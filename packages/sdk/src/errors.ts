/**
 * Thrown when a smart-contract call reverts on-chain.
 * `reason` mirrors the Solidity revert string; `txHash` is populated
 * when the revert was caught from a mined transaction.
 */
export class ContractRevertError extends Error {
  public readonly reason: string;
  public readonly txHash: string | undefined;

  constructor(reason: string, txHash?: string) {
    super(`Contract reverted: ${reason}`);
    this.name = 'ContractRevertError';
    this.reason = reason;
    this.txHash = txHash;
  }
}

/**
 * Thrown when the signer does not have enough native token (MATIC) to
 * cover estimated gas fees.
 */
export class InsufficientGasError extends Error {
  constructor(message = 'Insufficient native token to cover gas fees') {
    super(message);
    this.name = 'InsufficientGasError';
  }
}

/**
 * Thrown when the JSON-RPC provider is unreachable or returns a network
 * error before a transaction can be submitted.
 */
export class RpcConnectionError extends Error {
  constructor(message = 'Failed to connect to RPC endpoint') {
    super(message);
    this.name = 'RpcConnectionError';
  }
}
