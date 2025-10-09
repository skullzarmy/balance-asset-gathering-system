"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function ServiceWorkerManager() {
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            // Register service worker
            navigator.serviceWorker.ready.then((reg) => {
                setRegistration(reg);
                console.log("Service Worker ready:", reg);
            });

            // Listen for updates
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                console.log("Service Worker controller changed - reloading page");
                window.location.reload();
            });

            // Check for waiting service worker
            navigator.serviceWorker.ready.then((reg) => {
                if (reg.waiting) {
                    setUpdateAvailable(true);
                }
            });

            // Listen for new service worker installing
            navigator.serviceWorker.addEventListener("message", (event) => {
                if (event.data && event.data.type === "SKIP_WAITING") {
                    setUpdateAvailable(true);
                }
            });

            // Monitor online status
            const handleOnline = () => setIsOnline(true);
            const handleOffline = () => setIsOnline(false);

            setIsOnline(navigator.onLine);
            window.addEventListener("online", handleOnline);
            window.addEventListener("offline", handleOffline);

            return () => {
                window.removeEventListener("online", handleOnline);
                window.removeEventListener("offline", handleOffline);
            };
        }
    }, []);

    const handleUpdate = async () => {
        if (registration?.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
            setUpdateAvailable(false);
        }
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    // Only show update notification if there's an update available
    if (!updateAvailable && isOnline) {
        return null;
    }

    return (
        <>
            {/* Online/Offline Status Indicator */}
            <div
                className={`fixed top-4 right-4 z-40 transition-all duration-300 ${
                    isOnline ? "translate-y-[-100px] opacity-0" : "translate-y-0 opacity-100"
                }`}
            >
                <Card className="bg-destructive text-destructive-foreground border-destructive">
                    <CardContent className="flex items-center gap-2 p-3">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">You're offline</span>
                    </CardContent>
                </Card>
            </div>

            {/* Update Available Notification */}
            {updateAvailable && (
                <div className="fixed top-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
                    <Card className="shadow-lg border-2 border-primary">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Update Available</CardTitle>
                            </div>
                            <CardDescription>A new version of B.A.G.S. is ready to install</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex gap-2">
                                <Button onClick={handleUpdate} size="sm" className="flex-1">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Update Now
                                </Button>
                                <Button variant="outline" onClick={handleRefresh} size="sm">
                                    Later
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    );
}
