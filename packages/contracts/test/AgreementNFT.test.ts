import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AgreementNFT } from '../typechain-types';

describe('AgreementNFT', function () {
  const agreementId = ethers.keccak256(ethers.toUtf8Bytes('agreement-uuid-0001'));
  const META_URI    = 'ipfs://QmTestHash';

  async function deploy() {
    const [admin, operator, tenant, owner, stranger] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('AgreementNFT');
    const nft = (await factory.deploy(admin.address, operator.address)) as unknown as AgreementNFT;
    await nft.waitForDeployment();
    return { nft, admin, operator, tenant, owner, stranger };
  }

  async function deployAndMint() {
    const ctx = await deploy();
    const tx = await ctx.nft.connect(ctx.operator).mint(
      agreementId, ctx.tenant.address, ctx.owner.address, META_URI
    );
    const receipt = await tx.wait();
    // Extract token IDs from AgreementMinted event
    const event = receipt?.logs
      .map(l => { try { return ctx.nft.interface.parseLog(l); } catch { return null; } })
      .find(e => e?.name === 'AgreementMinted');
    const tenantTokenId: bigint = event?.args[1];
    const ownerTokenId:  bigint = event?.args[2];
    return { ...ctx, tenantTokenId, ownerTokenId };
  }

  describe('mint', function () {
    it('mints two tokens — one to tenant, one to owner', async function () {
      const { nft, tenant, owner, tenantTokenId, ownerTokenId } = await deployAndMint();
      expect(await nft.ownerOf(tenantTokenId)).to.equal(tenant.address);
      expect(await nft.ownerOf(ownerTokenId)).to.equal(owner.address);
    });

    it('stores agreement → token mappings', async function () {
      const { nft, tenantTokenId, ownerTokenId } = await deployAndMint();
      expect(await nft.tenantToken(agreementId)).to.equal(tenantTokenId);
      expect(await nft.ownerToken(agreementId)).to.equal(ownerTokenId);
      expect(await nft.tokenAgreement(tenantTokenId)).to.equal(agreementId);
      expect(await nft.tokenAgreement(ownerTokenId)).to.equal(agreementId);
    });

    it('emits AgreementMinted', async function () {
      const { nft, operator, tenant, owner } = await deploy();
      const agId2 = ethers.keccak256(ethers.toUtf8Bytes('agreement-uuid-0002'));
      await expect(nft.connect(operator).mint(agId2, tenant.address, owner.address, META_URI))
        .to.emit(nft, 'AgreementMinted');
    });

    it('reverts on duplicate mint for same agreementId', async function () {
      const { nft, operator, tenant, owner } = await deployAndMint();
      await expect(nft.connect(operator).mint(agreementId, tenant.address, owner.address, META_URI))
        .to.be.revertedWith('AgreementNFT: already minted');
    });

    it('reverts for non-operator', async function () {
      const { nft, stranger, tenant, owner } = await deploy();
      await expect(nft.connect(stranger).mint(agreementId, tenant.address, owner.address, META_URI))
        .to.be.reverted;
    });
  });

  describe('tokenURI', function () {
    it('returns the metadata URI for both tokens', async function () {
      const { nft, tenantTokenId, ownerTokenId } = await deployAndMint();
      expect(await nft.tokenURI(tenantTokenId)).to.equal(META_URI);
      expect(await nft.tokenURI(ownerTokenId)).to.equal(META_URI);
    });

    it('reverts for non-existent token', async function () {
      const { nft } = await deploy();
      await expect(nft.tokenURI(999n)).to.be.reverted;
    });
  });

  describe('updateMetadata', function () {
    it('updates URI and is readable via tokenURI', async function () {
      const { nft, operator, tenantTokenId } = await deployAndMint();
      const newURI = 'ipfs://QmUpdatedHash';
      await nft.connect(operator).updateMetadata(tenantTokenId, newURI);
      expect(await nft.tokenURI(tenantTokenId)).to.equal(newURI);
    });

    it('reverts for non-operator', async function () {
      const { nft, stranger, tenantTokenId } = await deployAndMint();
      await expect(nft.connect(stranger).updateMetadata(tenantTokenId, 'ipfs://x'))
        .to.be.reverted;
    });
  });
});
