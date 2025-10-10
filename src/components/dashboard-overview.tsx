"use client";

import type { Wallet } from "@/lib/types";
import { useOptimizedPortfolioStats } from "@/hooks/use-performance-optimizations";
import { PortfolioOverviewCard } from "./portfolio-overview-card";
import { ChainBreakdownChart } from "./chain-breakdown-chart";
import { TezosStakingBreakdownChart } from "./tezos-staking-breakdown-chart";
import { TopTokensList } from "./top-tokens-list";
import { PortfolioTimeline } from "./portfolio-timeline";
import { WalletActivityFeed } from "./wallet-activity-feed";
import { ExchangeRates } from "./exchange-rates";
import { BalanceBreakdown } from "./balance-breakdown";
import { WalletsTable } from "./wallets-table";
import { WalletManagementCards } from "./wallet-management-cards";
import { VirtualizedWalletList } from "./virtualized-wallet-list";
import { memo, useMemo } from "react";

interface DashboardOverviewProps {
    wallets: Wallet[];
    isRefreshing?: boolean;
}

// Memoized dashboard overview for performance
export const DashboardOverview = memo(function DashboardOverview({ wallets, isRefreshing }: DashboardOverviewProps) {
    const { stats, chainBreakdown, topTokens } = useOptimizedPortfolioStats(wallets);
    const hasTezos = useMemo(() => wallets.some((w) => w.type === "tezos"), [wallets]);

    // Use virtualized list for large wallet collections (>15 wallets)
    const shouldUseVirtualizedList = wallets.length > 15;

    return (
        <div className="space-y-6">
            <PortfolioOverviewCard stats={stats} isRefreshing={isRefreshing} />

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <BalanceBreakdown stats={stats} />
                <ExchangeRates stats={stats} />
            </div>

            {shouldUseVirtualizedList ? (
                <VirtualizedWalletList
                    wallets={wallets}
                    xtzUsdPrice={stats.xtzUsdPrice}
                    xtzEurPrice={stats.xtzEurPrice}
                />
            ) : (
                <WalletsTable wallets={wallets} xtzUsdPrice={stats.xtzUsdPrice} xtzEurPrice={stats.xtzEurPrice} />
            )}

            <WalletManagementCards wallets={wallets} />

            <PortfolioTimeline wallets={wallets} />

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <ChainBreakdownChart data={chainBreakdown} />
                {hasTezos && <TezosStakingBreakdownChart wallets={wallets} />}
            </div>

            <TopTokensList tokens={topTokens} />

            <WalletActivityFeed wallets={wallets} />
        </div>
    );
});
