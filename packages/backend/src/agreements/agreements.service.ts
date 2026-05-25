import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agreement } from './agreement.entity';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { DisputeDto } from './dto/dispute.dto';
import { RateDto } from './dto/rate.dto';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Wallet } from '../blockchain/wallet.entity';
import { ReputationToken } from '../reputation/reputation-token.entity';
import { User } from '../users/user.entity';
import { AgreementStatus, JobType, UserRole } from '@trustnest/shared';
import { agreementIdToBytes32 } from '@trustnest/sdk';

@Injectable()
export class AgreementsService {
  constructor(
    @InjectRepository(Agreement) private readonly agreementRepo: Repository<Agreement>,
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(ReputationToken) private readonly reputationRepo: Repository<ReputationToken>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly blockchainService: BlockchainService,
  ) {}

  async create(dto: CreateAgreementDto): Promise<Partial<Agreement>> {
    const agreement = this.agreementRepo.create({
      tenantId: dto.tenantId,
      ownerId: dto.ownerId,
      propertyAddress: dto.propertyAddress,
      monthlyRentINR: dto.monthlyRentINR.toString(),
      depositINR: dto.depositINR.toString(),
      startDate: dto.startDate,
      endDate: dto.endDate,
      pdfIpfsHash: dto.pdfIpfsHash ?? null,
      onChainAgreementId: agreementIdToBytes32(
        `${dto.tenantId}-${dto.ownerId}-${dto.startDate}`,
      ),
    });
    const saved = await this.agreementRepo.save(agreement);
    return { id: saved.id, status: saved.status, createdAt: saved.createdAt };
  }

  async findById(id: string, requestingUserId?: string): Promise<Agreement> {
    const agreement = await this.agreementRepo.findOne({ where: { id } });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (requestingUserId && agreement.tenantId !== requestingUserId && agreement.ownerId !== requestingUserId) {
      throw new ForbiddenException('Access denied to this agreement');
    }
    return agreement;
  }

  async list(
    userId: string,
    page: number,
    limit: number,
    status?: AgreementStatus,
  ): Promise<{ data: Agreement[]; total: number; page: number; limit: number }> {
    const qb = this.agreementRepo
      .createQueryBuilder('a')
      .where('a.tenantId = :uid OR a.ownerId = :uid', { uid: userId });
    if (status) qb.andWhere('a.status = :status', { status });
    const [data, total] = await qb
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  async confirm(agreementId: string, userId: string): Promise<{ status: AgreementStatus }> {
    const agreement = await this.findById(agreementId, userId);

    if (agreement.status !== AgreementStatus.DRAFT) {
      throw new ConflictException('Agreement already confirmed or beyond DRAFT state');
    }

    const isTenant = agreement.tenantId === userId;
    const tenantConfirmed = isTenant ? true : agreement.tenantConfirmed;
    const ownerConfirmed = isTenant ? agreement.ownerConfirmed : true;
    if (isTenant) {
      await this.agreementRepo.update(agreementId, { tenantConfirmed: true });
    } else {
      await this.agreementRepo.update(agreementId, { ownerConfirmed: true });
    }

    if (tenantConfirmed && ownerConfirmed) {
      // Both confirmed — enqueue NFT mint
      const tenantWallet = await this.walletRepo.findOne({ where: { userId: agreement.tenantId } });
      const ownerWallet = await this.walletRepo.findOne({ where: { userId: agreement.ownerId } });
      if (!tenantWallet || !ownerWallet) throw new BadRequestException('Wallets not found for parties');

      await this.blockchainService.enqueueJob(
        JobType.MINT_AGREEMENT_NFT,
        {
          agreementId,
          tenantAddress: tenantWallet.address,
          ownerAddress: ownerWallet.address,
          metadataURI: `ipfs://trustnest/${agreementId}`,
        },
        agreementId,
      );
    }

    return { status: tenantConfirmed && ownerConfirmed
      ? AgreementStatus.PENDING_DEPOSIT
      : AgreementStatus.DRAFT };
  }

  async raiseDispute(agreementId: string, userId: string, dto: DisputeDto): Promise<{ status: AgreementStatus }> {
    const agreement = await this.findById(agreementId, userId);

    if (agreement.status !== AgreementStatus.ACTIVE) {
      throw new ConflictException('Can only dispute an ACTIVE agreement');
    }

    await this.agreementRepo.update(agreementId, {
      status: AgreementStatus.DISPUTED,
      disputeReason: dto.reason,
      disputeEvidenceIpfsHash: dto.evidenceIpfsHash ?? null,
    });

    await this.blockchainService.enqueueJob(
      JobType.RESOLVE_DISPUTE,
      { agreementId, action: 'raise' },
      agreementId,
    );

    return { status: AgreementStatus.DISPUTED };
  }

  async rate(agreementId: string, userId: string, dto: RateDto): Promise<{ ok: boolean }> {
    const agreement = await this.findById(agreementId, userId);

    if (agreement.status !== AgreementStatus.CLOSED && agreement.status !== AgreementStatus.ACTIVE) {
      throw new ConflictException('Can only rate a CLOSED or ACTIVE agreement');
    }

    const isTenant = agreement.tenantId === userId;
    const role = isTenant ? UserRole.TENANT : UserRole.OWNER;

    // Upsert reputation token
    const existing = await this.reputationRepo.findOne({ where: { agreementId, userId } });
    if (existing) throw new ConflictException('Already rated this agreement');

    await this.reputationRepo.save(
      this.reputationRepo.create({
        userId,
        agreementId,
        role,
        score: dto.score,
        review: dto.review ?? null,
      }),
    );

    // Check if both parties rated — mint SBTs
    const bothRated = await this.reputationRepo.count({ where: { agreementId } });
    if (bothRated >= 2) {
      const tenantToken = await this.reputationRepo.findOne({ where: { agreementId, role: UserRole.TENANT } });
      const ownerToken = await this.reputationRepo.findOne({ where: { agreementId, role: UserRole.OWNER } });
      const tenantWallet = await this.walletRepo.findOne({ where: { userId: agreement.tenantId } });
      const ownerWallet = await this.walletRepo.findOne({ where: { userId: agreement.ownerId } });

      if (tenantToken && ownerToken && tenantWallet && ownerWallet) {
        await this.blockchainService.enqueueJob(
          JobType.MINT_REPUTATION_SBT,
          {
            agreementId,
            tenantAddress: tenantWallet.address,
            tenantScore: tenantToken.score,
            ownerAddress: ownerWallet.address,
            ownerScore: ownerToken.score,
            tenantTokenId: '0',
            ownerTokenId: '0',
          },
          agreementId,
        );
      }
    }

    return { ok: true };
  }
}
