import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "./query-client";
import {
    fetchTezosBalanceBreakdown,
    fetchTezosTokens,
    fetchDelegationStatus,
    fetchDelegationDetails,
    fetchTezDomain,
    fetchTezosHistory,
    fetchTezosOperations,
    fetchWalletRewards,
    type TezosBalanceBreakdown,
} from "./blockchain/tezos";
import {
    fetchEtherlinkBalance,
    fetchEtherlinkTokens,
    fetchEtherlinkTransactions,
    fetchEtherlinkHistory,
    fetchEtherlinkCounters,
} from "./blockchain/etherlink";
import { getAllPrices } from "./pricing";
import type { TokenBalance, DelegationDetails, WalletRewards, Transaction } from "./types";

// Tezos Query Options
export const tezosQueries = {
    balanceBreakdown: (address: string) =>
        queryOptions({
            queryKey: queryKeys.tezos.breakdown(address),
            queryFn: (): Promise<TezosBalanceBreakdown> => fetchTezosBalanceBreakdown(address),
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes
        }),

    tokens: (address: string) =>
        queryOptions({
            queryKey: queryKeys.tezos.tokens(address),
            queryFn: (): Promise<TokenBalance[]> => fetchTezosTokens(address),
            staleTime: 60 * 1000, // 1 minute - tokens change less frequently
            gcTime: 10 * 60 * 1000, // 10 minutes
        }),

    delegation: (address: string) =>
        queryOptions({
            queryKey: queryKeys.tezos.delegation(address),
            queryFn: () => fetchDelegationStatus(address),
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000,
        }),

    delegationDetails: (address: string) =>
        queryOptions({
            queryKey: queryKeys.tezos.delegationDetails(address),
            queryFn: (): Promise<DelegationDetails | null> => fetchDelegationDetails(address),
            staleTime: 2 * 60 * 1000, // 2 minutes - baker info changes rarely
            gcTime: 15 * 60 * 1000,
        }),

    domain: (address: string) =>
        queryOptions({
            queryKey: queryKeys.tezos.domain(address),
            queryFn: (): Promise<string | null> => fetchTezDomain(address),
            staleTime: 10 * 60 * 1000, // 10 minutes - domains change very rarely
            gcTime: 30 * 60 * 1000,
        }),

    history: (address: string, days: number = 30) =>
        queryOptions({
            queryKey: queryKeys.tezos.history(address, days),
            queryFn: () => fetchTezosHistory(address, days),
            staleTime: 5 * 60 * 1000, // 5 minutes for historical data
            gcTime: 15 * 60 * 1000,
        }),

    operations: (address: string, limit: number = 20) =>
        queryOptions({
            queryKey: queryKeys.tezos.operations(address, limit),
            queryFn: () => fetchTezosOperations(address, limit),
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000,
        }),

    rewards: (address: string) =>
        queryOptions({
            queryKey: queryKeys.tezos.rewards(address),
            queryFn: (): Promise<WalletRewards | null> => fetchWalletRewards(address),
            staleTime: 10 * 60 * 1000, // 10 minutes - rewards change slowly
            gcTime: 30 * 60 * 1000,
        }),
} as const;

// Etherlink Query Options
export const etherlinkQueries = {
    balance: (address: string) =>
        queryOptions({
            queryKey: queryKeys.etherlink.balance(address),
            queryFn: (): Promise<number> => fetchEtherlinkBalance(address),
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000,
        }),

    tokens: (address: string) =>
        queryOptions({
            queryKey: queryKeys.etherlink.tokens(address),
            queryFn: (): Promise<TokenBalance[]> => fetchEtherlinkTokens(address),
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000,
        }),

    transactions: (address: string, limit: number = 20) =>
        queryOptions({
            queryKey: queryKeys.etherlink.transactions(address, limit),
            queryFn: (): Promise<Transaction[]> => fetchEtherlinkTransactions(address),
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000,
        }),

    history: (address: string, days: number = 30) =>
        queryOptions({
            queryKey: queryKeys.etherlink.history(address, days),
            queryFn: () => fetchEtherlinkHistory(address, days),
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 15 * 60 * 1000,
        }),

    counters: (address: string) =>
        queryOptions({
            queryKey: queryKeys.etherlink.counters(address),
            queryFn: () => fetchEtherlinkCounters(address),
            staleTime: 2 * 60 * 1000, // 2 minutes - counters change slowly
            gcTime: 10 * 60 * 1000,
        }),
} as const;

// Pricing Query Options
export const pricingQueries = {
    prices: (symbol: "XTZ" | "ETH") =>
        queryOptions({
            queryKey: queryKeys.pricing.prices(symbol),
            queryFn: () => getAllPrices(symbol),
            staleTime: 2 * 60 * 1000, // 2 minutes for price data
            gcTime: 10 * 60 * 1000,
            refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes for prices
        }),
} as const;

// Combined wallet data query for efficient parallel fetching
export const walletQueries = {
    tezosWallet: (address: string) =>
        queryOptions({
            queryKey: ["wallet", "tezos", address],
            queryFn: async () => {
                // Fetch all Tezos wallet data in parallel
                const [breakdown, delegation, tokens, delegationDetails, prices, tezDomain] = await Promise.all([
                    fetchTezosBalanceBreakdown(address).catch(() => ({
                        total: 0,
                        spendable: 0,
                        staked: 0,
                        unstaked: 0,
                    })),
                    fetchDelegationStatus(address).catch(() => ({ status: "undelegated" as const })),
                    fetchTezosTokens(address).catch(() => []),
                    fetchDelegationDetails(address).catch(() => null),
                    getAllPrices("XTZ").catch(() => ({ usd: null, eur: null, timestamp: Date.now() })),
                    fetchTezDomain(address).catch(() => null),
                ]);

                return {
                    address,
                    breakdown,
                    delegation,
                    tokens,
                    delegationDetails,
                    prices,
                    tezDomain,
                    usdValue: prices.usd ? breakdown.total * prices.usd : undefined,
                    eurValue: prices.eur ? breakdown.total * prices.eur : undefined,
                };
            },
            staleTime: 30 * 1000,
            gcTime: 5 * 60 * 1000,
        }),

    etherlinkWallet: (address: string) =>
        queryOptions({
            queryKey: ["wallet", "etherlink", address],
            queryFn: async () => {
                // Fetch all Etherlink wallet data in parallel
                const [balance, tokens, prices] = await Promise.all([
                    fetchEtherlinkBalance(address).catch(() => 0),
                    fetchEtherlinkTokens(address).catch(() => []),
                    getAllPrices("ETH").catch(() => ({ usd: null, eur: null, timestamp: Date.now() })),
                ]);

                return {
                    address,
                    balance,
                    tokens,
                    prices,
                    usdValue: prices.usd ? balance * prices.usd : undefined,
                    eurValue: prices.eur ? balance * prices.eur : undefined,
                };
            },
            staleTime: 30 * 1000,
            gcTime: 5 * 60 * 1000,
        }),
} as const;

// Export all query factories
export const queries = {
    tezos: tezosQueries,
    etherlink: etherlinkQueries,
    pricing: pricingQueries,
    wallet: walletQueries,
} as const;
