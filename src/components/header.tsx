"use client";

import { siteConfig } from "@/lib/site-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletImportExport } from "@/components/wallet-import-export";
import { AddWalletDialog } from "@/components/add-wallet-dialog";
import { TezosLogo } from "@/components/tezos-logo";
import { useRef } from "react";
import type { TezosLogoHandle } from "@/components/tezos-logo";

interface HeaderProps {
    onAddWallet: (address: string, type: "tezos" | "etherlink", label?: string) => Promise<void>;
    onImportComplete?: () => void;
    walletCount: number;
}

export function Header({ onAddWallet, onImportComplete, walletCount }: HeaderProps) {
    const logoRef = useRef<TezosLogoHandle>(null);

    return (
        <header className="border-b border-border/50 backdrop-blur sticky top-0 z-10 bg-background/80">
            <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex items-center justify-between gap-1 sm:gap-2">
                <a
                    href="/"
                    className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 group bg-background group-hover:bg-primary"
                    onMouseEnter={() => logoRef.current?.startAnimation()}
                    onMouseLeave={() => logoRef.current?.stopAnimation()}
                >
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-b-full rounded-t-sm bg-primary group-hover:bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:rounded-full transition-all duration-700">
                        <TezosLogo
                            ref={logoRef}
                            size={24}
                            className="text-primary-foreground group-hover:text-primary"
                        />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold">{siteConfig.name}</h1>
                        <p className="text-xs text-muted-foreground hidden sm:block">{siteConfig.subtitle}</p>
                    </div>
                </a>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Wallet Management Group */}
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border/50">
                        <WalletImportExport onImportComplete={onImportComplete} walletCount={walletCount} />
                        <AddWalletDialog onAdd={onAddWallet} />
                    </div>

                    {/* Settings Group */}
                    <div className="flex items-center p-1 rounded-lg bg-muted/30 border border-border/50">
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}
