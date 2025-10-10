"use client";

import type { Wallet } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell } from "recharts";
import { TezosLogo } from "@/components/tezos-logo";
import { calculateTezosBreakdown } from "@/lib/analytics";
import { PieChart as PieChartIcon } from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";

interface TezosStakingBreakdownChartProps {
    wallets: Wallet[];
}

const chartConfig = {
    Staked: {
        label: "Staked",
        color: "hsl(var(--chart-3))",
    },
    Delegated: {
        label: "Delegated",
        color: "hsl(var(--chart-4))",
    },
    Undelegated: {
        label: "Undelegated",
        color: "hsl(var(--chart-5))",
    },
} satisfies ChartConfig;

const COLORS = {
    Staked: "hsl(var(--chart-3))",
    Delegated: "hsl(var(--chart-4))",
    Undelegated: "hsl(var(--chart-5))",
};

export function TezosStakingBreakdownChart({ wallets }: TezosStakingBreakdownChartProps) {
    const breakdown = calculateTezosBreakdown(wallets);

    const chartData = [
        { name: "Staked", value: breakdown.staked, fill: COLORS.Staked },
        { name: "Delegated", value: breakdown.delegated, fill: COLORS.Delegated },
        { name: "Undelegated", value: breakdown.undelegated, fill: COLORS.Undelegated },
    ].filter((item) => item.value > 0);

    if (chartData.length === 0) {
        return (
            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5" />
                        Tezos Staking Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No Tezos staking data available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Tezos Staking Breakdown
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) =>
                                `${name}: ${(
                                    (value / (breakdown.staked + breakdown.delegated + breakdown.undelegated)) *
                                    100
                                ).toFixed(1)}%`
                            }
                            outerRadius={80}
                            dataKey="value"
                        >
                            {chartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                            ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                </ChartContainer>

                <div className="mt-4 space-y-2">
                    {chartData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                <span>{item.name}</span>
                            </div>
                            <span className="font-semibold flex items-center gap-1">
                                {item.value.toFixed(2)}
                                <TezosLogo size={14} variant="static" filled={true} className="text-current" />
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
