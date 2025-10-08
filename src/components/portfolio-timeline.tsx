"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState, useEffect } from "react";
import { fetchTezosHistory } from "@/lib/blockchain/tezos";
import { fetchEtherlinkHistory } from "@/lib/blockchain/etherlink";
import type { Wallet } from "@/lib/types";
import { Activity } from "lucide-react";

interface PortfolioTimelineProps {
    wallets: Wallet[];
}

export function PortfolioTimeline({ wallets }: PortfolioTimelineProps) {
    const [timeRange, setTimeRange] = useState("30");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, phase: "Fetching..." });

    useEffect(() => {
        const loadAllHistory = async () => {
            setLoading(true);
            setLoadingProgress({ current: 0, total: wallets.length, phase: "Fetching wallet data..." });
            const days = Number.parseInt(timeRange);

            // Fetch history for all wallets in parallel for maximum speed
            const histories = await Promise.all(
                wallets.map(async (wallet, index) => {
                    const result =
                        wallet.type === "tezos"
                            ? { wallet, history: await fetchTezosHistory(wallet.address, days) }
                            : { wallet, history: await fetchEtherlinkHistory(wallet.address, days) };

                    setLoadingProgress((prev) => ({ ...prev, current: prev.current + 1 }));
                    return result;
                })
            );

            setLoadingProgress((prev) => ({ ...prev, phase: "Processing data..." }));

            // Aggregate by date - balance_history returns liquid balance (excluding staked)
            const dateMap = new Map<string, any>();

            histories.forEach(({ wallet, history }) => {
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

            setLoadingProgress((prev) => ({ ...prev, phase: "Building chart..." }));

            const chartData = Array.from(dateMap.values()).sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            setData(chartData);
            setLoading(false);
        };

        if (wallets.length > 0) {
            loadAllHistory();
        } else {
            setLoading(false);
        }
    }, [wallets, timeRange]);

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
                                {loadingProgress.current}/{loadingProgress.total} wallets
                            </div>
                            <div className="text-xs text-muted-foreground animate-pulse">{loadingProgress.phase}</div>
                        </div>
                        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No history available yet
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data}>
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
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    color: "hsl(var(--foreground))",
                                }}
                                formatter={(value: number) => value.toFixed(4)}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="tezos"
                                stackId="1"
                                stroke="hsl(var(--chart-1))"
                                fill="url(#tezosGradient)"
                                name="Tezos"
                            />
                            <Area
                                type="monotone"
                                dataKey="etherlink"
                                stackId="1"
                                stroke="hsl(var(--chart-2))"
                                fill="url(#etherlinkGradient)"
                                name="Etherlink"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
