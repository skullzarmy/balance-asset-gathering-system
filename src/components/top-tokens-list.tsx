"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import Image from "next/image";

interface TopToken {
    symbol: string;
    name: string;
    balance: number;
    thumbnailUri?: string;
    wallets: number;
}

interface TopTokensListProps {
    tokens: TopToken[];
}

function convertIPFSToFileship(uri?: string): string | null {
    if (!uri) return null;

    // Handle ipfs:// protocol
    if (uri.startsWith("ipfs://")) {
        const cid = uri.replace("ipfs://", "");
        return `https://ipfs.fileship.xyz/${cid}`;
    }

    // Handle /ipfs/ path
    if (uri.includes("/ipfs/")) {
        const cid = uri.split("/ipfs/")[1];
        return `https://ipfs.fileship.xyz/${cid}`;
    }

    // Already a full URL
    if (uri.startsWith("http")) {
        return uri;
    }

    return null;
}

export function TopTokensList({ tokens }: TopTokensListProps) {
    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Top Tokens
                </CardTitle>
            </CardHeader>
            <CardContent>
                {tokens.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No tokens found</div>
                ) : (
                    <div className="space-y-4">
                        {tokens.map((token, idx) => {
                            const imageUrl = convertIPFSToFileship(token.thumbnailUri);
                            return (
                                <div key={`${token.symbol}-${idx}`} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                            {imageUrl ? (
                                                <Image
                                                    src={imageUrl}
                                                    alt={token.symbol}
                                                    width={40}
                                                    height={40}
                                                    className="object-cover w-auto h-auto"
                                                    unoptimized
                                                />
                                            ) : (
                                                <Coins className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{token.symbol}</div>
                                            <div className="text-sm text-muted-foreground">{token.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{token.balance.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {token.wallets} wallet{token.wallets !== 1 ? "s" : ""}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
