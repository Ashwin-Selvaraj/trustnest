/**
 * Generates a fresh operator wallet and prints the encrypted env values.
 *
 * Usage:
 *   MASTER_ENCRYPTION_KEY=<64-char-hex> node dist/scripts/generate-operator-key.js
 *
 * The raw private key is printed ONCE to stdout for backup purposes and never
 * written to disk. Paste OPERATOR_KEY_ENCRYPTED / OPERATOR_KEY_IV into
 * packages/backend/.env, then fund the printed address with gas (Amoy faucet
 * for testnet) before running on-chain jobs.
 */
import { Wallet } from 'ethers';
import { encryptValue } from '../blockchain/crypto.util';

function main(): void {
  const masterKey = process.env['MASTER_ENCRYPTION_KEY'];
  if (!masterKey || masterKey.length !== 64) {
    console.error(
      'MASTER_ENCRYPTION_KEY env var is required (64-char hex / 32 bytes).\n' +
      'Generate one with: openssl rand -hex 32',
    );
    process.exit(1);
  }

  const wallet = Wallet.createRandom();
  const { ciphertext, iv } = encryptValue(wallet.privateKey, masterKey);

  console.log('── Operator wallet generated ──────────────────────────────');
  console.log('Address (fund this with gas):');
  console.log(`  ${wallet.address}`);
  console.log('');
  console.log('Add to packages/backend/.env:');
  console.log(`  OPERATOR_KEY_ENCRYPTED=${ciphertext}`);
  console.log(`  OPERATOR_KEY_IV=${iv}`);
  console.log('');
  console.log('Raw private key (backup securely, shown only once):');
  console.log(`  ${wallet.privateKey}`);
  console.log('───────────────────────────────────────────────────────────');
}

main();
