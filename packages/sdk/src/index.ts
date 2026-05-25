// Errors
export { ContractRevertError, InsufficientGasError, RpcConnectionError } from './errors';

// Modules
export { RegistryModule } from './modules/registry';
export type { RegisterUserParams } from './modules/registry';

export { EscrowModule } from './modules/escrow';
export type {
  DepositParams,
  ReleaseParams,
  ResolveDisputeParams,
  EscrowInfo,
} from './modules/escrow';

export { AgreementModule } from './modules/agreement';
export type { MintAgreementParams, MintAgreementResult } from './modules/agreement';

export { ReputationModule } from './modules/reputation';
export type { MintReputationParams, ReputationScore } from './modules/reputation';

// Root SDK class
export { TrustNestSDK } from './sdk';
export type { TrustNestSDKConfig } from './sdk';

// Utilities
export { agreementIdToBytes32 } from './utils';
