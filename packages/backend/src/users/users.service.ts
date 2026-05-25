import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Wallet } from '../blockchain/wallet.entity';
import { ReputationToken } from '../reputation/reputation-token.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(ReputationToken) private readonly reputationRepo: Repository<ReputationToken>,
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
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      kycStatus: user.kycStatus,
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

  async initiateKyc(userId: string): Promise<{ kycJobId: string }> {
    const { v4: uuidv4 } = await import('uuid');
    const kycJobId = uuidv4();
    await this.userRepo.update(userId, { kycJobId });
    // In production: upload files to S3 and trigger KYC provider
    return { kycJobId };
  }

  async handleKycWebhook(kycJobId: string, status: 'VERIFIED' | 'REJECTED'): Promise<void> {
    const { KycStatus } = await import('@trustnest/shared');
    await this.userRepo.update(
      { kycJobId },
      { kycStatus: status === 'VERIFIED' ? KycStatus.VERIFIED : KycStatus.REJECTED },
    );
  }
}
