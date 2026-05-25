import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  const operatorAddress = process.env['OPERATOR_ADDRESS'] ?? deployer.address;
  const usdcAddress     = process.env['USDC_ADDRESS'] ?? ethers.ZeroAddress;

  console.log('Deployer :', deployer.address);
  console.log('Operator :', operatorAddress);
  console.log('USDC     :', usdcAddress);
  console.log('Network  :', (await ethers.provider.getNetwork()).name);
  console.log('---');

  const Registry = await ethers.getContractFactory('TrustNestRegistry');
  const registry = await Registry.deploy(deployer.address, operatorAddress);
  await registry.waitForDeployment();
  console.log('TrustNestRegistry :', await registry.getAddress());

  const EscrowVaultFactory = await ethers.getContractFactory('EscrowVault');
  const escrowVault = await EscrowVaultFactory.deploy(deployer.address, operatorAddress, usdcAddress);
  await escrowVault.waitForDeployment();
  console.log('EscrowVault       :', await escrowVault.getAddress());

  const AgreementNFTFactory = await ethers.getContractFactory('AgreementNFT');
  const agreementNFT = await AgreementNFTFactory.deploy(deployer.address, operatorAddress);
  await agreementNFT.waitForDeployment();
  console.log('AgreementNFT      :', await agreementNFT.getAddress());

  const ReputationSBTFactory = await ethers.getContractFactory('ReputationSBT');
  const reputationSBT = await ReputationSBTFactory.deploy(deployer.address, operatorAddress);
  await reputationSBT.waitForDeployment();
  console.log('ReputationSBT     :', await reputationSBT.getAddress());

  console.log('---');
  console.log('Update CONTRACT_ADDRESSES in packages/shared/src/constants/contracts.ts');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
