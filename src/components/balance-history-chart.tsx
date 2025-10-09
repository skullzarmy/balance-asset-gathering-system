"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import type { Wallet } from "@/lib/types";
import { TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { QueryError } from "@/components/ui/error-boundary";
import { ChartSkeleton } from "@/components/ui/skeleton";

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

    const days = timeframe === "all" ? 365 : Number.parseInt(timeframe.replace("d", ""));

    // Use separate queries based on wallet type for proper TypeScript typing
    const tezosQuery = useQuery({
        ...queries.tezos.history(wallet.address, days),
        enabled: wallet.type === "tezos",
    });

    const etherlinkQuery = useQuery({
        ...queries.etherlink.history(wallet.address, days),
        enabled: wallet.type === "etherlink",
    });

    // Get the appropriate query result
    const activeQuery = wallet.type === "tezos" ? tezosQuery : etherlinkQuery;
    const historyData = activeQuery.data || [];
    const loading = activeQuery.isLoading;
    const error = activeQuery.error;

    // Format data for chart
    const data = historyData.map((point) => ({
        date: new Date(point.timestamp).toLocaleDateString(),
        balance: point.balance,
    }));

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
                {loading && <ChartSkeleton />}
                {error && (
                    <QueryError
                        error={error}
                        onRetry={() => {
                            if (wallet.type === "tezos") {
                                tezosQuery.refetch();
                            } else {
                                etherlinkQuery.refetch();
                            }
                        }}
                        isRetrying={wallet.type === "tezos" ? tezosQuery.isFetching : etherlinkQuery.isFetching}
                    />
                )}
                {!loading && !error && data.length === 0 && (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data available
                    </div>
                )}
                {!loading && !error && data.length > 0 && (
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
                )}
            </CardContent>
        </Card>
    );
}
