import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/user.entity';
import { BlockchainService } from '../blockchain/blockchain.service';
import { OtpStore } from './otp.store';
import { JobType } from '@trustnest/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly otpStore: OtpStore,
    private readonly blockchainService: BlockchainService,
  ) {}

  async sendOtp(phone: string): Promise<{ sessionId: string }> {
    const sessionId = uuidv4();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpStore.setOtp(sessionId, phone, otp);
    // In production: send via SMS gateway. Log in dev.
    this.logger.log(`OTP for ${phone}: ${otp} (session: ${sessionId})`);
    return { sessionId };
  }

  async verifyOtp(
    sessionId: string,
    otp: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    const stored = await this.otpStore.getOtp(sessionId);
    if (!stored || stored.otp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.otpStore.deleteOtp(sessionId);

    // Upsert user
    let user = await this.userRepo.findOne({ where: { phone: stored.phone } });
    if (!user) {
      user = this.userRepo.create({ phone: stored.phone });
      user = await this.userRepo.save(user);

      // Create custodial wallet
      const wallet = await this.blockchainService.createWallet(user.id);

      // Enqueue REGISTER_USER job
      await this.blockchainService.enqueueJob(JobType.REGISTER_USER, {
        userId: user.id,
        walletAddress: wallet.address,
      });
    }

    const tokens = await this.issueTokens(user);
    return {
      ...tokens,
      user: { id: user.id, phone: user.phone, role: user.role },
    };
  }

  async refresh(token: string): Promise<{ accessToken: string }> {
    const userId = await this.otpStore.getRefreshToken(token);
    if (!userId) throw new UnauthorizedException('Invalid or expired refresh token');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    await this.otpStore.deleteRefreshToken(token);
    const newTokens = await this.issueTokens(user);
    return { accessToken: newTokens.accessToken };
  }

  private async issueTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, phone: user.phone };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    await this.otpStore.setRefreshToken(refreshToken, user.id);
    return { accessToken, refreshToken };
  }
}
