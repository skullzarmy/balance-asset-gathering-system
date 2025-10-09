import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
    const handleRefresh = () => {
        if (typeof window !== "undefined") {
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-4 rounded-full bg-muted">
                        <WifiOff className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl">You're Offline</CardTitle>
                    <CardDescription>
                        It looks like you've lost your internet connection. Some features may not be available.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                        Check your internet connection and try again. Previously viewed wallet data may still be
                        available.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button onClick={handleRefresh} className="w-full">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                        <Link href="/" passHref>
                            <Button variant="outline" className="w-full">
                                <Home className="mr-2 h-4 w-4" />
                                Go Home
                            </Button>
                        </Link>
                    </div>
                    <div className="text-xs text-muted-foreground text-center space-y-1">
                        <p>B.A.G.S. works offline with cached data</p>
                        <p>Connect to the internet for live updates</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
