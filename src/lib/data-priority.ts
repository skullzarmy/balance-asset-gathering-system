/**
 * Data Priority Management System
 *
 * Defines loading priorities for different types of wallet data:
 * - CRITICAL: Current balances, delegation status (loads immediately)
 * - HIGH: Tokens, basic wallet info (loads after critical)
 * - MEDIUM: Historical data, operations (loads on demand)
 * - LOW: Detailed analytics, rewards (background loading)
 */

export enum DataPriority {
    CRITICAL = 0, // Must load immediately - user-visible data
    HIGH = 1, // Important data - loads quickly after critical
    MEDIUM = 2, // Nice-to-have data - loads on demand/interaction
    LOW = 3, // Background data - loads when idle
}

export interface DataTask {
    priority: DataPriority;
    queryKey: string[];
    queryFn: () => Promise<unknown>;
    enabled?: boolean;
    staleTime?: number;
}

/**
 * Progressive data loading configuration for different wallet types
 */
export const dataLoadingStrategy = {
    tezos: {
        [DataPriority.CRITICAL]: [
            "breakdown", // Current balance breakdown
            "delegation", // Staking status
        ],
        [DataPriority.HIGH]: [
            "tokens", // Token balances
            "domain", // .tez domain resolution
        ],
        [DataPriority.MEDIUM]: [
            "history", // Balance history charts
            "operations", // Recent transactions
        ],
        [DataPriority.LOW]: [
            "rewards", // Detailed staking rewards
            "delegationDetails", // Baker information
        ],
    },
    etherlink: {
        [DataPriority.CRITICAL]: [
            "balance", // Current ETH balance
        ],
        [DataPriority.HIGH]: [
            "tokens", // ERC-20 token balances
            "counters", // Transaction counts
        ],
        [DataPriority.MEDIUM]: [
            "history", // Balance history
            "transactions", // Recent transactions
        ],
        [DataPriority.LOW]: [],
    },
} as const;

/**
 * Determines if data loading should be deferred based on priority and user context
 */
export function shouldDeferLoading(priority: DataPriority, context: "list" | "detail" | "background"): boolean {
    switch (context) {
        case "list":
            // In wallet list view, only load critical data immediately
            return priority > DataPriority.CRITICAL;

        case "detail":
            // In detail view, load critical and high priority immediately
            return priority > DataPriority.HIGH;

        case "background":
            // Background loading can handle all priorities
            return false;

        default:
            return priority > DataPriority.CRITICAL;
    }
}

/**
 * Calculate appropriate stale times based on data priority and type
 */
export function getOptimalStaleTime(
    priority: DataPriority,
    dataType: "balance" | "history" | "static" | "dynamic"
): number {
    const baseStaleTime = {
        [DataPriority.CRITICAL]: 30 * 1000, // 30 seconds
        [DataPriority.HIGH]: 2 * 60 * 1000, // 2 minutes
        [DataPriority.MEDIUM]: 5 * 60 * 1000, // 5 minutes
        [DataPriority.LOW]: 10 * 60 * 1000, // 10 minutes
    };

    const multiplier = {
        balance: 1, // Current balances need frequent updates
        history: 48, // Historical data is immutable (24h base * 48 = 24h)
        static: 24, // Static data like domains (2min base * 24 = 48min)
        dynamic: 1, // Dynamic data like operations
    };

    return baseStaleTime[priority] * (multiplier[dataType] || 1);
}

/**
 * Creates a progressive loading queue for wallet data
 */
export function createLoadingQueue(
    walletType: "tezos" | "etherlink",
    context: "list" | "detail" | "background"
): Array<{ dataType: string; priority: DataPriority; shouldDefer: boolean }> {
    const strategy = dataLoadingStrategy[walletType];
    const queue: Array<{ dataType: string; priority: DataPriority; shouldDefer: boolean }> = [];

    Object.entries(strategy).forEach(([priorityStr, dataTypes]) => {
        const priority = parseInt(priorityStr) as DataPriority;
        dataTypes.forEach((dataType) => {
            queue.push({
                dataType,
                priority,
                shouldDefer: shouldDeferLoading(priority, context),
            });
        });
    });

    // Sort by priority (critical first)
    return queue.sort((a, b) => a.priority - b.priority);
}
