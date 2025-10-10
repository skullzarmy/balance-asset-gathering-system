"use client";

import React from "react";
import { useWallets } from "@/hooks/use-wallets";
import { usePrefetch } from "@/hooks/use-prefetch";
import { Header } from "@/components/header";
import { AddWalletDialog } from "@/components/add-wallet-dialog";
import { WalletImportExport } from "@/components/wallet-import-export";
import { DashboardOverview } from "@/components/dashboard-overview";
import Footer from "@/components/footer";
import { siteConfig } from "@/lib/site-config";
import { Wallet, Shield } from "lucide-react";
import { WalletCardSkeleton } from "@/components/ui/skeleton";

export default function Home() {
    const { wallets, loading, addWallet, isRefreshingWallet } = useWallets();
    const { prefetchNextLikely } = usePrefetch();

    // Prefetch likely next data when wallets are loaded
    React.useEffect(() => {
        if (wallets.length > 0 && !loading) {
            prefetchNextLikely(wallets);
        }
    }, [wallets, loading, prefetchNextLikely]);

    const handleImportComplete = () => {
        // Trigger a page reload to refresh wallet data
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header onAddWallet={addWallet} onImportComplete={handleImportComplete} walletCount={0} />
                <main className="container mx-auto px-4 py-8">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2].map((id) => (
                            <WalletCardSkeleton key={`skeleton-loading-${id}`} />
                        ))}
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header onAddWallet={addWallet} onImportComplete={handleImportComplete} walletCount={wallets.length} />

            <main className="container mx-auto px-4 py-8">
                {wallets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center max-w-2xl mx-auto">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6">
                            <Wallet className="h-10 w-10 text-primary" />
                        </div>

                        <h2 className="text-3xl font-bold mb-3">Welcome to {siteConfig.name}</h2>

                        <p className="text-xl text-muted-foreground mb-6">{siteConfig.description}</p>

                        <div className="bg-muted/50 rounded-xl p-6 mb-8 text-left max-w-lg">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" />
                                Privacy-First Design
                            </h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>• All data stays on your device</li>
                                <li>• No accounts, no tracking, no servers</li>
                                <li>• Direct blockchain API access only</li>
                                <li>• Export/import for backup control</li>
                            </ul>
                        </div>

                        <div className="flex flex-row items-center gap-3">
                            <AddWalletDialog onAdd={addWallet} />
                            <WalletImportExport onImportComplete={handleImportComplete} walletCount={0} />
                        </div>
                    </div>
                ) : (
                    <DashboardOverview wallets={wallets} isRefreshing={isRefreshingWallet} />
                )}
            </main>
            <Footer />
        </div>
    );
}
