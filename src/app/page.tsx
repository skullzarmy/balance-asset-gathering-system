"use client";

import { useWallets } from "@/hooks/use-wallets";
import { Header } from "@/components/header";
import { AddWalletDialog } from "@/components/add-wallet-dialog";
import { DashboardOverview } from "@/components/dashboard-overview";
import Footer from "@/components/footer";
import { Wallet } from "lucide-react";

export default function Home() {
    const { wallets, loading, addWallet, removeWallet, refreshWallet, updateWalletLabel } = useWallets();

    const handleImportComplete = () => {
        // Trigger a page reload to refresh wallet data
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header onAddWallet={addWallet} onImportComplete={handleImportComplete} walletCount={wallets.length} />

            <main className="container mx-auto px-4 py-8">
                {wallets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Wallet className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">No wallets yet</h2>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            Add your first Tezos or Etherlink wallet to start monitoring your portfolio
                        </p>
                        <AddWalletDialog onAdd={addWallet} />
                    </div>
                ) : (
                    <DashboardOverview
                        wallets={wallets}
                        onRefresh={refreshWallet}
                        onRemove={removeWallet}
                        onUpdateLabel={updateWalletLabel}
                    />
                )}
            </main>
            <Footer />
        </div>
    );
}
