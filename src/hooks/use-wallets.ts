"use client";

import { useState, useEffect } from "react";
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

    useEffect(() => {
        const loadWallets = async () => {
            try {
                const storedWallets = walletStorage.getWallets();

                // Show cached wallets immediately
                setWallets(storedWallets);
                setLoading(false);

                // Only refresh if wallets are stale (older than 5 minutes)
                const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
                const now = Date.now();

                const staleWallets = storedWallets.filter((w) => {
                    const isStale = !w.lastUpdated || now - w.lastUpdated > STALE_THRESHOLD;
                    return isStale;
                });

                if (staleWallets.length === 0) {
                    return;
                }

                // Refresh only stale wallets
                staleWallets.forEach(async (wallet) => {
                    try {
                        if (wallet.type === "tezos") {
                            const [breakdown, delegation, prices] = await Promise.all([
                                fetchTezosBalanceBreakdown(wallet.address).catch(() => ({
                                    total: 0,
                                    spendable: 0,
                                    staked: 0,
                                    unstaked: 0,
                                })),
                                fetchDelegationStatus(wallet.address).catch(() => ({
                                    status: "undelegated" as const,
                                })),
                                getAllPrices("XTZ").catch(() => ({
                                    usd: null,
                                    eur: null,
                                    timestamp: Date.now(),
                                })),
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
                                status: delegation.status,
                                delegatedTo: "delegatedTo" in delegation ? delegation.delegatedTo : undefined,
                                stakedAmount: "stakedAmount" in delegation ? delegation.stakedAmount : undefined,
                            };

                            // Update storage
                            walletStorage.updateWallet(wallet.id, updated);

                            // Update state progressively
                            setWallets((prev) => prev.map((w) => (w.id === wallet.id ? updated : w)));
                        } else {
                            const [balance, prices] = await Promise.all([
                                fetchEtherlinkBalance(wallet.address).catch(() => 0),
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
                            };

                            // Update storage
                            walletStorage.updateWallet(wallet.id, updated);

                            // Update state progressively
                            setWallets((prev) => prev.map((w) => (w.id === wallet.id ? updated : w)));
                        }
                    } catch (error) {
                        // Silent fail for individual wallet refresh
                    }
                });
            } catch (error) {
                console.error("[useWallets] Error loading wallets:", error);
                setWallets([]);
                setLoading(false);
            }
        };

        loadWallets();
    }, []);

    const addWallet = async (address: string, type: "tezos" | "etherlink", label: string) => {
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
                setWallets([...wallets, wallet]);
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
                setWallets([...wallets, wallet]);
            }
        } catch (error) {
            console.error("Error adding wallet:", error);
        }
    };

    const removeWallet = (id: string) => {
        try {
            walletStorage.removeWallet(id);
            setWallets(wallets.filter((w) => w.id !== id));
        } catch (error) {
            console.error("Error removing wallet:", error);
        }
    };

    const refreshWallet = async (id: string) => {
        try {
            const wallet = wallets.find((w) => w.id === id);
            if (!wallet) return;

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
                    tezDomain: tezDomain || wallet.tezDomain,
                    status: delegation.status,
                    delegatedTo: "delegatedTo" in delegation ? delegation.delegatedTo : undefined,
                    stakedAmount: "stakedAmount" in delegation ? delegation.stakedAmount : undefined,
                    tokens,
                    delegationDetails: delegationDetails || undefined,
                };

                walletStorage.updateWallet(id, updates);
                setWallets(wallets.map((w) => (w.id === id ? { ...w, ...updates } : w)));
            } else {
                const [balance, tokens, prices] = await Promise.all([
                    fetchEtherlinkBalance(wallet.address).catch(() => 0),
                    fetchEtherlinkTokens(wallet.address).catch(() => []),
                    getAllPrices("XTZ").catch(() => ({ usd: null, eur: null, timestamp: Date.now() })),
                ]);
                const usdValue = prices.usd ? balance * prices.usd : undefined;
                const eurValue = prices.eur ? balance * prices.eur : undefined;
                walletStorage.updateWallet(id, { balance, usdValue, eurValue, lastUpdated: prices.timestamp, tokens });
                setWallets(
                    wallets.map((w) =>
                        w.id === id ? { ...w, balance, usdValue, eurValue, lastUpdated: prices.timestamp, tokens } : w
                    )
                );
            }
        } catch (error) {
            console.error("Error refreshing wallet:", error);
        }
    };

    const updateWalletLabel = (id: string, label: string) => {
        try {
            walletStorage.updateWallet(id, { label });
            setWallets(wallets.map((w) => (w.id === id ? { ...w, label } : w)));
        } catch (error) {
            console.error("Error updating wallet label:", error);
        }
    };

    return {
        wallets,
        loading,
        addWallet,
        removeWallet,
        refreshWallet,
        updateWalletLabel,
    };
}

// Also export as default for better compatibility
export default useWallets;
