"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface AddWalletDialogProps {
    onAdd: (address: string, type: "tezos" | "etherlink", label: string) => Promise<void>;
}

// Auto-detect wallet type from input
function detectWalletType(input: string): "tezos" | "etherlink" | null {
    const trimmed = input.trim();

    // Tezos addresses: tz1, tz2, tz3, KT1
    if (/^(tz1|tz2|tz3|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed)) {
        return "tezos";
    }

    // Etherlink addresses: 0x followed by 40 hex characters
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        return "etherlink";
    }

    // Tezos domain: .tez
    if (trimmed.endsWith(".tez")) {
        return "tezos";
    }

    return null;
}

// Resolve .tez domain to address using TzKT API
async function resolveTezDomain(domain: string): Promise<string | null> {
    try {
        const response = await fetch(
            `https://api.tzkt.io/v1/domains?name=${encodeURIComponent(domain)}&select=address&limit=1`
        );

        if (!response.ok) return null;

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && data[0].address) {
            return data[0].address;
        }

        return null;
    } catch (error) {
        console.error("Error resolving .tez domain:", error);
        return null;
    }
}

type ValidationState =
    | { status: "idle" }
    | { status: "validating" }
    | { status: "valid"; type: "tezos" | "etherlink"; resolvedAddress?: string; domain?: string }
    | { status: "invalid"; message: string };

export function AddWalletDialog({ onAdd }: AddWalletDialogProps) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [label, setLabel] = useState("");
    const [loading, setLoading] = useState(false);
    const [validation, setValidation] = useState<ValidationState>({ status: "idle" });

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setInput("");
            setLabel("");
            setValidation({ status: "idle" });
        }
    }, [open]);

    // Validate input with debouncing
    useEffect(() => {
        if (!input.trim()) {
            setValidation({ status: "idle" });
            return;
        }

        const timeoutId = setTimeout(async () => {
            setValidation({ status: "validating" });

            const trimmed = input.trim();
            const detectedType = detectWalletType(trimmed);

            if (!detectedType) {
                setValidation({
                    status: "invalid",
                    message: "Enter a valid Tezos address (tz1...), Etherlink address (0x...), or .tez domain",
                });
                return;
            }

            // If it's a .tez domain, resolve it
            if (trimmed.endsWith(".tez")) {
                const resolved = await resolveTezDomain(trimmed);

                if (!resolved) {
                    setValidation({
                        status: "invalid",
                        message: `Domain "${trimmed}" not found or doesn't point to an address`,
                    });
                    return;
                }

                setValidation({
                    status: "valid",
                    type: "tezos",
                    resolvedAddress: resolved,
                    domain: trimmed,
                });

                // Auto-fill label with domain name if not set
                if (!label) {
                    setLabel(trimmed);
                }
                return;
            }

            // Valid address
            setValidation({
                status: "valid",
                type: detectedType,
            });
        }, 400); // Debounce 400ms

        return () => clearTimeout(timeoutId);
    }, [input, label]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validation.status !== "valid") return;

        setLoading(true);

        try {
            const addressToAdd = validation.resolvedAddress || input.trim();
            const finalLabel =
                label || validation.domain || `${validation.type === "tezos" ? "Tezos" : "Etherlink"} Wallet`;

            await onAdd(addressToAdd, validation.type, finalLabel);
            setInput("");
            setLabel("");
            setOpen(false);
        } catch (error) {
            console.error("Error adding wallet:", error);
        } finally {
            setLoading(false);
        }
    };

    const isValid = validation.status === "valid";
    const showValidation = input.trim() && validation.status !== "idle";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" className="sm:w-auto sm:px-4">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-2">Add Wallet</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Wallet</DialogTitle>
                    <DialogDescription>Enter a Tezos address, Etherlink address, or .tez domain</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="address">Address or Domain</Label>
                        <div className="relative">
                            <Input
                                id="address"
                                placeholder="tz1... or 0x... or alice.tez"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className={
                                    showValidation
                                        ? validation.status === "valid"
                                            ? "pr-10 border-green-500 focus-visible:ring-green-500"
                                            : validation.status === "invalid"
                                            ? "pr-10 border-red-500 focus-visible:ring-red-500"
                                            : "pr-10"
                                        : ""
                                }
                            />
                            {showValidation && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {validation.status === "validating" && (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                    {validation.status === "valid" && (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    )}
                                    {validation.status === "invalid" && (
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Validation feedback */}
                        {validation.status === "valid" && (
                            <div className="flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    {validation.domain ? (
                                        <div>
                                            <div className="font-medium">Domain resolved</div>
                                            <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                                                {validation.resolvedAddress}
                                            </div>
                                        </div>
                                    ) : (
                                        <span>Valid {validation.type === "tezos" ? "Tezos" : "Etherlink"} address</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {validation.status === "invalid" && (
                            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{validation.message}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="label">Label (optional)</Label>
                        <Input
                            id="label"
                            placeholder="My Main Wallet"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">A friendly name to identify this wallet</p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !isValid}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Wallet"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
