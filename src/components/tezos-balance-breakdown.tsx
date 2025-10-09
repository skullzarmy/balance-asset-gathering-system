"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
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
    const { data: breakdown, isLoading: loading } = useQuery(queries.tezos.balanceBreakdown(wallet.address));

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

                    {/* Pie Chart */}
                    {hasStaking && (
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <PieChart>
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent formatter={(value: number) => `${value.toFixed(4)} XTZ`} />
                                    }
                                />
                                <Pie
                                    data={[
                                        { name: "Spendable", value: breakdown.spendable, fill: "hsl(var(--chart-1))" },
                                        ...(breakdown.staked > 0
                                            ? [{ name: "Staked", value: breakdown.staked, fill: "hsl(var(--chart-2))" }]
                                            : []),
                                        ...(breakdown.unstaked > 0
                                            ? [
                                                  {
                                                      name: "Unstaked",
                                                      value: breakdown.unstaked,
                                                      fill: "hsl(var(--chart-3))",
                                                  },
                                              ]
                                            : []),
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                                    outerRadius={80}
                                    dataKey="value"
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
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
