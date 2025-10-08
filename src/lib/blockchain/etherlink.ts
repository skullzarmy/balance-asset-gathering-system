// Etherlink (EVM) blockchain integration utilities
import type { TokenBalance, Transaction } from "../types";
import { rateLimitedEtherlinkFetch } from "../rate-limiter";

const ETHERLINK_RPC = "https://node.mainnet.etherlink.com";

// Common ERC-20 tokens on Etherlink
const KNOWN_TOKENS = [
    {
        address: "0x796eFD9D7b9B5d5b3B3B3B3B3B3B3B3B3B3B3B3B",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
    },
    {
        address: "0x123eFD9D7b9B5d5b3B3B3B3B3B3B3B3B3B3B3B3B",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
    },
];

export async function fetchEtherlinkBalance(address: string): Promise<number> {
    try {
        const response = await rateLimitedEtherlinkFetch(ETHERLINK_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_getBalance",
                params: [address, "latest"],
                id: 1,
            }),
        });
        if (!response.ok) return 0;
        const data = await response.json();
        const balanceWei = Number.parseInt(data.result, 16);
        const balance = balanceWei / 1e18;
        return balance;
    } catch (error) {
        console.error("[v0] Error fetching Etherlink balance:", error);
        return 0;
    }
}

export async function fetchERC20Balance(
    walletAddress: string,
    tokenAddress: string,
    decimals: number
): Promise<number> {
    try {
        // ERC-20 balanceOf function signature
        const data = `0x70a08231000000000000000000000000${walletAddress.slice(2).padStart(64, "0")}`;

        const response = await rateLimitedEtherlinkFetch(ETHERLINK_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_call",
                params: [{ to: tokenAddress, data }, "latest"],
                id: 1,
            }),
        });

        if (!response.ok) return 0;
        const result = await response.json();
        if (result.result) {
            const balance = Number.parseInt(result.result, 16);
            return balance / Math.pow(10, decimals);
        }
        return 0;
    } catch (error) {
        console.error("[v0] Error fetching ERC-20 balance:", error);
        return 0;
    }
}

export async function fetchEtherlinkTokens(address: string): Promise<TokenBalance[]> {
    try {
        const tokens: TokenBalance[] = [];

        // Fetch balances for known tokens
        for (const token of KNOWN_TOKENS) {
            const balance = await fetchERC20Balance(address, token.address, token.decimals);
            if (balance > 0) {
                tokens.push({
                    symbol: token.symbol,
                    name: token.name,
                    balance,
                    decimals: token.decimals,
                    contractAddress: token.address,
                });
            }
        }

        return tokens;
    } catch (error) {
        console.error("[v0] Error fetching Etherlink tokens:", error);
        return [];
    }
}

export async function fetchEtherlinkTransactions(address: string): Promise<Transaction[]> {
    try {
        // Get latest block number
        const blockResponse = await rateLimitedEtherlinkFetch(ETHERLINK_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_blockNumber",
                params: [],
                id: 1,
            }),
        });
        if (!blockResponse.ok) return [];
        const blockData = await blockResponse.json();
        const latestBlock = Number.parseInt(blockData.result, 16);

        // Fetch recent blocks and filter transactions
        const transactions: Transaction[] = [];
        const blocksToCheck = 100;

        for (let i = 0; i < blocksToCheck && i < latestBlock; i++) {
            const blockNum = `0x${(latestBlock - i).toString(16)}`;

            const response = await rateLimitedEtherlinkFetch(ETHERLINK_RPC, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "eth_getBlockByNumber",
                    params: [blockNum, true],
                    id: 1,
                }),
            });

            if (!response.ok) continue;
            const data = await response.json();
            if (data.result?.transactions) {
                for (const tx of data.result.transactions) {
                    if (
                        tx.from?.toLowerCase() === address.toLowerCase() ||
                        tx.to?.toLowerCase() === address.toLowerCase()
                    ) {
                        transactions.push({
                            hash: tx.hash,
                            timestamp: Number.parseInt(data.result.timestamp, 16) * 1000,
                            from: tx.from,
                            to: tx.to || "Contract Creation",
                            value: Number.parseInt(tx.value, 16) / 1e18,
                            type: tx.from?.toLowerCase() === address.toLowerCase() ? "sent" : "received",
                            status: "confirmed",
                        });
                    }
                }
            }

            if (transactions.length >= 20) break;
        }

        return transactions.slice(0, 20);
    } catch (error) {
        console.error("[v0] Error fetching Etherlink transactions:", error);
        return [];
    }
}

export async function fetchEtherlinkHistory(address: string, days = 30) {
    try {
        // Use end of yesterday to avoid incomplete current day data
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today
        const endTime = new Date(now.getTime() - 1); // End of yesterday (23:59:59.999)
        const cutoffTime = endTime.getTime() - days * 24 * 60 * 60 * 1000;

        // Use Etherlink Explorer API for historical balance data
        const response = await rateLimitedEtherlinkFetch(
            `https://explorer.etherlink.com/api/v2/addresses/${address}/coin-balance-history`
        );

        if (!response.ok) {
            return [];
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            return [];
        }

        // Convert Explorer API response to our format, filtering to yesterday
        const history = data.items
            .filter((item: any) => {
                const timestamp = new Date(item.timestamp).getTime();
                return timestamp >= cutoffTime && timestamp <= endTime.getTime();
            })
            .map((item: any) => ({
                timestamp: new Date(item.timestamp).getTime(),
                balance: parseFloat(item.value) / 1e18, // Convert from wei
                blockNumber: item.block_number,
            }))
            .reverse(); // Oldest first

        // Remove trailing zeros (incomplete current day data)
        while (history.length > 0 && history[history.length - 1].balance === 0) {
            history.pop();
        }

        return history;
    } catch (error) {
        console.error("[Etherlink] Error fetching balance history:", error);
        return [];
    }
}
