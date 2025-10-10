"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Copy, Trash2, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import type { Wallet, TezosWallet } from "@/lib/types";
import { formatCurrency, formatAddress } from "@/lib/utils";
import { TezosLogo } from "@/components/tezos-logo";
import { WalletIcon } from "@/components/WalletIcon";
import { useWallets } from "@/hooks/use-wallets";

interface WalletManagementCardsProps {
    wallets: Wallet[];
}

export function WalletManagementCards({ wallets }: WalletManagementCardsProps) {
    const { removeWallet, updateWalletLabel } = useWallets();
    const [isVisible, setIsVisible] = useState(false);
    const [editingWallet, setEditingWallet] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");

    const handleCopyAddress = async (address: string) => {
        try {
            await navigator.clipboard.writeText(address);
            // Could add toast notification here if needed
        } catch {
            // Could add error notification here if needed
        }
    };

    const handleStartEdit = (wallet: Wallet) => {
        setEditingWallet(wallet.id);
        setEditLabel(wallet.label);
    };

    const handleSaveEdit = async (walletId: string) => {
        if (editLabel.trim()) {
            await updateWalletLabel(walletId, editLabel.trim());
            setEditingWallet(null);
            setEditLabel("");
        }
    };

    const handleCancelEdit = () => {
        setEditingWallet(null);
        setEditLabel("");
    };

    const getStatusColor = (wallet: Wallet) => {
        if (wallet.type === "tezos") {
            const tezosWallet = wallet as TezosWallet;
            switch (tezosWallet.status) {
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

    const getBalanceColorClass = (type: "spendable" | "staked" | "unstaked") => {
        switch (type) {
            case "spendable":
                return "text-green-600 dark:text-green-400";
            case "staked":
                return "text-blue-600 dark:text-blue-400";
            case "unstaked":
                return "text-orange-600 dark:text-orange-400";
        }
    };

    if (wallets.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Wallet Management</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsVisible(!isVisible)}
                    className="flex items-center gap-2"
                >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {isVisible ? "Hide Cards" : "Show Cards"}
                    {isVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {isVisible && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wallets.map((wallet) => (
                        <Card key={wallet.id} className="hover:shadow-lg transition-shadow duration-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {wallet.type === "tezos" ? (
                                            <TezosLogo className="h-6 w-6" />
                                        ) : (
                                            <WalletIcon className="h-6 w-6" />
                                        )}
                                        {editingWallet === wallet.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editLabel}
                                                    onChange={(e) => setEditLabel(e.target.value)}
                                                    className="text-sm font-semibold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleSaveEdit(wallet.id);
                                                        if (e.key === "Escape") handleCancelEdit();
                                                    }}
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleSaveEdit(wallet.id)}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    ✓
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleCancelEdit}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    ✕
                                                </Button>
                                            </div>
                                        ) : (
                                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                                {(wallet.type === "tezos" && (wallet as TezosWallet).tezDomain) ||
                                                    wallet.label}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleStartEdit(wallet)}
                                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                </Button>
                                            </CardTitle>
                                        )}
                                    </div>
                                    <Badge className={getStatusColor(wallet)}>
                                        {wallet.type === "tezos" ? (wallet as TezosWallet).status : "active"}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Address */}
                                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                                        {formatAddress(wallet.address)}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleCopyAddress(wallet.address)}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>

                                {/* Baker Info for Tezos wallets */}
                                {wallet.type === "tezos" && (wallet as TezosWallet).delegationDetails && (
                                    <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                            Baker
                                        </span>
                                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                            {(wallet as TezosWallet).delegationDetails.bakerName ||
                                                (wallet as TezosWallet).delegationDetails.baker.slice(0, 10)}
                                        </span>
                                    </div>
                                )}

                                {/* Balance Breakdown */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Total Balance</span>
                                        <div className="text-right">
                                            <div className="font-semibold">
                                                {(() => {
                                                    const formatted = formatCurrency(
                                                        wallet.balance,
                                                        wallet.type === "tezos" ? "XTZ" : "ETH"
                                                    );
                                                    return wallet.type === "tezos" ? (
                                                        <span className="flex items-center gap-1">
                                                            {formatted.amount}
                                                            <TezosLogo
                                                                size={14}
                                                                variant="static"
                                                                filled={true}
                                                                className="text-current"
                                                            />
                                                        </span>
                                                    ) : (
                                                        `${formatted.amount} ${formatted.currency}`
                                                    );
                                                })()}
                                            </div>
                                            {wallet.usdValue && wallet.eurValue && (
                                                <div className="text-xs text-gray-500">
                                                    (${wallet.usdValue.toFixed(2)} / €{wallet.eurValue.toFixed(2)})
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {wallet.type === "tezos" && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm ${getBalanceColorClass("spendable")}`}>
                                                    Spendable
                                                </span>
                                                <span
                                                    className={`font-medium ${getBalanceColorClass(
                                                        "spendable"
                                                    )} flex items-center gap-1`}
                                                >
                                                    {(() => {
                                                        const formatted = formatCurrency(
                                                            (wallet as TezosWallet).spendableBalance || 0,
                                                            "XTZ"
                                                        );
                                                        return (
                                                            <>
                                                                {formatted.amount}
                                                                <TezosLogo
                                                                    size={14}
                                                                    variant="static"
                                                                    filled={true}
                                                                    className="text-current"
                                                                />
                                                            </>
                                                        );
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm ${getBalanceColorClass("staked")}`}>
                                                    Staked
                                                </span>
                                                <span
                                                    className={`font-medium ${getBalanceColorClass(
                                                        "staked"
                                                    )} flex items-center gap-1`}
                                                >
                                                    {
                                                        formatCurrency(
                                                            (wallet as TezosWallet).stakedBalance || 0,
                                                            "XTZ"
                                                        ).amount
                                                    }
                                                    <TezosLogo
                                                        size={12}
                                                        variant="static"
                                                        filled={true}
                                                        className="text-current"
                                                    />
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm ${getBalanceColorClass("unstaked")}`}>
                                                    Unstaking
                                                </span>
                                                <span
                                                    className={`font-medium ${getBalanceColorClass(
                                                        "unstaked"
                                                    )} flex items-center gap-1`}
                                                >
                                                    {
                                                        formatCurrency(
                                                            (wallet as TezosWallet).unstakedBalance || 0,
                                                            "XTZ"
                                                        ).amount
                                                    }
                                                    <TezosLogo
                                                        size={12}
                                                        variant="static"
                                                        filled={true}
                                                        className="text-current"
                                                    />
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end pt-2 border-t">
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => removeWallet(wallet.id)}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
