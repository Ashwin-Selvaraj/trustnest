import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
import {
  TrustNestSDK,
  ContractRevertError,
} from '@trustnest/sdk';
import {
  CONTRACT_ADDRESSES,
  USDC_MAINNET_ADDRESS,
  JobType,
  JobStatus,
  PaymentStatus,
  AgreementStatus,
  inrToUsdc,
  UserRole,
} from '@trustnest/shared';
import { BlockchainJob } from './blockchain-job.entity';
import { Wallet } from './wallet.entity';
import { Agreement } from '../agreements/agreement.entity';
import { PaymentEvent } from '../payments/payment-event.entity';
import { ReputationToken } from '../reputation/reputation-token.entity';
import { decryptValue, encryptValue } from './crypto.util';

// Backoff constants
const BASE_DELAY_MS = 30_000;
const MAX_ATTEMPTS = 8;

@Injectable()
export class BlockchainService implements OnModuleInit {
  private sdk!: TrustNestSDK;
  private readonly logger = new Logger(BlockchainService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(BlockchainJob) private readonly jobRepo: Repository<BlockchainJob>,
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Agreement) private readonly agreementRepo: Repository<Agreement>,
    @InjectRepository(PaymentEvent) private readonly paymentRepo: Repository<PaymentEvent>,
    @InjectRepository(ReputationToken) private readonly reputationRepo: Repository<ReputationToken>,
  ) {}

  async onModuleInit(): Promise<void> {
    const encryptedKey = this.config.getOrThrow<string>('OPERATOR_KEY_ENCRYPTED');
    const iv = this.config.getOrThrow<string>('OPERATOR_KEY_IV');
    const masterKey = this.config.getOrThrow<string>('MASTER_ENCRYPTION_KEY');
    const rpcUrl = this.config.getOrThrow<string>('POLYGON_RPC_URL');
    const network = this.config.get<string>('NETWORK', 'amoy') as 'amoy' | 'mainnet';
    const usdcAddress =
      this.config.get<string>('USDC_ADDRESS') ??
      (network === 'mainnet' ? USDC_MAINNET_ADDRESS : ethers.ZeroAddress);

    const operatorKey = decryptValue(encryptedKey, iv, masterKey);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(operatorKey, provider);

    this.sdk = new TrustNestSDK({
      signer,
      addresses: CONTRACT_ADDRESSES[network],
      usdcAddress,
    });

    this.logger.log(`BlockchainService ready — network=${network}`);
  }

  // ─── Wallet management ────────────────────────────────────────────────────

  async createWallet(userId: string): Promise<Wallet> {
    const masterKey = this.config.getOrThrow<string>('MASTER_ENCRYPTION_KEY');
    const randomWallet = ethers.Wallet.createRandom();
    const { ciphertext, iv } = encryptValue(randomWallet.privateKey, masterKey);

    const wallet = this.walletRepo.create({
      userId,
      address: randomWallet.address,
      encryptedKey: ciphertext,
      keyIv: iv,
    });
    return this.walletRepo.save(wallet);
  }

  // ─── Job queue ────────────────────────────────────────────────────────────

  async enqueueJob(
    type: JobType,
    payload: Record<string, unknown>,
    agreementId?: string,
  ): Promise<BlockchainJob> {
    const job = this.jobRepo.create({
      type,
      payload,
      agreementId: agreementId ?? null,
      status: JobStatus.PENDING,
    });
    return this.jobRepo.save(job);
  }

  async getPendingJobs(): Promise<BlockchainJob[]> {
    return this.jobRepo
      .createQueryBuilder('job')
      .where('job.status IN (:...statuses)', { statuses: [JobStatus.PENDING, JobStatus.FAILED] })
      .andWhere('(job.processAfter IS NULL OR job.processAfter <= :now)', { now: new Date() })
      .orderBy('job.createdAt', 'ASC')
      .limit(20)
      .getMany();
  }

  async processJob(job: BlockchainJob): Promise<void> {
    this.logger.log(`Processing job ${job.id} type=${job.type} attempt=${job.attempts + 1}`);

    await this.jobRepo.update(job.id, { status: JobStatus.PROCESSING });

    try {
      switch (job.type) {
        case JobType.REGISTER_USER:
          await this.processRegisterUser(job);
          break;
        case JobType.MINT_AGREEMENT_NFT:
          await this.processMintAgreementNFT(job);
          break;
        case JobType.DEPOSIT_ESCROW:
          await this.processDepositEscrow(job);
          break;
        case JobType.RELEASE_ESCROW:
          await this.processReleaseEscrow(job);
          break;
        case JobType.RESOLVE_DISPUTE:
          await this.processResolveDispute(job);
          break;
        case JobType.MINT_REPUTATION_SBT:
          await this.processMintReputationSBT(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      await this.jobRepo.update(job.id, {
        status: JobStatus.DONE,
        attempts: job.attempts + 1,
        lastError: null,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isFatal = err instanceof ContractRevertError;
      const nextAttempts = job.attempts + 1;
      const processAfter = isFatal || nextAttempts >= MAX_ATTEMPTS
        ? null
        : new Date(Date.now() + BASE_DELAY_MS * Math.pow(2, nextAttempts));

      await this.jobRepo.update(job.id, {
        status: isFatal || nextAttempts >= MAX_ATTEMPTS ? JobStatus.FAILED : JobStatus.PENDING,
        attempts: nextAttempts,
        lastError: errorMessage,
        processAfter,
      });

      if (isFatal) {
        this.logger.error(`Job ${job.id} failed fatally: ${errorMessage}`);
      } else {
        this.logger.warn(`Job ${job.id} failed (attempt ${nextAttempts}): ${errorMessage}`);
      }
    }
  }

  // ─── Job processors ───────────────────────────────────────────────────────

  private async processRegisterUser(job: BlockchainJob): Promise<void> {
    const { userId, walletAddress } = job.payload as { userId: string; walletAddress: string };
    await this.sdk.registry.registerUser({ userId, walletAddress });
    await this.walletRepo.update({ userId }, { registeredOnChain: true });
  }

  private async processMintAgreementNFT(job: BlockchainJob): Promise<void> {
    const { agreementId, tenantAddress, ownerAddress, metadataURI } = job.payload as {
      agreementId: string;
      tenantAddress: string;
      ownerAddress: string;
      metadataURI: string;
    };

    const result = await this.sdk.agreement.mintAgreement({
      agreementId,
      tenantAddress,
      ownerAddress,
      metadataURI,
    });

    await this.agreementRepo.update(agreementId, {
      nftTokenIdTenant: result.tenantTokenId.toString(),
      nftTokenIdOwner: result.ownerTokenId.toString(),
      status: AgreementStatus.PENDING_DEPOSIT,
    });
  }

  private async processDepositEscrow(job: BlockchainJob): Promise<void> {
    const { agreementId, tenantAddress, ownerAddress, usdcAmountWei, paymentEventId } =
      job.payload as {
        agreementId: string;
        tenantAddress: string;
        ownerAddress: string;
        usdcAmountWei: string;
        paymentEventId: string;
      };

    const receipt = await this.sdk.escrow.deposit({
      agreementId,
      tenantAddress,
      ownerAddress,
      usdcAmount: BigInt(usdcAmountWei),
    });

    await this.paymentRepo.update(paymentEventId, {
      status: PaymentStatus.CONFIRMED,
      txHash: receipt.hash,
    });
    await this.agreementRepo.update(agreementId, { status: AgreementStatus.ACTIVE });
  }

  private async processReleaseEscrow(job: BlockchainJob): Promise<void> {
    const { agreementId, deductionAmountWei, paymentEventId } = job.payload as {
      agreementId: string;
      deductionAmountWei: string;
      paymentEventId: string;
    };

    const receipt = await this.sdk.escrow.release({
      agreementId,
      deductionAmount: BigInt(deductionAmountWei),
    });

    await this.paymentRepo.update(paymentEventId, {
      status: PaymentStatus.CONFIRMED,
      txHash: receipt.hash,
    });
    await this.agreementRepo.update(agreementId, { status: AgreementStatus.CLOSED });
  }

  private async processResolveDispute(job: BlockchainJob): Promise<void> {
    const { agreementId, tenantShareWei, ownerShareWei } = job.payload as {
      agreementId: string;
      tenantShareWei: string;
      ownerShareWei: string;
    };

    await this.sdk.escrow.resolveDispute({
      agreementId,
      tenantShare: BigInt(tenantShareWei),
      ownerShare: BigInt(ownerShareWei),
    });

    await this.agreementRepo.update(agreementId, { status: AgreementStatus.CLOSED });
  }

  private async processMintReputationSBT(job: BlockchainJob): Promise<void> {
    const { agreementId, tenantAddress, tenantScore, ownerAddress, ownerScore, tenantTokenId, ownerTokenId } =
      job.payload as {
        agreementId: string;
        tenantAddress: string;
        tenantScore: number;
        ownerAddress: string;
        ownerScore: number;
        tenantTokenId: string;
        ownerTokenId: string;
      };

    await this.sdk.reputation.mintReputation({
      agreementId,
      tenantAddress,
      tenantScore,
      ownerAddress,
      ownerScore,
    });

    // Update on-chain token IDs in the reputation_tokens rows
    await this.reputationRepo.update(
      { agreementId, role: UserRole.TENANT },
      { sbtTokenId: parseInt(tenantTokenId, 10) },
    );
    await this.reputationRepo.update(
      { agreementId, role: UserRole.OWNER },
      { sbtTokenId: parseInt(ownerTokenId, 10) },
    );
  }

  // ─── Forex helper ─────────────────────────────────────────────────────────

  getForexRate(): number {
    return this.config.get<number>('FOREX_RATE_INR_PER_USDC') ?? 83.5;
  }

  inrToUsdcWei(amountINR: number): bigint {
    return inrToUsdc(amountINR, this.getForexRate());
  }

  // ─── Admin helpers ────────────────────────────────────────────────────────

  async retryJob(jobId: string): Promise<BlockchainJob> {
    const job = await this.jobRepo.findOneOrFail({ where: { id: jobId } });
    await this.jobRepo.update(jobId, {
      status: JobStatus.PENDING,
      processAfter: null,
      lastError: null,
    });
    return { ...job, status: JobStatus.PENDING };
  }

  async listJobs(statuses: JobStatus[]): Promise<BlockchainJob[]> {
    return this.jobRepo.find({
      where: statuses.map((s) => ({ status: s })),
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
