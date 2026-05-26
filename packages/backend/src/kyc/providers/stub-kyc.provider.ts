import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { IKycProvider } from '../kyc-provider.interface';

/**
 * StubKycProvider  (KYC_PROVIDER=stub)
 *
 * In-memory fake implementation for local development.
 * Generates a random OTP and logs it to the console.
 * No external API calls — works with zero credentials.
 *
 * DO NOT use in production.
 */
@Injectable()
export class StubKycProvider implements IKycProvider {
  private readonly logger = new Logger(StubKycProvider.name);

  /** sessionId → { otp, expiresAt } */
  private readonly otpStore = new Map<
    string,
    { otp: string; maskedAadhaar: string; expiresAt: number }
  >();

  async initiateAadhaarOtp(
    aadhaarNumber: string,
  ): Promise<{ sessionId: string }> {
    const sessionId = randomBytes(16).toString('hex');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const maskedAadhaar = `XXXX-XXXX-${aadhaarNumber.slice(-4)}`;

    this.otpStore.set(sessionId, {
      otp,
      maskedAadhaar,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
    });

    // In real providers the OTP is sent via SMS — here we log it
    this.logger.warn(
      `[STUB] Aadhaar OTP for Aadhaar ...${aadhaarNumber.slice(-4)}: ${otp}  (session: ${sessionId})`,
    );

    return { sessionId };
  }

  async verifyAadhaarOtp(
    sessionId: string,
    otp: string,
  ): Promise<{ maskedAadhaar: string }> {
    const session = this.otpStore.get(sessionId);

    if (!session) {
      throw new BadRequestException('Invalid or expired Aadhaar OTP session');
    }
    if (Date.now() > session.expiresAt) {
      this.otpStore.delete(sessionId);
      throw new BadRequestException('Aadhaar OTP session has expired');
    }
    if (session.otp !== otp) {
      throw new BadRequestException('Incorrect OTP');
    }

    this.otpStore.delete(sessionId);
    return { maskedAadhaar: session.maskedAadhaar };
  }

  async verifyPan(panNumber: string): Promise<{ maskedPan: string }> {
    // Stub: accept any valid-format PAN (validated by DTO already)
    const maskedPan = `${panNumber.slice(0, 5)}****${panNumber.slice(-1)}`;
    this.logger.warn(`[STUB] PAN verified: ${maskedPan}`);
    return { maskedPan };
  }

  async verifyBankAccount(
    _accountNumber: string,
    _ifsc: string,
  ): Promise<{ verified: boolean }> {
    // Stub: always succeeds
    this.logger.warn('[STUB] Bank account penny-drop: auto-verified');
    return { verified: true };
  }

  async verifyLiveness(
    _imageBase64: string,
  ): Promise<{ passed: boolean; reason?: string }> {
    // Stub: always passes — override SELFIE_STUB=false in dev to test rejection
    this.logger.warn('[STUB] Selfie liveness check: auto-passed');
    return { passed: true };
  }
}
