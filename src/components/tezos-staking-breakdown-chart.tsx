"use client";

import type { Wallet } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as RechartsPI, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { calculateTezosBreakdown } from "@/lib/analytics";
import { PieChart as PieChartIcon } from "lucide-react";

interface TezosStakingBreakdownChartProps {
    wallets: Wallet[];
}

export function TezosStakingBreakdownChart({ wallets }: TezosStakingBreakdownChartProps) {
    const breakdown = calculateTezosBreakdown(wallets);
    const total = breakdown.staked + breakdown.delegated + breakdown.undelegated;

    if (total === 0) {
        return null;
    }

    const chartData = [
        { name: "Staked", value: breakdown.staked, color: "hsl(var(--chart-1))" },
        { name: "Delegated", value: breakdown.delegated, color: "hsl(var(--chart-2))" },
        { name: "Undelegated", value: breakdown.undelegated, color: "hsl(var(--chart-3))" },
    ].filter((item) => item.value > 0);

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Tezos Staking Distribution
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <RechartsPI>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                                color: "hsl(var(--foreground))",
                            }}
                            formatter={(value: number) => [`${value.toFixed(2)} XTZ`]}
                        />
                        <Legend />
                    </RechartsPI>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                    {chartData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span>{item.name}</span>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">{item.value.toFixed(2)} XTZ</div>
                                <div className="text-xs text-muted-foreground">
                                    {((item.value / total) * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
