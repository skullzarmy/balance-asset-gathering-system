import type { Wallet, WalletSnapshot } from "./types";

const WALLETS_KEY = "bags_wallets";
const SNAPSHOTS_KEY = "bags_snapshots";

export const walletStorage = {
    // Wallet CRUD operations
    getWallets(): Wallet[] {
        if (typeof window === "undefined") return [];
        const stored = localStorage.getItem(WALLETS_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    addWallet(wallet: Wallet): void {
        const wallets = this.getWallets();
        wallets.push(wallet);
        localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
    },

    updateWallet(id: string, updates: Partial<Wallet>): void {
        const wallets = this.getWallets();
        const index = wallets.findIndex((w) => w.id === id);
        if (index !== -1) {
            wallets[index] = { ...wallets[index], ...updates };
            localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
        }
    },

    removeWallet(id: string): void {
        const wallets = this.getWallets().filter((w) => w.id !== id);
        localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
    },

    // Snapshot operations for timeline
    getSnapshots(walletId?: string): WalletSnapshot[] {
        if (typeof window === "undefined") return [];
        const stored = localStorage.getItem(SNAPSHOTS_KEY);
        const snapshots: WalletSnapshot[] = stored ? JSON.parse(stored) : [];
        return walletId ? snapshots.filter((s) => s.walletId === walletId) : snapshots;
    },

    addSnapshot(snapshot: WalletSnapshot): void {
        const snapshots = this.getSnapshots();
        snapshots.push(snapshot);
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    },

    clearSnapshots(walletId: string): void {
        const snapshots = this.getSnapshots().filter((s) => s.walletId !== walletId);
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    },

    // Import/Export operations
    exportConfig(): string {
        const wallets = this.getWallets();
        const config: import("./types").WalletExportConfig = {
            version: "2.0",
            exportDate: new Date().toISOString(),
            wallets: wallets.map((w) => ({
                address: w.address,
                alias: w.label,
                enabled: true,
                type: w.type,
                ...(w.type === "tezos" && { tzdomain: w.tezDomain }),
            })),
        };
        return JSON.stringify(config, null, 2);
    },

    importConfig(jsonString: string): { success: number; failed: number; errors: string[] } {
        try {
            const config: import("./types").WalletExportConfig = JSON.parse(jsonString);
            const results = { success: 0, failed: 0, errors: [] as string[] };

            if (!config.wallets || !Array.isArray(config.wallets)) {
                throw new Error("Invalid config format: missing wallets array");
            }

            // Check version to handle v1.0 vs v2.0 format
            const isV2 = config.version === "2.0";

            const existingWallets = this.getWallets();
            const existingAddresses = new Set(existingWallets.map((w) => w.address.toLowerCase()));

            for (const legacyWallet of config.wallets) {
                try {
                    if (!legacyWallet.enabled) continue;

                    // Skip if already exists
                    if (existingAddresses.has(legacyWallet.address.toLowerCase())) {
                        results.failed++;
                        results.errors.push(`Wallet ${legacyWallet.alias} already exists`);
                        continue;
                    }

                    // v2.0 files include type field, v1.0 defaults to tezos
                    const walletType = isV2 ? legacyWallet.type || "tezos" : "tezos";

                    // Create minimal wallet entry - full data will be fetched on first load
                    const wallet: Wallet =
                        walletType === "tezos"
                            ? {
                                  id: `tezos-${legacyWallet.address}-${Date.now()}`,
                                  address: legacyWallet.address,
                                  type: "tezos",
                                  label: legacyWallet.alias,
                                  status: "undelegated",
                                  balance: 0,
                                  spendableBalance: 0,
                                  stakedBalance: 0,
                                  unstakedBalance: 0,
                                  addedAt: Date.now(),
                                  ...(legacyWallet.tzdomain && { tezDomain: legacyWallet.tzdomain }),
                              }
                            : {
                                  id: `etherlink-${legacyWallet.address}-${Date.now()}`,
                                  address: legacyWallet.address,
                                  type: "etherlink",
                                  label: legacyWallet.alias,
                                  balance: 0,
                                  addedAt: Date.now(),
                              };

                    this.addWallet(wallet);
                    results.success++;
                } catch (err) {
                    results.failed++;
                    results.errors.push(`Failed to import ${legacyWallet.alias}: ${err}`);
                }
            }

            return results;
        } catch (err) {
            return {
                success: 0,
                failed: 0,
                errors: [`Failed to parse config: ${err}`],
            };
        }
    },
};
