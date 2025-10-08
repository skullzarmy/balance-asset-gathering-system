"use client";

import { siteConfig } from "@/lib/site-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletImportExport } from "@/components/wallet-import-export";
import { AddWalletDialog } from "@/components/add-wallet-dialog";
import { Wallet } from "lucide-react";

interface HeaderProps {
    onAddWallet: (address: string, type: "tezos" | "etherlink", label?: string) => Promise<void>;
    onImportComplete?: () => void;
    walletCount: number;
}

export function Header({ onAddWallet, onImportComplete, walletCount }: HeaderProps) {
    return (
        <header className="border-b border-border/50 backdrop-blur sticky top-0 z-10 bg-background/80">
            <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex items-center justify-between gap-1 sm:gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                        <Wallet className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <a href="/" className="min-w-0 hidden sm:block">
                        <h1 className="text-xl font-bold">{siteConfig.name}</h1>
                        <p className="text-xs text-muted-foreground">{siteConfig.subtitle}</p>
                    </a>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <WalletImportExport onImportComplete={onImportComplete} walletCount={walletCount} />
                    <ThemeToggle />
                    <AddWalletDialog onAdd={onAddWallet} />
                </div>
            </div>
        </header>
    );
}
