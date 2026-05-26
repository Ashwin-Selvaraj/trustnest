import { Module } from '@nestjs/common';
import { KycProviderFactory } from './kyc-provider.factory';

@Module({
  providers: [KycProviderFactory],
  exports: [KycProviderFactory],
})
export class KycModule {}
