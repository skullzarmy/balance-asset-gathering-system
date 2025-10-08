"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowUpRight, ArrowDownLeft, Users, TrendingUp } from "lucide-react";
import type { Wallet } from "@/lib/types";

interface WalletActivityFeedProps {
    wallets: Wallet[];
}

interface ActivityItem {
    id: string;
    type: "added" | "delegated" | "staked" | "token";
    wallet: string;
    timestamp: number;
    details?: string;
}

export function WalletActivityFeed({ wallets }: WalletActivityFeedProps) {
    // Generate activity feed from wallet data
    const activities: ActivityItem[] = wallets
        .flatMap((wallet) => {
            const items: ActivityItem[] = [
                {
                    id: `${wallet.id}-added`,
                    type: "added",
                    wallet: wallet.label,
                    timestamp: wallet.addedAt,
                },
            ];

            if (wallet.type === "tezos") {
                if (wallet.status === "delegated" || wallet.status === "staked") {
                    items.push({
                        id: `${wallet.id}-delegated`,
                        type: wallet.status === "staked" ? "staked" : "delegated",
                        wallet: wallet.label,
                        timestamp: wallet.addedAt + 1000,
                        details: wallet.delegatedTo,
                    });
                }

                if (wallet.tokens && wallet.tokens.length > 0) {
                    items.push({
                        id: `${wallet.id}-tokens`,
                        type: "token",
                        wallet: wallet.label,
                        timestamp: wallet.addedAt + 2000,
                        details: `${wallet.tokens.length} tokens detected`,
                    });
                }
            }

            return items;
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

    const getIcon = (type: ActivityItem["type"]) => {
        switch (type) {
            case "added":
                return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
            case "delegated":
                return <Users className="h-4 w-4 text-purple-500" />;
            case "staked":
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case "token":
                return <ArrowUpRight className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getLabel = (type: ActivityItem["type"]) => {
        switch (type) {
            case "added":
                return "Wallet Added";
            case "delegated":
                return "Delegated";
            case "staked":
                return "Staked";
            case "token":
                return "Tokens Found";
        }
    };

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No activity yet</div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    {getIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">{activity.wallet}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {getLabel(activity.type)}
                                        </Badge>
                                    </div>
                                    {activity.details && (
                                        <div className="text-sm text-muted-foreground mt-1">{activity.details}</div>
                                    )}
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {new Date(activity.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
