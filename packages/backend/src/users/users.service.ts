import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { User } from './user.entity';
import { PaymentDetails } from './payment-details.entity';
import { Wallet } from '../blockchain/wallet.entity';
import { ReputationToken } from '../reputation/reputation-token.entity';
import { PropertyInterest } from '../interests/property-interest.entity';
import { Property } from '../properties/property.entity';
import { PropertyImage } from '../properties/property-image.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { KycAadhaarInitDto } from './dto/kyc-aadhaar-init.dto';
import { KycAadhaarVerifyDto } from './dto/kyc-aadhaar-verify.dto';
import { KycPanDto } from './dto/kyc-pan.dto';
import { PaymentDetailsDto } from './dto/payment-details.dto';
import { KycStatus, KycMethod, PaymentDetailsStatus } from '@trustnest/shared';
import { KycProviderFactory } from '../kyc/kyc-provider.factory';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)              private readonly userRepo: Repository<User>,
    @InjectRepository(PaymentDetails)    private readonly paymentDetailsRepo: Repository<PaymentDetails>,
    @InjectRepository(Wallet)            private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(ReputationToken)   private readonly reputationRepo: Repository<ReputationToken>,
    @InjectRepository(PropertyInterest)  private readonly interestRepo: Repository<PropertyInterest>,
    @InjectRepository(Property)          private readonly propertyRepo: Repository<Property>,
    @InjectRepository(PropertyImage)     private readonly propertyImageRepo: Repository<PropertyImage>,
    private readonly kycFactory: KycProviderFactory,
    private readonly storage: StorageService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getMe(userId: string): Promise<Record<string, unknown>> {
    const user = await this.findById(userId);
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    const score = await this.getReputationScore(userId);
    const paymentDetails = await this.paymentDetailsRepo.findOne({ where: { userId } });

    const profileComplete = !!(user.name && user.role && user.dob);

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      dob: user.dob ? user.dob.toISOString().split('T')[0] : null,
      kycStatus: user.kycStatus,
      kycMethod: user.kycMethod,
      maskedAadhaar: user.maskedAadhaar,
      maskedPan: user.maskedPan,
      kycRejectionReason: user.kycRejectionReason,
      profileComplete,
      paymentDetailsStatus: paymentDetails?.status ?? PaymentDetailsStatus.NONE,
      walletAddress: wallet?.address ?? null,
      reputationScore: score.averageScore,
      reputationCount: score.totalAgreements,
    };
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<Record<string, unknown>> {
    await this.userRepo.update(userId, { name: dto.name });
    return this.getMe(userId);
  }

  async getReputationScore(userId: string): Promise<{ averageScore: number; totalAgreements: number; role: string }> {
    const tokens = await this.reputationRepo.find({ where: { userId } });
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (tokens.length === 0) {
      return { averageScore: 0, totalAgreements: 0, role: user?.role ?? 'TENANT' };
    }
    const avg = tokens.reduce((sum, t) => sum + t.score, 0) / tokens.length;
    return {
      averageScore: Math.round(avg * 10) / 10,
      totalAgreements: tokens.length,
      role: user?.role ?? 'TENANT',
    };
  }

  // ─── KYC: Aadhaar ─────────────────────────────────────────────────────────
  //
  // All calls are routed through KycProviderFactory.
  // Active provider is set by KYC_PROVIDER env var (stub | sandbox | digio).
  // Mobile app NEVER calls the KYC provider directly — always via this service.

  async initiateAadhaarKyc(
    userId: string,
    dto: KycAadhaarInitDto,
  ): Promise<{ sessionId: string }> {
    // Delegate to active KYC provider (stub/Sandbox.co.in/Digio)
    const { sessionId } = await this.kycFactory.getProvider().initiateAadhaarOtp(dto.aadhaarNumber);

    // Store kycMethod early so UX can show "OTP sent" state correctly
    await this.userRepo.update(userId, { kycMethod: KycMethod.AADHAAR });

    return { sessionId };
  }

  async verifyAadhaarKyc(
    userId: string,
    dto: KycAadhaarVerifyDto,
  ): Promise<{ success: boolean }> {
    // Provider validates OTP and returns masked Aadhaar (last 4 digits only)
    const { maskedAadhaar } = await this.kycFactory
      .getProvider()
      .verifyAadhaarOtp(dto.sessionId, dto.otp);

    // Persist result — never store the full Aadhaar number
    await this.userRepo.update(userId, {
      maskedAadhaar,
      kycStatus: KycStatus.PENDING, // selfie still required
      kycMethod: KycMethod.AADHAAR,
    });

    return { success: true };
  }

  // ─── KYC: PAN ─────────────────────────────────────────────────────────────

  async initiatePanKyc(
    userId: string,
    dto: KycPanDto,
  ): Promise<{ jobId: string }> {
    // Provider calls ITD database lookup (Sandbox.co.in /kyc/pan or Digio)
    const { maskedPan } = await this.kycFactory.getProvider().verifyPan(dto.panNumber);

    const { v4: uuidv4 } = await import('uuid');
    const jobId = uuidv4();

    await this.userRepo.update(userId, {
      maskedPan,
      kycMethod: KycMethod.PAN,
      kycStatus: KycStatus.PENDING, // selfie still required
      kycJobId: jobId,
    });

    return { jobId };
  }

  // ─── KYC: Selfie / Liveness ───────────────────────────────────────────────

  async verifySelfie(
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<{ success: boolean; kycStatus: KycStatus; selfieUrl: string | null }> {
    // 1. Upload the selfie to R2 (if provided) and get back a public URL.
    let selfieUrl: string | null = null;
    if (file) {
      const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
      const key = `kyc/selfies/${userId}/${Date.now()}.${ext}`;
      selfieUrl = await this.storage.upload(key, file.buffer, file.mimetype);
    }

    // 2. Run liveness check via the active KYC provider.
    //    Pass the base64-encoded image when available; stub provider ignores it.
    const imageBase64 = file ? file.buffer.toString('base64') : '';
    const { passed, reason } = await this.kycFactory.getProvider().verifyLiveness(imageBase64);

    if (passed) {
      await this.userRepo.update(userId, {
        kycStatus: KycStatus.VERIFIED,
        kycRejectionReason: null,
        ...(selfieUrl ? { kycSelfieUrl: selfieUrl } : {}),
      });
      return { success: true, kycStatus: KycStatus.VERIFIED, selfieUrl };
    } else {
      await this.userRepo.update(userId, {
        kycStatus: KycStatus.REJECTED,
        kycRejectionReason: reason ?? 'Liveness check failed',
        ...(selfieUrl ? { kycSelfieUrl: selfieUrl } : {}),
      });
      return { success: false, kycStatus: KycStatus.REJECTED, selfieUrl };
    }
  }

  // ─── Legacy KYC (kept for backward compat) ────────────────────────────────

  async initiateKyc(userId: string): Promise<{ kycJobId: string }> {
    const { v4: uuidv4 } = await import('uuid');
    const kycJobId = uuidv4();
    await this.userRepo.update(userId, { kycJobId });
    // In production: upload files to S3 and trigger KYC provider
    return { kycJobId };
  }

  async handleKycWebhook(kycJobId: string, status: 'VERIFIED' | 'REJECTED'): Promise<void> {
    await this.userRepo.update(
      { kycJobId },
      { kycStatus: status === 'VERIFIED' ? KycStatus.VERIFIED : KycStatus.REJECTED },
    );
  }

  // ─── Payment Details ───────────────────────────────────────────────────────

  async savePaymentDetails(
    userId: string,
    dto: PaymentDetailsDto,
  ): Promise<{ success: boolean }> {
    let details = await this.paymentDetailsRepo.findOne({ where: { userId } });

    const encryptedAccount = dto.bankAccountNumber
      ? this.encryptBankAccount(dto.bankAccountNumber)
      : null;

    // Determine payment details status
    // UPI IDs are accepted as-is (no external verification needed)
    // Bank accounts require penny-drop verification via the active provider
    let paymentStatus: PaymentDetailsStatus;
    if (dto.bankAccountNumber && dto.bankIfsc) {
      const { verified } = await this.kycFactory
        .getProvider()
        .verifyBankAccount(dto.bankAccountNumber, dto.bankIfsc);
      paymentStatus = verified
        ? PaymentDetailsStatus.VERIFIED
        : PaymentDetailsStatus.PENDING_VERIFICATION;
    } else {
      // UPI ID — no external verification, mark as VERIFIED
      paymentStatus = PaymentDetailsStatus.VERIFIED;
    }

    if (details) {
      details.upiId = dto.upiId ?? details.upiId;
      details.bankAccountNumber = encryptedAccount ?? details.bankAccountNumber;
      details.bankIfsc = dto.bankIfsc ?? details.bankIfsc;
      details.status = paymentStatus;
      if (paymentStatus === PaymentDetailsStatus.VERIFIED) {
        details.verifiedAt = new Date();
      }
      await this.paymentDetailsRepo.save(details);
    } else {
      details = this.paymentDetailsRepo.create({
        userId,
        upiId: dto.upiId ?? null,
        bankAccountNumber: encryptedAccount,
        bankIfsc: dto.bankIfsc ?? null,
        status: paymentStatus,
        verifiedAt: paymentStatus === PaymentDetailsStatus.VERIFIED ? new Date() : null,
      });
      await this.paymentDetailsRepo.save(details);
    }

    return { success: true };
  }

  async getPaymentDetails(userId: string): Promise<Record<string, unknown>> {
    const details = await this.paymentDetailsRepo.findOne({ where: { userId } });
    if (!details) {
      return { hasDetails: false };
    }

    // Return masked bank account number
    const maskedAccount = details.bankAccountNumber
      ? this.maskBankAccount(details.bankAccountNumber)
      : null;

    return {
      hasDetails: true,
      upiId: details.upiId,
      maskedBankAccount: maskedAccount,
      bankIfsc: details.bankIfsc,
      status: details.status,
      verifiedAt: details.verifiedAt,
    };
  }

  async deletePaymentDetails(userId: string): Promise<{ success: boolean }> {
    await this.paymentDetailsRepo.delete({ userId });
    return { success: true };
  }

  // ─── Property Interests ───────────────────────────────────────────────────

  async getMyInterests(tenantId: string): Promise<unknown[]> {
    const interests = await this.interestRepo
      .createQueryBuilder('i')
      .leftJoin('i.property', 'p')
      .addSelect([
        'p.id', 'p.title', 'p.city', 'p.locality',
        'p.monthlyRentINR', 'p.status',
      ])
      .where('i.tenantId = :tenantId', { tenantId })
      .orderBy('i.createdAt', 'DESC')
      .getMany();

    const result = await Promise.all(
      interests.map(async (interest) => {
        const prop = (interest as PropertyInterest & { property?: Property }).property;
        let primaryImageUrl: string | null = null;
        if (prop) {
          const img = await this.propertyImageRepo.findOne({
            where: { propertyId: prop.id, isPrimary: true },
          });
          primaryImageUrl = img?.url ?? null;
        }
        return {
          id:          interest.id,
          propertyId:  interest.propertyId,
          tenantId:    interest.tenantId,
          status:      interest.status,
          message:     interest.message,
          agreementId: interest.agreementId,
          createdAt:   interest.createdAt,
          updatedAt:   interest.updatedAt,
          property:    prop
            ? {
                title:          prop.title,
                city:           prop.city,
                locality:       prop.locality,
                monthlyRentINR: prop.monthlyRentINR,
                status:         prop.status,
                primaryImageUrl,
              }
            : null,
        };
      }),
    );

    return result;
  }

  // ─── Encryption helpers ───────────────────────────────────────────────────

  private encryptBankAccount(plaintext: string): string {
    const keyHex = process.env['PAYMENT_ENCRYPTION_KEY'] ?? '0'.repeat(64);
    const keyStr = Buffer.from(keyHex, 'hex').toString('binary');
    const iv = randomBytes(12);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cipher = createCipheriv('aes-256-gcm', keyStr as any, iv as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8') as any, cipher.final() as any] as any);
    const authTag = cipher.getAuthTag();
    // Format: iv:authTag:ciphertext (all hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private maskBankAccount(encrypted: string): string {
    try {
      const keyHex = process.env['PAYMENT_ENCRYPTION_KEY'] ?? '0'.repeat(64);
      const keyStr = Buffer.from(keyHex, 'hex').toString('binary');
      const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':');
      if (!ivHex || !authTagHex || !ciphertextHex) return 'XXXX';
      const iv = Buffer.from(ivHex, 'hex').toString('binary');
      const authTag = Buffer.from(authTagHex, 'hex');
      const ciphertext = Buffer.from(ciphertextHex, 'hex');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decipher = createDecipheriv('aes-256-gcm', keyStr as any, iv as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      decipher.setAuthTag(authTag as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decrypted = Buffer.concat([decipher.update(ciphertext as any), decipher.final() as any] as any).toString('utf8');
      return `XXXX${decrypted.slice(-4)}`;
    } catch {
      return 'XXXX';
    }
  }
}
