"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Upload, FileJson, QrCode, Camera, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { walletStorage } from "@/lib/wallet-storage";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

export function WalletImportExport({
    onImportComplete,
    walletCount = 0,
}: {
    onImportComplete?: (() => void) | undefined;
    walletCount?: number;
}) {
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importMethod, setImportMethod] = useState<"file" | "qr">("file");
    const [isScanning, setIsScanning] = useState(false);
    const [qrCodeData, setQrCodeData] = useState<string>("");
    const [qrPages, setQrPages] = useState<string[]>([]);
    const [currentQrPage, setCurrentQrPage] = useState(0);
    const [totalWalletsInExport, setTotalWalletsInExport] = useState(0);
    const [importProgress, setImportProgress] = useState<{
        currentPage: number;
        totalPages: number;
        walletsImported: number;
    } | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const scannerElementId = "qr-scanner-region";
    const hasWallets = walletCount > 0;

    // Cleanup QR scanner on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear();
                } catch (error) {
                    console.log("Scanner cleanup error:", error);
                }
            }
        };
    }, []);

    const handleExportJson = () => {
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

    const handleExportQR = () => {
        try {
            const wallets = walletStorage.getWallets();
            const walletsPerPage = 2; // Conservative limit for QR code capacity
            const pages: string[] = [];

            // Split wallets into smaller batches
            for (let i = 0; i < wallets.length; i += walletsPerPage) {
                const batch = wallets.slice(i, i + walletsPerPage);
                const pageConfig = {
                    version: "2.0",
                    exportDate: new Date().toISOString(),
                    page: Math.floor(i / walletsPerPage) + 1,
                    totalPages: Math.ceil(wallets.length / walletsPerPage),
                    totalWallets: wallets.length,
                    wallets: batch.map((w) => ({
                        address: w.address,
                        alias: w.label,
                        enabled: true,
                        type: w.type,
                        ...(w.type === "tezos" && { tzdomain: w.tezDomain }),
                    })),
                };
                pages.push(JSON.stringify(pageConfig));
            }

            if (pages.length === 0) {
                toast.error("No wallets to export");
                return;
            }

            setQrPages(pages);
            setCurrentQrPage(0);
            setTotalWalletsInExport(wallets.length);
            setQrCodeData(pages[0]);
            setIsExportOpen(true);
        } catch {
            toast.error("Export failed", {
                description: "Failed to prepare wallet configuration for QR code",
            });
        }
    };

    const startQRScanning = () => {
        setIsScanning(true);

        // Add a small delay to ensure the DOM element is rendered
        setTimeout(() => {
            try {
                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                    rememberLastUsedCamera: true,
                    showTorchButtonIfSupported: true,
                    showZoomSliderIfSupported: true,
                };

                const scanner = new Html5QrcodeScanner(
                    scannerElementId,
                    config,
                    false // verbose
                );

                scannerRef.current = scanner;

                scanner.render(
                    (decodedText) => {
                        handleQRScanResult(decodedText);
                    },
                    (errorMessage) => {
                        // Ignore scan failures, they're normal during scanning
                        console.debug("QR scan attempt:", errorMessage);
                    }
                );
            } catch (error) {
                console.error("QR Scanner error:", error);
                toast.error("Camera access failed", {
                    description: "Please ensure camera permissions are granted and try again",
                });
                setIsScanning(false);
            }
        }, 100);
    };

    const stopQRScanning = () => {
        if (scannerRef.current) {
            try {
                scannerRef.current.clear();
            } catch (error) {
                console.log("Scanner stop error:", error);
            }
            scannerRef.current = null;
        }
        setIsScanning(false);
        setImportProgress(null);
    };

    const handleQRScanResult = async (data: string) => {
        try {
            const parsedData = JSON.parse(data);

            // Check if this is a paginated export
            if (parsedData.page && parsedData.totalPages) {
                const results = walletStorage.importConfig(data);

                // Update import progress
                setImportProgress((prev) => ({
                    currentPage: parsedData.page,
                    totalPages: parsedData.totalPages,
                    walletsImported: (prev?.walletsImported || 0) + results.success,
                }));

                if (results.errors.length > 0) {
                    const message = results.success > 0 ? "success" : "error";
                    toast[message](`Page ${parsedData.page}/${parsedData.totalPages} imported with errors`, {
                        description: `Imported: ${results.success}, Failed: ${results.failed}`,
                    });
                } else {
                    toast.success(`Page ${parsedData.page}/${parsedData.totalPages} imported`, {
                        description: `Successfully imported ${results.success} wallet(s)`,
                    });
                }

                if (parsedData.page < parsedData.totalPages) {
                    toast.info("Ready for next QR code", {
                        description: `Page ${parsedData.page + 1} of ${
                            parsedData.totalPages
                        } remaining - keep scanning!`,
                        duration: 2000,
                    });
                    // Keep scanning - don't stop the camera
                } else {
                    toast.success("All pages imported!", {
                        description: `Completed importing all ${parsedData.totalWallets} wallets`,
                    });
                    stopQRScanning();
                    setIsImportOpen(false);
                }
            } else {
                // Handle legacy single-page import
                const results = walletStorage.importConfig(data);

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
                stopQRScanning();
                setIsImportOpen(false);
            }

            if (onImportComplete) {
                onImportComplete();
            }
        } catch {
            toast.error("Import failed", {
                description: "Invalid QR code data format - try scanning again",
            });
            // Don't stop scanning on error, let them try again
        }
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
            {/* Import Dialog */}
            <Dialog
                open={isImportOpen}
                onOpenChange={(open) => {
                    setIsImportOpen(open);
                    if (!open && isScanning) {
                        stopQRScanning();
                    }
                }}
            >
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="sm:w-auto sm:px-3">
                        <Upload className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-2">Import</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Import Wallet Configuration</DialogTitle>
                        <DialogDescription>
                            Choose how you'd like to import your wallet configuration.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={importMethod} onValueChange={(value) => setImportMethod(value as "file" | "qr")}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="file">
                                <FileJson className="h-4 w-4 mr-2" />
                                File
                            </TabsTrigger>
                            <TabsTrigger value="qr">
                                <Camera className="h-4 w-4 mr-2" />
                                QR Code
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="file" className="space-y-4">
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
                                        onChange={handleFileImport}
                                        disabled={importing}
                                    />
                                </label>
                                <p className="text-sm text-muted-foreground mt-2">Supports .json files only</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="qr" className="space-y-4">
                            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                                {!isScanning ? (
                                    <>
                                        <Scan className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                        <Button onClick={startQRScanning} disabled={importing}>
                                            <Camera className="h-4 w-4 mr-2" />
                                            Start Camera
                                        </Button>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Point your camera at a wallet configuration QR code
                                        </p>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        {importProgress && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                                <p className="text-sm font-medium text-green-800">
                                                    Progress: {importProgress.currentPage}/{importProgress.totalPages}{" "}
                                                    pages
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    {importProgress.walletsImported} wallets imported so far
                                                </p>
                                                {importProgress.currentPage < importProgress.totalPages && (
                                                    <p className="text-xs text-green-600 mt-1">
                                                        📱 Ready for page {importProgress.currentPage + 1}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        <div
                                            id={scannerElementId}
                                            className="mx-auto w-full max-w-sm"
                                            style={{ minHeight: "300px" }}
                                        />
                                        <Button variant="outline" onClick={stopQRScanning} className="w-full">
                                            Stop Scanning
                                        </Button>
                                        <p className="text-sm text-muted-foreground">
                                            {importProgress
                                                ? "Scan the next QR code to continue importing"
                                                : "Position the QR code within the camera view"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p className="font-medium">Format requirements:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Standard Tezos wallet config format</li>
                            <li>Supports both Tezos and Etherlink addresses</li>
                            <li>Duplicate wallets will be skipped</li>
                        </ul>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Export Button with Menu */}
            {hasWallets && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="sm:w-auto sm:px-3" disabled={!hasWallets}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only sm:ml-2">Export</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Export Wallets</DialogTitle>
                            <DialogDescription>Choose your export format.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3">
                            <Button variant="outline" className="w-full justify-start" onClick={handleExportJson}>
                                <FileJson className="h-4 w-4 mr-2" />
                                Download JSON File
                            </Button>
                            <Button variant="outline" className="w-full justify-start" onClick={handleExportQR}>
                                <QrCode className="h-4 w-4 mr-2" />
                                Show QR Code
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* QR Code Export Dialog */}
            <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Export as QR Code</DialogTitle>
                        <DialogDescription>
                            {qrPages.length > 1
                                ? `Page ${currentQrPage + 1} of ${qrPages.length} - Scan each QR code separately`
                                : "Scan this QR code with your mobile device to import the wallet configuration."}
                        </DialogDescription>
                    </DialogHeader>

                    {qrCodeData && (
                        <div className="flex flex-col items-center space-y-4">
                            {qrPages.length > 1 && (
                                <div className="w-full bg-muted p-3 rounded-lg text-center">
                                    <p className="text-sm font-medium">
                                        Page {currentQrPage + 1} of {qrPages.length}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {totalWalletsInExport} wallets split into {qrPages.length} QR codes
                                    </p>
                                </div>
                            )}

                            <div className="bg-white p-4 rounded-lg">
                                <QRCodeSVG value={qrCodeData} size={256} level="M" includeMargin={true} />
                            </div>

                            {qrPages.length > 1 && (
                                <div className="flex gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const newPage = Math.max(0, currentQrPage - 1);
                                            setCurrentQrPage(newPage);
                                            setQrCodeData(qrPages[newPage]);
                                        }}
                                        disabled={currentQrPage === 0}
                                        className="flex-1"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const newPage = Math.min(qrPages.length - 1, currentQrPage + 1);
                                            setCurrentQrPage(newPage);
                                            setQrCodeData(qrPages[newPage]);
                                        }}
                                        disabled={currentQrPage === qrPages.length - 1}
                                        className="flex-1"
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}

                            <div className="text-center space-y-2">
                                <p className="text-sm font-medium">
                                    {qrPages.length > 1 ? "Scan each QR code in order" : "Scan with your mobile device"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Make sure the entire QR code is visible in your camera viewfinder
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    navigator.clipboard.writeText(qrCodeData);
                                    toast.success("Copied to clipboard");
                                }}
                                className="w-full"
                            >
                                Copy Current Page to Clipboard
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
