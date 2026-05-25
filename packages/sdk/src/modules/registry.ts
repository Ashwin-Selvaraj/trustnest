import { type ContractTransactionReceipt, type Signer } from 'ethers';
import { TrustNestRegistry__factory } from '@trustnest/contracts/typechain-types';
import { agreementIdToBytes32 } from '../utils';
import { wrapContractError } from '../internal/wrapContractError';

export interface RegisterUserParams {
  /** Postgres UUID that uniquely identifies the user in the backend DB. */
  userId: string;
  /** Custodial wallet address created for this user. */
  walletAddress: string;
}

/**
 * Wraps `TrustNestRegistry` — the on-chain mapping between Postgres user IDs
 * (bytes32 hash of a UUID) and custodial wallet addresses.
 *
 * All write methods require a signer with `OPERATOR_ROLE`.
 */
export class RegistryModule {
  constructor(
    private readonly signer: Signer,
    private readonly registryAddress: string,
  ) {}

  private get contract() {
    return TrustNestRegistry__factory.connect(this.registryAddress, this.signer);
  }

  /**
   * Registers a (userId, walletAddress) pair on-chain.
   * Reverts if the userId or wallet is already registered.
   * Waits for 1 confirmation.
   */
  async registerUser(params: RegisterUserParams): Promise<ContractTransactionReceipt> {
    return wrapContractError(async () => {
      const tx = await this.contract.register(
        agreementIdToBytes32(params.userId),
        params.walletAddress,
      );
      return (await tx.wait(1)) as ContractTransactionReceipt;
    });
  }

  /**
   * Removes a userId → wallet mapping from the registry.
   * Reverts if the userId was never registered.
   * Waits for 1 confirmation.
   */
  async deregisterUser(userId: string): Promise<ContractTransactionReceipt> {
    return wrapContractError(async () => {
      const tx = await this.contract.deregister(agreementIdToBytes32(userId));
      return (await tx.wait(1)) as ContractTransactionReceipt;
    });
  }

  /**
   * Returns the custodial wallet address for a given userId.
   * Returns `address(0)` (zero address) if not registered.
   */
  async getWalletAddress(userId: string): Promise<string> {
    return wrapContractError(() =>
      this.contract.getWallet(agreementIdToBytes32(userId)),
    );
  }

  /**
   * Returns the bytes32 userId hash for a given wallet address.
   * Returns `bytes32(0)` if not registered.
   */
  async getUserId(walletAddress: string): Promise<string> {
    return wrapContractError(() => this.contract.getUserId(walletAddress));
  }
}
