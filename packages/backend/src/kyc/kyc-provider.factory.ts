import { Injectable, Logger } from '@nestjs/common';
import type { IKycProvider } from './kyc-provider.interface';
import { StubKycProvider } from './providers/stub-kyc.provider';
import { SandboxKycProvider } from './providers/sandbox-kyc.provider';

/**
 * KycProviderFactory
 *
 * Reads KYC_PROVIDER env var and returns the correct provider implementation.
 * This is the only place that knows which provider is active.
 *
 * Adding a new provider:
 *  1. Implement IKycProvider in src/kyc/providers/<name>-kyc.provider.ts
 *  2. Add a case here
 *  3. Add env vars to .env.example
 *  4. Zero frontend changes required
 */
@Injectable()
export class KycProviderFactory {
  private readonly logger = new Logger(KycProviderFactory.name);
  private readonly provider: IKycProvider;

  constructor() {
    const kycProvider = process.env['KYC_PROVIDER'] ?? 'stub';

    switch (kycProvider) {
      case 'sandbox':
        this.logger.log('KYC provider: Sandbox.co.in');
        this.provider = new SandboxKycProvider();
        break;

      case 'digio':
        // TODO: import and instantiate DigioKycProvider when implemented (§12d.C)
        this.logger.warn(
          'KYC_PROVIDER=digio requested but DigioKycProvider not yet implemented — falling back to stub',
        );
        this.provider = new StubKycProvider();
        break;

      case 'stub':
      default:
        this.logger.warn(
          'KYC provider: STUB (fake OTP — development only, DO NOT use in production)',
        );
        this.provider = new StubKycProvider();
        break;
    }
  }

  getProvider(): IKycProvider {
    return this.provider;
  }
}
