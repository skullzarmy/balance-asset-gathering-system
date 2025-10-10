"use client";

import type { Wallet } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Trash2, ExternalLink, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { usePrefetch } from "@/hooks/use-prefetch";
import { TezosLogo } from "@/components/tezos-logo";

interface WalletCardProps {
    wallet: Wallet;
    onRefresh: (id: string) => Promise<void>;
    onRemove: (id: string) => void;
    onUpdateLabel?: (id: string, label: string) => void;
}

export function WalletCard({ wallet, onRefresh, onRemove, onUpdateLabel }: WalletCardProps) {
    const [refreshing, setRefreshing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editLabel, setEditLabel] = useState(wallet.label);
    const { prefetchOnHover } = usePrefetch();

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh(wallet.id);
        setRefreshing(false);
    };

    const handleSaveLabel = () => {
        if (onUpdateLabel && editLabel.trim()) {
            onUpdateLabel(wallet.id, editLabel.trim());
            setEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditLabel(wallet.label);
        setEditing(false);
    };

    const explorerUrl =
        wallet.type === "tezos"
            ? `https://tzkt.io/${wallet.address}`
            : `https://explorer.etherlink.com/address/${wallet.address}`;

    const totalTokens = wallet.tokens ? wallet.tokens.length : 0;

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50" onMouseEnter={() => prefetchOnHover(wallet)}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1 flex-1">
                    {editing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="h-8 text-sm"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveLabel();
                                    if (e.key === "Escape") handleCancelEdit();
                                }}
                                autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveLabel}>
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-medium">{wallet.label}</CardTitle>
                            {onUpdateLabel && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => setEditing(true)}
                                >
                                    <Pencil className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        {wallet.type === "tezos" && wallet.tezDomain ? (
                            <span className="text-xs text-muted-foreground">{wallet.tezDomain}</span>
                        ) : (
                            <code className="text-xs text-muted-foreground">
                                {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                            </code>
                        )}
                        <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </a>
                    </div>
                    {wallet.type === "tezos" && wallet.delegationDetails && (
                        <div className="text-xs text-muted-foreground">
                            Baker: {wallet.delegationDetails.bakerName || wallet.delegationDetails.baker.slice(0, 10)}
                        </div>
                    )}
                    {wallet.type === "tezos" && wallet.status === "undelegated" && (
                        <div className="text-xs text-muted-foreground">Not delegated</div>
                    )}
                </div>
                <Badge variant={wallet.type === "tezos" ? "default" : "secondary"}>
                    {wallet.type === "tezos" ? "Tezos" : "Etherlink"}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <div className="text-2xl font-bold">
                        <span className="flex items-center gap-1">
                            {wallet.balance.toFixed(2)}
                            {wallet.type === "tezos" ? (
                                <TezosLogo size={14} variant="static" filled={true} className="text-current" />
                            ) : (
                                "XTZ"
                            )}
                        </span>
                    </div>
                    {(wallet.usdValue || wallet.eurValue) && (
                        <div className="text-xs text-muted-foreground mt-1">
                            {wallet.usdValue &&
                                `$${wallet.usdValue.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}`}
                            {wallet.usdValue && wallet.eurValue && " / "}
                            {wallet.eurValue &&
                                `${wallet.eurValue.toLocaleString("de-DE", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })} €`}
                        </div>
                    )}
                    {wallet.type === "tezos" && (
                        <div className="mt-3 space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Spendable:</span>
                                <span className="font-medium flex items-center gap-1">
                                    {wallet.spendableBalance.toFixed(2)}
                                    <TezosLogo size={14} variant="static" filled={true} className="text-current" />
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Staked:</span>
                                <span className="font-medium flex items-center gap-1">
                                    {wallet.stakedBalance.toFixed(2)}
                                    <TezosLogo size={14} variant="static" filled={true} className="text-current" />
                                </span>
                            </div>
                            {wallet.unstakedBalance > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Unstaking:</span>
                                    <span className="font-medium flex items-center gap-1">
                                        {wallet.unstakedBalance.toFixed(2)}
                                        <TezosLogo size={14} variant="static" filled={true} className="text-current" />
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                    {wallet.lastUpdated && (
                        <div className="text-xs text-muted-foreground mt-2">
                            Updated: {new Date(wallet.lastUpdated).toLocaleTimeString()}
                        </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {wallet.type === "tezos" && (
                            <Badge
                                variant={
                                    wallet.status === "staked"
                                        ? "default"
                                        : wallet.status === "delegated"
                                        ? "secondary"
                                        : "outline"
                                }
                                className="text-xs"
                            >
                                {wallet.status}
                            </Badge>
                        )}
                        {totalTokens > 0 && (
                            <Badge variant="outline" className="text-xs">
                                {totalTokens} token{totalTokens !== 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onRemove(wallet.id)}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
