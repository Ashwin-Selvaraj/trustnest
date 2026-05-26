/**
 * IKycProvider
 *
 * All KYC calls in UsersService go through this interface.
 * The concrete provider is selected at startup via KYC_PROVIDER env var.
 *
 * Architecture rule: the mobile app NEVER calls any KYC provider directly.
 * Flow: React Native → TrustNest backend → KYC provider
 *
 * Current implementations:
 *  - StubKycProvider   (KYC_PROVIDER=stub)    — in-memory fake OTP; local dev
 *  - SandboxKycProvider (KYC_PROVIDER=sandbox) — Sandbox.co.in free sandbox; real UIDAI gateway
 *  - DigioKycProvider  (KYC_PROVIDER=digio)   — Digio production; KYC + Aadhaar eSign bundle
 */
export interface IKycProvider {
  /**
   * Trigger an OTP to be sent to the mobile number linked to the given Aadhaar.
   * Returns a sessionId (provider ref) to be passed to verifyAadhaarOtp.
   */
  initiateAadhaarOtp(aadhaarNumber: string): Promise<{ sessionId: string }>;

  /**
   * Verify the OTP the user entered against the provider.
   * On success: returns masked Aadhaar (last 4 digits only).
   * On failure: throws BadRequestException.
   */
  verifyAadhaarOtp(
    sessionId: string,
    otp: string,
  ): Promise<{ maskedAadhaar: string }>;

  /**
   * Validate a PAN number against ITD (Income Tax Dept) database.
   * Returns masked PAN (e.g. ABCDE****F).
   * No image upload — this is a database lookup.
   * For PAN card OCR, use DigioKycProvider.verifyPanImage().
   */
  verifyPan(panNumber: string): Promise<{ maskedPan: string }>;

  /**
   * Verify a bank account via penny-drop.
   * Returns true if account details match.
   */
  verifyBankAccount(
    accountNumber: string,
    ifsc: string,
  ): Promise<{ verified: boolean; reason?: string }>;

  /**
   * Perform selfie / liveness check.
   * @param imageBase64 - base64-encoded JPEG from mobile camera
   * Returns passed=true if liveness confirmed; false with reason if failed.
   */
  verifyLiveness(
    imageBase64: string,
  ): Promise<{ passed: boolean; reason?: string }>;
}
