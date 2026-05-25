/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/** Safely copies a Buffer into a plain Uint8Array with guaranteed ArrayBuffer backing. */
function toSafeUint8(input: Buffer | Uint8Array): Uint8Array {
  const ab = new ArrayBuffer(input.length);
  const u8 = new Uint8Array(ab);
  u8.set(input);
  return u8;
}

/**
 * Encrypt a UTF-8 plaintext string with AES-256-GCM.
 * `masterKeyHex` must be a 64-char hex string (32 bytes).
 * Ciphertext format: `<encHex>:<tagHex>` (hex-encoded).
 */
export function encryptValue(
  plaintext: string,
  masterKeyHex: string,
): { ciphertext: string; iv: string } {
  const key = toSafeUint8(Buffer.from(masterKeyHex, 'hex'));
  const ivBuf = crypto.randomBytes(12);
  const iv = toSafeUint8(ivBuf);
  // Cast via `any` to sidestep Buffer vs Uint8Array<ArrayBuffer> strictness in @types/node
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const cipher = (crypto as any).createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
  const enc1: string = cipher.update(plaintext, 'utf8', 'hex');
  const enc2: string = cipher.final('hex');
  const tag: string = cipher.getAuthTag().toString('hex');
  return {
    ciphertext: `${enc1}${enc2}:${tag}`,
    iv: ivBuf.toString('hex'),
  };
}

/**
 * Decrypt a ciphertext produced by `encryptValue`.
 * Ciphertext format: `<encHex>:<tagHex>`.
 */
export function decryptValue(
  ciphertext: string,
  ivHex: string,
  masterKeyHex: string,
): string {
  const key = toSafeUint8(Buffer.from(masterKeyHex, 'hex'));
  const iv = toSafeUint8(Buffer.from(ivHex, 'hex'));
  const colonIdx = ciphertext.lastIndexOf(':');
  const encHex = ciphertext.slice(0, colonIdx);
  const tagHex = ciphertext.slice(colonIdx + 1);
  const encBuf = toSafeUint8(Buffer.from(encHex, 'hex'));
  const authTag = toSafeUint8(Buffer.from(tagHex, 'hex'));
  // Cast via `any` to sidestep Buffer vs Uint8Array<ArrayBuffer> strictness in @types/node
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const decipher = (crypto as any).createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(authTag);
  const dec: string = decipher.update(encBuf, undefined, 'utf8');
  const final: string = decipher.final('utf8');
  return dec + final;
}
