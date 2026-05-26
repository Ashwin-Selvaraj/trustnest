import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { IKycProvider } from '../kyc-provider.interface';

/**
 * SandboxKycProvider  (KYC_PROVIDER=sandbox)
 *
 * Integrates with Sandbox.co.in free sandbox APIs.
 * - Aadhaar OTP: real UIDAI gateway (OTP sent to actual Aadhaar-linked mobile)
 * - PAN: real ITD database lookup
 * - Bank penny-drop: real verification
 *
 * Sign up at https://sandbox.co.in → get API key + secret from dashboard.
 * All API calls require: Authorization: Bearer <token>, x-api-version: 2.0
 *
 * TODO: implement each method below by calling the Sandbox.co.in REST API.
 * Docs: https://docs.sandbox.co.in
 */
@Injectable()
export class SandboxKycProvider implements IKycProvider {
  private readonly logger = new Logger(SandboxKycProvider.name);
  private readonly baseUrl = 'https://api.sandbox.co.in';

  // TODO: inject ConfigService and read SANDBOX_API_KEY + SANDBOX_API_SECRET
  private readonly apiKey = process.env['SANDBOX_API_KEY'] ?? '';
  private readonly apiSecret = process.env['SANDBOX_API_SECRET'] ?? '';

  /** Obtain a short-lived access token from Sandbox.co.in */
  private async getAccessToken(): Promise<string> {
    // POST /authenticate
    // Body: { _id: apiKey, _secret: apiSecret, _domain: null }
    // Returns: { access_token: "..." }
    // TODO: implement + cache token (TTL from response)
    throw new ServiceUnavailableException(
      'SandboxKycProvider: getAccessToken() not yet implemented — set KYC_PROVIDER=stub for local dev',
    );
  }

  async initiateAadhaarOtp(
    aadhaarNumber: string,
  ): Promise<{ sessionId: string }> {
    // POST /kyc/aadhaar/otp
    // Headers: Authorization: Bearer <token>, x-api-version: 2.0
    // Body: { "@entity": "in.co.sandbox.kyc.aadhaar.otp.request", "aadhaar_number": aadhaarNumber }
    // Response: { data: { ref_id: "...", message: "OTP sent" } }
    // → return { sessionId: ref_id }
    //
    // TODO: implement HTTP call + store ref_id in Redis with 10-min TTL
    this.logger.error(
      'SandboxKycProvider.initiateAadhaarOtp() not yet implemented',
    );
    throw new ServiceUnavailableException(
      'Aadhaar KYC not yet configured — contact support',
    );
  }

  async verifyAadhaarOtp(
    sessionId: string,
    otp: string,
  ): Promise<{ maskedAadhaar: string }> {
    // POST /kyc/aadhaar/otp/verify
    // Body: { "@entity": "in.co.sandbox.kyc.aadhaar.otp.verify.request", "ref_id": sessionId, "otp": otp }
    // Response: { data: { aadhaar_number: "XXXX-XXXX-1234", ... } }
    // → extract last 4 digits, return { maskedAadhaar: "XXXX-XXXX-1234" }
    // → clear Redis session after use
    //
    // On error: Sandbox returns HTTP 422 with { code: ..., message: "Invalid OTP" }
    // → throw BadRequestException with provider message
    this.logger.error(
      'SandboxKycProvider.verifyAadhaarOtp() not yet implemented',
    );
    throw new ServiceUnavailableException(
      'Aadhaar KYC not yet configured — contact support',
    );
  }

  async verifyPan(panNumber: string): Promise<{ maskedPan: string }> {
    // POST /kyc/pan
    // Body: { "@entity": "in.co.sandbox.kyc.pan.request", "pan": panNumber }
    // Response: { data: { pan_number: "ABCDE1234F", name: "...", status: "VALID" } }
    // → mask PAN: ABCDE****F, return { maskedPan }
    // → on invalid PAN: throw BadRequestException
    this.logger.error('SandboxKycProvider.verifyPan() not yet implemented');
    throw new ServiceUnavailableException(
      'PAN verification not yet configured — contact support',
    );
  }

  async verifyBankAccount(
    accountNumber: string,
    ifsc: string,
  ): Promise<{ verified: boolean; reason?: string }> {
    // POST /bank/verify (Sandbox.co.in penny-drop endpoint)
    // Body: { "account_number": accountNumber, "ifsc": ifsc }
    // Response: { data: { bank_account_status: "VALID" | "INVALID", name_at_bank: "..." } }
    // → return { verified: status === "VALID" }
    this.logger.error(
      'SandboxKycProvider.verifyBankAccount() not yet implemented',
    );
    throw new ServiceUnavailableException(
      'Bank verification not yet configured — contact support',
    );
  }

  async verifyLiveness(
    _imageBase64: string,
  ): Promise<{ passed: boolean; reason?: string }> {
    // Sandbox.co.in does not have a free liveness API.
    // For development: return passed=true (same as stub).
    // For production: integrate Digio face-match or Hyperverge FaceMatch.
    this.logger.warn(
      'SandboxKycProvider: liveness check not available in sandbox — auto-passing',
    );
    return { passed: true };
  }

  // Silence unused-var linting until above methods are implemented
  private _unused = { apiKey: this.apiKey, apiSecret: this.apiSecret, getAccessToken: this.getAccessToken.bind(this) };
}
