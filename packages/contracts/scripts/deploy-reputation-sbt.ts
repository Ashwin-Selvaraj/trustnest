import { ethers, network } from 'hardhat';

/**
 * One-off deploy for ReputationSBT only — used when a full deploy.ts run
 * partially failed (e.g. ran out of gas) after the other 4 contracts already
 * succeeded, so we don't waste gas redeploying them.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const operatorAddress = process.env['OPERATOR_ADDRESS'] ?? deployer.address;

  console.log('Deployer :', deployer.address);
  console.log('Operator :', operatorAddress);
  console.log('Network  :', network.name);
  console.log('---');

  const ReputationSBTFactory = await ethers.getContractFactory('ReputationSBT');
  const reputationSBT = await ReputationSBTFactory.deploy(deployer.address, operatorAddress);
  await reputationSBT.waitForDeployment();
  console.log('ReputationSBT :', await reputationSBT.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
