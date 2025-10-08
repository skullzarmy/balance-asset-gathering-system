"use client";

import { useState } from "react";
import { Download, Upload, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { walletStorage } from "@/lib/wallet-storage";
import { toast } from "sonner";

export function WalletImportExport({
    onImportComplete,
    walletCount = 0,
}: {
    onImportComplete?: () => void;
    walletCount?: number;
}) {
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const hasWallets = walletCount > 0;

    const handleExport = () => {
        try {
            const config = walletStorage.exportConfig();
            const blob = new Blob([config], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `bags-wallets-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Wallets exported", {
                description: "Your wallet configuration has been downloaded",
            });
        } catch {
            toast.error("Export failed", {
                description: "Failed to export wallet configuration",
            });
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            const text = await file.text();
            const results = walletStorage.importConfig(text);

            if (results.errors.length > 0) {
                const message = results.success > 0 ? "success" : "error";
                toast[message]("Import completed with errors", {
                    description: `Imported: ${results.success}, Failed: ${results.failed}`,
                });
            } else {
                toast.success("Import successful", {
                    description: `Successfully imported ${results.success} wallet(s)`,
                });
            }

            if (results.success > 0 && onImportComplete) {
                onImportComplete();
            }

            setIsImportOpen(false);
        } catch {
            toast.error("Import failed", {
                description: "Failed to read wallet configuration file",
            });
        } finally {
            setImporting(false);
            // Reset file input
            event.target.value = "";
        }
    };

    return (
        <div className="flex gap-1">
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="sm:w-auto sm:px-3">
                        <Upload className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-2">Import</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Wallet Configuration</DialogTitle>
                        <DialogDescription>
                            Upload a wallet configuration JSON file. The file must follow the standard format used by
                            other Tezos ecosystem apps.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                            <FileJson className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <label htmlFor="import-file" className="cursor-pointer">
                                <Button variant="secondary" disabled={importing} asChild>
                                    <span>{importing ? "Importing..." : "Choose File"}</span>
                                </Button>
                                <input
                                    id="import-file"
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={handleImport}
                                    disabled={importing}
                                />
                            </label>
                            <p className="text-sm text-muted-foreground mt-2">Supports .json files only</p>
                        </div>
                        <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                            <p className="font-medium">Format requirements:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>Standard Tezos wallet config format</li>
                                <li>Supports both Tezos and Etherlink addresses</li>
                                <li>Duplicate wallets will be skipped</li>
                            </ul>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Button
                variant="outline"
                size="icon"
                className="sm:w-auto sm:px-3"
                onClick={handleExport}
                disabled={!hasWallets}
            >
                <Download className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2">Export</span>
            </Button>
        </div>
    );
}
