export interface ContractAddresses {
  registry:     string;  // TrustNestRegistry
  escrowVault:  string;  // EscrowVault
  agreementNFT: string;  // AgreementNFT
  reputationSBT: string; // ReputationSBT
}

// Populated after Task 14 deploy; zero-addresses are safe placeholders for local dev
export const CONTRACT_ADDRESSES: Record<'amoy' | 'mainnet', ContractAddresses> = {
  amoy: {
    registry:      '0x0000000000000000000000000000000000000000',
    escrowVault:   '0x0000000000000000000000000000000000000000',
    agreementNFT:  '0x0000000000000000000000000000000000000000',
    reputationSBT: '0x0000000000000000000000000000000000000000',
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
