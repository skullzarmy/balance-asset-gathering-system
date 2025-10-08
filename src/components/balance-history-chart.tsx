"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { fetchTezosHistory } from "@/lib/blockchain/tezos";
import { fetchEtherlinkHistory } from "@/lib/blockchain/etherlink";
import type { Wallet } from "@/lib/types";
import { TrendingUp } from "lucide-react";

interface BalanceHistoryChartProps {
    wallet: Wallet;
}

export function BalanceHistoryChart({ wallet }: BalanceHistoryChartProps) {
    const [timeRange, setTimeRange] = useState("7");
    const [data, setData] = useState<{ timestamp: number; balance: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            setLoading(true);
            const days = Number.parseInt(timeRange);

            if (wallet.type === "tezos") {
                const history = await fetchTezosHistory(wallet.address, days);
                setData(history);
            } else {
                const history = await fetchEtherlinkHistory(wallet.address, days);
                setData(history);
            }

            setLoading(false);
        };

        loadHistory();
    }, [wallet.address, wallet.type, timeRange]);

    const chartData = data.map((point) => ({
        date: new Date(point.timestamp).toLocaleDateString(),
        balance: point.balance,
    }));

    const change = data.length > 1 ? ((data[data.length - 1].balance - data[0].balance) / data[0].balance) * 100 : 0;

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Balance History</span>
                    <span className="sm:hidden">History</span>
                </CardTitle>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[100px] sm:w-[120px] h-9">
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
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        Loading history...
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        No history available
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <div className="text-xl sm:text-2xl font-bold">
                                {data[data.length - 1].balance.toFixed(2)} {wallet.type === "tezos" ? "XTZ" : "ETH"}
                            </div>
                            <div className={`text-xs sm:text-sm ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {change >= 0 ? "+" : ""}
                                {change.toFixed(2)}% ({timeRange} days)
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "var(--radius)",
                                    }}
                                    formatter={(value: number) => [value.toFixed(4), "Balance"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="hsl(var(--chart-1))"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorBalance)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
