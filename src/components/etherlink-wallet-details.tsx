"use client";

import type { EtherlinkWallet } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, ArrowUpRight, ArrowDownLeft, Activity, FileCode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import { BalanceHistoryChart } from "./balance-history-chart";

interface EtherlinkWalletDetailsProps {
    wallet: EtherlinkWallet;
}

export function EtherlinkWalletDetails({ wallet }: EtherlinkWalletDetailsProps) {
    const { tokens } = wallet;

    // Use TanStack Query for transactions
    const { data: transactions = [], isLoading: loading } = useQuery(queries.etherlink.transactions(wallet.address));

    // Use TanStack Query for address counters
    const { data: counters, isLoading: loadingCounters } = useQuery(queries.etherlink.counters(wallet.address));

    return (
        <div className="space-y-4">
            <BalanceHistoryChart wallet={wallet} />

            {/* Address Statistics */}
            {counters && !loadingCounters && (
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Wallet Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Transactions</div>
                                <div className="text-2xl font-bold">
                                    {parseInt(counters.transactions_count).toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Token Transfers</div>
                                <div className="text-2xl font-bold">
                                    {parseInt(counters.token_transfers_count).toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Gas Used</div>
                                <div className="text-2xl font-bold">
                                    {(parseInt(counters.gas_usage_count) / 1e6).toFixed(2)}M
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Contract Calls</div>
                                <div className="text-2xl font-bold">
                                    {parseInt(counters.validations_count).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Token Balances */}
            {tokens && tokens.length > 0 && (
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Coins className="h-4 w-4" />
                            ERC-20 Tokens ({tokens.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tokens.map((token, idx) => (
                                <div
                                    key={`${token.contractAddress}-${idx}`}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                            <Coins className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{token.symbol}</div>
                                            <div className="text-xs text-muted-foreground">{token.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{token.balance.toLocaleString()}</div>
                                        {token.usdValue && (
                                            <div className="text-xs text-muted-foreground">
                                                ${token.usdValue.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Transactions */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        Recent Transactions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-sm text-muted-foreground text-center py-4">Loading transactions...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">No recent transactions</div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.slice(0, 10).map((tx) => (
                                <div
                                    key={tx.hash}
                                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                tx.type === "sent" ? "bg-red-500/10" : "bg-green-500/10"
                                            }`}
                                        >
                                            {tx.type === "sent" ? (
                                                <ArrowUpRight className="h-4 w-4 text-red-500" />
                                            ) : (
                                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium capitalize">{tx.type}</div>
                                            <div className="text-xs text-muted-foreground truncate font-mono">
                                                {tx.type === "sent" ? `To: ${tx.to}` : `From: ${tx.from}`}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div
                                            className={`font-semibold ${
                                                tx.type === "sent" ? "text-red-500" : "text-green-500"
                                            }`}
                                        >
                                            {tx.type === "sent" ? "-" : "+"}
                                            {tx.value.toFixed(4)} XTZ
                                        </div>
                                        <a
                                            href={`https://explorer.etherlink.com/tx/${tx.hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
                                        >
                                            View on Explorer
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
