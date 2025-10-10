"use client";

import { useMemo, useCallback } from "react";
import type { Wallet } from "@/lib/types";
import { calculatePortfolioStats, calculateChainBreakdown, getTopTokens } from "@/lib/analytics";

// Custom hooks for memoized calculations
export function useOptimizedPortfolioStats(wallets: Wallet[]) {
    const stats = useMemo(() => calculatePortfolioStats(wallets), [wallets]);
    const chainBreakdown = useMemo(() => calculateChainBreakdown(wallets), [wallets]);
    const topTokens = useMemo(() => getTopTokens(wallets), [wallets]);

    return {
        stats,
        chainBreakdown,
        topTokens,
    };
}

// Optimized wallet list hook
export function useOptimizedWalletList(
    wallets: Wallet[],
    onRefresh?: (id: string) => Promise<void>,
    onRemove?: (id: string) => void,
    onUpdateLabel?: (id: string, label: string) => void
) {
    // Memoize the handlers to prevent child re-renders
    const memoizedRefresh = useCallback((id: string) => onRefresh?.(id), [onRefresh]);
    const memoizedRemove = useCallback((id: string) => onRemove?.(id), [onRemove]);
    const memoizedUpdateLabel = useCallback((id: string, label: string) => onUpdateLabel?.(id, label), [onUpdateLabel]);

    // Memoize the sorted wallets
    const sortedWallets = useMemo(() => {
        return [...wallets].sort((a, b) => b.addedAt - a.addedAt);
    }, [wallets]);

    return {
        sortedWallets,
        memoizedRefresh,
        memoizedRemove,
        memoizedUpdateLabel,
    };
}

// Virtual scrolling implementation for large wallet lists
export function useVirtualizedWallets(wallets: Wallet[], itemHeight: number = 120) {
    const sortedWallets = useMemo(() => {
        return [...wallets].sort((a, b) => b.addedAt - a.addedAt);
    }, [wallets]);

    const shouldVirtualize = wallets.length > 20; // Only virtualize for large lists

    return {
        sortedWallets,
        shouldVirtualize,
        itemHeight,
        containerHeight: Math.min(800, wallets.length * itemHeight),
    };
}

// Debounced update hook for performance
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(callback: T, delay: number): T {
    const debouncedCallback = useMemo(() => {
        let timeoutId: NodeJS.Timeout;

        return ((...args: Parameters<T>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => callback(...args), delay);
        }) as T;
    }, [callback, delay]);

    return debouncedCallback;
}

// Memoized balance calculations
export const useMemoizedBalances = (wallet: Wallet) => {
    return useMemo(() => {
        if (wallet.type === "tezos") {
            return {
                spendable: wallet.spendableBalance || 0,
                staked: wallet.stakedBalance || 0,
                unstaking: wallet.unstakedBalance || 0,
                total: wallet.balance,
            };
        }
        return {
            spendable: wallet.balance,
            staked: 0,
            unstaking: 0,
            total: wallet.balance,
        };
    }, [wallet]);
};

// Performance monitoring hook
export function usePerformanceMonitoring(componentName: string) {
    const startTime = useMemo(() => performance.now(), []);

    const logRenderTime = useCallback(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        if (renderTime > 16) {
            // More than one frame (16ms at 60fps)
            console.warn(`[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
        }
    }, [componentName, startTime]);

    return { logRenderTime };
}
