import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    onRetry?: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
        this.props.onRetry?.();
    };

    render() {
        if (this.state.hasError && this.state.error) {
            return <DefaultErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
        }

        return this.props.children;
    }
}

interface ErrorFallbackProps {
    error: Error;
    onRetry?: () => void;
}

function DefaultErrorFallback({ error, onRetry }: ErrorFallbackProps) {
    const isNetworkError = error.message.includes("fetch") || error.message.includes("network");
    const isTimeoutError = error.message.includes("timeout");

    return (
        <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Something went wrong
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                    {isNetworkError && (
                        <p>Unable to connect to blockchain services. Please check your internet connection.</p>
                    )}
                    {isTimeoutError && <p>Request timed out. The blockchain services might be slow or unavailable.</p>}
                    {!isNetworkError && !isTimeoutError && (
                        <p>An unexpected error occurred while loading your wallet data.</p>
                    )}
                </div>

                <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">{error.message}</div>

                {onRetry && (
                    <Button onClick={onRetry} variant="outline" size="sm" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// Query Error Component for TanStack Query errors
interface QueryErrorProps {
    error: Error;
    onRetry?: () => void;
    isRetrying?: boolean;
}

export function QueryError({ error, onRetry, isRetrying }: QueryErrorProps) {
    const errorMessage = error?.message || "Unknown error occurred";
    const isNetworkError = errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch");
    const isRateLimited = errorMessage.includes("429") || errorMessage.includes("rate limit");
    const isServerError = errorMessage.includes("500") || errorMessage.includes("502") || errorMessage.includes("503");

    return (
        <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        {isNetworkError ? (
                            <WifiOff className="h-5 w-5 text-destructive" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="text-sm font-medium text-destructive">
                            {isNetworkError && "Connection Error"}
                            {isRateLimited && "Rate Limited"}
                            {isServerError && "Service Unavailable"}
                            {!isNetworkError && !isRateLimited && !isServerError && "Loading Error"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {isNetworkError && "Unable to reach blockchain services. Check your connection."}
                            {isRateLimited && "Too many requests. Please wait a moment before trying again."}
                            {isServerError && "Blockchain services are temporarily unavailable."}
                            {!isNetworkError && !isRateLimited && !isServerError && errorMessage}
                        </div>
                        {onRetry && (
                            <Button
                                onClick={onRetry}
                                variant="outline"
                                size="sm"
                                disabled={isRetrying}
                                className="mt-2"
                            >
                                {isRetrying ? (
                                    <>
                                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                        Retrying...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Retry
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Re-export for easier component imports
export { QueryError as TanStackQueryError };
