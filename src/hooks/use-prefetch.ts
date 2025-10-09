"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchHelpers } from "@/lib/query-client";
import type { Wallet } from "@/lib/types";

export function usePrefetch() {
    const queryClient = useQueryClient();

    const prefetchWalletDetails = useCallback(
        async (wallet: Wallet) => {
            // Only prefetch if data is stale or missing
            const hasRecentData = queryClient.getQueryData(["wallet", wallet.type, wallet.address]);
            if (hasRecentData) return;

            await prefetchHelpers.walletDetails(wallet.address, wallet.type);
        },
        [queryClient]
    );

    const prefetchWalletHistory = useCallback(async (wallet: Wallet) => {
        await prefetchHelpers.walletHistory(wallet.address, wallet.type);
    }, []);

    const prefetchPortfolioData = useCallback(async (wallets: Wallet[], days = 30) => {
        const walletMeta = wallets.map((w) => ({ address: w.address, type: w.type }));
        await prefetchHelpers.portfolioData(walletMeta, days);
    }, []);

    // Prefetch related data when user hovers over wallet
    const prefetchOnHover = useCallback(
        async (wallet: Wallet) => {
            // Use requestIdleCallback for non-blocking prefetch
            if (typeof window !== "undefined" && "requestIdleCallback" in window) {
                window.requestIdleCallback(() => {
                    prefetchWalletDetails(wallet);
                    prefetchWalletHistory(wallet);
                });
            } else {
                // Fallback for browsers without requestIdleCallback
                setTimeout(() => {
                    prefetchWalletDetails(wallet);
                    prefetchWalletHistory(wallet);
                }, 50);
            }
        },
        [prefetchWalletDetails, prefetchWalletHistory]
    );

    // Prefetch next likely data based on user patterns
    const prefetchNextLikely = useCallback(
        (wallets: Wallet[]) => {
            if (typeof window !== "undefined" && "requestIdleCallback" in window) {
                window.requestIdleCallback(() => {
                    // Prefetch portfolio timeline data for main dashboard
                    prefetchPortfolioData(wallets);

                    // Prefetch detailed data for first few wallets (most viewed)
                    wallets.slice(0, 3).forEach((wallet) => {
                        prefetchWalletDetails(wallet);
                    });
                });
            }
        },
        [prefetchPortfolioData, prefetchWalletDetails]
    );

    return {
        prefetchWalletDetails,
        prefetchWalletHistory,
        prefetchPortfolioData,
        prefetchOnHover,
        prefetchNextLikely,
    };
}
