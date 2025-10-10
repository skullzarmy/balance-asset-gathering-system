"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, memo } from "react";
import type { Wallet } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2 } from "lucide-react";
import { formatAddress } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";
import { useWallets } from "@/hooks/use-wallets";
import { TezosLogo } from "@/components/tezos-logo";

interface VirtualizedWalletListProps {
    wallets: Wallet[];
    xtzUsdPrice?: number | null;
    xtzEurPrice?: number | null;
}

// Memoized individual wallet row component
const WalletRow = memo(function WalletRow({
    wallet,
    xtzUsdPrice,
    xtzEurPrice,
    onRefresh,
    onRemove,
}: {
    wallet: Wallet;
    xtzUsdPrice?: number | null;
    xtzEurPrice?: number | null;
    onRefresh?: (id: string) => Promise<void>;
    onRemove?: (id: string) => void;
}) {
    const getStatusColor = (wallet: Wallet) => {
        if (wallet.type === "tezos") {
            switch (wallet.status) {
                case "delegated":
                    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
                case "staked":
                    return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
                case "undelegated":
                    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
                default:
                    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
            }
        }
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    };

    const formatBalanceWithCurrency = (amount: number): { primary: JSX.Element; secondary: string } => {
        const amountStr = (
            <span className="flex items-center gap-1">
                {(amount / 1_000_000).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
                <TezosLogo size={14} variant="static" filled={true} className="text-current" />
            </span>
        );

        if (!xtzUsdPrice && !xtzEurPrice) {
            return { primary: amountStr, secondary: "" };
        }

        const parts: string[] = [];
        if (xtzUsdPrice) {
            const usdValue = (amount / 1_000_000) * xtzUsdPrice;
            parts.push(`$${usdValue.toFixed(2)}`);
        }
        if (xtzEurPrice) {
            const eurValue = (amount / 1_000_000) * xtzEurPrice;
            parts.push(`€${eurValue.toFixed(2)}`);
        }

        return {
            primary: amountStr,
            secondary: parts.length > 0 ? `(${parts.join(" / ")})` : "",
        };
    };

    return (
        <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Wallet Info */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold">{wallet.label}</div>
                            <Badge className={getStatusColor(wallet)}>
                                {wallet.type === "tezos" ? wallet.status : "active"}
                            </Badge>
                        </div>
                        {wallet.type === "tezos" && wallet.tezDomain && (
                            <div className="text-xs text-muted-foreground">{wallet.tezDomain}</div>
                        )}
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground font-mono">
                                {formatAddress(wallet.address)}
                            </span>
                            <CopyButton text={wallet.address} size="sm" className="h-3 w-3 p-0" />
                        </div>
                    </div>

                    {/* Baker Info */}
                    <div>
                        {wallet.type === "tezos" && wallet.delegationDetails ? (
                            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                {wallet.delegationDetails.bakerName || wallet.delegationDetails.baker.slice(0, 10)}
                            </div>
                        ) : wallet.type === "tezos" && wallet.delegatedTo ? (
                            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                {wallet.delegatedTo.slice(0, 10)}
                            </div>
                        ) : wallet.type === "tezos" ? (
                            <span className="text-sm text-orange-600 font-medium">Not delegated</span>
                        ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                        )}
                    </div>

                    {/* Balance Info */}
                    <div className="text-right">
                        <div className="font-semibold">{formatBalanceWithCurrency(wallet.balance).primary}</div>
                        {formatBalanceWithCurrency(wallet.balance).secondary && (
                            <div className="text-xs text-muted-foreground">
                                {formatBalanceWithCurrency(wallet.balance).secondary}
                            </div>
                        )}
                        {wallet.type === "tezos" && (
                            <div className="text-xs space-y-1 mt-1">
                                <div className="flex justify-between">
                                    <span className="text-green-600">Spendable:</span>
                                    <span>{formatBalanceWithCurrency(wallet.spendableBalance || 0).primary}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-600">Staked:</span>
                                    <span>{formatBalanceWithCurrency(wallet.stakedBalance || 0).primary}</span>
                                </div>
                                {(wallet.unstakedBalance || 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-orange-600">Unstaking:</span>
                                        <span>{formatBalanceWithCurrency(wallet.unstakedBalance || 0).primary}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                        {onRefresh && (
                            <Button size="sm" variant="outline" onClick={() => onRefresh(wallet.id)}>
                                <RefreshCw className="h-3 w-3" />
                            </Button>
                        )}
                        {onRemove && (
                            <Button size="sm" variant="destructive" onClick={() => onRemove(wallet.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

export function VirtualizedWalletList({ wallets, xtzUsdPrice, xtzEurPrice }: VirtualizedWalletListProps) {
    const { refreshWallet, removeWallet } = useWallets();
    const parentRef = useRef<HTMLDivElement>(null);

    // Only virtualize if we have more than 10 wallets
    const shouldVirtualize = wallets.length > 10;

    const virtualizer = useVirtualizer({
        count: wallets.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 160, // Estimated height per wallet row
        enabled: shouldVirtualize,
    });

    if (!shouldVirtualize) {
        // For small lists, just render normally
        return (
            <div className="space-y-4">
                {wallets.map((wallet) => (
                    <WalletRow
                        key={wallet.id}
                        wallet={wallet}
                        xtzUsdPrice={xtzUsdPrice}
                        xtzEurPrice={xtzEurPrice}
                        onRefresh={refreshWallet}
                        onRemove={removeWallet}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            ref={parentRef}
            className="h-[600px] overflow-auto"
            style={{
                contain: "strict",
            }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                        }}
                    >
                        <div className="p-2">
                            <WalletRow
                                wallet={wallets[virtualItem.index]}
                                xtzUsdPrice={xtzUsdPrice}
                                xtzEurPrice={xtzEurPrice}
                                onRefresh={refreshWallet}
                                onRemove={removeWallet}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
