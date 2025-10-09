// Core wallet types for Tezos and Etherlink
export type WalletType = "tezos" | "etherlink";

export type TezosWalletStatus = "undelegated" | "delegated" | "staked";

export interface TezosWallet {
    id: string;
    address: string;
    type: "tezos";
    label: string;
    status: TezosWalletStatus;
    balance: number;
    spendableBalance: number;
    stakedBalance: number;
    unstakedBalance: number;
    usdValue?: number;
    eurValue?: number;
    delegatedTo?: string;
    stakedAmount?: number;
    addedAt: number;
    lastUpdated?: number;
    tezDomain?: string;
    tokens?: TokenBalance[];
    delegationDetails?: DelegationDetails;
}

export interface EtherlinkWallet {
    id: string;
    address: string;
    type: "etherlink";
    label: string;
    balance: number;
    usdValue?: number;
    eurValue?: number;
    addedAt: number;
    lastUpdated?: number;
    tokens?: TokenBalance[];
}

export type Wallet = TezosWallet | EtherlinkWallet;

export interface TokenBalance {
    symbol: string;
    name: string;
    balance: number;
    decimals: number;
    contractAddress: string;
    usdValue?: number;
    thumbnailUri?: string;
    tokenId?: string;
}

export interface WalletSnapshot {
    walletId: string;
    timestamp: number;
    balance: number;
    tokens: TokenBalance[];
    status?: TezosWalletStatus;
}

export interface DelegationDetails {
    baker: string;
    bakerName?: string;
    stakingBalance: number;
    stakingCapacity: number;
    freeSpace: number;
    fee: number;
    estimatedRoi: number;
}

export interface WalletRewards {
    cycle: number;
    totalRewards: number;
    futureRewards: number;
    delegatedBalance: number;
    stakingRewards: number;
    delegatingRewards: number;
    bakingPower: number;
}

export interface Transaction {
    hash: string;
    timestamp: number;
    from: string;
    to: string;
    value: number;
    type: string;
    status: string;
}

// Import/Export config types (backwards compatible)
export interface LegacyWalletConfig {
    address: string;
    alias: string;
    tzdomain?: string;
    enabled: boolean;
    type?: "tezos" | "etherlink"; // Extension for etherlink support
}

export interface WalletExportConfig {
    version: string;
    exportDate: string;
    wallets: LegacyWalletConfig[];
}
