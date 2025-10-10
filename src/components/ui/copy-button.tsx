"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
    text: string;
    size?: "sm" | "icon";
    variant?: "ghost" | "outline";
    className?: string;
}

export function CopyButton({ text, size = "icon", variant = "ghost", className }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy text:", error);
        }
    };

    return (
        <Button size={size} variant={variant} onClick={handleCopy} className={className}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
    );
}
