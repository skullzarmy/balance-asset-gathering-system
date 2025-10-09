"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { Wallet, TezosWallet, EtherlinkWallet } from "@/lib/types";
import { walletStorage } from "@/lib/wallet-storage";
import {
    fetchTezosBalanceBreakdown,
    fetchDelegationStatus,
    fetchTezosTokens,
    fetchDelegationDetails,
    fetchTezDomain,
} from "@/lib/blockchain/tezos";
import { fetchEtherlinkBalance, fetchEtherlinkTokens } from "@/lib/blockchain/etherlink";
import { getAllPrices } from "@/lib/pricing";
import { queryKeys } from "@/lib/query-client";

export function useWallets() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    // Load wallets directly from localStorage on mount, then sync with TanStack Query
    useEffect(() => {
        const loadInitialWallets = () => {
            try {
                const walletsFromStorage = walletStorage.getWallets();
                console.log("[useWallets] Loaded from localStorage:", walletsFromStorage.length, "wallets");
                setWallets(walletsFromStorage);

                // Sync with query cache
                queryClient.setQueryData(queryKeys.wallets.all, walletsFromStorage);
                setLoading(false);
            } catch (error) {
                console.error("[useWallets] Error loading wallets from localStorage:", error);
                setWallets([]);
                setLoading(false);
            }
        };

        loadInitialWallets();
    }, [queryClient]);

    // Use TanStack Query for wallet storage with localStorage persistence
    const { data: storedWallets = [] } = useQuery({
        queryKey: queryKeys.wallets.all,
        queryFn: () => {
            // Always read from localStorage directly
            const walletsFromStorage = walletStorage.getWallets();
            console.log("[useWallets Query] Reading from localStorage:", walletsFromStorage.length, "wallets");
            return walletsFromStorage;
        },
        staleTime: Infinity, // Wallets only change when user explicitly modifies them
        gcTime: Infinity, // Keep wallet data in cache forever
        refetchOnMount: false, // Don't refetch from storage unnecessarily
        refetchOnWindowFocus: false, // Don't refetch wallets on focus
        refetchOnReconnect: false, // Don't refetch wallets on reconnect
        initialData: [],
        enabled: false, // Disable automatic queries, we'll manage localStorage manually
    });

    useEffect(() => {
        const loadWallets = async () => {
            try {
                // Use cached wallets from TanStack Query
                const cachedWallets = storedWallets;

                // Show cached wallets immediately
                setWallets(cachedWallets);
                setLoading(false);

                // Only refresh if wallets are stale (older than 5 minutes) OR missing tokens
                const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
                const now = Date.now();

                const walletsNeedingRefresh = cachedWallets.filter((w) => {
                    const isStale = !w.lastUpdated || now - w.lastUpdated > STALE_THRESHOLD;
                    const missingTokens = !w.tokens || w.tokens.length === 0;
                    const missingDomain = w.type === "tezos" && !w.tezDomain;
                    const missingBakerName =
                        w.type === "tezos" &&
                        w.delegationDetails &&
                        (!w.delegationDetails.bakerName || w.delegationDetails.bakerName.startsWith("tz"));
                    const missingDelegationDetails = w.type === "tezos" && !w.delegationDetails;
                    return isStale || missingTokens || missingDomain || missingBakerName || missingDelegationDetails;
                });

                if (walletsNeedingRefresh.length === 0) {
                    return;
                }

                // Refresh wallets in parallel
                Promise.all(
                    walletsNeedingRefresh.map(async (wallet) => {
                        try {
                            if (wallet.type === "tezos") {
                                const [breakdown, delegation, tokens, delegationDetails, prices, tezDomain] =
                                    await Promise.all([
                                        fetchTezosBalanceBreakdown(wallet.address).catch(() => ({
                                            total: 0,
                                            spendable: 0,
                                            staked: 0,
                                            unstaked: 0,
                                        })),
                                        fetchDelegationStatus(wallet.address).catch(() => ({
                                            status: "undelegated" as const,
                                        })),
                                        fetchTezosTokens(wallet.address).catch(() => []),
                                        fetchDelegationDetails(wallet.address).catch(() => null),
                                        getAllPrices("XTZ").catch(() => ({
                                            usd: null,
                                            eur: null,
                                            timestamp: Date.now(),
                                        })),
                                        fetchTezDomain(wallet.address).catch(() => null),
                                    ]);

                                const usdValue = prices.usd ? breakdown.total * prices.usd : undefined;
                                const eurValue = prices.eur ? breakdown.total * prices.eur : undefined;

                                const updated = {
                                    ...wallet,
                                    balance: breakdown.total,
                                    spendableBalance: breakdown.spendable,
                                    stakedBalance: breakdown.staked,
                                    unstakedBalance: breakdown.unstaked,
                                    usdValue,
                                    eurValue,
                                    lastUpdated: prices.timestamp,
                                    tezDomain: tezDomain || undefined,
                                    status: delegation.status,
                                    delegatedTo: "delegatedTo" in delegation ? delegation.delegatedTo : undefined,
                                    stakedAmount: "stakedAmount" in delegation ? delegation.stakedAmount : undefined,
                                    tokens,
                                    delegationDetails: delegationDetails || undefined,
                                };

                                // Update storage
                                walletStorage.updateWallet(wallet.id, updated);

                                // Update state progressively
                                setWallets((prev) => prev.map((w) => (w.id === wallet.id ? updated : w)));
                            } else {
                                const [balance, tokens, prices] = await Promise.all([
                                    fetchEtherlinkBalance(wallet.address).catch(() => 0),
                                    fetchEtherlinkTokens(wallet.address).catch(() => []),
                                    getAllPrices("XTZ").catch(() => ({ usd: null, eur: null, timestamp: Date.now() })),
                                ]);

                                const usdValue = prices.usd ? balance * prices.usd : undefined;
                                const eurValue = prices.eur ? balance * prices.eur : undefined;

                                const updated = {
                                    ...wallet,
                                    balance,
                                    usdValue,
                                    eurValue,
                                    lastUpdated: prices.timestamp,
                                    tokens,
                                };

                                // Update storage
                                walletStorage.updateWallet(wallet.id, updated);

                                // Update state progressively
                                setWallets((prev) => prev.map((w) => (w.id === wallet.id ? updated : w)));
                            }
                        } catch {
                            // Silent fail for individual wallet refresh
                        }
                    })
                );
            } catch (error) {
                console.error("[useWallets] Error loading wallets:", error);
                setWallets([]);
                setLoading(false);
            }
        };
    }, [storedWallets]);

    // Optimistic mutation for adding wallets
    const addWalletMutation = useMutation({
        mutationFn: async ({
            address,
            type,
            label,
        }: {
            address: string;
            type: "tezos" | "etherlink";
            label: string;
        }) => {
            const id = `${type}-${address}-${Date.now()}`;

            if (type === "tezos") {
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

                const usdValue = prices.usd ? breakdown.total * prices.usd : undefined;
                const eurValue = prices.eur ? breakdown.total * prices.eur : undefined;

                const wallet: TezosWallet = {
                    id,
                    address,
                    type: "tezos",
                    label,
                    balance: breakdown.total,
                    spendableBalance: breakdown.spendable,
                    stakedBalance: breakdown.staked,
                    unstakedBalance: breakdown.unstaked,
                    usdValue,
                    eurValue,
                    lastUpdated: prices.timestamp,
                    tezDomain: tezDomain || undefined,
                    status: delegation.status,
                    delegatedTo: "delegatedTo" in delegation ? delegation.delegatedTo : undefined,
                    stakedAmount: "stakedAmount" in delegation ? delegation.stakedAmount : undefined,
                    tokens,
                    delegationDetails: delegationDetails || undefined,
                    addedAt: Date.now(),
                };

                return wallet;
            } else {
                const [balance, tokens, prices] = await Promise.all([
                    fetchEtherlinkBalance(address).catch(() => 0),
                    fetchEtherlinkTokens(address).catch(() => []),
                    getAllPrices("XTZ").catch(() => ({ usd: null, eur: null, timestamp: Date.now() })),
                ]);

                const usdValue = prices.usd ? balance * prices.usd : undefined;
                const eurValue = prices.eur ? balance * prices.eur : undefined;

                const wallet: EtherlinkWallet = {
                    id,
                    address,
                    type: "etherlink",
                    label,
                    balance,
                    usdValue,
                    eurValue,
                    lastUpdated: prices.timestamp,
                    tokens,
                    addedAt: Date.now(),
                };

                return wallet;
            }
        },
        onMutate: async ({ address, type, label }) => {
            // Cancel outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: queryKeys.wallets.all });

            // Snapshot previous value
            const previousWallets = queryClient.getQueryData(queryKeys.wallets.all) as Wallet[];

            // Create optimistic wallet with loading state
            const id = `${type}-${address}-${Date.now()}`;
            const optimisticWallet: Wallet =
                type === "tezos"
                    ? {
                          id,
                          address,
                          type: "tezos",
                          label,
                          balance: 0,
                          spendableBalance: 0,
                          stakedBalance: 0,
                          unstakedBalance: 0,
                          usdValue: undefined,
                          eurValue: undefined,
                          lastUpdated: Date.now(),
                          tokens: [],
                          addedAt: Date.now(),
                          status: "undelegated" as const,
                      }
                    : {
                          id,
                          address,
                          type: "etherlink",
                          label,
                          balance: 0,
                          usdValue: undefined,
                          eurValue: undefined,
                          lastUpdated: Date.now(),
                          tokens: [],
                          addedAt: Date.now(),
                      };

            // Optimistically update to the new value
            queryClient.setQueryData(queryKeys.wallets.all, [...(previousWallets || []), optimisticWallet]);
            setWallets((prev) => [...prev, optimisticWallet]);

            // Return context with snapshot
            return { previousWallets, optimisticWallet };
        },
        onError: (err, _variables, context) => {
            // If mutation fails, use the context to roll back
            if (context?.previousWallets) {
                queryClient.setQueryData(queryKeys.wallets.all, context.previousWallets);
                setWallets(context.previousWallets);
            }
            console.error("Error adding wallet:", err);
        },
        onSuccess: (newWallet, _variables, context) => {
            // Update storage first
            walletStorage.addWallet(newWallet);

            // Then update both cache and state
            const updatedWallets = [...wallets.filter((w) => w.id !== context?.optimisticWallet.id), newWallet];

            queryClient.setQueryData(queryKeys.wallets.all, updatedWallets);
            setWallets(updatedWallets);

            console.log("[useWallets] Added wallet to localStorage and state:", newWallet.label);
        },
        onSettled: () => {
            // Ensure consistency by reloading from localStorage
            const freshWallets = walletStorage.getWallets();
            queryClient.setQueryData(queryKeys.wallets.all, freshWallets);
            setWallets(freshWallets);
        },
    });

    const addWallet = useCallback(
        async (address: string, type: "tezos" | "etherlink", label: string): Promise<void> => {
            await addWalletMutation.mutateAsync({ address, type, label });
        },
        [addWalletMutation]
    );

    // Optimistic mutation for removing wallets
    const removeWalletMutation = useMutation({
        mutationFn: async (walletId: string) => {
            const walletToRemove = wallets.find((w) => w.id === walletId);
            if (!walletToRemove) {
                throw new Error("Wallet not found");
            }

            // Update local storage
            walletStorage.removeWallet(walletId);
            return walletToRemove;
        },
        onSuccess: () => {
            // Update state to reflect the removal
            const freshWallets = walletStorage.getWallets();
            queryClient.setQueryData(queryKeys.wallets.all, freshWallets);
            setWallets(freshWallets);

            console.log("[useWallets] Removed wallet from localStorage and state");
        },
    });

    const removeWallet = useCallback(
        async (id: string) => {
            return removeWalletMutation.mutateAsync(id);
        },
        [removeWalletMutation]
    );

    // Optimistic mutation for refreshing individual wallets
    const refreshWalletMutation = useMutation({
        mutationFn: async (id: string) => {
            const wallet = wallets.find((w) => w.id === id);
            if (!wallet) throw new Error("Wallet not found");

            if (wallet.type === "tezos") {
                const [breakdown, delegation, tokens, delegationDetails, prices, tezDomain] = await Promise.all([
                    fetchTezosBalanceBreakdown(wallet.address).catch(() => ({
                        total: 0,
                        spendable: 0,
                        staked: 0,
                        unstaked: 0,
                    })),
                    fetchDelegationStatus(wallet.address).catch(() => ({ status: "undelegated" as const })),
                    fetchTezosTokens(wallet.address).catch(() => []),
                    fetchDelegationDetails(wallet.address).catch(() => null),
                    getAllPrices("XTZ").catch(() => ({ usd: null, eur: null, timestamp: Date.now() })),
                    fetchTezDomain(wallet.address).catch(() => null),
                ]);

                const usdValue = prices.usd ? breakdown.total * prices.usd : undefined;
                const eurValue = prices.eur ? breakdown.total * prices.eur : undefined;

                const updates = {
                    balance: breakdown.total,
                    spendableBalance: breakdown.spendable,
                    stakedBalance: breakdown.staked,
                    unstakedBalance: breakdown.unstaked,
                    usdValue,
                    eurValue,
                    lastUpdated: prices.timestamp,
                    tezDomain: tezDomain || undefined,
                    status: delegation.status,
                    delegatedTo: "delegatedTo" in delegation ? delegation.delegatedTo : undefined,
                    stakedAmount: "stakedAmount" in delegation ? delegation.stakedAmount : undefined,
                    tokens,
                    delegationDetails: delegationDetails || undefined,
                };

                return { id, updates };
            } else {
                const [balance, tokens, prices] = await Promise.all([
                    fetchEtherlinkBalance(wallet.address).catch(() => 0),
                    fetchEtherlinkTokens(wallet.address).catch(() => []),
                    getAllPrices("XTZ").catch(() => ({ usd: null, eur: null, timestamp: Date.now() })),
                ]);

                const usdValue = prices.usd ? balance * prices.usd : undefined;
                const eurValue = prices.eur ? balance * prices.eur : undefined;

                const updates = {
                    balance,
                    usdValue,
                    eurValue,
                    lastUpdated: prices.timestamp,
                    tokens,
                };

                return { id, updates };
            }
        },
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.wallets.all });

            // Snapshot previous value
            const previousWallets = queryClient.getQueryData(queryKeys.wallets.all) as Wallet[];

            // Optimistically update wallet with refreshing indicator
            const updatedWallets =
                previousWallets?.map((w) => (w.id === id ? { ...w, lastUpdated: Date.now() } : w)) || [];

            queryClient.setQueryData(queryKeys.wallets.all, updatedWallets);
            setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, lastUpdated: Date.now() } : w)));

            return { previousWallets };
        },
        onError: (err, _id, context) => {
            // Roll back on error
            if (context?.previousWallets) {
                queryClient.setQueryData(queryKeys.wallets.all, context.previousWallets);
                setWallets(context.previousWallets);
            }
            console.error("Error refreshing wallet:", err);
        },
        onSuccess: ({ id, updates }) => {
            // Update storage and state with fresh data
            walletStorage.updateWallet(id, updates);

            const currentWallets = queryClient.getQueryData(queryKeys.wallets.all) as Wallet[];
            const updatedWallets = currentWallets.map((w) => (w.id === id ? { ...w, ...updates } : w));

            queryClient.setQueryData(queryKeys.wallets.all, updatedWallets);
            setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
        },
    });

    const refreshWallet = useCallback(
        async (id: string): Promise<void> => {
            await refreshWalletMutation.mutateAsync(id);
        },
        [refreshWalletMutation]
    );

    const updateWalletLabel = async (id: string, label: string) => {
        try {
            const wallet = wallets.find((w) => w.id === id);
            if (!wallet) return;

            // Update label in storage first
            walletStorage.updateWallet(id, { label });

            // Also refresh tezDomain if it's a Tezos wallet
            if (wallet.type === "tezos") {
                const tezDomain = await fetchTezDomain(wallet.address).catch(() => null);
                walletStorage.updateWallet(id, { tezDomain: tezDomain || undefined });
            }

            // Sync state with localStorage
            const freshWallets = walletStorage.getWallets();
            queryClient.setQueryData(queryKeys.wallets.all, freshWallets);
            setWallets(freshWallets);

            console.log("[useWallets] Updated wallet label in localStorage and state:", label);
        } catch (error) {
            console.error("Failed to update wallet label:", error);
        }
    };

    return {
        wallets,
        loading,
        addWallet,
        removeWallet,
        refreshWallet,
        updateWalletLabel,
        // Expose mutation states for UI feedback
        isAddingWallet: addWalletMutation.isPending,
        isRemovingWallet: removeWalletMutation.isPending,
        isRefreshingWallet: refreshWalletMutation.isPending,
        addWalletError: addWalletMutation.error,
        removeWalletError: removeWalletMutation.error,
        refreshWalletError: refreshWalletMutation.error,
    };
}

// Also export as default for better compatibility
export default useWallets;
