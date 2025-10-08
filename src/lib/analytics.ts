import type { Wallet, TezosWallet, EtherlinkWallet } from "./types";

export interface PortfolioStats {
    totalValue: number;
    totalValueUsd: number;
    totalValueEur: number;
    totalSpendable: number;
    totalStaked: number;
    totalUnstaked: number;
    tezosValue: number;
    tezosValueUsd: number;
    tezosValueEur: number;
    etherlinkValue: number;
    etherlinkValueUsd: number;
    etherlinkValueEur: number;
    totalWallets: number;
    tezosWallets: number;
    etherlinkWallets: number;
    totalTokens: number;
    delegatedWallets: number;
    stakedWallets: number;
    xtzUsdPrice: number | null;
    xtzEurPrice: number | null;
    ethUsdPrice: number | null;
    ethEurPrice: number | null;
    lastUpdated: number;
}

export interface ChainBreakdown {
    chain: string;
    value: number;
    percentage: number;
    walletCount: number;
}

export function calculatePortfolioStats(wallets: Wallet[]): PortfolioStats {
    const tezosWallets = wallets.filter((w) => w.type === "tezos") as TezosWallet[];
    const etherlinkWallets = wallets.filter((w) => w.type === "etherlink") as EtherlinkWallet[];

    const tezosValue = tezosWallets.reduce((sum, w) => sum + w.balance, 0);
    const etherlinkValue = etherlinkWallets.reduce((sum, w) => sum + w.balance, 0);
    const totalValue = tezosValue + etherlinkValue;

    const tezosValueUsd = tezosWallets.reduce((sum, w) => sum + (w.usdValue || 0), 0);
    const etherlinkValueUsd = etherlinkWallets.reduce((sum, w) => sum + (w.usdValue || 0), 0);
    const totalValueUsd = tezosValueUsd + etherlinkValueUsd;

    const tezosValueEur = tezosWallets.reduce((sum, w) => sum + (w.eurValue || 0), 0);
    const etherlinkValueEur = etherlinkWallets.reduce((sum, w) => sum + (w.eurValue || 0), 0);
    const totalValueEur = tezosValueEur + etherlinkValueEur;

    const totalSpendable = tezosWallets.reduce((sum, w) => sum + w.spendableBalance, 0);
    const totalStaked = tezosWallets.reduce((sum, w) => sum + w.stakedBalance, 0);
    const totalUnstaked = tezosWallets.reduce((sum, w) => sum + w.unstakedBalance, 0);

    const totalTokens = wallets.reduce((sum, w) => sum + (w.tokens?.length || 0), 0);

    const delegatedWallets = tezosWallets.filter((w) => w.status === "delegated" || w.status === "staked").length;
    const stakedWallets = tezosWallets.filter((w) => w.status === "staked").length;

    // Calculate average prices from wallets
    const walletWithUsdPrice = tezosWallets.find((w) => w.usdValue && w.balance > 0);
    const xtzPriceUsd = walletWithUsdPrice ? walletWithUsdPrice.usdValue / walletWithUsdPrice.balance : null;

    const walletWithEurPrice = tezosWallets.find((w) => w.eurValue && w.balance > 0);
    const xtzPriceEur = walletWithEurPrice ? walletWithEurPrice.eurValue / walletWithEurPrice.balance : null;

    const ethWalletWithUsdPrice = etherlinkWallets.find((w) => w.usdValue && w.balance > 0);
    const ethPriceUsd = ethWalletWithUsdPrice ? ethWalletWithUsdPrice.usdValue / ethWalletWithUsdPrice.balance : null;

    const ethWalletWithEurPrice = etherlinkWallets.find((w) => w.eurValue && w.balance > 0);
    const ethPriceEur = ethWalletWithEurPrice ? ethWalletWithEurPrice.eurValue / ethWalletWithEurPrice.balance : null;

    const lastUpdated = Math.max(...wallets.map((w) => w.lastUpdated || 0), Date.now());

    return {
        totalValue,
        totalValueUsd,
        totalValueEur,
        totalSpendable,
        totalStaked,
        totalUnstaked,
        tezosValue,
        tezosValueUsd,
        tezosValueEur,
        etherlinkValue,
        etherlinkValueUsd,
        etherlinkValueEur,
        totalWallets: wallets.length,
        tezosWallets: tezosWallets.length,
        etherlinkWallets: etherlinkWallets.length,
        totalTokens,
        delegatedWallets,
        stakedWallets,
        xtzUsdPrice: xtzPriceUsd,
        xtzEurPrice: xtzPriceEur,
        ethUsdPrice: ethPriceUsd,
        ethEurPrice: ethPriceEur,
        lastUpdated,
    };
}

export interface TezosBreakdown {
    staked: number;
    delegated: number;
    undelegated: number;
}

export function calculateTezosBreakdown(wallets: Wallet[]): TezosBreakdown {
    const tezosWallets = wallets.filter((w) => w.type === "tezos") as TezosWallet[];

    const staked = tezosWallets.filter((w) => w.status === "staked").reduce((sum, w) => sum + w.balance, 0);

    const delegated = tezosWallets.filter((w) => w.status === "delegated").reduce((sum, w) => sum + w.balance, 0);

    const undelegated = tezosWallets.filter((w) => w.status === "undelegated").reduce((sum, w) => sum + w.balance, 0);

    return { staked, delegated, undelegated };
}

export function calculateChainBreakdown(wallets: Wallet[]): ChainBreakdown[] {
    const tezosValue = wallets.filter((w) => w.type === "tezos").reduce((sum, w) => sum + w.balance, 0);

    const etherlinkValue = wallets.filter((w) => w.type === "etherlink").reduce((sum, w) => sum + w.balance, 0);

    const total = tezosValue + etherlinkValue;

    return [
        {
            chain: "Tezos",
            value: tezosValue,
            percentage: total > 0 ? (tezosValue / total) * 100 : 0,
            walletCount: wallets.filter((w) => w.type === "tezos").length,
        },
        {
            chain: "Etherlink",
            value: etherlinkValue,
            percentage: total > 0 ? (etherlinkValue / total) * 100 : 0,
            walletCount: wallets.filter((w) => w.type === "etherlink").length,
        },
    ];
}

export function getTopTokens(wallets: Wallet[], limit = 5) {
    const tokenMap = new Map<
        string,
        { symbol: string; name: string; balance: number; thumbnailUri?: string; walletIds: Set<string> }
    >();

    wallets.forEach((wallet) => {
        wallet.tokens?.forEach((token) => {
            const key = `${token.contractAddress}-${token.symbol}`;
            const existing = tokenMap.get(key);

            if (existing) {
                existing.balance += token.balance;
                existing.walletIds.add(wallet.id);
            } else {
                tokenMap.set(key, {
                    symbol: token.symbol,
                    name: token.name,
                    balance: token.balance,
                    thumbnailUri: token.thumbnailUri,
                    walletIds: new Set([wallet.id]),
                });
            }
        });
    });

    const result = Array.from(tokenMap.values())
        .map(({ symbol, name, balance, thumbnailUri, walletIds }) => ({
            symbol,
            name,
            balance,
            thumbnailUri,
            wallets: walletIds.size,
        }))
        .sort((a, b) => b.balance - a.balance)
        .slice(0, limit);

    return result;
}

// Export everything as a default object as well for compatibility
export default {
    calculatePortfolioStats,
    calculateChainBreakdown,
    calculateTezosBreakdown,
    getTopTokens,
};
