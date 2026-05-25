import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TrustNestRegistry } from '../typechain-types';

describe('TrustNestRegistry', function () {
  async function deploy() {
    const [admin, operator, alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('TrustNestRegistry');
    const registry = (await factory.deploy(admin.address, operator.address)) as unknown as TrustNestRegistry;
    await registry.waitForDeployment();
    return { registry, admin, operator, alice, bob };
  }

  const uid1 = ethers.keccak256(ethers.toUtf8Bytes('user-uuid-0001'));
  const uid2 = ethers.keccak256(ethers.toUtf8Bytes('user-uuid-0002'));

  describe('register', function () {
    it('maps userId → wallet and wallet → userId', async function () {
      const { registry, operator, alice } = await deploy();
      await registry.connect(operator).register(uid1, alice.address);
      expect(await registry.getWallet(uid1)).to.equal(alice.address);
      expect(await registry.getUserId(alice.address)).to.equal(uid1);
    });

    it('emits UserRegistered', async function () {
      const { registry, operator, alice } = await deploy();
      await expect(registry.connect(operator).register(uid1, alice.address))
        .to.emit(registry, 'UserRegistered')
        .withArgs(uid1, alice.address);
    });

    it('reverts when userId already registered', async function () {
      const { registry, operator, alice, bob } = await deploy();
      await registry.connect(operator).register(uid1, alice.address);
      await expect(registry.connect(operator).register(uid1, bob.address))
        .to.be.revertedWith('Registry: userId already registered');
    });

    it('reverts when wallet already registered under different userId', async function () {
      const { registry, operator, alice } = await deploy();
      await registry.connect(operator).register(uid1, alice.address);
      await expect(registry.connect(operator).register(uid2, alice.address))
        .to.be.revertedWith('Registry: wallet already registered');
    });

    it('reverts for non-operator', async function () {
      const { registry, alice, bob } = await deploy();
      await expect(registry.connect(alice).register(uid1, bob.address))
        .to.be.reverted;
    });
  });

  describe('deregister', function () {
    it('clears both mappings and emits UserDeregistered', async function () {
      const { registry, operator, alice } = await deploy();
      await registry.connect(operator).register(uid1, alice.address);
      await expect(registry.connect(operator).deregister(uid1))
        .to.emit(registry, 'UserDeregistered')
        .withArgs(uid1, alice.address);
      expect(await registry.getWallet(uid1)).to.equal(ethers.ZeroAddress);
      expect(await registry.getUserId(alice.address)).to.equal(ethers.ZeroHash);
    });

    it('reverts when userId not registered', async function () {
      const { registry, operator } = await deploy();
      await expect(registry.connect(operator).deregister(uid1))
        .to.be.revertedWith('Registry: userId not registered');
    });
  });
});
