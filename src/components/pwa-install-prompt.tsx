"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        const checkIfInstalled = () => {
            if (typeof window !== "undefined") {
                // Check for standalone mode (PWA installed)
                const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
                // Check for iOS standalone mode
                const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

                console.log("PWA Install Check:", { isStandalone, isIOSStandalone });
                setIsInstalled(isStandalone || isIOSStandalone);
            }
        };

        checkIfInstalled();

        const handleBeforeInstallPrompt = (e: Event) => {
            console.log("beforeinstallprompt event fired", e);
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show the install prompt immediately on mobile
            setTimeout(() => {
                if (!isInstalled) {
                    console.log("Showing PWA install prompt");
                    setShowInstallPrompt(true);
                }
            }, 1000); // Reduced delay for testing
        };

        const handleAppInstalled = () => {
            console.log("PWA app installed event fired");
            setIsInstalled(true);
            setShowInstallPrompt(false);
            setDeferredPrompt(null);
        };

        // Add debug logging
        console.log("PWA Install Prompt: Setting up event listeners");

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        // For testing: show prompt after 5 seconds if no beforeinstallprompt fired
        const testTimeout = setTimeout(() => {
            if (!deferredPrompt && !isInstalled) {
                console.log("No beforeinstallprompt received - PWA criteria may not be met");
                console.log("Check: HTTPS, valid manifest, service worker, engagement");
                // Show anyway for testing
                setShowInstallPrompt(true);
            }
        }, 5000);

        return () => {
            clearTimeout(testTimeout);
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, [isInstalled, deferredPrompt]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;

            if (choiceResult.outcome === "accepted") {
                setShowInstallPrompt(false);
                setDeferredPrompt(null);
            }
        } catch (error) {
            console.error("Error showing install prompt:", error);
        }
    };

    const handleDismiss = () => {
        setShowInstallPrompt(false);

        // Don't show again for this session
        sessionStorage.setItem("pwa-install-dismissed", "true");
    }; // Don't show if already installed or dismissed in this session
    if (
        isInstalled ||
        !showInstallPrompt ||
        !deferredPrompt ||
        (typeof window !== "undefined" && sessionStorage.getItem("pwa-install-dismissed"))
    ) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
            <Card className="shadow-lg border-2">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Install B.A.G.S.</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <CardDescription>Install our app for faster access and offline functionality</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex gap-2">
                        <Button onClick={handleInstallClick} className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Install App
                        </Button>
                        <Button variant="outline" onClick={handleDismiss}>
                            Later
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
