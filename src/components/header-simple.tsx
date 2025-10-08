"use client";

import { siteConfig } from "@/lib/site-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletIcon } from "@/components/WalletIcon";
import { useRef } from "react";
import type { WalletHandle } from "@/components/WalletIcon";

export function SimpleHeader() {
    const walletRef = useRef<WalletHandle>(null);

    return (
        <header className="border-b border-border/50 backdrop-blur sticky top-0 z-10 bg-background/80">
            <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex items-center justify-between gap-1 sm:gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                        <WalletIcon ref={walletRef} size={20} className="text-primary-foreground" />
                    </div>
                    <a
                        href="/"
                        className="min-w-0 hidden sm:block group"
                        onMouseEnter={() => walletRef.current?.startAnimation()}
                        onMouseLeave={() => walletRef.current?.stopAnimation()}
                    >
                        <h1 className="text-xl font-bold">{siteConfig.name}</h1>
                        <p className="text-xs text-muted-foreground">{siteConfig.subtitle}</p>
                    </a>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
