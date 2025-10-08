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
import { TezosWalletDetails } from "./tezos-wallet-details";
import { EtherlinkWalletDetails } from "./etherlink-wallet-details";

interface WalletsTableProps {
    wallets: Wallet[];
    xtzUsdPrice?: number | null;
    xtzEurPrice?: number | null;
    onRefresh?: (id: string) => Promise<void>;
    onRemove?: (id: string) => void;
    onUpdateLabel?: (id: string, label: string) => void;
}

type SortField = "name" | "type" | "balance" | "spendable" | "staked" | "unstaking" | "baker";
type SortDirection = "asc" | "desc" | null;

function formatMultiCurrency(
    amount: number,
    usdPrice?: number | null,
    eurPrice?: number | null
): { primary: string; secondary: string } {
    const amountStr = `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${
        amount === 0 ? "XTZ" : "ꜩ"
    }`;

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
        secondary: parts.join(" / "),
    };
}

export function WalletsTable({
    wallets,
    xtzUsdPrice,
    xtzEurPrice,
    onRefresh,
    onRemove,
    onUpdateLabel,
}: WalletsTableProps) {
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
                className="h-8 -ml-3 font-semibold hover:bg-muted/50"
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
                        if (onUpdateLabel && editLabel.trim()) {
                            onUpdateLabel(wallet.id, editLabel.trim());
                        }
                        setEditingId(null);
                    };

                    const handleCancel = () => {
                        setEditingId(null);
                        setEditLabel("");
                    };

                    const handleRefresh = async () => {
                        if (onRefresh) {
                            setRefreshingId(wallet.id);
                            await onRefresh(wallet.id);
                            setRefreshingId(null);
                        }
                    };

                    const explorerUrl =
                        wallet.type === "tezos"
                            ? `https://tzkt.io/${wallet.address}`
                            : `https://explorer.etherlink.com/address/${wallet.address}`;

                    const totalTokens = wallet.tokens ? wallet.tokens.length : 0;

                    return (
                        <Card key={wallet.id} className="bg-card/50 backdrop-blur border-border/50">
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
                                            <CardTitle className="text-base font-medium">{wallet.label}</CardTitle>
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
                                            Baker:{" "}
                                            {wallet.delegationDetails.bakerName ||
                                                wallet.delegationDetails.baker.slice(0, 10)}
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
                                        {wallet.balance.toFixed(2)} {wallet.type === "tezos" ? "ꜩ" : "XTZ"}
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
                                                <span className="font-medium">
                                                    {wallet.spendableBalance.toFixed(2)} ꜩ
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Staked:</span>
                                                <span className="font-medium">{wallet.stakedBalance.toFixed(2)} ꜩ</span>
                                            </div>
                                            {wallet.unstakedBalance > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Unstaking:</span>
                                                    <span className="font-medium">
                                                        {wallet.unstakedBalance.toFixed(2)} ꜩ
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
                                                className="text-xs"
                                            >
                                                {wallet.status}
                                            </Badge>
                                            {totalTokens > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {totalTokens} token{totalTokens !== 1 ? "s" : ""}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
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
                                            <Button size="sm" variant="outline" onClick={handleSave}>
                                                <Check className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={handleCancel}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            {onUpdateLabel && (
                                                <Button size="sm" variant="outline" onClick={handleEdit}>
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            )}
                                            {onRefresh && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleRefresh}
                                                    disabled={isRefreshing}
                                                >
                                                    <RefreshCw
                                                        className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
                                                    />
                                                </Button>
                                            )}
                                            {onRemove && (
                                                <Button size="sm" variant="outline" onClick={() => onRemove(wallet.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
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
                    <CardTitle className="flex items-center gap-2">
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
                                    const bakerInfo =
                                        wallet.type === "tezos"
                                            ? wallet.delegationDetails
                                                ? wallet.delegationDetails.bakerName ||
                                                  wallet.delegationDetails.baker.slice(0, 10)
                                                : wallet.status === "undelegated"
                                                ? "Not delegated"
                                                : wallet.delegatedTo || "-"
                                            : "-";

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
                                        if (onUpdateLabel && editLabel.trim()) {
                                            onUpdateLabel(wallet.id, editLabel.trim());
                                        }
                                        setEditingId(null);
                                    };

                                    const handleCancel = () => {
                                        setEditingId(null);
                                        setEditLabel("");
                                    };

                                    const handleRefresh = async () => {
                                        if (onRefresh) {
                                            setRefreshingId(wallet.id);
                                            await onRefresh(wallet.id);
                                            setRefreshingId(null);
                                        }
                                    };

                                    return (
                                        <TableRow key={wallet.id}>
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
                                                        <div>{wallet.label}</div>
                                                        {wallet.type === "tezos" && wallet.tezDomain && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {wallet.tezDomain}
                                                            </div>
                                                        )}
                                                        {wallet.type === "tezos" && (
                                                            <div className="text-xs text-muted-foreground font-mono">
                                                                {wallet.address.slice(0, 10)}...
                                                                {wallet.address.slice(-6)}
                                                            </div>
                                                        )}
                                                        {wallet.type === "etherlink" && (
                                                            <div className="text-xs text-muted-foreground font-mono">
                                                                {wallet.address.slice(0, 10)}...
                                                                {wallet.address.slice(-6)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm capitalize">{wallet.type}</div>
                                            </TableCell>
                                            {hasTezosWallets && (
                                                <TableCell>
                                                    <div className="text-sm">{bakerInfo}</div>
                                                </TableCell>
                                            )}
                                            <TableCell className="text-right">
                                                <div className="text-sm font-medium">
                                                    {
                                                        formatMultiCurrency(wallet.balance, xtzUsdPrice, xtzEurPrice)
                                                            .primary
                                                    }
                                                </div>
                                                {formatMultiCurrency(wallet.balance, xtzUsdPrice, xtzEurPrice)
                                                    .secondary && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {
                                                            formatMultiCurrency(
                                                                wallet.balance,
                                                                xtzUsdPrice,
                                                                xtzEurPrice
                                                            ).secondary
                                                        }
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="text-sm">
                                                    {formatMultiCurrency(spendable, xtzUsdPrice, xtzEurPrice).primary}
                                                </div>
                                                {formatMultiCurrency(spendable, xtzUsdPrice, xtzEurPrice).secondary && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {
                                                            formatMultiCurrency(spendable, xtzUsdPrice, xtzEurPrice)
                                                                .secondary
                                                        }
                                                    </div>
                                                )}
                                            </TableCell>
                                            {hasTezosWallets && (
                                                <>
                                                    <TableCell className="text-right">
                                                        <div className="text-sm">
                                                            {
                                                                formatMultiCurrency(staked, xtzUsdPrice, xtzEurPrice)
                                                                    .primary
                                                            }
                                                        </div>
                                                        {formatMultiCurrency(staked, xtzUsdPrice, xtzEurPrice)
                                                            .secondary && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {
                                                                    formatMultiCurrency(
                                                                        staked,
                                                                        xtzUsdPrice,
                                                                        xtzEurPrice
                                                                    ).secondary
                                                                }
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="text-sm">
                                                            {
                                                                formatMultiCurrency(unstaking, xtzUsdPrice, xtzEurPrice)
                                                                    .primary
                                                            }
                                                        </div>
                                                        {formatMultiCurrency(unstaking, xtzUsdPrice, xtzEurPrice)
                                                            .secondary && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {
                                                                    formatMultiCurrency(
                                                                        unstaking,
                                                                        xtzUsdPrice,
                                                                        xtzEurPrice
                                                                    ).secondary
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
                                                            <Button size="icon" variant="ghost" className="h-11 w-11">
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
                                                            {onUpdateLabel && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-11 w-11"
                                                                    onClick={handleEdit}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {onRefresh && (
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
                                                            )}
                                                            {onRemove && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-11 w-11"
                                                                    onClick={() => onRemove(wallet.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
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
