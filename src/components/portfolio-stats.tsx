"use client";

import type { PortfolioStats } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Coins, Wallet, TrendingUp } from "lucide-react";

interface PortfolioStatsProps {
    stats: PortfolioStats;
}

function formatMultiCurrency(xtz: number, usd?: number, eur?: number): { primary: string; secondary: string } {
    const xtzStr = `${xtz.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ꜩ`;

    if (!usd && !eur) {
        return { primary: xtzStr, secondary: "" };
    }

    const parts: string[] = [];
    if (usd) {
        parts.push(`$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }
    if (eur) {
        parts.push(`${eur.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
    }

    return {
        primary: xtzStr,
        secondary: `(${parts.join(" / ")})`,
    };
}

export function PortfolioStatsCards({ stats }: PortfolioStatsProps) {
    const estimatedApy = 5.2; // Typical Tezos staking APY
    const annualRewardsXtz = (stats.totalStaked * estimatedApy) / 100;
    const totalStakedUsd = stats.xtzUsdPrice ? stats.totalStaked * stats.xtzUsdPrice : undefined;
    const totalStakedEur = stats.xtzEurPrice ? stats.totalStaked * stats.xtzEurPrice : undefined;
    const annualRewardsUsd = totalStakedUsd ? (totalStakedUsd * estimatedApy) / 100 : undefined;
    const annualRewardsEur = totalStakedEur ? (totalStakedEur * estimatedApy) / 100 : undefined;

    const totalValue = formatMultiCurrency(stats.totalValue, stats.totalValueUsd, stats.totalValueEur);
    const tezosValue = formatMultiCurrency(stats.tezosValue, stats.tezosValueUsd, stats.tezosValueEur);
    const etherlinkValue = formatMultiCurrency(stats.etherlinkValue, stats.etherlinkValueUsd, stats.etherlinkValueEur);
    const stakedValue = formatMultiCurrency(stats.totalStaked, totalStakedUsd, totalStakedEur);
    const rewardsValue = formatMultiCurrency(annualRewardsXtz, annualRewardsUsd, annualRewardsEur);

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-card/50 to-card/50 backdrop-blur border-blue-500/20 shadow-lg shadow-blue-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/30 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
                    <DollarSign className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                        {totalValue.primary}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {totalValue.secondary && <span className="block text-xs">{totalValue.secondary}</span>}
                        <span className="text-blue-500/70">
                            {stats.totalWallets} wallet{stats.totalWallets !== 1 ? "s" : ""}
                        </span>
                    </p>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-teal-500/10 via-card/50 to-card/50 backdrop-blur border-teal-500/20 shadow-lg shadow-teal-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-500/30 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium">Tezos Value</CardTitle>
                    <Coins className="h-5 w-5 text-teal-500" />
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
                        {tezosValue.primary}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {tezosValue.secondary && <span className="block text-xs">{tezosValue.secondary}</span>}
                        <span className="text-teal-500/70">
                            {stats.tezosWallets} wallet{stats.tezosWallets !== 1 ? "s" : ""}
                        </span>
                    </p>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-card/50 to-card/50 backdrop-blur border-purple-500/20 shadow-lg shadow-purple-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/30 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium">Etherlink Value</CardTitle>
                    <Wallet className="h-5 w-5 text-purple-500" />
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                        {etherlinkValue.primary}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {etherlinkValue.secondary && <span className="block text-xs">{etherlinkValue.secondary}</span>}
                        <span className="text-purple-500/70">
                            {stats.etherlinkWallets} wallet{stats.etherlinkWallets !== 1 ? "s" : ""}
                        </span>
                    </p>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-card/50 to-card/50 backdrop-blur border-emerald-500/20 shadow-lg shadow-emerald-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium">Staked & Earning</CardTitle>
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                        {stakedValue.primary}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stakedValue.secondary && <span className="block text-xs">{stakedValue.secondary}</span>}
                        <span className="text-emerald-500/70">
                            ~{rewardsValue.primary}/year @ {estimatedApy}% APY
                        </span>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
