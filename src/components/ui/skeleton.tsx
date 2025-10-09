import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
    return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

// Wallet Card Skeleton
export function WalletCardSkeleton() {
    return (
        <div className="bg-card/50 backdrop-blur border-border/50 rounded-lg border p-6 space-y-4">
            <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-18" />
                    <Skeleton className="h-4 w-14" />
                </div>
            </div>
        </div>
    );
}

// Chart Skeleton
export function ChartSkeleton() {
    return (
        <div className="bg-card/50 backdrop-blur border-border/50 rounded-lg border">
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-24" />
                </div>

                <div className="h-[300px] space-y-2">
                    <div className="flex justify-between items-end h-full">
                        {Array.from({ length: 12 }, (_, i) => `chart-bar-${i}`).map((barId) => (
                            <Skeleton key={barId} className="w-6" style={{ height: `${Math.random() * 80 + 20}%` }} />
                        ))}
                    </div>
                    <div className="flex justify-between">
                        {Array.from({ length: 4 }, (_, i) => `chart-label-${i}`).map((labelId) => (
                            <Skeleton key={labelId} className="h-3 w-12" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Balance Breakdown Skeleton
export function BalanceBreakdownSkeleton() {
    return (
        <div className="bg-card/50 backdrop-blur border-border/50 rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-32" />
            </div>

            <div className="flex items-center justify-center h-[300px]">
                <div className="relative">
                    <Skeleton className="h-48 w-48 rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-1">
                            <Skeleton className="h-6 w-16 mx-auto" />
                            <Skeleton className="h-4 w-12 mx-auto" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-6 mt-4">
                {Array.from({ length: 3 }, (_, i) => `legend-${i}`).map((legendId) => (
                    <div key={legendId} className="flex items-center gap-2">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Transaction List Skeleton
export function TransactionSkeleton() {
    return (
        <div className="bg-card/50 backdrop-blur border-border/50 rounded-lg border">
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-5 w-36" />
                </div>

                <div className="space-y-3">
                    {Array.from({ length: 5 }, (_, i) => `transaction-${i}`).map((transactionId) => (
                        <div
                            key={transactionId}
                            className="flex items-start gap-3 p-3 rounded-lg border border-border/50"
                        >
                            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-3 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <div className="text-right space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Stats Grid Skeleton
export function StatsGridSkeleton() {
    return (
        <div className="bg-card/50 backdrop-blur border-border/50 rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-28" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }, (_, i) => `stat-${i}`).map((statId) => (
                    <div key={statId} className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Token List Skeleton
export function TokenListSkeleton() {
    return (
        <div className="bg-card/50 backdrop-blur border-border/50 rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-32" />
            </div>

            <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => `token-${i}`).map((tokenId) => (
                    <div key={tokenId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="text-right space-y-1">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export { Skeleton };
