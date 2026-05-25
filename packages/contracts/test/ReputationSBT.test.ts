import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ReputationSBT } from '../typechain-types';

describe('ReputationSBT', function () {
  const agreementId = ethers.keccak256(ethers.toUtf8Bytes('agreement-uuid-0001'));

  async function deploy() {
    const [admin, operator, tenant, owner, stranger] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('ReputationSBT');
    const sbt = (await factory.deploy(admin.address, operator.address)) as unknown as ReputationSBT;
    await sbt.waitForDeployment();
    return { sbt, admin, operator, tenant, owner, stranger };
  }

  async function deployAndMint(tenantScore = 5, ownerScore = 4) {
    const ctx = await deploy();
    await ctx.sbt.connect(ctx.operator).mint(
      agreementId, ctx.tenant.address, tenantScore, ctx.owner.address, ownerScore
    );
    return ctx;
  }

  describe('mint', function () {
    it('mints tokens to tenant and owner', async function () {
      const { sbt, tenant, owner } = await deployAndMint();
      const tenantTokens = await sbt.tokensByOwner(tenant.address, 0);
      const ownerTokens  = await sbt.tokensByOwner(owner.address,  0);
      expect(await sbt.ownerOf(tenantTokens)).to.equal(tenant.address);
      expect(await sbt.ownerOf(ownerTokens)).to.equal(owner.address);
    });

    it('stores reputation data correctly', async function () {
      const { sbt, tenant } = await deployAndMint(5, 4);
      const tokenId = await sbt.tokensByOwner(tenant.address, 0);
      const rep = await sbt.reputationOf(tokenId);
      expect(rep.agreementId).to.equal(agreementId);
      expect(rep.score).to.equal(5);
      expect(rep.isOwnerRole).to.equal(false);
    });

    it('emits Locked for both tokens', async function () {
      const { sbt, operator, tenant, owner } = await deploy();
      const agId2 = ethers.keccak256(ethers.toUtf8Bytes('agreement-uuid-0002'));
      const tx = sbt.connect(operator).mint(agId2, tenant.address, 4, owner.address, 3);
      await expect(tx).to.emit(sbt, 'Locked');
    });

    it('reverts on score out of range', async function () {
      const { sbt, operator, tenant, owner } = await deploy();
      await expect(sbt.connect(operator).mint(agreementId, tenant.address, 0, owner.address, 5))
        .to.be.revertedWith('SBT: invalid tenant score');
      await expect(sbt.connect(operator).mint(agreementId, tenant.address, 5, owner.address, 6))
        .to.be.revertedWith('SBT: invalid owner score');
    });

    it('reverts for non-operator', async function () {
      const { sbt, stranger, tenant, owner } = await deploy();
      await expect(sbt.connect(stranger).mint(agreementId, tenant.address, 5, owner.address, 5))
        .to.be.reverted;
    });
  });

  describe('transfer revert (soulbound)', function () {
    it('reverts on safeTransferFrom', async function () {
      const { sbt, tenant, owner } = await deployAndMint();
      const tokenId = await sbt.tokensByOwner(tenant.address, 0);
      await expect(
        sbt.connect(tenant)['safeTransferFrom(address,address,uint256)'](
          tenant.address, owner.address, tokenId
        )
      ).to.be.revertedWith('SBT: soulbound - transfer not allowed');
    });

    it('reverts on transferFrom', async function () {
      const { sbt, tenant, owner } = await deployAndMint();
      const tokenId = await sbt.tokensByOwner(tenant.address, 0);
      await expect(sbt.connect(tenant).transferFrom(tenant.address, owner.address, tokenId))
        .to.be.revertedWith('SBT: soulbound - transfer not allowed');
    });
  });

  describe('scoreOf', function () {
    it('returns correct average * 10 and count', async function () {
      const { sbt, operator, tenant, owner } = await deploy();
      const agId1 = ethers.keccak256(ethers.toUtf8Bytes('ag-1'));
      const agId2 = ethers.keccak256(ethers.toUtf8Bytes('ag-2'));

      await sbt.connect(operator).mint(agId1, tenant.address, 5, owner.address, 3);
      await sbt.connect(operator).mint(agId2, tenant.address, 3, owner.address, 5);

      // tenant: scores 5+3=8, count=2 → average*10 = 40
      const [tenantAvg, tenantCount] = await sbt.scoreOf(tenant.address);
      expect(tenantCount).to.equal(2n);
      expect(tenantAvg).to.equal(40n); // (8/2)*10 = 40

      // owner: scores 3+5=8, count=2 → average*10 = 40
      const [ownerAvg, ownerCount] = await sbt.scoreOf(owner.address);
      expect(ownerCount).to.equal(2n);
      expect(ownerAvg).to.equal(40n);
    });

    it('returns zero for address with no tokens', async function () {
      const { sbt, stranger } = await deploy();
      const [avg, count] = await sbt.scoreOf(stranger.address);
      expect(avg).to.equal(0n);
      expect(count).to.equal(0n);
    });
  });
});
