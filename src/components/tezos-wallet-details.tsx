"use client";

import type { TezosWallet, WalletRewards } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Coins, TrendingUp, Users, Award } from "lucide-react";
import { BalanceHistoryChart } from "./balance-history-chart";
import { TezosBalanceBreakdownChart } from "./tezos-balance-breakdown";
import { fetchWalletRewards } from "@/lib/blockchain/tezos";
import { useState, useEffect } from "react";

interface TezosWalletDetailsProps {
    wallet: TezosWallet;
}

export function TezosWalletDetails({ wallet }: TezosWalletDetailsProps) {
    const { delegationDetails, tokens } = wallet;
    const [rewards, setRewards] = useState<WalletRewards | null>(null);
    const [loadingRewards, setLoadingRewards] = useState(true);

    useEffect(() => {
        const loadRewards = async () => {
            setLoadingRewards(true);
            const data = await fetchWalletRewards(wallet.address);
            setRewards(data);
            setLoadingRewards(false);
        };

        loadRewards();
    }, [wallet.address]);

    return (
        <div className="space-y-4">
            <BalanceHistoryChart wallet={wallet} />
            <TezosBalanceBreakdownChart wallet={wallet} />

            {/* Rewards */}
            {!loadingRewards && rewards && delegationDetails && (
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Baker Stats - Cycle {rewards.cycle}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total rewards for {delegationDetails.bakerName || "baker"}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Staking Rewards</div>
                                <div className="text-lg font-semibold text-green-500">
                                    {rewards.stakingRewards.toFixed(6)} ꜩ
                                </div>
                                <div className="text-xs text-muted-foreground">Baker's staked balance</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Delegating Rewards</div>
                                <div className="text-lg font-semibold text-blue-500">
                                    {rewards.delegatingRewards.toFixed(6)} ꜩ
                                </div>
                                <div className="text-xs text-muted-foreground">All delegators combined</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Total Earned</div>
                                <div className="text-lg font-bold">{rewards.totalRewards.toFixed(6)} ꜩ</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Next Cycle (Est.)</div>
                                <div className="text-lg font-semibold text-purple-500">
                                    {rewards.futureRewards.toFixed(6)} ꜩ
                                </div>
                            </div>
                        </div>

                        {rewards.bakingPower > 0 && (
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Total Baking Power</div>
                                <div className="text-base font-medium">{rewards.bakingPower.toLocaleString()} ꜩ</div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Delegation Details */}
            {delegationDetails && (
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Delegation Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Baker</div>
                            <div className="font-medium">{delegationDetails.bakerName}</div>
                            <code className="text-xs text-muted-foreground">{delegationDetails.baker}</code>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Fee</div>
                                <div className="text-lg font-semibold">{(delegationDetails.fee * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Est. ROI</div>
                                <div className="text-lg font-semibold text-green-500">
                                    {(delegationDetails.estimatedRoi * 100).toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-muted-foreground mb-2">Staking Capacity</div>
                            <Progress
                                value={(delegationDetails.stakingBalance / delegationDetails.stakingCapacity) * 100}
                                className="h-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>{delegationDetails.stakingBalance.toLocaleString()} XTZ</span>
                                <span>{delegationDetails.stakingCapacity.toLocaleString()} XTZ</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}{" "}
            {/* Token Balances */}
            {tokens && tokens.length > 0 && (
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Coins className="h-4 w-4" />
                            Token Balances ({tokens.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tokens.map((token, idx) => (
                                <div
                                    key={`${token.contractAddress}-${token.tokenId || idx}`}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        {token.thumbnailUri && token.thumbnailUri.startsWith("ipfs://") ? (
                                            <img
                                                src={token.thumbnailUri.replace("ipfs://", "https://ipfs.io/ipfs/")}
                                                alt={token.symbol}
                                                className="h-8 w-8 rounded-full"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center ${
                                                token.thumbnailUri && token.thumbnailUri.startsWith("ipfs://")
                                                    ? "hidden"
                                                    : ""
                                            }`}
                                        >
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
            {/* Staking Info */}
            {wallet.status === "staked" && wallet.stakedAmount && wallet.stakedAmount > 0 && (
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Staking
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Staked Amount</span>
                                <span className="font-semibold">{wallet.stakedAmount.toFixed(2)} XTZ</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Percentage</span>
                                <span className="font-semibold">
                                    {((wallet.stakedAmount / wallet.balance) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
