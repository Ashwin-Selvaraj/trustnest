import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  TrustNestRegistry__factory,
  EscrowVault__factory,
  AgreementNFT__factory,
  ReputationSBT__factory,
  MockUSDC__factory,
} from '@trustnest/contracts/typechain-types';
import { TrustNestSDK } from '../src/sdk';
import { EscrowStatus } from '@trustnest/shared';
import { ContractRevertError } from '../src/errors';

// ─── Test fixtures ─────────────────────────────────────────────────────────────

const AGREEMENT_UUID = 'e4f0a123-dead-beef-cafe-000000000001';
const USER_UUID_1    = 'aaaaaaaa-0000-0000-0000-000000000001';
const USER_UUID_2    = 'bbbbbbbb-0000-0000-0000-000000000002';
const DEPOSIT_AMOUNT = 75_000_000n; // 75 USDC (6 decimals)
const METADATA_URI   = 'ipfs://QmFakeHash/agreement.json';

async function deployAll() {
  const [admin, operator, tenant, owner, other] = await ethers.getSigners();

  // ── Deploy MockUSDC
  const usdc = await new MockUSDC__factory(admin).deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();

  // ── Deploy core contracts (operator has OPERATOR_ROLE on all)
  const registry = await new TrustNestRegistry__factory(admin).deploy(
    admin.address, operator.address,
  );
  await registry.waitForDeployment();

  const vault = await new EscrowVault__factory(admin).deploy(
    admin.address, operator.address, usdcAddress,
  );
  await vault.waitForDeployment();

  const agreementNFT = await new AgreementNFT__factory(admin).deploy(
    admin.address, operator.address,
  );
  await agreementNFT.waitForDeployment();

  const reputationSBT = await new ReputationSBT__factory(admin).deploy(
    admin.address, operator.address,
  );
  await reputationSBT.waitForDeployment();

  // ── Fund the operator wallet with enough USDC and create SDK
  await usdc.mint(operator.address, DEPOSIT_AMOUNT * 100n);

  const sdk = new TrustNestSDK({
    signer: operator,
    addresses: {
      registry: await registry.getAddress(),
      escrowVault: await vault.getAddress(),
      agreementNFT: await agreementNFT.getAddress(),
      reputationSBT: await reputationSBT.getAddress(),
    },
    usdcAddress,
  });

  return { sdk, usdc, registry, vault, agreementNFT, reputationSBT, admin, operator, tenant, owner, other };
}

// ─── RegistryModule ─────────────────────────────────────────────────────────

describe('RegistryModule', function () {
  it('registerUser — maps userId hash to wallet on-chain', async function () {
    const { sdk, tenant } = await deployAll();

    const receipt = await sdk.registry.registerUser({
      userId: USER_UUID_1,
      walletAddress: tenant.address,
    });

    expect(receipt).to.have.property('hash');
    const onChainWallet = await sdk.registry.getWalletAddress(USER_UUID_1);
    expect(onChainWallet.toLowerCase()).to.equal(tenant.address.toLowerCase());
  });

  it('getWalletAddress — returns zero address when not registered', async function () {
    const { sdk } = await deployAll();
    const wallet = await sdk.registry.getWalletAddress(USER_UUID_2);
    expect(wallet).to.equal(ethers.ZeroAddress);
  });

  it('getUserId — returns bytes32 hash for a registered wallet', async function () {
    const { sdk, tenant } = await deployAll();
    await sdk.registry.registerUser({ userId: USER_UUID_1, walletAddress: tenant.address });

    const userId = await sdk.registry.getUserId(tenant.address);
    expect(userId).to.be.a('string').and.not.equal(ethers.ZeroHash);
  });

  it('deregisterUser — removes the mapping', async function () {
    const { sdk, tenant } = await deployAll();
    await sdk.registry.registerUser({ userId: USER_UUID_1, walletAddress: tenant.address });
    await sdk.registry.deregisterUser(USER_UUID_1);

    const wallet = await sdk.registry.getWalletAddress(USER_UUID_1);
    expect(wallet).to.equal(ethers.ZeroAddress);
  });

  it('registerUser — throws ContractRevertError on duplicate userId', async function () {
    const { sdk, tenant, owner } = await deployAll();
    await sdk.registry.registerUser({ userId: USER_UUID_1, walletAddress: tenant.address });

    await expect(
      sdk.registry.registerUser({ userId: USER_UUID_1, walletAddress: owner.address }),
    ).to.be.rejectedWith(ContractRevertError);
  });
});

// ─── EscrowModule ────────────────────────────────────────────────────────────

describe('EscrowModule', function () {
  async function deployAndRegister() {
    const ctx = await deployAll();
    // Register both parties so wallets are known
    await ctx.sdk.registry.registerUser({ userId: USER_UUID_1, walletAddress: ctx.tenant.address });
    await ctx.sdk.registry.registerUser({ userId: USER_UUID_2, walletAddress: ctx.owner.address });
    return ctx;
  }

  it('deposit — auto-approves USDC and locks funds in vault', async function () {
    const { sdk, usdc, vault, tenant, owner } = await deployAndRegister();
    const vaultAddr = await vault.getAddress();

    const balanceBefore = await usdc.balanceOf(vaultAddr);
    await sdk.escrow.deposit({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      usdcAmount: DEPOSIT_AMOUNT,
    });

    expect(await usdc.balanceOf(vaultAddr)).to.equal(balanceBefore + DEPOSIT_AMOUNT);
  });

  it('getEscrow — returns ACTIVE status after deposit', async function () {
    const { sdk, tenant, owner } = await deployAndRegister();
    await sdk.escrow.deposit({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      usdcAmount: DEPOSIT_AMOUNT,
    });

    const info = await sdk.escrow.getEscrow(AGREEMENT_UUID);
    expect(info).to.not.be.null;
    expect(info!.status).to.equal(EscrowStatus.ACTIVE);
    expect(info!.amount).to.equal(DEPOSIT_AMOUNT);
    expect(info!.tenant.toLowerCase()).to.equal(tenant.address.toLowerCase());
  });

  it('getEscrow — returns null for non-existent agreement', async function () {
    const { sdk } = await deployAll();
    const result = await sdk.escrow.getEscrow('no-such-uuid');
    expect(result).to.be.null;
  });

  it('release — full refund to tenant when deduction is zero', async function () {
    const { sdk, usdc, tenant, owner } = await deployAndRegister();
    await sdk.escrow.deposit({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      usdcAmount: DEPOSIT_AMOUNT,
    });

    const tenantBefore = await usdc.balanceOf(tenant.address);
    await sdk.escrow.release({ agreementId: AGREEMENT_UUID, deductionAmount: 0n });

    expect(await usdc.balanceOf(tenant.address)).to.equal(tenantBefore + DEPOSIT_AMOUNT);
  });

  it('release — splits deposit correctly with a deduction', async function () {
    const { sdk, usdc, tenant, owner } = await deployAndRegister();
    await sdk.escrow.deposit({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      usdcAmount: DEPOSIT_AMOUNT,
    });

    const deduction     = 10_000_000n; // 10 USDC
    const tenantBefore  = await usdc.balanceOf(tenant.address);
    const ownerBefore   = await usdc.balanceOf(owner.address);

    await sdk.escrow.release({ agreementId: AGREEMENT_UUID, deductionAmount: deduction });

    expect(await usdc.balanceOf(tenant.address)).to.equal(tenantBefore + DEPOSIT_AMOUNT - deduction);
    expect(await usdc.balanceOf(owner.address)).to.equal(ownerBefore + deduction);
  });

  it('raiseDispute — transitions escrow to DISPUTED', async function () {
    const { sdk, tenant, owner } = await deployAndRegister();
    await sdk.escrow.deposit({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      usdcAmount: DEPOSIT_AMOUNT,
    });

    await sdk.escrow.raiseDispute(AGREEMENT_UUID);
    const info = await sdk.escrow.getEscrow(AGREEMENT_UUID);
    expect(info!.status).to.equal(EscrowStatus.DISPUTED);
  });

  it('resolveDispute — splits funds after dispute', async function () {
    const { sdk, usdc, tenant, owner } = await deployAndRegister();
    await sdk.escrow.deposit({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      usdcAmount: DEPOSIT_AMOUNT,
    });
    await sdk.escrow.raiseDispute(AGREEMENT_UUID);

    const tenantShare  = 50_000_000n;
    const ownerShare   = 25_000_000n;
    const tenantBefore = await usdc.balanceOf(tenant.address);
    const ownerBefore  = await usdc.balanceOf(owner.address);

    await sdk.escrow.resolveDispute({
      agreementId: AGREEMENT_UUID,
      tenantShare,
      ownerShare,
    });

    expect(await usdc.balanceOf(tenant.address)).to.equal(tenantBefore + tenantShare);
    expect(await usdc.balanceOf(owner.address)).to.equal(ownerBefore + ownerShare);
  });

  it('deposit — throws ContractRevertError on duplicate agreementId', async function () {
    const { sdk, tenant, owner } = await deployAndRegister();
    await sdk.escrow.deposit({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      usdcAmount: DEPOSIT_AMOUNT,
    });

    await expect(
      sdk.escrow.deposit({
        agreementId: AGREEMENT_UUID,
        tenantAddress: tenant.address,
        ownerAddress: owner.address,
        usdcAmount: DEPOSIT_AMOUNT,
      }),
    ).to.be.rejectedWith(ContractRevertError);
  });
});

// ─── AgreementModule ─────────────────────────────────────────────────────────

describe('AgreementModule', function () {
  it('mintAgreement — mints two NFTs and returns token IDs', async function () {
    const { sdk, tenant, owner } = await deployAll();

    const result = await sdk.agreement.mintAgreement({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      metadataURI: METADATA_URI,
    });

    expect(result.tenantTokenId).to.be.gt(0n);
    expect(result.ownerTokenId).to.be.gt(0n);
    expect(result.tenantTokenId).to.not.equal(result.ownerTokenId);
  });

  it('getTokenByAgreement — returns correct token IDs after mint', async function () {
    const { sdk, tenant, owner } = await deployAll();
    const { tenantTokenId, ownerTokenId } = await sdk.agreement.mintAgreement({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      metadataURI: METADATA_URI,
    });

    const tokens = await sdk.agreement.getTokenByAgreement(AGREEMENT_UUID);
    expect(tokens).to.not.be.null;
    expect(tokens!.tenantTokenId).to.equal(tenantTokenId);
    expect(tokens!.ownerTokenId).to.equal(ownerTokenId);
  });

  it('getTokenByAgreement — returns null when no NFTs minted', async function () {
    const { sdk } = await deployAll();
    const result = await sdk.agreement.getTokenByAgreement('non-existent-uuid');
    expect(result).to.be.null;
  });

  it('getMetadataURI — returns correct URI for a minted token', async function () {
    const { sdk, tenant, owner } = await deployAll();
    const { tenantTokenId } = await sdk.agreement.mintAgreement({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      metadataURI: METADATA_URI,
    });

    const uri = await sdk.agreement.getMetadataURI(tenantTokenId);
    expect(uri).to.equal(METADATA_URI);
  });

  it('updateMetadata — changes the URI for a token', async function () {
    const { sdk, tenant, owner } = await deployAll();
    const { tenantTokenId } = await sdk.agreement.mintAgreement({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      metadataURI: METADATA_URI,
    });

    const newURI = 'ipfs://QmUpdatedHash/agreement-v2.json';
    await sdk.agreement.updateMetadata(tenantTokenId, newURI);

    const uri = await sdk.agreement.getMetadataURI(tenantTokenId);
    expect(uri).to.equal(newURI);
  });

  it('mintAgreement — throws ContractRevertError on duplicate agreementId', async function () {
    const { sdk, tenant, owner } = await deployAll();
    await sdk.agreement.mintAgreement({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      metadataURI: METADATA_URI,
    });

    await expect(
      sdk.agreement.mintAgreement({
        agreementId: AGREEMENT_UUID,
        tenantAddress: tenant.address,
        ownerAddress: owner.address,
        metadataURI: METADATA_URI,
      }),
    ).to.be.rejectedWith(ContractRevertError);
  });
});

// ─── ReputationModule ────────────────────────────────────────────────────────

describe('ReputationModule', function () {
  it('mintReputation — mints two SBTs (one per party)', async function () {
    const { sdk, tenant, owner } = await deployAll();

    const receipt = await sdk.reputation.mintReputation({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      tenantScore: 5,
      ownerAddress: owner.address,
      ownerScore: 4,
    });

    expect(receipt).to.have.property('hash');
  });

  it('getScore — returns averageTimes10 and count', async function () {
    const { sdk, tenant, owner } = await deployAll();

    await sdk.reputation.mintReputation({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      tenantScore: 4,
      ownerAddress: owner.address,
      ownerScore: 5,
    });

    const tenantScore = await sdk.reputation.getScore(tenant.address);
    expect(tenantScore.tokenCount).to.equal(1n);
    expect(tenantScore.averageTimes10).to.equal(40n); // 4 * 10 / 1

    const ownerScore = await sdk.reputation.getScore(owner.address);
    expect(ownerScore.tokenCount).to.equal(1n);
    expect(ownerScore.averageTimes10).to.equal(50n); // 5 * 10 / 1
  });

  it('getScore — returns zeros for address with no tokens', async function () {
    const { sdk, other } = await deployAll();
    const score = await sdk.reputation.getScore(other.address);
    expect(score.averageTimes10).to.equal(0n);
    expect(score.tokenCount).to.equal(0n);
  });

  it('getScore — averages correctly across multiple agreements', async function () {
    const { sdk, tenant, owner } = await deployAll();

    await sdk.reputation.mintReputation({
      agreementId: 'agreement-uuid-001',
      tenantAddress: tenant.address,
      tenantScore: 5,
      ownerAddress: owner.address,
      ownerScore: 3,
    });
    await sdk.reputation.mintReputation({
      agreementId: 'agreement-uuid-002',
      tenantAddress: tenant.address,
      tenantScore: 3,
      ownerAddress: owner.address,
      ownerScore: 5,
    });

    const tenantScore = await sdk.reputation.getScore(tenant.address);
    expect(tenantScore.tokenCount).to.equal(2n);
    expect(tenantScore.averageTimes10).to.equal(40n); // (5+3)*10 / 2 = 40
  });

  it('getTokensByOwner — returns all SBT token IDs for a wallet', async function () {
    const { sdk, tenant, owner } = await deployAll();

    await sdk.reputation.mintReputation({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      tenantScore: 5,
      ownerAddress: owner.address,
      ownerScore: 4,
    });

    const tokens = await sdk.reputation.getTokensByOwner(tenant.address);
    expect(tokens).to.have.length(1);
    expect(tokens[0]).to.be.gt(0n);
  });

  it('getTokensByOwner — returns empty array for address with no tokens', async function () {
    const { sdk, other } = await deployAll();
    const tokens = await sdk.reputation.getTokensByOwner(other.address);
    expect(tokens).to.deep.equal([]);
  });

  it('mintReputation — rejects invalid scores (0 or > 5)', async function () {
    const { sdk, tenant, owner } = await deployAll();

    await expect(
      sdk.reputation.mintReputation({
        agreementId: AGREEMENT_UUID,
        tenantAddress: tenant.address,
        tenantScore: 0,          // invalid
        ownerAddress: owner.address,
        ownerScore: 5,
      }),
    ).to.be.rejectedWith(ContractRevertError);
  });
});

// ─── Full flow integration test ───────────────────────────────────────────────

describe('TrustNestSDK — full agreement lifecycle', function () {
  it('register → mint NFT → deposit → release → mint SBT', async function () {
    const { sdk, usdc, tenant, owner } = await deployAll();

    // 1. Register both users
    await sdk.registry.registerUser({ userId: USER_UUID_1, walletAddress: tenant.address });
    await sdk.registry.registerUser({ userId: USER_UUID_2, walletAddress: owner.address });

    // 2. Mint agreement NFTs
    const { tenantTokenId, ownerTokenId } = await sdk.agreement.mintAgreement({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      metadataURI: METADATA_URI,
    });
    expect(tenantTokenId).to.be.gt(0n);
    expect(ownerTokenId).to.be.gt(0n);

    // 3. Deposit escrow
    const tenantBalBefore = await usdc.balanceOf(tenant.address);
    await sdk.escrow.deposit({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      ownerAddress: owner.address,
      usdcAmount: DEPOSIT_AMOUNT,
    });
    const escrow = await sdk.escrow.getEscrow(AGREEMENT_UUID);
    expect(escrow!.status).to.equal(EscrowStatus.ACTIVE);

    // 4. Release escrow (no deduction)
    await sdk.escrow.release({ agreementId: AGREEMENT_UUID, deductionAmount: 0n });
    const tenantBalAfter = await usdc.balanceOf(tenant.address);
    expect(tenantBalAfter).to.equal(tenantBalBefore + DEPOSIT_AMOUNT);

    // 5. Mint reputation SBTs
    await sdk.reputation.mintReputation({
      agreementId: AGREEMENT_UUID,
      tenantAddress: tenant.address,
      tenantScore: 5,
      ownerAddress: owner.address,
      ownerScore: 4,
    });
    const tenantReputation = await sdk.reputation.getScore(tenant.address);
    expect(tenantReputation.tokenCount).to.equal(1n);
    expect(tenantReputation.averageTimes10).to.equal(50n);
  });
});
