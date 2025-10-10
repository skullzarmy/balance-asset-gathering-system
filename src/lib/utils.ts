import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string): { amount: string; currency: string } {
    if (currency === "XTZ") {
        return {
            amount: (amount / 1_000_000).toFixed(2),
            currency: "XTZ",
        };
    }
    if (currency === "ETH") {
        return {
            amount: amount.toFixed(4),
            currency: "ETH",
        };
    }
    return {
        amount: amount.toFixed(2),
        currency: currency,
    };
}

export function formatAddress(address: string): string {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
