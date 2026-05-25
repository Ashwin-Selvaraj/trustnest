import { type Signer } from 'ethers';
import { type ContractAddresses } from '@trustnest/shared';
import { RegistryModule } from './modules/registry';
import { EscrowModule } from './modules/escrow';
import { AgreementModule } from './modules/agreement';
import { ReputationModule } from './modules/reputation';

export interface TrustNestSDKConfig {
  /**
   * Ethers v6 Signer that holds the `OPERATOR_ROLE` on all four contracts.
   * In the backend, this is the AES-256-GCM-encrypted operator key
   * decrypted at startup inside `BlockchainService`.
   */
  signer: Signer;
  /** On-chain addresses for all four TrustNest contracts. */
  addresses: ContractAddresses;
  /**
   * USDC token address on the target network.
   * Use `USDC_MAINNET_ADDRESS` from `@trustnest/shared` for Polygon mainnet,
   * or the MockUSDC address when running against a local Hardhat node.
   */
  usdcAddress: string;
}

/**
 * Entry-point for all on-chain interactions.
 *
 * Instantiate once per process (in `BlockchainService`), then call methods
 * on the four module properties — `registry`, `escrow`, `agreement`,
 * `reputation` — from any other NestJS service.
 *
 * All write methods require the configured signer to hold `OPERATOR_ROLE`
 * on the target contracts and wait for exactly 1 block confirmation before
 * resolving.
 *
 * @example
 * ```typescript
 * const sdk = new TrustNestSDK({
 *   signer: operatorWallet,
 *   addresses: CONTRACT_ADDRESSES.amoy,
 *   usdcAddress: USDC_MAINNET_ADDRESS,
 * });
 *
 * await sdk.registry.registerUser({ userId, walletAddress });
 * await sdk.escrow.deposit({ agreementId, tenantAddress, ownerAddress, usdcAmount });
 * ```
 */
export class TrustNestSDK {
  public readonly registry: RegistryModule;
  public readonly escrow: EscrowModule;
  public readonly agreement: AgreementModule;
  public readonly reputation: ReputationModule;

  constructor(config: TrustNestSDKConfig) {
    this.registry = new RegistryModule(config.signer, config.addresses.registry);
    this.escrow = new EscrowModule(
      config.signer,
      config.addresses.escrowVault,
      config.usdcAddress,
    );
    this.agreement = new AgreementModule(config.signer, config.addresses.agreementNFT);
    this.reputation = new ReputationModule(config.signer, config.addresses.reputationSBT);
  }
}
