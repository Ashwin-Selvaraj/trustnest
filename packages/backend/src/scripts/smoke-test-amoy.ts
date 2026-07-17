/**
 * End-to-end on-chain smoke test against Amoy (phase2-tasks.md §1).
 *
 * Exercises the exact SDK path the backend job queue uses:
 *   mint test USDC → register tenant+owner → mint agreement NFT →
 *   deposit escrow → release escrow → mint reputation SBTs → read score.
 *
 * Usage (env from packages/backend/.env must be loaded):
 *   set -a && source .env && set +a && node dist/scripts/smoke-test-amoy.js
 *
 * Costs real (testnet) gas — 7 transactions total.
 */
import { Contract, JsonRpcProvider, Wallet, formatUnits, parseUnits } from 'ethers';
import { randomUUID } from 'crypto';
import { TrustNestSDK } from '@trustnest/sdk';
import { CONTRACT_ADDRESSES } from '@trustnest/shared';
import { decryptValue } from '../blockchain/crypto.util';

const MOCK_USDC_ABI = [
  'function mint(address to, uint256 amount) external',
  'function balanceOf(address) view returns (uint256)',
];

async function main(): Promise<void> {
  const rpcUrl    = process.env['POLYGON_RPC_URL'];
  const encrypted = process.env['OPERATOR_KEY_ENCRYPTED'];
  const iv        = process.env['OPERATOR_KEY_IV'];
  const masterKey = process.env['MASTER_ENCRYPTION_KEY'];
  const usdcAddress = process.env['USDC_ADDRESS'];
  if (!rpcUrl || !encrypted || !iv || !masterKey || !usdcAddress) {
    console.error('Missing env: POLYGON_RPC_URL / OPERATOR_KEY_* / MASTER_ENCRYPTION_KEY / USDC_ADDRESS');
    process.exit(1);
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const operator = new Wallet(decryptValue(encrypted, iv, masterKey), provider);
  const sdk = new TrustNestSDK({
    signer: operator,
    addresses: CONTRACT_ADDRESSES.amoy,
    usdcAddress,
  });

  const gasBefore = await provider.getBalance(operator.address);
  console.log(`Operator ${operator.address} — gas: ${formatUnits(gasBefore, 18)} POL`);

  // Fresh throwaway identities for this run (custodial wallets: address-only, no funding needed)
  const tenantUserId = randomUUID();
  const ownerUserId  = randomUUID();
  const agreementId  = randomUUID();
  const tenantWallet = Wallet.createRandom();
  const ownerWallet  = Wallet.createRandom();
  console.log(`Tenant ${tenantWallet.address} / Owner ${ownerWallet.address}`);
  console.log(`Agreement ${agreementId}`);
  console.log('---');

  // 0. Mint test USDC to the operator (open mint on MockUSDC)
  const depositAmount = parseUnits('500', 6); // 500 USDC
  const usdc = new Contract(usdcAddress, MOCK_USDC_ABI, operator);
  await (await usdc['mint']!(operator.address, depositAmount)).wait(1);
  console.log(`1/7 MockUSDC minted: ${formatUnits(depositAmount, 6)} USDC → operator`);

  // 1–2. Register both users on TrustNestRegistry
  await sdk.registry.registerUser({ userId: tenantUserId, walletAddress: tenantWallet.address });
  console.log('2/7 Tenant registered on-chain');
  await sdk.registry.registerUser({ userId: ownerUserId, walletAddress: ownerWallet.address });
  console.log('3/7 Owner registered on-chain');

  // 3. Mint the dual agreement NFTs
  const minted = await sdk.agreement.mintAgreement({
    agreementId,
    tenantAddress: tenantWallet.address,
    ownerAddress:  ownerWallet.address,
    metadataURI:   'https://trustnest.example/agreements/smoke-test.json',
  });
  console.log(`4/7 AgreementNFT minted (tenant #${minted.tenantTokenId}, owner #${minted.ownerTokenId})`);

  // 4. Deposit escrow (auto-approves USDC allowance)
  await sdk.escrow.deposit({
    agreementId,
    tenantAddress: tenantWallet.address,
    ownerAddress:  ownerWallet.address,
    usdcAmount:    depositAmount,
  });
  console.log(`5/7 Escrow deposited: ${formatUnits(depositAmount, 6)} USDC locked in vault`);

  // 5. Release with a 50 USDC deduction to the owner
  const deduction = parseUnits('50', 6);
  await sdk.escrow.release({ agreementId, deductionAmount: deduction });
  const tenantBal = await usdc['balanceOf']!(tenantWallet.address) as bigint;
  const ownerBal  = await usdc['balanceOf']!(ownerWallet.address) as bigint;
  console.log(
    `6/7 Escrow released — tenant got ${formatUnits(tenantBal, 6)} USDC, ` +
    `owner got ${formatUnits(ownerBal, 6)} USDC (deduction)`,
  );

  // 6. Mint reputation SBTs for both parties
  await sdk.reputation.mintReputation({
    agreementId,
    tenantAddress: tenantWallet.address,
    tenantScore: 5,
    ownerAddress: ownerWallet.address,
    ownerScore: 4,
  });
  const tenantScore = await sdk.reputation.getScore(tenantWallet.address);
  const ownerScore  = await sdk.reputation.getScore(ownerWallet.address);
  console.log(
    `7/7 Reputation SBTs minted — tenant score ${Number(tenantScore.averageTimes10) / 10} ` +
    `(${tenantScore.tokenCount} token), owner score ${Number(ownerScore.averageTimes10) / 10} ` +
    `(${ownerScore.tokenCount} token)`,
  );

  const gasAfter = await provider.getBalance(operator.address);
  console.log('---');
  console.log(`Gas used: ${formatUnits(gasBefore - gasAfter, 18)} POL`);
  console.log('SMOKE TEST PASSED — full escrow lifecycle verified on Amoy');
}

main().catch((err) => {
  console.error('SMOKE TEST FAILED:', err);
  process.exitCode = 1;
});
