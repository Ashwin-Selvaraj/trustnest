import { type ContractTransactionReceipt, type Signer, MaxUint256 } from 'ethers';
import {
  EscrowVault__factory,
  IERC20__factory,
} from '@trustnest/contracts/typechain-types';
import { EscrowStatus } from '@trustnest/shared';
import { agreementIdToBytes32 } from '../utils';
import { wrapContractError } from '../internal/wrapContractError';

export interface DepositParams {
  /** Postgres UUID of the agreement. */
  agreementId: string;
  /** Custodial wallet address of the tenant. */
  tenantAddress: string;
  /** Custodial wallet address of the owner. */
  ownerAddress: string;
  /** Amount in USDC wei (6 decimals). */
  usdcAmount: bigint;
}

export interface ReleaseParams {
  /** Postgres UUID of the agreement. */
  agreementId: string;
  /**
   * Amount in USDC wei to deduct from the tenant's deposit and send to the
   * owner as damages. Pass `0n` for a full refund.
   */
  deductionAmount: bigint;
}

export interface ResolveDisputeParams {
  /** Postgres UUID of the agreement. */
  agreementId: string;
  /** USDC wei to send to tenant. Must sum with `ownerShare` to equal deposit. */
  tenantShare: bigint;
  /** USDC wei to send to owner. Must sum with `tenantShare` to equal deposit. */
  ownerShare: bigint;
}

export interface EscrowInfo {
  tenant: string;
  owner: string;
  amount: bigint;
  status: EscrowStatus;
  depositedAt: bigint;
}

/** Maps on-chain EscrowStatus ordinal (0–4) to the shared TypeScript enum. */
const ESCROW_STATUS_MAP: EscrowStatus[] = [
  EscrowStatus.PENDING,
  EscrowStatus.ACTIVE,
  EscrowStatus.RELEASED,
  EscrowStatus.REFUNDED,
  EscrowStatus.DISPUTED,
];

/**
 * Wraps `EscrowVault` — the USDC custody contract.
 *
 * All write methods require a signer with `OPERATOR_ROLE`.
 * `deposit` automatically approves the vault to spend the operator's USDC
 * if the current allowance is insufficient.
 */
export class EscrowModule {
  constructor(
    private readonly signer: Signer,
    private readonly escrowVaultAddress: string,
    private readonly usdcAddress: string,
  ) {}

  private get vault() {
    return EscrowVault__factory.connect(this.escrowVaultAddress, this.signer);
  }

  private get usdc() {
    return IERC20__factory.connect(this.usdcAddress, this.signer);
  }

  /**
   * Ensures the vault has an unlimited USDC allowance from the operator signer.
   * Only calls `approve` when the current allowance is less than `amount`.
   */
  private async ensureAllowance(amount: bigint): Promise<void> {
    const signerAddress = await this.signer.getAddress();
    const allowance = await this.usdc.allowance(signerAddress, this.escrowVaultAddress);
    if (allowance < amount) {
      const tx = await this.usdc.approve(this.escrowVaultAddress, MaxUint256);
      await tx.wait(1);
    }
  }

  /**
   * Pulls `usdcAmount` from the operator's wallet and locks it in the vault.
   * Auto-approves USDC allowance if insufficient.
   * Reverts if an escrow already exists for `agreementId`.
   * Waits for 1 confirmation.
   */
  async deposit(params: DepositParams): Promise<ContractTransactionReceipt> {
    return wrapContractError(async () => {
      await this.ensureAllowance(params.usdcAmount);
      const tx = await this.vault.deposit(
        agreementIdToBytes32(params.agreementId),
        params.tenantAddress,
        params.ownerAddress,
        params.usdcAmount,
      );
      return (await tx.wait(1)) as ContractTransactionReceipt;
    });
  }

  /**
   * Releases an active escrow: `deductionAmount` goes to the owner as
   * damages; the remainder is returned to the tenant.
   * Waits for 1 confirmation.
   */
  async release(params: ReleaseParams): Promise<ContractTransactionReceipt> {
    return wrapContractError(async () => {
      const tx = await this.vault.release(
        agreementIdToBytes32(params.agreementId),
        params.deductionAmount,
      );
      return (await tx.wait(1)) as ContractTransactionReceipt;
    });
  }

  /**
   * Locks a previously-active escrow pending manual dispute resolution.
   * Waits for 1 confirmation.
   */
  async raiseDispute(agreementId: string): Promise<ContractTransactionReceipt> {
    return wrapContractError(async () => {
      const tx = await this.vault.raiseDispute(agreementIdToBytes32(agreementId));
      return (await tx.wait(1)) as ContractTransactionReceipt;
    });
  }

  /**
   * Resolves a disputed escrow by splitting the deposit between the two parties.
   * `tenantShare + ownerShare` must equal the original deposit amount.
   * Waits for 1 confirmation.
   */
  async resolveDispute(params: ResolveDisputeParams): Promise<ContractTransactionReceipt> {
    return wrapContractError(async () => {
      const tx = await this.vault.resolveDispute(
        agreementIdToBytes32(params.agreementId),
        params.tenantShare,
        params.ownerShare,
      );
      return (await tx.wait(1)) as ContractTransactionReceipt;
    });
  }

  /**
   * Returns the current on-chain escrow state for an agreement, or `null` if
   * no escrow has been created (amount === 0n).
   */
  async getEscrow(agreementId: string): Promise<EscrowInfo | null> {
    return wrapContractError(async () => {
      const result = await this.vault.escrows(agreementIdToBytes32(agreementId));
      if (result.amount === 0n) return null;
      return {
        tenant: result.tenant,
        owner: result.owner,
        amount: result.amount,
        status: ESCROW_STATUS_MAP[Number(result.status)] ?? EscrowStatus.PENDING,
        depositedAt: result.depositedAt,
      };
    });
  }
}
