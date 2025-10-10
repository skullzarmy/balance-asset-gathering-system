"use client";

import { Badge } from "@/components/ui/badge";
import { formatAddress } from "@/lib/utils";

interface BakerInfoProps {
    bakerAddress: string;
    bakerName?: string;
    size?: "sm" | "md" | "lg";
    showAddress?: boolean;
    className?: string;
}

export function BakerInfo({
    bakerAddress,
    bakerName,
    size = "md",
    showAddress = false,
    className = "",
}: BakerInfoProps) {
    const sizeClasses = {
        sm: "h-6 w-6 text-xs",
        md: "h-8 w-8 text-sm",
        lg: "h-10 w-10 text-base",
    };

    const textSizeClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
    };

    // Generate a consistent color based on baker address with dark mode support
    const generateBakerColor = (address: string) => {
        let hash = 0;
        for (let i = 0; i < address.length; i++) {
            hash = address.charCodeAt(i) + ((hash << 5) - hash);
        }
        const lightColors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-purple-500",
            "bg-orange-500",
            "bg-teal-500",
            "bg-indigo-500",
            "bg-pink-500",
            "bg-cyan-500",
        ];
        const darkColors = [
            "dark:bg-blue-600",
            "dark:bg-green-600",
            "dark:bg-purple-600",
            "dark:bg-orange-600",
            "dark:bg-teal-600",
            "dark:bg-indigo-600",
            "dark:bg-pink-600",
            "dark:bg-cyan-600",
        ];
        const index = Math.abs(hash) % lightColors.length;
        return `${lightColors[index]} ${darkColors[index]}`;
    };

    const getBakerInitials = (name?: string, address?: string) => {
        if (name && name !== address) {
            // If it's a proper name, take first 2 characters
            return name.slice(0, 2).toUpperCase();
        }
        // If it's an address, take first and last character
        if (address) {
            return (address.charAt(3) + address.charAt(address.length - 1)).toUpperCase();
        }
        return "??";
    };

    const displayName = bakerName && bakerName !== bakerAddress ? bakerName : null;
    const displayAddress = showAddress || !displayName ? formatAddress(bakerAddress) : null;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Baker Avatar */}
            <div
                className={`
                    ${sizeClasses[size]} 
                    ${generateBakerColor(bakerAddress)}
                    rounded-full 
                    flex 
                    items-center 
                    justify-center 
                    text-white 
                    font-semibold
                    shadow-sm
                `}
            >
                {getBakerInitials(bakerName, bakerAddress)}
            </div>

            {/* Baker Info */}
            <div className="flex flex-col">
                {displayName && <span className={`font-medium ${textSizeClasses[size]}`}>{displayName}</span>}
                {displayAddress && (
                    <span className={`text-muted-foreground ${textSizeClasses[size]} ${displayName ? "text-xs" : ""}`}>
                        {displayAddress}
                    </span>
                )}
            </div>
        </div>
    );
}

export function BakerBadge({
    bakerAddress,
    bakerName,
    className = "",
}: {
    bakerAddress: string;
    bakerName?: string;
    className?: string;
}) {
    const displayName = bakerName && bakerName !== bakerAddress ? bakerName : formatAddress(bakerAddress);

    return (
        <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
            <div className="h-3 w-3 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0" />
            <span className="truncate">{displayName}</span>
        </Badge>
    );
}
