"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { isRateLimitError, isNetworkError, isTimeoutError, isBlockchainError } from "@/lib/errors";

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    // Create QueryClient instance inside the client component
    const [queryClient] = useState(
        () =>
            new QueryClient({
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
                            if (
                                isBlockchainError(error) &&
                                error.statusCode &&
                                error.statusCode >= 400 &&
                                error.statusCode < 500
                            ) {
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
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
