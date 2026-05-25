import { type ContractTransactionReceipt, type Signer } from 'ethers';
import { ReputationSBT__factory } from '@trustnest/contracts/typechain-types';
import { agreementIdToBytes32 } from '../utils';
import { wrapContractError } from '../internal/wrapContractError';

export interface MintReputationParams {
  /** Postgres UUID of the closed agreement. */
  agreementId: string;
  /** Custodial wallet of the tenant. */
  tenantAddress: string;
  /** Peer score the owner gave the tenant (1–5). */
  tenantScore: number;
  /** Custodial wallet of the owner. */
  ownerAddress: string;
  /** Peer score the tenant gave the owner (1–5). */
  ownerScore: number;
}

export interface ReputationScore {
  /**
   * Average score * 10 (e.g., 45 represents a 4.5 average).
   * This is the raw value returned by `scoreOf` on-chain.
   */
  averageTimes10: bigint;
  /** Total number of soulbound reputation tokens held by this address. */
  tokenCount: bigint;
}

/**
 * Wraps `ReputationSBT` — the ERC-5192 soulbound token that records
 * peer ratings at agreement close.
 *
 * All write methods require a signer with `OPERATOR_ROLE`.
 */
export class ReputationModule {
  constructor(
    private readonly signer: Signer,
    private readonly reputationSBTAddress: string,
  ) {}

  private get contract() {
    return ReputationSBT__factory.connect(this.reputationSBTAddress, this.signer);
  }

  /**
   * Mints two soulbound reputation tokens at agreement close — one for the
   * tenant and one for the owner — each recording the peer-assigned score.
   * Scores must be in the range 1–5 (enforced on-chain).
   * Waits for 1 confirmation.
   */
  async mintReputation(params: MintReputationParams): Promise<ContractTransactionReceipt> {
    return wrapContractError(async () => {
      const tx = await this.contract.mint(
        agreementIdToBytes32(params.agreementId),
        params.tenantAddress,
        params.tenantScore,
        params.ownerAddress,
        params.ownerScore,
      );
      return (await tx.wait(1)) as ContractTransactionReceipt;
    });
  }

  /**
   * Returns the on-chain reputation score for a wallet address.
   * `averageTimes10` is the raw `scoreOf` return (e.g., 45 = 4.5 stars).
   * Returns `{ averageTimes10: 0n, tokenCount: 0n }` for addresses with no tokens.
   */
  async getScore(walletAddress: string): Promise<ReputationScore> {
    return wrapContractError(async () => {
      const [averageTimes10, tokenCount] = await this.contract.scoreOf(walletAddress);
      return { averageTimes10, tokenCount };
    });
  }

  /**
   * Returns all soulbound token IDs owned by a wallet address in order of minting.
   */
  async getTokensByOwner(walletAddress: string): Promise<bigint[]> {
    return wrapContractError(async () => {
      const tokens: bigint[] = [];
      let index = 0n;
      // tokensByOwner is a mapping(address => uint256[]) — no length getter,
      // so we page through the public array getter until it reverts.
      while (true) {
        try {
          const tokenId = await this.contract.tokensByOwner(walletAddress, index);
          tokens.push(tokenId);
          index++;
        } catch {
          break;
        }
      }
      return tokens;
    });
  }
}
