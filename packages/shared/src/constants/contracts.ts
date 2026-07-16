export interface ContractAddresses {
  registry:     string;  // TrustNestRegistry
  escrowVault:  string;  // EscrowVault
  agreementNFT: string;  // AgreementNFT
  reputationSBT: string; // ReputationSBT
}

// amoy addresses deployed via packages/contracts/scripts/deploy.ts +
// deploy-reputation-sbt.ts (see docs/phase2-tasks.md §1); mainnet zero-addresses
// remain safe placeholders until a real mainnet deploy happens.
export const CONTRACT_ADDRESSES: Record<'amoy' | 'mainnet', ContractAddresses> = {
  amoy: {
    registry:      '0x5AF9aAddbb690e5488FfcB8fCAD515Fc01b31feC',
    escrowVault:   '0x958A7D4A90744F014cca47f7fC54A98101300113',
    agreementNFT:  '0x3cED151239271279e0eBc1dF772077Ff87e70353',
    reputationSBT: '0xDC9F27e122f0847c53AFd32dB419859b56Ee89C7',
  },
  mainnet: {
    registry:      '0x0000000000000000000000000000000000000000',
    escrowVault:   '0x0000000000000000000000000000000000000000',
    agreementNFT:  '0x0000000000000000000000000000000000000000',
    reputationSBT: '0x0000000000000000000000000000000000000000',
  },
};

// Native USDC on Polygon mainnet (6 decimals)
export const USDC_MAINNET_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as const;

// Amoy testnet: mintable MockUSDC deployed alongside the above (deploy.ts auto-deploys
// this when no real USDC_ADDRESS is supplied on a non-mainnet network). Never used on
// mainnet — see EscrowVault's usdcAddress constructor arg / docs/phase2-tasks.md §1.
export const USDC_AMOY_MOCK_ADDRESS = '0xE5eA6150C5126118F62F33e370b686cC8d6b4775' as const;
