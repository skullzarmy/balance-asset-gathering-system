"use client";

import type { PortfolioStats } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, RefreshCw } from "lucide-react";
import { useWallets } from "@/hooks/use-wallets";
import { TezosLogo } from "@/components/tezos-logo";

interface PortfolioOverviewCardProps {
    stats: PortfolioStats;
    isRefreshing?: boolean;
}

function formatCurrency(xtz: number, usd?: number, eur?: number): { primary: JSX.Element; secondary: string } {
    const xtzStr = (
        <span className="flex items-center gap-1">
            {xtz.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <TezosLogo size={16} variant="static" filled={true} className="text-current" />
        </span>
    );

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

export function PortfolioOverviewCard({ stats, isRefreshing }: PortfolioOverviewCardProps) {
    const { refreshAllWallets } = useWallets();
    const totalValue = formatCurrency(stats.totalValue, stats.totalValueUsd, stats.totalValueEur);
    const spendableValue = formatCurrency(
        stats.totalSpendable,
        stats.xtzUsdPrice ? stats.totalSpendable * stats.xtzUsdPrice : undefined,
        stats.xtzEurPrice ? stats.totalSpendable * stats.xtzEurPrice : undefined
    );
    const stakedValue = formatCurrency(
        stats.totalStaked,
        stats.xtzUsdPrice ? stats.totalStaked * stats.xtzUsdPrice : undefined,
        stats.xtzEurPrice ? stats.totalStaked * stats.xtzEurPrice : undefined
    );
    const unstakedValue = formatCurrency(
        stats.totalUnstaked,
        stats.xtzUsdPrice ? stats.totalUnstaked * stats.xtzUsdPrice : undefined,
        stats.xtzEurPrice ? stats.totalUnstaked * stats.xtzEurPrice : undefined
    );

    if (!stats || stats.totalWallets === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            Total Portfolio
                            <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                                <Wallet className="h-4 w-4" />
                                <span>0</span>
                            </div>
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {["total", "spendable", "staked", "unstaking"].map((type) => (
                            <div key={type} className="space-y-1 p-4 rounded-lg bg-muted/20 border border-border/30">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                        Total Portfolio
                        <div className="flex items-center gap-1 text-xs sm:text-sm font-normal text-muted-foreground">
                            <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{stats.totalWallets}</span>
                        </div>
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshAllWallets}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 w-full sm:w-auto"
                    >
                        <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span className="text-xs sm:text-sm">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {/* Total Balance */}
                    <div className="space-y-1 p-4 sm:p-3 lg:p-4 rounded-lg bg-gradient-to-br from-blue-500/10 via-card/50 to-card/50 backdrop-blur border border-blue-500/20 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer min-h-[80px] flex flex-col justify-center">
                        <div className="text-xs sm:text-sm font-medium text-muted-foreground">Total Balance</div>
                        <div className="text-base sm:text-lg font-semibold text-blue-600 break-words">
                            {totalValue.primary}
                        </div>
                        {totalValue.secondary && (
                            <div className="text-xs text-muted-foreground break-words">{totalValue.secondary}</div>
                        )}
                    </div>

                    {/* Spendable */}
                    <div className="space-y-1 p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 via-card/50 to-card/50 backdrop-blur border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                        <div className="text-sm font-medium text-muted-foreground">Spendable</div>
                        <div className="text-lg font-semibold text-emerald-600">{spendableValue.primary}</div>
                        {spendableValue.secondary && (
                            <div className="text-sm text-muted-foreground">{spendableValue.secondary}</div>
                        )}
                    </div>

                    {/* Staked */}
                    <div className="space-y-1 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 via-card/50 to-card/50 backdrop-blur border border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                        <div className="text-sm font-medium text-muted-foreground">Staked</div>
                        <div className="text-lg font-semibold text-purple-600">{stakedValue.primary}</div>
                        {stakedValue.secondary && (
                            <div className="text-sm text-muted-foreground">{stakedValue.secondary}</div>
                        )}
                    </div>

                    {/* Unstaking */}
                    <div className="space-y-1 p-4 rounded-lg bg-gradient-to-br from-orange-500/10 via-card/50 to-card/50 backdrop-blur border border-orange-500/20 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                        <div className="text-sm font-medium text-muted-foreground">Unstaking</div>
                        <div className="text-lg font-semibold text-orange-600">{unstakedValue.primary}</div>
                        {unstakedValue.secondary && (
                            <div className="text-sm text-muted-foreground">{unstakedValue.secondary}</div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
