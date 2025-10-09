"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Enhanced cache management for PWA and offline support
export function useCachePersistence() {
    const queryClient = useQueryClient();
    useEffect(() => {
        // Clean up stale cache entries on app startup
        const cleanupStaleCache = () => {
            const cacheTime = 24 * 60 * 60 * 1000; // 24 hours
            const now = Date.now();

            // Get all queries and remove stale ones
            const queryCache = queryClient.getQueryCache();
            queryCache.getAll().forEach((query) => {
                const lastFetch = query.state.dataUpdatedAt;
                if (lastFetch && now - lastFetch > cacheTime) {
                    queryCache.remove(query);
                }
            });
        };

        // Run cleanup on app start
        cleanupStaleCache();

        // Set up periodic cleanup (every hour)
        const interval = setInterval(cleanupStaleCache, 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, [queryClient]);

    // Manage cache size to prevent memory issues
    useEffect(() => {
        const manageCacheSize = () => {
            const queryCache = queryClient.getQueryCache();
            const queries = queryCache.getAll();

            // If we have too many queries, remove the oldest inactive ones
            if (queries.length > 100) {
                const inactiveQueries = queries
                    .filter((query) => query.getObserversCount() === 0)
                    .sort((a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt)
                    .slice(0, queries.length - 80); // Keep 80 most recent

                inactiveQueries.forEach((query) => queryCache.remove(query));
            }
        };

        // Run on app start and then periodically
        manageCacheSize();
        const interval = setInterval(manageCacheSize, 10 * 60 * 1000); // Every 10 minutes

        return () => clearInterval(interval);
    }, [queryClient]);
}

// Cache warming for critical data
export function useCacheWarming() {
    const queryClient = useQueryClient();
    useEffect(() => {
        // Warm cache with essential price data on app start
        const warmCache = async () => {
            try {
                await queryClient.prefetchQuery({
                    queryKey: ["pricing", "XTZ"],
                    staleTime: 2 * 60 * 1000,
                });
            } catch (error) {
                // Silent fail for cache warming
                console.log("Cache warming failed:", error);
            }
        };

        // Delay cache warming to not interfere with initial load
        const timeout = setTimeout(warmCache, 2000);
        return () => clearTimeout(timeout);
    }, [queryClient]);
}

// Background sync for PWA
export function useBackgroundSync() {
    const queryClient = useQueryClient();
    useEffect(() => {
        if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
            // Register for background sync when online
            const handleOnline = () => {
                navigator.serviceWorker.ready.then(() => {
                    // Trigger background refresh of all wallet data
                    queryClient.invalidateQueries({ queryKey: ["wallets"] });
                    queryClient.invalidateQueries({ queryKey: ["tezos"] });
                    queryClient.invalidateQueries({ queryKey: ["etherlink"] });
                });
            };

            window.addEventListener("online", handleOnline);
            return () => window.removeEventListener("online", handleOnline);
        }
    }, [queryClient]);
}
