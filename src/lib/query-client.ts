import { QueryClient } from "@tanstack/react-query";
import { isRateLimitError, isNetworkError, isTimeoutError, isBlockchainError } from "./errors";

// Note: Cache persistence is handled at the app level to avoid circular dependencies

// Optimized QueryClient configuration for blockchain data
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Blockchain data specific optimizations
            staleTime: 30 * 1000, // 30 seconds - blockchain data changes relatively slowly
            gcTime: 5 * 60 * 1000, // 5 minutes cache retention

            // Request deduplication and parallelization optimizations
            refetchOnWindowFocus: true, // Refetch when user returns to app
            refetchOnReconnect: true, // Refetch when network reconnects
            refetchOnMount: true, // Always refetch on component mount for fresh data

            // Retry configuration for blockchain APIs
            retry: (failureCount, error: Error) => {
                // Don't retry for rate limiting
                if (isRateLimitError(error)) {
                    return false;
                }

                // Don't retry for 4xx errors (bad request, not found, etc.)
                if (isBlockchainError(error) && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
                    return false;
                }

                // Retry network and timeout errors up to 3 times
                if (isNetworkError(error) || isTimeoutError(error)) {
                    return failureCount < 3;
                }

                // Retry other errors up to 2 times
                return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

            // Network timeout optimized for blockchain APIs
            networkMode: "online", // Only fetch when online

            // Enable request deduplication by default
            notifyOnChangeProps: ["data", "error"] as const, // Only re-render when data or error changes
        },
        mutations: {
            // Mutation defaults for wallet operations
            retry: 1,
            networkMode: "online",
        },
    },
});

// Query key factories for consistent caching
export const queryKeys = {
    // Wallet-related queries
    wallets: {
        all: ["wallets"] as const,
        lists: () => [...queryKeys.wallets.all, "list"] as const,
        list: (filters: string) => [...queryKeys.wallets.lists(), { filters }] as const,
        details: () => [...queryKeys.wallets.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.wallets.details(), id] as const,
    },

    // Tezos-specific queries
    tezos: {
        all: ["tezos"] as const,
        balances: () => [...queryKeys.tezos.all, "balance"] as const,
        balance: (address: string) => [...queryKeys.tezos.balances(), address] as const,
        breakdown: (address: string) => [...queryKeys.tezos.all, "breakdown", address] as const,
        tokens: (address: string) => [...queryKeys.tezos.all, "tokens", address] as const,
        delegation: (address: string) => [...queryKeys.tezos.all, "delegation", address] as const,
        delegationDetails: (address: string) => [...queryKeys.tezos.all, "delegation-details", address] as const,
        domain: (address: string) => [...queryKeys.tezos.all, "domain", address] as const,
        history: (address: string, days: number) => [...queryKeys.tezos.all, "history", address, days] as const,
        operations: (address: string, limit: number) => [...queryKeys.tezos.all, "operations", address, limit] as const,
        rewards: (address: string) => [...queryKeys.tezos.all, "rewards", address] as const,
    },

    // Etherlink-specific queries
    etherlink: {
        all: ["etherlink"] as const,
        balances: () => [...queryKeys.etherlink.all, "balance"] as const,
        balance: (address: string) => [...queryKeys.etherlink.balances(), address] as const,
        tokens: (address: string) => [...queryKeys.etherlink.all, "tokens", address] as const,
        transactions: (address: string, limit: number) =>
            [...queryKeys.etherlink.all, "transactions", address, limit] as const,
        history: (address: string, days: number) => [...queryKeys.etherlink.all, "history", address, days] as const,
        counters: (address: string) => [...queryKeys.etherlink.all, "counters", address] as const,
    },

    // Pricing queries
    pricing: {
        all: ["pricing"] as const,
        prices: (symbol: string) => [...queryKeys.pricing.all, symbol] as const,
    },
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
    wallet: (address: string) => {
        queryClient.invalidateQueries({ queryKey: ["tezos", address] });
        queryClient.invalidateQueries({ queryKey: ["etherlink", address] });
        queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
    },

    allWallets: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.tezos.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.etherlink.all });
    },

    pricing: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.pricing.all });
    },
};

// Prefetch helpers for common patterns
export const prefetchHelpers = {
    walletDetails: async (address: string, type: "tezos" | "etherlink") => {
        if (type === "tezos") {
            await Promise.all([
                queryClient.prefetchQuery({
                    queryKey: queryKeys.tezos.breakdown(address),
                    staleTime: 30 * 1000,
                }),
                queryClient.prefetchQuery({
                    queryKey: queryKeys.tezos.tokens(address),
                    staleTime: 60 * 1000,
                }),
                queryClient.prefetchQuery({
                    queryKey: queryKeys.tezos.delegation(address),
                    staleTime: 60 * 1000,
                }),
                queryClient.prefetchQuery({
                    queryKey: queryKeys.tezos.delegationDetails(address),
                    staleTime: 2 * 60 * 1000,
                }),
                queryClient.prefetchQuery({
                    queryKey: queryKeys.tezos.domain(address),
                    staleTime: 10 * 60 * 1000,
                }),
            ]);
        } else {
            await Promise.all([
                queryClient.prefetchQuery({
                    queryKey: queryKeys.etherlink.balance(address),
                    staleTime: 30 * 1000,
                }),
                queryClient.prefetchQuery({
                    queryKey: queryKeys.etherlink.tokens(address),
                    staleTime: 60 * 1000,
                }),
                queryClient.prefetchQuery({
                    queryKey: queryKeys.etherlink.counters(address),
                    staleTime: 2 * 60 * 1000,
                }),
            ]);
        }
    },

    portfolioData: async (wallets: Array<{ address: string; type: "tezos" | "etherlink" }>, days = 30) => {
        // Prefetch history for all wallets in parallel for portfolio timeline
        const prefetchPromises = wallets.map((wallet) =>
            queryClient.prefetchQuery({
                queryKey:
                    wallet.type === "tezos"
                        ? queryKeys.tezos.history(wallet.address, days)
                        : queryKeys.etherlink.history(wallet.address, days),
                staleTime: 5 * 60 * 1000,
            })
        );

        await Promise.all(prefetchPromises);
    },

    walletHistory: async (address: string, type: "tezos" | "etherlink") => {
        // Prefetch common history timeframes
        const timeframes = [7, 30, 90];
        const prefetchPromises = timeframes.map((days) =>
            queryClient.prefetchQuery({
                queryKey:
                    type === "tezos"
                        ? queryKeys.tezos.history(address, days)
                        : queryKeys.etherlink.history(address, days),
                staleTime: 5 * 60 * 1000,
            })
        );

        await Promise.all(prefetchPromises);
    },
};
