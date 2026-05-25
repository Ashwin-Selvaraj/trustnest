import { isCallException, isError } from 'ethers';
import { ContractRevertError, InsufficientGasError, RpcConnectionError } from '../errors';

/**
 * Runs `fn` and maps common ethers v6 errors into typed SDK errors so callers
 * can catch specific failure modes.
 *
 * Two revert paths are handled:
 * 1. Real RPC nodes (mainnet / Amoy): ethers v6 wraps reverts as a
 *    `CALL_EXCEPTION` — detected via `isCallException()`.
 * 2. Hardhat local node: reverts surface *before* the tx is mined, as a
 *    `VM Exception while processing transaction: …` error from the
 *    gas-estimation call. These are caught by checking `err.message`.
 */
export async function wrapContractError<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    // ── Standard ethers v6 CALL_EXCEPTION (mainnet / real RPC nodes) ──────
    if (isCallException(err)) {
      throw new ContractRevertError(
        err.reason ?? err.message ?? 'unknown revert reason',
        err.receipt?.hash,
      );
    }

    if (isError(err, 'INSUFFICIENT_FUNDS')) {
      throw new InsufficientGasError(err.message);
    }
    if (isError(err, 'NETWORK_ERROR') || isError(err, 'TIMEOUT')) {
      throw new RpcConnectionError(err.message);
    }

    // ── Hardhat local-node revert formats (VM Exception) ─────────────────
    // The Hardhat in-memory node rejects the gas-estimation call before
    // mining, producing a plain Error with the revert reason in its message.
    if (err instanceof Error) {
      const msg = err.message;

      // require(...) / revert "reason string"
      const reasonMatch = msg.match(/reverted with reason string '([^']+)'/);
      if (reasonMatch) {
        throw new ContractRevertError(reasonMatch[1]);
      }

      // Custom Solidity errors: revert CustomError(...)
      const customMatch = msg.match(/reverted with custom error '([^'(]+)/);
      if (customMatch) {
        throw new ContractRevertError(`custom error: ${customMatch[1].trim()}`);
      }

      // Panic codes: e.g. 0x11 (arithmetic overflow)
      const panicMatch = msg.match(/reverted with panic code (0x[0-9a-fA-F]+)/);
      if (panicMatch) {
        throw new ContractRevertError(`panic: ${panicMatch[1]}`);
      }

      // Bare "Transaction reverted without a reason string" from Hardhat
      if (msg.includes('Transaction reverted without a reason string')) {
        throw new ContractRevertError('transaction reverted');
      }
    }

    throw err;
  }
}
