"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";
import { fetchTezosHistory } from "@/lib/blockchain/tezos";
import { fetchEtherlinkHistory } from "@/lib/blockchain/etherlink";
import type { Wallet } from "@/lib/types";
import { TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface BalanceHistoryChartProps {
    wallet: Wallet;
}

const chartConfig = {
    balance: {
        label: "Balance",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

export function BalanceHistoryChart({ wallet }: BalanceHistoryChartProps) {
    const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "all">("30d");
    const [data, setData] = useState<Array<{ date: string; balance: number }>>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const days = timeframe === "all" ? 365 : Number.parseInt(timeframe.replace("d", ""));

                if (wallet.type === "tezos") {
                    const history = await fetchTezosHistory(wallet.address, days);
                    setData(history);
                } else {
                    const history = await fetchEtherlinkHistory(wallet.address, days);
                    setData(history);
                }
            } catch (error) {
                console.error("Error loading balance history:", error);
                setData([]);
            }
        };
        loadData();
    }, [wallet.address, wallet.type, timeframe]);

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Balance History
                </CardTitle>
                <Select value={timeframe} onValueChange={(value) => setTimeframe(value as typeof timeframe)}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">7 Days</SelectItem>
                        <SelectItem value="30d">30 Days</SelectItem>
                        <SelectItem value="90d">90 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <AreaChart accessibilityLayer data={data}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="hsl(var(--chart-1))"
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
