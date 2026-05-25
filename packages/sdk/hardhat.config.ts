import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

/**
 * Minimal Hardhat config for the SDK test suite.
 * No Solidity compilation is needed here — all contract artifacts and TypeChain
 * types are sourced from @trustnest/contracts.
 * The Hardhat in-memory network is used as a fast local EVM for unit tests.
 */
const config: HardhatUserConfig = {
  solidity: '0.8.24',
  paths: {
    tests: './test',
  },
};

export default config;
