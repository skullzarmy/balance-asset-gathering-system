"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { useState, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import type { Wallet } from "@/lib/types";
import { Activity } from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";

interface PortfolioTimelineProps {
    wallets: Wallet[];
}

const chartConfig = {
    tezos: {
        label: "Tezos",
        color: "hsl(var(--chart-1))",
    },
    etherlink: {
        label: "Etherlink",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig;

export function PortfolioTimeline({ wallets }: PortfolioTimelineProps) {
    const [timeRange, setTimeRange] = useState("30");
    const days = Number.parseInt(timeRange);

    // Use useQueries for parallel fetching with automatic request deduplication
    const historyQueries = useQueries({
        queries: wallets.map((wallet) =>
            wallet.type === "tezos"
                ? queries.tezos.history(wallet.address, days)
                : queries.etherlink.history(wallet.address, days)
        ),
    });

    // Calculate loading state
    const loading = historyQueries.some((q) => q.isLoading);
    const loadedCount = historyQueries.filter((q) => !q.isLoading).length;

    // Process and aggregate data using useMemo for performance
    const data = useMemo(() => {
        if (loading || historyQueries.some((q) => q.error)) {
            return [];
        }

        // Aggregate by date - balance_history returns liquid balance (excluding staked)
        const dateMap = new Map<string, { date: string; tezos: number; etherlink: number }>();

        historyQueries.forEach((query, index) => {
            const wallet = wallets[index];
            const history = query.data || [];

            history.forEach((point) => {
                const date = new Date(point.timestamp).toLocaleDateString();
                const existing = dateMap.get(date) || {
                    date,
                    tezos: 0,
                    etherlink: 0,
                };

                if (wallet.type === "tezos") {
                    // balance from balance_history is liquid balance (staked tez are pseudotokens, not included)
                    existing.tezos += point.balance;
                } else {
                    existing.etherlink += point.balance;
                }

                dateMap.set(date, existing);
            });
        });

        const chartData = Array.from(dateMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return chartData;
    }, [historyQueries, wallets, loading]);

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Portfolio Timeline
                </CardTitle>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-[300px] flex flex-col items-center justify-center gap-3">
                        <div className="flex flex-col items-center gap-2">
                            <div className="text-sm font-medium">
                                {loadedCount}/{wallets.length} wallets
                            </div>
                            <div className="text-xs text-muted-foreground animate-pulse">Loading wallet history...</div>
                        </div>
                        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${(loadedCount / wallets.length) * 100}%` }}
                            />
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No history available yet
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <AreaChart accessibilityLayer data={data}>
                            <defs>
                                <linearGradient id="tezosGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                </linearGradient>
                                <linearGradient id="etherlinkGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                            <ChartTooltip
                                content={<ChartTooltipContent formatter={(value: number) => value.toFixed(4)} />}
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Area
                                type="monotone"
                                dataKey="tezos"
                                stackId="1"
                                stroke="hsl(var(--chart-1))"
                                fill="url(#tezosGradient)"
                            />
                            <Area
                                type="monotone"
                                dataKey="etherlink"
                                stackId="1"
                                stroke="hsl(var(--chart-2))"
                                fill="url(#etherlinkGradient)"
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
