"use client";

import type { PortfolioStats } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";

interface BalanceBreakdownProps {
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
        secondary: parts.join(" / "),
    };
}

export function BalanceBreakdown({ stats }: BalanceBreakdownProps) {
    const spendableUsd = stats.xtzUsdPrice ? stats.totalSpendable * stats.xtzUsdPrice : undefined;
    const spendableEur = stats.xtzEurPrice ? stats.totalSpendable * stats.xtzEurPrice : undefined;

    const stakedUsd = stats.xtzUsdPrice ? stats.totalStaked * stats.xtzUsdPrice : undefined;
    const stakedEur = stats.xtzEurPrice ? stats.totalStaked * stats.xtzEurPrice : undefined;

    const unstakedUsd = stats.xtzUsdPrice ? stats.totalUnstaked * stats.xtzUsdPrice : undefined;
    const unstakedEur = stats.xtzEurPrice ? stats.totalUnstaked * stats.xtzEurPrice : undefined;

    if (stats.tezosValue === 0) {
        return null;
    }

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Total Tezos Balance Breakdown
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-baseline justify-between mb-1">
                            <span className="text-sm font-medium">Total Balance</span>
                            <div className="text-right">
                                <div className="text-xl font-bold">
                                    {
                                        formatMultiCurrency(stats.tezosValue, stats.tezosValueUsd, stats.tezosValueEur)
                                            .primary
                                    }
                                </div>
                                {formatMultiCurrency(stats.tezosValue, stats.tezosValueUsd, stats.tezosValueEur)
                                    .secondary && (
                                    <div className="text-xs text-muted-foreground">
                                        {
                                            formatMultiCurrency(
                                                stats.tezosValue,
                                                stats.tezosValueUsd,
                                                stats.tezosValueEur
                                            ).secondary
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border">
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-muted-foreground">Spendable</span>
                            <div className="text-right">
                                <div className="text-sm font-medium">
                                    {formatMultiCurrency(stats.totalSpendable, spendableUsd, spendableEur).primary}
                                </div>
                                {formatMultiCurrency(stats.totalSpendable, spendableUsd, spendableEur).secondary && (
                                    <div className="text-xs text-muted-foreground">
                                        {
                                            formatMultiCurrency(stats.totalSpendable, spendableUsd, spendableEur)
                                                .secondary
                                        }
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-muted-foreground">Staked</span>
                            <div className="text-right">
                                <div className="text-sm font-medium">
                                    {formatMultiCurrency(stats.totalStaked, stakedUsd, stakedEur).primary}
                                </div>
                                {formatMultiCurrency(stats.totalStaked, stakedUsd, stakedEur).secondary && (
                                    <div className="text-xs text-muted-foreground">
                                        {formatMultiCurrency(stats.totalStaked, stakedUsd, stakedEur).secondary}
                                    </div>
                                )}
                            </div>
                        </div>

                        {stats.totalUnstaked > 0 && (
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm text-muted-foreground">Unstaking</span>
                                <div className="text-right">
                                    <div className="text-sm font-medium">
                                        {formatMultiCurrency(stats.totalUnstaked, unstakedUsd, unstakedEur).primary}
                                    </div>
                                    {formatMultiCurrency(stats.totalUnstaked, unstakedUsd, unstakedEur).secondary && (
                                        <div className="text-xs text-muted-foreground">
                                            {
                                                formatMultiCurrency(stats.totalUnstaked, unstakedUsd, unstakedEur)
                                                    .secondary
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
