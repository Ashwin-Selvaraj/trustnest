import { expect } from 'chai';
import { ethers } from 'hardhat';
import { EscrowVault, MockUSDC } from '../typechain-types';

describe('EscrowVault', function () {
  const DEPOSIT = 75_000_000n; // 75 USDC (6 decimals)
  const agreementId = ethers.keccak256(ethers.toUtf8Bytes('agreement-uuid-0001'));

  async function deploy() {
    const [admin, operator, tenant, owner] = await ethers.getSigners();

    const usdcFactory = await ethers.getContractFactory('MockUSDC');
    const usdc = (await usdcFactory.deploy()) as unknown as MockUSDC;
    await usdc.waitForDeployment();

    const vaultFactory = await ethers.getContractFactory('EscrowVault');
    const vault = (await vaultFactory.deploy(
      admin.address, operator.address, await usdc.getAddress()
    )) as unknown as EscrowVault;
    await vault.waitForDeployment();

    // Fund operator and approve vault
    await usdc.mint(operator.address, DEPOSIT * 10n);
    await usdc.connect(operator).approve(await vault.getAddress(), ethers.MaxUint256);

    return { vault, usdc, admin, operator, tenant, owner };
  }

  async function deployAndDeposit() {
    const ctx = await deploy();
    await ctx.vault.connect(ctx.operator).deposit(
      agreementId, ctx.tenant.address, ctx.owner.address, DEPOSIT
    );
    return ctx;
  }

  describe('deposit', function () {
    it('transfers USDC to vault and emits Deposited', async function () {
      const { vault, usdc, operator, tenant, owner } = await deploy();
      const vaultAddr = await vault.getAddress();

      await expect(vault.connect(operator).deposit(agreementId, tenant.address, owner.address, DEPOSIT))
        .to.emit(vault, 'Deposited')
        .withArgs(agreementId, tenant.address, DEPOSIT);

      expect(await usdc.balanceOf(vaultAddr)).to.equal(DEPOSIT);
    });

    it('reverts if escrow already exists', async function () {
      const { vault, operator, tenant, owner } = await deployAndDeposit();
      await expect(vault.connect(operator).deposit(agreementId, tenant.address, owner.address, DEPOSIT))
        .to.be.revertedWith('Escrow: already exists');
    });

    it('reverts for non-operator', async function () {
      const { vault, tenant, owner } = await deploy();
      await expect(vault.connect(tenant).deposit(agreementId, tenant.address, owner.address, DEPOSIT))
        .to.be.reverted;
    });
  });

  describe('release', function () {
    it('returns full deposit to tenant when deduction is zero', async function () {
      const { vault, usdc, operator, tenant } = await deployAndDeposit();
      const before = await usdc.balanceOf(tenant.address);
      await vault.connect(operator).release(agreementId, 0n);
      expect(await usdc.balanceOf(tenant.address)).to.equal(before + DEPOSIT);
    });

    it('splits deposit correctly with deduction', async function () {
      const { vault, usdc, operator, tenant, owner } = await deployAndDeposit();
      const deduction = 5_000_000n; // 5 USDC
      const tenantBefore = await usdc.balanceOf(tenant.address);
      const ownerBefore  = await usdc.balanceOf(owner.address);

      await vault.connect(operator).release(agreementId, deduction);

      expect(await usdc.balanceOf(tenant.address)).to.equal(tenantBefore + DEPOSIT - deduction);
      expect(await usdc.balanceOf(owner.address)).to.equal(ownerBefore + deduction);
    });

    it('reverts when deduction exceeds deposit', async function () {
      const { vault, operator } = await deployAndDeposit();
      await expect(vault.connect(operator).release(agreementId, DEPOSIT + 1n))
        .to.be.revertedWith('Escrow: deduction exceeds deposit');
    });

    it('reverts on non-active escrow', async function () {
      const { vault, operator } = await deployAndDeposit();
      await vault.connect(operator).release(agreementId, 0n);
      await expect(vault.connect(operator).release(agreementId, 0n))
        .to.be.revertedWith('Escrow: not active');
    });
  });

  describe('raiseDispute', function () {
    it('sets status to DISPUTED and emits event', async function () {
      const { vault, operator } = await deployAndDeposit();
      await expect(vault.connect(operator).raiseDispute(agreementId))
        .to.emit(vault, 'DisputeRaised')
        .withArgs(agreementId);
      // release must now fail (not active)
      await expect(vault.connect(operator).release(agreementId, 0n))
        .to.be.revertedWith('Escrow: not active');
    });
  });

  describe('resolveDispute', function () {
    it('splits funds correctly and emits DisputeResolved', async function () {
      const { vault, usdc, operator, tenant, owner } = await deployAndDeposit();
      await vault.connect(operator).raiseDispute(agreementId);

      const tenantShare = 50_000_000n;
      const ownerShare  = 25_000_000n;
      const tenantBefore = await usdc.balanceOf(tenant.address);
      const ownerBefore  = await usdc.balanceOf(owner.address);

      await expect(vault.connect(operator).resolveDispute(agreementId, tenantShare, ownerShare))
        .to.emit(vault, 'DisputeResolved')
        .withArgs(agreementId, tenantShare, ownerShare);

      expect(await usdc.balanceOf(tenant.address)).to.equal(tenantBefore + tenantShare);
      expect(await usdc.balanceOf(owner.address)).to.equal(ownerBefore + ownerShare);
    });

    it('reverts when shares do not equal deposit', async function () {
      const { vault, operator } = await deployAndDeposit();
      await vault.connect(operator).raiseDispute(agreementId);
      await expect(vault.connect(operator).resolveDispute(agreementId, 1n, 1n))
        .to.be.revertedWith('Escrow: shares must equal deposit');
    });

    it('reverts when escrow is not in DISPUTED state', async function () {
      const { vault, operator } = await deployAndDeposit();
      await expect(vault.connect(operator).resolveDispute(agreementId, DEPOSIT, 0n))
        .to.be.revertedWith('Escrow: not disputed');
    });
  });

  describe('emergencyRefund', function () {
    it('refunds full deposit to tenant', async function () {
      const { vault, usdc, admin, operator, tenant } = await deployAndDeposit();
      const before = await usdc.balanceOf(tenant.address);

      // Give admin the ADMIN_ROLE (already set in constructor), just use admin signer
      await expect(vault.connect(admin).emergencyRefund(agreementId))
        .to.emit(vault, 'EmergencyRefunded')
        .withArgs(agreementId, tenant.address, DEPOSIT);

      expect(await usdc.balanceOf(tenant.address)).to.equal(before + DEPOSIT);
    });

    it('reverts if already released', async function () {
      const { vault, admin, operator } = await deployAndDeposit();
      await vault.connect(operator).release(agreementId, 0n);
      await expect(vault.connect(admin).emergencyRefund(agreementId))
        .to.be.revertedWith('Escrow: already settled');
    });
  });
});
