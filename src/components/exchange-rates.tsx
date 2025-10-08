"use client";

import type { PortfolioStats } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface ExchangeRatesProps {
    stats: PortfolioStats;
}

export function ExchangeRates({ stats }: ExchangeRatesProps) {
    const { xtzUsdPrice, xtzEurPrice, ethUsdPrice, ethEurPrice, lastUpdated } = stats;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
        });
    };

    if (!xtzUsdPrice && !xtzEurPrice && !ethUsdPrice && !ethEurPrice) {
        return null;
    }

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Exchange Rates
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {(xtzUsdPrice || xtzEurPrice) && (
                        <div>
                            <div className="text-sm font-medium mb-2">Tezos (XTZ)</div>
                            <div className="flex flex-wrap gap-4 text-sm">
                                {xtzUsdPrice && xtzEurPrice && (
                                    <div className="text-muted-foreground">
                                        1 ꜩ = ${xtzUsdPrice.toFixed(4)} • €{xtzEurPrice.toFixed(4)}
                                    </div>
                                )}
                                {xtzUsdPrice && (
                                    <div className="text-muted-foreground">
                                        1 USD = {(1 / xtzUsdPrice).toFixed(4)} ꜩ
                                    </div>
                                )}
                                {xtzEurPrice && (
                                    <div className="text-muted-foreground">
                                        1 EUR = {(1 / xtzEurPrice).toFixed(4)} ꜩ
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(ethUsdPrice || ethEurPrice) && (
                        <div>
                            <div className="text-sm font-medium mb-2">Etherlink (ETH)</div>
                            <div className="flex flex-wrap gap-4 text-sm">
                                {ethUsdPrice && ethEurPrice && (
                                    <div className="text-muted-foreground">
                                        1 ETH = ${ethUsdPrice.toFixed(2)} • €{ethEurPrice.toFixed(2)}
                                    </div>
                                )}
                                {ethUsdPrice && (
                                    <div className="text-muted-foreground">
                                        1 USD = {(1 / ethUsdPrice).toFixed(6)} ETH
                                    </div>
                                )}
                                {ethEurPrice && (
                                    <div className="text-muted-foreground">
                                        1 EUR = {(1 / ethEurPrice).toFixed(6)} ETH
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                        Updated: {formatDate(lastUpdated)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
