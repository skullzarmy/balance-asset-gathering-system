"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff } from "lucide-react";

export function NetworkStatus() {
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);

    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <Card className="bg-yellow-500/10 border-yellow-500/20 mb-4">
            <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm font-medium">You're offline</span>
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Some features may not work properly without an internet connection.
                </p>
            </CardContent>
        </Card>
    );
}
