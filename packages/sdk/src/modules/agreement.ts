import { type ContractTransactionReceipt, type Signer } from 'ethers';
import { AgreementNFT__factory } from '@trustnest/contracts/typechain-types';
import { agreementIdToBytes32 } from '../utils';
import { wrapContractError } from '../internal/wrapContractError';

export interface MintAgreementParams {
  /** Postgres UUID of the agreement. */
  agreementId: string;
  /** Custodial wallet address of the tenant. */
  tenantAddress: string;
  /** Custodial wallet address of the owner. */
  ownerAddress: string;
  /** IPFS or HTTPS URI pointing to the agreement JSON metadata. */
  metadataURI: string;
}

export interface MintAgreementResult {
  receipt: ContractTransactionReceipt;
  /** ERC-721 token ID minted for the tenant. */
  tenantTokenId: bigint;
  /** ERC-721 token ID minted for the owner. */
  ownerTokenId: bigint;
}

/**
 * Wraps `AgreementNFT` — the dual-mint ERC-721 contract that represents a
 * rental agreement as two NFTs (one for each party).
 *
 * All write methods require a signer with `OPERATOR_ROLE`.
 */
export class AgreementModule {
  constructor(
    private readonly signer: Signer,
    private readonly agreementNFTAddress: string,
  ) {}

  private get contract() {
    return AgreementNFT__factory.connect(this.agreementNFTAddress, this.signer);
  }

  /**
   * Dual-mints one NFT for the tenant and one for the owner.
   * Both tokens share the same `metadataURI`.
   * Reverts if NFTs have already been minted for this `agreementId`.
   * Returns both token IDs parsed from the `AgreementMinted` event.
   * Waits for 1 confirmation.
   */
  async mintAgreement(params: MintAgreementParams): Promise<MintAgreementResult> {
    return wrapContractError(async () => {
      const contract = this.contract;
      const tx = await contract.mint(
        agreementIdToBytes32(params.agreementId),
        params.tenantAddress,
        params.ownerAddress,
        params.metadataURI,
      );
      const receipt = (await tx.wait(1)) as ContractTransactionReceipt;

      let tenantTokenId = 0n;
      let ownerTokenId = 0n;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === 'AgreementMinted') {
            tenantTokenId = parsed.args[1] as bigint;
            ownerTokenId = parsed.args[2] as bigint;
            break;
          }
        } catch {
          // skip logs from other contracts
        }
      }

      return { receipt, tenantTokenId, ownerTokenId };
    });
  }

  /**
   * Updates the metadata URI on a specific token.
   * Reverts if the token does not exist or caller lacks `OPERATOR_ROLE`.
   * Waits for 1 confirmation.
   */
  async updateMetadata(
    tokenId: bigint,
    newMetadataURI: string,
  ): Promise<ContractTransactionReceipt> {
    return wrapContractError(async () => {
      const tx = await this.contract.updateMetadata(tokenId, newMetadataURI);
      return (await tx.wait(1)) as ContractTransactionReceipt;
    });
  }

  /**
   * Returns `{ tenantTokenId, ownerTokenId }` for an agreement, or `null` if
   * no NFTs have been minted yet (tenantToken mapping returns 0).
   */
  async getTokenByAgreement(
    agreementId: string,
  ): Promise<{ tenantTokenId: bigint; ownerTokenId: bigint } | null> {
    return wrapContractError(async () => {
      const idBytes = agreementIdToBytes32(agreementId);
      const tenantTokenId = await this.contract.tenantToken(idBytes);
      if (tenantTokenId === 0n) return null;
      const ownerTokenId = await this.contract.ownerToken(idBytes);
      return { tenantTokenId, ownerTokenId };
    });
  }

  /**
   * Returns the metadata URI for a specific ERC-721 token.
   * Reverts if the token does not exist.
   */
  async getMetadataURI(tokenId: bigint): Promise<string> {
    return wrapContractError(() => this.contract.tokenURI(tokenId));
  }
}
