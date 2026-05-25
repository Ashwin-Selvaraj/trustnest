import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReputationToken } from './reputation-token.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ReputationService {
  constructor(
    @InjectRepository(ReputationToken) private readonly tokenRepo: Repository<ReputationToken>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async getReputation(userId: string): Promise<Record<string, unknown>> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const tokens = await this.tokenRepo.find({
      where: { userId },
      order: { mintedAt: 'DESC' },
    });

    const avg = tokens.length
      ? Math.round((tokens.reduce((s, t) => s + t.score, 0) / tokens.length) * 10) / 10
      : 0;

    return {
      userId,
      averageScore: avg,
      totalAgreements: tokens.length,
      tokens: tokens.map((t) => ({
        sbtTokenId: t.sbtTokenId,
        agreementId: t.agreementId,
        role: t.role,
        score: t.score,
        mintedAt: t.mintedAt,
      })),
    };
  }
}
