"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useState, useEffect } from "react";
import { fetchTezosBalanceBreakdown, type TezosBalanceBreakdown } from "@/lib/blockchain/tezos";
import type { TezosWallet } from "@/lib/types";
import { Layers } from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";

interface TezosBalanceBreakdownChartProps {
    wallet: TezosWallet;
}

const chartConfig = {
    spendable: {
        label: "Spendable",
        color: "hsl(var(--chart-1))",
    },
    staked: {
        label: "Staked",
        color: "hsl(var(--chart-2))",
    },
    unstaked: {
        label: "Unstaked",
        color: "hsl(var(--chart-3))",
    },
} satisfies ChartConfig;

export function TezosBalanceBreakdownChart({ wallet }: TezosBalanceBreakdownChartProps) {
    const [breakdown, setBreakdown] = useState<TezosBalanceBreakdown | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBreakdown = async () => {
            setLoading(true);
            const data = await fetchTezosBalanceBreakdown(wallet.address);
            setBreakdown(data);
            setLoading(false);
        };

        loadBreakdown();
    }, [wallet.address]);

    if (loading) {
        return (
            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Balance Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Loading breakdown...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!breakdown || breakdown.total === 0) {
        return null;
    }

    const chartData = [
        {
            name: "Balance",
            spendable: breakdown.spendable,
            staked: breakdown.staked,
            unstaked: breakdown.unstaked,
        },
    ];

    const hasStaking = breakdown.staked > 0 || breakdown.unstaked > 0;

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Balance Breakdown
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-xs text-muted-foreground">Total</div>
                            <div className="text-lg font-bold">{breakdown.total.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">XTZ</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Spendable</div>
                            <div className="text-lg font-bold">{breakdown.spendable.toFixed(2)}</div>
                            <div className="text-xs text-green-500">
                                {((breakdown.spendable / breakdown.total) * 100).toFixed(1)}%
                            </div>
                        </div>
                        {breakdown.staked > 0 && (
                            <div>
                                <div className="text-xs text-muted-foreground">Staked</div>
                                <div className="text-lg font-bold">{breakdown.staked.toFixed(2)}</div>
                                <div className="text-xs text-blue-500">
                                    {((breakdown.staked / breakdown.total) * 100).toFixed(1)}%
                                </div>
                            </div>
                        )}
                        {breakdown.unstaked > 0 && (
                            <div>
                                <div className="text-xs text-muted-foreground">Unstaked</div>
                                <div className="text-lg font-bold">{breakdown.unstaked.toFixed(2)}</div>
                                <div className="text-xs text-orange-500">
                                    {((breakdown.unstaked / breakdown.total) * 100).toFixed(1)}%
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stacked Area Chart */}
                    {hasStaking && (
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <AreaChart accessibilityLayer data={chartData}>
                                <defs>
                                    <linearGradient id="spendableGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                    </linearGradient>
                                    <linearGradient id="stakedGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                                    </linearGradient>
                                    <linearGradient id="unstakedGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent formatter={(value: number) => `${value.toFixed(4)} XTZ`} />
                                    }
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Area
                                    type="monotone"
                                    dataKey="spendable"
                                    stackId="1"
                                    stroke="hsl(var(--chart-1))"
                                    fill="url(#spendableGradient)"
                                />
                                {breakdown.staked > 0 && (
                                    <Area
                                        type="monotone"
                                        dataKey="staked"
                                        stackId="1"
                                        stroke="hsl(var(--chart-2))"
                                        fill="url(#stakedGradient)"
                                    />
                                )}
                                {breakdown.unstaked > 0 && (
                                    <Area
                                        type="monotone"
                                        dataKey="unstaked"
                                        stackId="1"
                                        stroke="hsl(var(--chart-3))"
                                        fill="url(#unstakedGradient)"
                                    />
                                )}
                            </AreaChart>
                        </ChartContainer>
                    )}

                    {/* Simple breakdown bars if no staking */}
                    {!hasStaking && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Spendable</span>
                                        <span className="font-semibold">
                                            {breakdown.spendable.toFixed(2)} XTZ (100%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-chart-1" style={{ width: "100%" }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
