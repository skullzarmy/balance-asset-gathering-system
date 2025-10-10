/**
 * Progressive Data Loading Hook
 *
 * Implements intelligent data loading that prioritizes critical data
 * and defers non-essential data based on user context and interaction patterns.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import { DataPriority, createLoadingQueue, getOptimalStaleTime, shouldDeferLoading } from "@/lib/data-priority";
import type { Wallet } from "@/lib/types";

interface ProgressiveLoadingOptions {
    context: "list" | "detail" | "background";
    enableBackgroundLoading?: boolean;
    deferNonCritical?: boolean;
}

interface LoadingState {
    isLoadingCritical: boolean;
    isLoadingHigh: boolean;
    isLoadingMedium: boolean;
    isLoadingLow: boolean;
    totalProgress: number;
    completedTasks: number;
    totalTasks: number;
}

/**
 * Hook for progressive wallet data loading
 */
export function useProgressiveWalletLoading(wallet: Wallet, options: ProgressiveLoadingOptions = { context: "list" }) {
    const { context, enableBackgroundLoading = true, deferNonCritical = true } = options;
    const [userInteracted, setUserInteracted] = useState(false);
    const backgroundTimeoutRef = useRef<NodeJS.Timeout>();

    // Create loading queue based on wallet type and context
    const loadingQueue = createLoadingQueue(wallet.type, context);

    // Track which data has been requested
    const [requestedData, setRequestedData] = useState<Set<string>>(new Set());

    // Critical data (always loads immediately)
    const criticalQueries = loadingQueue
        .filter((item) => item.priority === DataPriority.CRITICAL)
        .map((item) => {
            const queryConfig = getQueryConfig(wallet, item.dataType, item.priority);
            return queryConfig;
        });

    const criticalResults = useQueries({ queries: criticalQueries });

    // High priority data (loads after critical or on interaction)
    const highQueries = loadingQueue
        .filter((item) => item.priority === DataPriority.HIGH)
        .map((item) => {
            const shouldEnable = !shouldDeferLoading(item.priority, context) || userInteracted;
            const queryConfig = getQueryConfig(wallet, item.dataType, item.priority);
            return {
                ...queryConfig,
                enabled: shouldEnable && !requestedData.has(item.dataType),
            };
        });

    const highResults = useQueries({ queries: highQueries });

    // Medium priority data (loads on demand)
    const mediumQueries = loadingQueue
        .filter((item) => item.priority === DataPriority.MEDIUM)
        .map((item) => {
            const shouldEnable = userInteracted || (!deferNonCritical && context === "detail");
            const queryConfig = getQueryConfig(wallet, item.dataType, item.priority);
            return {
                ...queryConfig,
                enabled: shouldEnable && !requestedData.has(item.dataType),
            };
        });

    const mediumResults = useQueries({ queries: mediumQueries });

    // Low priority data (background loading)
    const lowQueries = loadingQueue
        .filter((item) => item.priority === DataPriority.LOW)
        .map((item) => {
            const queryConfig = getQueryConfig(wallet, item.dataType, item.priority);
            return {
                ...queryConfig,
                enabled: enableBackgroundLoading && !requestedData.has(item.dataType),
            };
        });

    const lowResults = useQueries({ queries: lowQueries });

    // Trigger user interaction handlers
    const handleUserInteraction = () => {
        if (!userInteracted) {
            setUserInteracted(true);
            // Mark high and medium priority data as requested
            const newRequested = new Set(requestedData);
            loadingQueue
                .filter((item) => item.priority <= DataPriority.MEDIUM)
                .forEach((item) => newRequested.add(item.dataType));
            setRequestedData(newRequested);
        }
    };

    // Background loading with idle callback
    useEffect(() => {
        if (!enableBackgroundLoading || context === "list") return;

        const scheduleBackgroundLoading = () => {
            if (backgroundTimeoutRef.current) {
                clearTimeout(backgroundTimeoutRef.current);
            }

            backgroundTimeoutRef.current = setTimeout(() => {
                if ("requestIdleCallback" in window) {
                    requestIdleCallback(() => {
                        const newRequested = new Set(requestedData);
                        loadingQueue
                            .filter((item) => item.priority === DataPriority.LOW)
                            .forEach((item) => newRequested.add(item.dataType));
                        setRequestedData(newRequested);
                    });
                } else {
                    // Fallback for browsers without requestIdleCallback
                    setTimeout(() => {
                        const newRequested = new Set(requestedData);
                        loadingQueue
                            .filter((item) => item.priority === DataPriority.LOW)
                            .forEach((item) => newRequested.add(item.dataType));
                        setRequestedData(newRequested);
                    }, 2000);
                }
            }, 1000); // Wait 1 second before background loading
        };

        scheduleBackgroundLoading();

        return () => {
            if (backgroundTimeoutRef.current) {
                clearTimeout(backgroundTimeoutRef.current);
            }
        };
    }, [enableBackgroundLoading, context, requestedData, loadingQueue]);

    // Calculate loading state
    const loadingState: LoadingState = {
        isLoadingCritical: criticalResults.some((q) => q.isLoading),
        isLoadingHigh: highResults.some((q) => q.isLoading),
        isLoadingMedium: mediumResults.some((q) => q.isLoading),
        isLoadingLow: lowResults.some((q) => q.isLoading),
        totalProgress: 0,
        completedTasks: 0,
        totalTasks: loadingQueue.length,
    };

    // Calculate progress
    const allResults = [...criticalResults, ...highResults, ...mediumResults, ...lowResults];
    loadingState.completedTasks = allResults.filter((q) => !q.isLoading && !q.error).length;
    loadingState.totalProgress = (loadingState.completedTasks / loadingState.totalTasks) * 100;

    // Aggregate data
    const data = {
        critical: criticalResults.reduce((acc, result, index) => {
            const dataType = loadingQueue.filter((q) => q.priority === DataPriority.CRITICAL)[index]?.dataType;
            if (dataType && result.data) {
                acc[dataType] = result.data;
            }
            return acc;
        }, {} as Record<string, unknown>),

        high: highResults.reduce((acc, result, index) => {
            const dataType = loadingQueue.filter((q) => q.priority === DataPriority.HIGH)[index]?.dataType;
            if (dataType && result.data) {
                acc[dataType] = result.data;
            }
            return acc;
        }, {} as Record<string, unknown>),

        medium: mediumResults.reduce((acc, result, index) => {
            const dataType = loadingQueue.filter((q) => q.priority === DataPriority.MEDIUM)[index]?.dataType;
            if (dataType && result.data) {
                acc[dataType] = result.data;
            }
            return acc;
        }, {} as Record<string, unknown>),

        low: lowResults.reduce((acc, result, index) => {
            const dataType = loadingQueue.filter((q) => q.priority === DataPriority.LOW)[index]?.dataType;
            if (dataType && result.data) {
                acc[dataType] = result.data;
            }
            return acc;
        }, {} as Record<string, unknown>),
    };

    return {
        data,
        loadingState,
        handleUserInteraction,
        // Expose individual query results for specific use cases
        queries: {
            critical: criticalResults,
            high: highResults,
            medium: mediumResults,
            low: lowResults,
        },
    };
}

/**
 * Helper function to get query configuration for a specific data type
 */
function getQueryConfig(wallet: Wallet, dataType: string, priority: DataPriority) {
    const baseConfig = {
        staleTime: getOptimalStaleTime(priority, getDataType(dataType)),
        gcTime: getOptimalStaleTime(priority, getDataType(dataType)) * 3,
    };

    if (wallet.type === "tezos") {
        switch (dataType) {
            case "breakdown":
                return { ...queries.tezos.balanceBreakdown(wallet.address), ...baseConfig };
            case "delegation":
                return { ...queries.tezos.delegation(wallet.address), ...baseConfig };
            case "tokens":
                return { ...queries.tezos.tokens(wallet.address), ...baseConfig };
            case "domain":
                return { ...queries.tezos.domain(wallet.address), ...baseConfig };
            case "history":
                return { ...queries.tezos.history(wallet.address), ...baseConfig };
            case "operations":
                return { ...queries.tezos.operations(wallet.address), ...baseConfig };
            case "rewards":
                return { ...queries.tezos.rewards(wallet.address), ...baseConfig };
            case "delegationDetails":
                return { ...queries.tezos.delegationDetails(wallet.address), ...baseConfig };
            default:
                throw new Error(`Unknown Tezos data type: ${dataType}`);
        }
    } else {
        switch (dataType) {
            case "balance":
                return { ...queries.etherlink.balance(wallet.address), ...baseConfig };
            case "tokens":
                return { ...queries.etherlink.tokens(wallet.address), ...baseConfig };
            case "counters":
                return { ...queries.etherlink.counters(wallet.address), ...baseConfig };
            case "history":
                return { ...queries.etherlink.history(wallet.address), ...baseConfig };
            case "transactions":
                return { ...queries.etherlink.transactions(wallet.address), ...baseConfig };
            default:
                throw new Error(`Unknown Etherlink data type: ${dataType}`);
        }
    }
}

/**
 * Categorize data types for optimal stale time calculation
 */
function getDataType(dataType: string): "balance" | "history" | "static" | "dynamic" {
    if (["breakdown", "balance"].includes(dataType)) return "balance";
    if (["history"].includes(dataType)) return "history";
    if (["domain", "delegationDetails"].includes(dataType)) return "static";
    return "dynamic";
}
