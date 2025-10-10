"use client";

import { useState, useEffect, useCallback } from "react";
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

export function useWallets() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingWallet, setIsAddingWallet] = useState(false);
    const [isRemovingWallet, setIsRemovingWallet] = useState(false);
    const [isRefreshingWallet, setIsRefreshingWallet] = useState(false);

    const refreshStaleWallets = useCallback(async (staleWallets: Wallet[]) => {
        // Refresh wallets in parallel but don't block the UI
        const refreshPromises = staleWallets.map(async (wallet) => {
            try {
                if (wallet.type === "tezos") {
                    const [breakdown, delegation, tokens, delegationDetails, prices, tezDomain] = await Promise.all([
                        fetchTezosBalanceBreakdown(wallet.address).catch(() => ({
                            total: wallet.balance || 0,
                            spendable: wallet.spendableBalance || 0,
                            staked: wallet.stakedBalance || 0,
                            unstaked: wallet.unstakedBalance || 0,
                        })),
                        fetchDelegationStatus(wallet.address).catch(() => ({
                            status: wallet.status || ("undelegated" as const),
                        })),
                        fetchTezosTokens(wallet.address).catch(() => wallet.tokens || []),
                        fetchDelegationDetails(wallet.address).catch(() => wallet.delegationDetails || null),
                        getAllPrices("XTZ").catch(() => ({
                            usd: null,
                            eur: null,
                            timestamp: Date.now(),
                        })),
                        fetchTezDomain(wallet.address).catch(() => wallet.tezDomain || null),
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

                    // Update storage and state
                    walletStorage.updateWallet(wallet.id, updated);
                    setWallets((prev) => prev.map((w) => (w.id === wallet.id ? updated : w)));
                } else {
                    const [balance, tokens, prices] = await Promise.all([
                        fetchEtherlinkBalance(wallet.address).catch(() => wallet.balance || 0),
                        fetchEtherlinkTokens(wallet.address).catch(() => wallet.tokens || []),
                        getAllPrices("XTZ").catch(() => ({
                            usd: null,
                            eur: null,
                            timestamp: Date.now(),
                        })),
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

                    // Update storage and state
                    walletStorage.updateWallet(wallet.id, updated);
                    setWallets((prev) => prev.map((w) => (w.id === wallet.id ? updated : w)));
                }
            } catch (error) {
                console.error(`Failed to refresh wallet ${wallet.label}:`, error);
            }
        });

        await Promise.allSettled(refreshPromises);
    }, []);

    // Load wallets from localStorage on mount and show them immediately
    useEffect(() => {
        const loadWallets = async () => {
            try {
                const walletsFromStorage = walletStorage.getWallets();
                setWallets(walletsFromStorage);
                setLoading(false);

                // Only refresh stale wallets in background
                const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
                const now = Date.now();

                const staleWallets = walletsFromStorage.filter((w) => {
                    return !w.lastUpdated || now - w.lastUpdated > STALE_THRESHOLD;
                });

                if (staleWallets.length > 0) {
                    // Refresh stale wallets in background without blocking UI
                    refreshStaleWallets(staleWallets);
                }
            } catch (error) {
                console.error("Error loading wallets:", error);
                setWallets([]);
                setLoading(false);
            }
        };

        loadWallets();
    }, [refreshStaleWallets]);

    const addWallet = useCallback(
        async (address: string, type: "tezos" | "etherlink", label: string): Promise<void> => {
            setIsAddingWallet(true);
            try {
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

                    walletStorage.addWallet(wallet);
                    setWallets((prev) => [...prev, wallet]);
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

                    walletStorage.addWallet(wallet);
                    setWallets((prev) => [...prev, wallet]);
                }

                console.log("[useWallets] Added wallet:", label);
            } catch (error) {
                console.error("Error adding wallet:", error);
                throw error;
            } finally {
                setIsAddingWallet(false);
            }
        },
        []
    );

    const removeWallet = useCallback(async (id: string) => {
        setIsRemovingWallet(true);
        try {
            walletStorage.removeWallet(id);
            setWallets((prev) => prev.filter((w) => w.id !== id));
            console.log("[useWallets] Removed wallet from localStorage and state");
        } catch (error) {
            console.error("Error removing wallet:", error);
            throw error;
        } finally {
            setIsRemovingWallet(false);
        }
    }, []);

    const refreshWallet = useCallback(
        async (id: string): Promise<void> => {
            setIsRefreshingWallet(true);
            try {
                const wallet = wallets.find((w) => w.id === id);
                if (!wallet) throw new Error("Wallet not found");

                if (wallet.type === "tezos") {
                    const [breakdown, delegation, tokens, delegationDetails, prices, tezDomain] = await Promise.all([
                        fetchTezosBalanceBreakdown(wallet.address).catch(() => ({
                            total: wallet.balance || 0,
                            spendable: wallet.spendableBalance || 0,
                            staked: wallet.stakedBalance || 0,
                            unstaked: wallet.unstakedBalance || 0,
                        })),
                        fetchDelegationStatus(wallet.address).catch(() => ({
                            status: wallet.status || ("undelegated" as const),
                        })),
                        fetchTezosTokens(wallet.address).catch(() => wallet.tokens || []),
                        fetchDelegationDetails(wallet.address).catch(() => wallet.delegationDetails || null),
                        getAllPrices("XTZ").catch(() => ({ usd: null, eur: null, timestamp: Date.now() })),
                        fetchTezDomain(wallet.address).catch(() => wallet.tezDomain || null),
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

                    walletStorage.updateWallet(id, updates);
                    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
                } else {
                    const [balance, tokens, prices] = await Promise.all([
                        fetchEtherlinkBalance(wallet.address).catch(() => wallet.balance || 0),
                        fetchEtherlinkTokens(wallet.address).catch(() => wallet.tokens || []),
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

                    walletStorage.updateWallet(id, updates);
                    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
                }
            } catch (error) {
                console.error("Error refreshing wallet:", error);
                throw error;
            } finally {
                setIsRefreshingWallet(false);
            }
        },
        [wallets]
    );

    const refreshAllWallets = useCallback(async (): Promise<void> => {
        if (wallets.length === 0) return;

        setIsRefreshingWallet(true);
        try {
            await refreshStaleWallets(wallets);
        } catch (error) {
            console.error("Error refreshing all wallets:", error);
            throw error;
        } finally {
            setIsRefreshingWallet(false);
        }
    }, [wallets, refreshStaleWallets]);

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
        refreshAllWallets,
        updateWalletLabel,
        // Simple loading states
        isAddingWallet,
        isRemovingWallet,
        isRefreshingWallet,
        addWalletError: null,
        removeWalletError: null,
        refreshWalletError: null,
    };
}

// Also export as default for better compatibility
export default useWallets;
