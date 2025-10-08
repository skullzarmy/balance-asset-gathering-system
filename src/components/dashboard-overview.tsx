"use client";

import type { Wallet } from "@/lib/types";
import { calculatePortfolioStats, calculateChainBreakdown, getTopTokens } from "@/lib/analytics";
import { PortfolioStatsCards } from "./portfolio-stats";
import { ChainBreakdownChart } from "./chain-breakdown-chart";
import { TezosStakingBreakdownChart } from "./tezos-staking-breakdown-chart";
import { TopTokensList } from "./top-tokens-list";
import { PortfolioTimeline } from "./portfolio-timeline";
import { WalletActivityFeed } from "./wallet-activity-feed";
import { ExchangeRates } from "./exchange-rates";
import { BalanceBreakdown } from "./balance-breakdown";
import { WalletsTable } from "./wallets-table";

interface DashboardOverviewProps {
    wallets: Wallet[];
    onRefresh?: (id: string) => Promise<void>;
    onRemove?: (id: string) => void;
    onUpdateLabel?: (id: string, label: string) => void;
}

export function DashboardOverview({ wallets, onRefresh, onRemove, onUpdateLabel }: DashboardOverviewProps) {
    const stats = calculatePortfolioStats(wallets);
    const chainBreakdown = calculateChainBreakdown(wallets);
    const topTokens = getTopTokens(wallets);
    const hasTezos = wallets.some((w) => w.type === "tezos");

    return (
        <div className="space-y-6">
            <PortfolioStatsCards stats={stats} />

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <BalanceBreakdown stats={stats} />
                <ExchangeRates stats={stats} />
            </div>

            <WalletsTable
                wallets={wallets}
                xtzUsdPrice={stats.xtzUsdPrice}
                xtzEurPrice={stats.xtzEurPrice}
                onRefresh={onRefresh}
                onRemove={onRemove}
                onUpdateLabel={onUpdateLabel}
            />

            <PortfolioTimeline wallets={wallets} />

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <ChainBreakdownChart data={chainBreakdown} />
                {hasTezos && <TezosStakingBreakdownChart wallets={wallets} />}
            </div>

            <TopTokensList tokens={topTokens} />

            <WalletActivityFeed wallets={wallets} />
        </div>
    );
}
