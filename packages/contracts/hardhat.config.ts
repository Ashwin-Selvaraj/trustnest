import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'cancun',
    },
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },
  networks: {
    amoy: {
      url: process.env['POLYGON_RPC_URL'] ?? '',
      accounts: process.env['OPERATOR_KEY'] ? [process.env['OPERATOR_KEY']] : [],
    },
  },
};

export default config;
