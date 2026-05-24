import { keccak256, toUtf8Bytes } from 'ethers';

/**
 * Converts a Postgres UUID string to a bytes32 hex string suitable for Solidity.
 * Matches what all four contracts expect for agreementId / userId parameters.
 */
export function agreementIdToBytes32(uuid: string): string {
  return keccak256(toUtf8Bytes(uuid));
}
