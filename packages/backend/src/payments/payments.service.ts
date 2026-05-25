import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PaymentEvent } from './payment-event.entity';
import { Agreement } from '../agreements/agreement.entity';
import { Wallet } from '../blockchain/wallet.entity';
import { BlockchainService } from '../blockchain/blockchain.service';
import { AgreementStatus, JobType, PaymentStatus, PaymentType } from '@trustnest/shared';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentEvent) private readonly paymentRepo: Repository<PaymentEvent>,
    @InjectRepository(Agreement) private readonly agreementRepo: Repository<Agreement>,
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    private readonly blockchainService: BlockchainService,
    private readonly config: ConfigService,
  ) {}

  async initiatePayment(agreementId: string, userId: string): Promise<Record<string, unknown>> {
    const agreement = await this.agreementRepo.findOne({ where: { id: agreementId } });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.tenantId !== userId) throw new ForbiddenException('Only the tenant can initiate payment');
    if (agreement.status !== AgreementStatus.PENDING_DEPOSIT) {
      throw new ConflictException('Agreement is not in PENDING_DEPOSIT state');
    }

    const depositINR = parseFloat(agreement.depositINR);
    const usdcWei = this.blockchainService.inrToUsdcWei(depositINR);
    const forexRate = this.blockchainService.getForexRate().toString();

    // Create Razorpay order (stubbed if keys not configured)
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');

    let orderId = `mock_order_${Date.now()}`;
    if (keyId && keySecret) {
      try {
        const Razorpay = (await import('razorpay')).default;
        const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const order = await rzp.orders.create({
          amount: Math.round(depositINR * 100), // paise
          currency: 'INR',
          receipt: agreementId,
        });
        orderId = order.id;
      } catch (err) {
        this.logger.warn(`Razorpay order creation failed: ${(err as Error).message}`);
      }
    }

    // Write PaymentEvent (event-first)
    await this.paymentRepo.save(
      this.paymentRepo.create({
        agreementId,
        type: PaymentType.DEPOSIT,
        amountINR: depositINR.toString(),
        usdcWei: usdcWei.toString(),
        forexRate,
        gatewayOrderId: orderId,
        status: PaymentStatus.PENDING,
      }),
    );

    return {
      orderId,
      amountINR: depositINR,
      gatewayKey: keyId ?? 'dev_mode',
      upiDeepLink: `upi://pay?pa=trustnest@upi&pn=TrustNest&am=${depositINR}&cu=INR&tn=${agreementId}`,
    };
  }

  async handleWebhook(signature: string, rawBody: string): Promise<{ ok: boolean }> {
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (keySecret) {
      const expectedSig = createHmac('sha256', keySecret)
        .update(rawBody)
        .digest('hex');
      if (signature !== expectedSig) {
        throw new ForbiddenException('Invalid webhook signature');
      }
    }

    const event = JSON.parse(rawBody) as { event: string; payload: Record<string, unknown> };
    if (event.event !== 'payment.captured') return { ok: true };

    const paymentData = event.payload['payment'] as Record<string, unknown> | undefined;
    const entity = paymentData?.['entity'] as Record<string, unknown> | undefined;
    const orderId = entity?.['order_id'] as string | undefined;
    const gatewayPaymentId = entity?.['id'] as string | undefined;

    if (!orderId) return { ok: true };

    const paymentEvent = await this.paymentRepo.findOne({ where: { gatewayOrderId: orderId } });
    if (!paymentEvent) return { ok: true };

    await this.paymentRepo.update(paymentEvent.id, { gatewayPaymentId: gatewayPaymentId ?? null });

    const agreement = await this.agreementRepo.findOne({ where: { id: paymentEvent.agreementId } });
    if (!agreement) return { ok: true };

    const tenantWallet = await this.walletRepo.findOne({ where: { userId: agreement.tenantId } });
    const ownerWallet = await this.walletRepo.findOne({ where: { userId: agreement.ownerId } });
    if (!tenantWallet || !ownerWallet) return { ok: true };

    await this.blockchainService.enqueueJob(
      JobType.DEPOSIT_ESCROW,
      {
        agreementId: paymentEvent.agreementId,
        tenantAddress: tenantWallet.address,
        ownerAddress: ownerWallet.address,
        usdcAmountWei: paymentEvent.usdcWei ?? '0',
        paymentEventId: paymentEvent.id,
      },
      paymentEvent.agreementId,
    );

    return { ok: true };
  }

  async releaseEscrow(
    agreementId: string,
    userId: string,
    deductionINR: number,
  ): Promise<{ status: AgreementStatus; jobId: string }> {
    const agreement = await this.agreementRepo.findOne({ where: { id: agreementId } });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.ownerId !== userId) throw new ForbiddenException('Only the owner can release escrow');
    if (agreement.status !== AgreementStatus.ACTIVE) {
      throw new ConflictException('Agreement is not ACTIVE');
    }
    if (agreement.status as AgreementStatus === AgreementStatus.DISPUTED) {
      throw new ConflictException('Cannot release a disputed agreement');
    }

    const depositINR = parseFloat(agreement.depositINR);
    if (deductionINR > depositINR) throw new BadRequestException('Deduction exceeds deposit');

    const forexRate = this.blockchainService.getForexRate();
    const deductionWei = this.blockchainService.inrToUsdcWei(deductionINR);
    const returnWei = this.blockchainService.inrToUsdcWei(depositINR - deductionINR);

    await this.agreementRepo.update(agreementId, { status: AgreementStatus.RELEASING });

    const paymentEvent = await this.paymentRepo.save(
      this.paymentRepo.create({
        agreementId,
        type: PaymentType.RELEASE,
        amountINR: (depositINR - deductionINR).toString(),
        usdcWei: returnWei.toString(),
        forexRate: forexRate.toString(),
        status: PaymentStatus.PENDING,
      }),
    );

    const job = await this.blockchainService.enqueueJob(
      JobType.RELEASE_ESCROW,
      {
        agreementId,
        deductionAmountWei: deductionWei.toString(),
        paymentEventId: paymentEvent.id,
      },
      agreementId,
    );

    return { status: AgreementStatus.RELEASING, jobId: job.id };
  }

  async getPaymentHistory(agreementId: string, userId: string): Promise<{ data: PaymentEvent[] }> {
    const agreement = await this.agreementRepo.findOne({ where: { id: agreementId } });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.tenantId !== userId && agreement.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const data = await this.paymentRepo.find({
      where: { agreementId },
      order: { createdAt: 'DESC' },
    });
    return { data };
  }
}
