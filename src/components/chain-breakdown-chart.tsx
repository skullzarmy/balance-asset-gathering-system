"use client";

import type { ChainBreakdown } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell } from "recharts";
import { Layers } from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";

interface ChainBreakdownChartProps {
    data: ChainBreakdown[];
}

const chartConfig = {
    Tezos: {
        label: "Tezos",
        color: "hsl(var(--chart-1))",
    },
    Etherlink: {
        label: "Etherlink",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig;

const COLORS = {
    Tezos: "hsl(var(--chart-1))",
    Etherlink: "hsl(var(--chart-2))",
};

export function ChainBreakdownChart({ data }: ChainBreakdownChartProps) {
    const chartData = data.map((item) => ({
        name: item.chain,
        value: item.value,
        percentage: item.percentage,
        fill: COLORS[item.chain as keyof typeof COLORS],
    }));

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Portfolio Distribution
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
                            label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
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
                    {data.map((item) => (
                        <div key={item.chain} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: COLORS[item.chain as keyof typeof COLORS] }}
                                />
                                <span>{item.chain}</span>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">{item.value.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">{item.walletCount} wallets</div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
