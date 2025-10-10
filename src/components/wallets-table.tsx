"use client";

import type { Wallet } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Wallet as WalletIcon,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Eye,
    Pencil,
    RefreshCw,
    Trash2,
    Check,
    X,
    ExternalLink,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { TezosWalletDetails } from "./tezos-wallet-details";
import { EtherlinkWalletDetails } from "./etherlink-wallet-details";
import { useWallets } from "@/hooks/use-wallets";
import { TezosLogo } from "@/components/tezos-logo";
import { Etherlink } from "@/components/etherlink-logo";

interface WalletsTableProps {
    wallets: Wallet[];
    xtzUsdPrice?: number | null;
    xtzEurPrice?: number | null;
}

type SortField = "name" | "type" | "balance" | "spendable" | "staked" | "unstaking" | "baker";
type SortDirection = "asc" | "desc" | null;

function formatCurrency(
    amount: number,
    usdPrice?: number | null,
    eurPrice?: number | null
): { primary: JSX.Element; secondary: string } {
    const amountStr = (
        <span className="flex items-center gap-1">
            {amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <TezosLogo size={14} variant="static" filled={true} className="text-current" />
        </span>
    );

    if (!usdPrice && !eurPrice) {
        return { primary: amountStr, secondary: "" };
    }

    const parts: string[] = [];
    if (usdPrice) {
        const usd = amount * usdPrice;
        parts.push(`$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }
    if (eurPrice) {
        const eur = amount * eurPrice;
        parts.push(`${eur.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);
    }

    return {
        primary: amountStr,
        secondary: `(${parts.join(" / ")})`,
    };
}

export function WalletsTable({ wallets, xtzUsdPrice, xtzEurPrice }: WalletsTableProps) {
    const { refreshWallet, removeWallet, updateWalletLabel } = useWallets();
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [refreshingId, setRefreshingId] = useState<string | null>(null);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Cycle through: asc -> desc -> null
            if (sortDirection === "asc") {
                setSortDirection("desc");
            } else if (sortDirection === "desc") {
                setSortDirection(null);
                setSortField(null);
            }
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedWallets = useMemo(() => {
        if (!sortField || !sortDirection) return wallets;

        return [...wallets].sort((a, b) => {
            let aVal: string | number;
            let bVal: string | number;

            switch (sortField) {
                case "name":
                    aVal = a.label.toLowerCase();
                    bVal = b.label.toLowerCase();
                    break;
                case "type":
                    aVal = a.type;
                    bVal = b.type;
                    break;
                case "balance":
                    aVal = a.balance;
                    bVal = b.balance;
                    break;
                case "spendable":
                    aVal = a.type === "tezos" ? a.spendableBalance : a.balance;
                    bVal = b.type === "tezos" ? b.spendableBalance : b.balance;
                    break;
                case "staked":
                    aVal = a.type === "tezos" ? a.stakedBalance : 0;
                    bVal = b.type === "tezos" ? b.stakedBalance : 0;
                    break;
                case "unstaking":
                    aVal = a.type === "tezos" ? a.unstakedBalance : 0;
                    bVal = b.type === "tezos" ? b.unstakedBalance : 0;
                    break;
                case "baker":
                    aVal = a.type === "tezos" ? a.delegationDetails?.bakerName || a.delegatedTo || "" : "";
                    bVal = b.type === "tezos" ? b.delegationDetails?.bakerName || b.delegatedTo || "" : "";
                    break;
                default:
                    return 0;
            }

            if (typeof aVal === "string" && typeof bVal === "string") {
                return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            } else {
                return sortDirection === "asc"
                    ? (aVal as number) - (bVal as number)
                    : (bVal as number) - (aVal as number);
            }
        });
    }, [wallets, sortField, sortDirection]);

    const hasTezosWallets = wallets.some((w) => w.type === "tezos");

    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
        const isActive = sortField === field;
        const icon = isActive ? (
            sortDirection === "asc" ? (
                <ArrowUp className="h-3 w-3 ml-1" />
            ) : (
                <ArrowDown className="h-3 w-3 ml-1" />
            )
        ) : (
            <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
        );

        return (
            <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3 font-bold hover:bg-muted/50 hover:text-primary transition-all duration-200"
                onClick={() => handleSort(field)}
            >
                {children}
                {icon}
            </Button>
        );
    };

    if (wallets.length === 0) {
        return null;
    }

    return (
        <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {sortedWallets.map((wallet) => {
                    const isEditing = editingId === wallet.id;
                    const isRefreshing = refreshingId === wallet.id;

                    const handleEdit = () => {
                        setEditingId(wallet.id);
                        setEditLabel(wallet.label);
                    };

                    const handleSave = () => {
                        if (editLabel.trim()) {
                            updateWalletLabel(wallet.id, editLabel.trim());
                        }
                        setEditingId(null);
                    };

                    const handleCancel = () => {
                        setEditingId(null);
                        setEditLabel("");
                    };

                    const handleRefresh = async () => {
                        try {
                            setRefreshingId(wallet.id);
                            await refreshWallet(wallet.id);
                            setRefreshingId(null);
                        } catch {
                            setRefreshingId(null);
                        }
                    };

                    const explorerUrl =
                        wallet.type === "tezos"
                            ? `https://tzkt.io/${wallet.address}`
                            : `https://explorer.etherlink.com/address/${wallet.address}`;

                    const totalTokens = wallet.tokens ? wallet.tokens.length : 0;

                    return (
                        <Card
                            key={wallet.id}
                            className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/70 hover:border-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
                        >
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                                <div className="space-y-1 flex-1">
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={editLabel}
                                                onChange={(e) => setEditLabel(e.target.value)}
                                                className="h-8 text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSave();
                                                    if (e.key === "Escape") handleCancel();
                                                }}
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg font-bold">{wallet.label}</CardTitle>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {wallet.type === "tezos" && wallet.tezDomain ? (
                                            <span className="text-xs text-muted-foreground">{wallet.tezDomain}</span>
                                        ) : (
                                            <code className="text-xs text-muted-foreground">
                                                {wallet.address.slice(0, 6)}...{wallet.address.slice(-6)}
                                            </code>
                                        )}
                                        <CopyButton text={wallet.address} size="sm" className="h-4 w-4 p-0" />
                                        <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </a>
                                    </div>
                                    {wallet.type === "tezos" && wallet.delegationDetails && (
                                        <div className="text-xs">
                                            <span className="text-muted-foreground">Baker: </span>
                                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                {wallet.delegationDetails.bakerName ||
                                                    wallet.delegationDetails.baker.slice(0, 10)}
                                            </span>
                                        </div>
                                    )}
                                    {wallet.type === "tezos" && wallet.status === "undelegated" && (
                                        <div className="text-xs">
                                            <span className="text-orange-600 font-medium">Not delegated</span>
                                        </div>
                                    )}
                                </div>
                                <Badge variant={wallet.type === "tezos" ? "default" : "secondary"}>
                                    {wallet.type === "tezos" ? "Tezos" : "Etherlink"}
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-3xl font-bold text-foreground">
                                        <span className="flex items-center gap-1">
                                            {wallet.balance.toFixed(2)}
                                            {wallet.type === "tezos" ? (
                                                <TezosLogo
                                                    size={14}
                                                    variant="static"
                                                    filled={true}
                                                    className="text-current"
                                                />
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
                                                <span className="font-medium text-emerald-600">
                                                    <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                                                        {wallet.spendableBalance.toFixed(2)}
                                                        <TezosLogo
                                                            size={12}
                                                            variant="static"
                                                            filled={true}
                                                            className="text-current"
                                                        />
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Staked:</span>
                                                <span className="font-medium text-purple-600">
                                                    <span className="flex items-center gap-1">
                                                        {wallet.stakedBalance.toFixed(2)}
                                                        <TezosLogo
                                                            size={14}
                                                            variant="static"
                                                            filled={true}
                                                            className="text-current"
                                                        />
                                                    </span>
                                                </span>
                                            </div>
                                            {wallet.unstakedBalance > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Unstaking:</span>
                                                    <span className="font-medium text-orange-600">
                                                        <span className="flex items-center gap-1">
                                                            {wallet.unstakedBalance.toFixed(2)}
                                                            <TezosLogo
                                                                size={14}
                                                                variant="static"
                                                                filled={true}
                                                                className="text-current"
                                                            />
                                                        </span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {wallet.type === "tezos" && (
                                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                                            <Badge
                                                variant={
                                                    wallet.status === "staked"
                                                        ? "default"
                                                        : wallet.status === "delegated"
                                                        ? "secondary"
                                                        : "outline"
                                                }
                                                className={`text-xs ${
                                                    wallet.status === "staked"
                                                        ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                                        : wallet.status === "delegated"
                                                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                                        : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                                                }`}
                                            >
                                                {wallet.status}
                                            </Badge>
                                            {totalTokens > 0 && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                >
                                                    {totalTokens} token{totalTokens !== 1 ? "s" : ""}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 bg-transparent hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                                            >
                                                <Eye className="h-3 w-3 mr-1" />
                                                View
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>{wallet.label}</DialogTitle>
                                            </DialogHeader>
                                            {wallet.type === "tezos" ? (
                                                <TezosWalletDetails wallet={wallet} />
                                            ) : (
                                                <EtherlinkWalletDetails wallet={wallet} />
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                    {isEditing ? (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleSave}
                                                className="hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-200"
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleCancel}
                                                className="hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button size="sm" variant="outline" onClick={handleEdit}>
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleRefresh}
                                                disabled={isRefreshing}
                                                className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                                            >
                                                <RefreshCw
                                                    className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
                                                />
                                                {isRefreshing && <span className="ml-1 text-xs">Updating...</span>}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => removeWallet(wallet.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Desktop Table View */}
            <Card className="bg-card/50 backdrop-blur border-border/50 hidden md:block">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <WalletIcon className="h-5 w-5" />
                        Wallets Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <SortButton field="name">Name</SortButton>
                                    </TableHead>
                                    <TableHead>
                                        <SortButton field="type">Type</SortButton>
                                    </TableHead>
                                    {hasTezosWallets && (
                                        <TableHead>
                                            <SortButton field="baker">Baker</SortButton>
                                        </TableHead>
                                    )}
                                    <TableHead className="text-right">
                                        <SortButton field="balance">Total Balance</SortButton>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <SortButton field="spendable">Spendable</SortButton>
                                    </TableHead>
                                    {hasTezosWallets && (
                                        <>
                                            <TableHead className="text-right">
                                                <SortButton field="staked">Staked</SortButton>
                                            </TableHead>
                                            <TableHead className="text-right">
                                                <SortButton field="unstaking">Unstaking</SortButton>
                                            </TableHead>
                                        </>
                                    )}
                                    <TableHead className="w-40">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedWallets.map((wallet) => {
                                    const spendable =
                                        wallet.type === "tezos" ? wallet.spendableBalance : wallet.balance;
                                    const staked = wallet.type === "tezos" ? wallet.stakedBalance : 0;
                                    const unstaking = wallet.type === "tezos" ? wallet.unstakedBalance : 0;
                                    const isEditing = editingId === wallet.id;
                                    const isRefreshing = refreshingId === wallet.id;

                                    const handleEdit = () => {
                                        setEditingId(wallet.id);
                                        setEditLabel(wallet.label);
                                    };

                                    const handleSave = () => {
                                        if (editLabel.trim()) {
                                            updateWalletLabel(wallet.id, editLabel.trim());
                                        }
                                        setEditingId(null);
                                    };

                                    const handleCancel = () => {
                                        setEditingId(null);
                                        setEditLabel("");
                                    };

                                    const handleRefresh = async () => {
                                        try {
                                            setRefreshingId(wallet.id);
                                            await refreshWallet(wallet.id);
                                            setRefreshingId(null);
                                        } catch {
                                            setRefreshingId(null);
                                        }
                                    };

                                    return (
                                        <TableRow
                                            key={wallet.id}
                                            className="hover:bg-muted/30 transition-colors duration-200"
                                        >
                                            <TableCell className="font-medium">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            value={editLabel}
                                                            onChange={(e) => setEditLabel(e.target.value)}
                                                            className="h-8 text-sm"
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleSave();
                                                                if (e.key === "Escape") handleCancel();
                                                            }}
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="font-semibold text-base">{wallet.label}</div>
                                                        {wallet.type === "tezos" && wallet.tezDomain && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {wallet.tezDomain}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <div className="text-xs text-muted-foreground font-mono">
                                                                {wallet.address.slice(0, 6)}...
                                                                {wallet.address.slice(-6)}
                                                            </div>
                                                            <CopyButton
                                                                text={wallet.address}
                                                                size="sm"
                                                                className="h-3 w-3 p-0"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center">
                                                    {wallet.type === "tezos" ? (
                                                        <TezosLogo
                                                            size={20}
                                                            variant="static"
                                                            filled={true}
                                                            className="text-blue-600 dark:text-blue-400"
                                                        />
                                                    ) : (
                                                        <Etherlink className="h-8 w-8" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            {hasTezosWallets && (
                                                <TableCell>
                                                    {wallet.type === "tezos" && wallet.delegationDetails ? (
                                                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                            {wallet.delegationDetails.bakerName ||
                                                                wallet.delegationDetails.baker.slice(0, 10)}
                                                        </div>
                                                    ) : wallet.type === "tezos" && wallet.delegatedTo ? (
                                                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                            {wallet.delegatedTo.slice(0, 10)}
                                                        </div>
                                                    ) : wallet.type === "tezos" ? (
                                                        <span className="text-sm text-orange-600 font-medium">
                                                            Not delegated
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                            )}
                                            <TableCell className="text-right">
                                                <div className="text-sm font-medium flex items-center justify-end gap-1">
                                                    {formatCurrency(wallet.balance, xtzUsdPrice, xtzEurPrice).primary}
                                                </div>
                                                {formatCurrency(wallet.balance, xtzUsdPrice, xtzEurPrice).secondary && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {
                                                            formatCurrency(wallet.balance, xtzUsdPrice, xtzEurPrice)
                                                                .secondary
                                                        }
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="text-sm text-emerald-600 font-medium flex items-center justify-center">
                                                    {formatCurrency(spendable, xtzUsdPrice, xtzEurPrice).primary}
                                                </div>
                                                {formatCurrency(spendable, xtzUsdPrice, xtzEurPrice).secondary && (
                                                    <div className="text-xs text-muted-foreground text-center">
                                                        {formatCurrency(spendable, xtzUsdPrice, xtzEurPrice).secondary}
                                                    </div>
                                                )}
                                            </TableCell>
                                            {hasTezosWallets && (
                                                <>
                                                    <TableCell className="text-center">
                                                        <div className="text-sm text-purple-600 font-medium flex items-center justify-center">
                                                            {formatCurrency(staked, xtzUsdPrice, xtzEurPrice).primary}
                                                        </div>
                                                        {formatCurrency(staked, xtzUsdPrice, xtzEurPrice).secondary && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {
                                                                    formatCurrency(staked, xtzUsdPrice, xtzEurPrice)
                                                                        .secondary
                                                                }
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="text-sm text-orange-600 font-medium flex items-center justify-center">
                                                            {
                                                                formatCurrency(unstaking, xtzUsdPrice, xtzEurPrice)
                                                                    .primary
                                                            }
                                                        </div>
                                                        {formatCurrency(unstaking, xtzUsdPrice, xtzEurPrice)
                                                            .secondary && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {
                                                                    formatCurrency(unstaking, xtzUsdPrice, xtzEurPrice)
                                                                        .secondary
                                                                }
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-11 w-11 hover:bg-primary/10 transition-all duration-200"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>{wallet.label}</DialogTitle>
                                                            </DialogHeader>
                                                            {wallet.type === "tezos" ? (
                                                                <TezosWalletDetails wallet={wallet} />
                                                            ) : (
                                                                <EtherlinkWalletDetails wallet={wallet} />
                                                            )}
                                                        </DialogContent>
                                                    </Dialog>
                                                    {isEditing ? (
                                                        <>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-11 w-11"
                                                                onClick={handleSave}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-11 w-11"
                                                                onClick={handleCancel}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-11 w-11"
                                                                onClick={handleEdit}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-11 w-11"
                                                                onClick={handleRefresh}
                                                                disabled={isRefreshing}
                                                            >
                                                                <RefreshCw
                                                                    className={`h-4 w-4 ${
                                                                        isRefreshing ? "animate-spin" : ""
                                                                    }`}
                                                                />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-11 w-11"
                                                                onClick={() => removeWallet(wallet.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
