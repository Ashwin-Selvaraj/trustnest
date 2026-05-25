import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const OTP_TTL_SECONDS = 300; // 5 minutes
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

@Injectable()
export class OtpStore implements OnModuleInit {
  private client!: Redis;
  private readonly logger = new Logger(OtpStore.name);

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(url, { lazyConnect: true, enableOfflineQueue: false });
    this.client.on('error', (err: Error) => this.logger.warn(`Redis error: ${err.message}`));
    try {
      await this.client.connect();
      this.logger.log('Redis connected');
    } catch {
      this.logger.warn('Redis unavailable — OTP flow will fail until reconnected');
    }
  }

  async setOtp(sessionId: string, phone: string, otp: string): Promise<void> {
    await this.client.set(`otp:${sessionId}`, `${phone}:${otp}`, 'EX', OTP_TTL_SECONDS);
  }

  async getOtp(sessionId: string): Promise<{ phone: string; otp: string } | null> {
    const value = await this.client.get(`otp:${sessionId}`);
    if (!value) return null;
    const [phone, otp] = value.split(':');
    return { phone, otp };
  }

  async deleteOtp(sessionId: string): Promise<void> {
    await this.client.del(`otp:${sessionId}`);
  }

  async setRefreshToken(token: string, userId: string): Promise<void> {
    await this.client.set(`refresh:${token}`, userId, 'EX', REFRESH_TTL_SECONDS);
  }

  async getRefreshToken(token: string): Promise<string | null> {
    return this.client.get(`refresh:${token}`);
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.client.del(`refresh:${token}`);
  }
}
