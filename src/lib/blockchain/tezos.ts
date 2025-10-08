// Tezos blockchain integration utilities
import type { TokenBalance, DelegationDetails } from "../types";
import { rateLimitedTzKTFetch } from "../rate-limiter";

export interface TezosBalanceBreakdown {
    total: number;
    spendable: number;
    staked: number;
    unstaked: number;
}

export async function fetchTezosBalance(address: string): Promise<number> {
    try {
        const response = await rateLimitedTzKTFetch(`https://api.tzkt.io/v1/accounts/${address}/balance`);
        if (!response.ok) return 0;
        const data = await response.json();
        const balance = data / 1_000_000; // Convert from mutez to XTZ
        return balance;
    } catch (error) {
        console.error("[v0] Error fetching Tezos balance:", error);
        return 0;
    }
}

export async function fetchTezosBalanceBreakdown(address: string): Promise<TezosBalanceBreakdown> {
    try {
        const response = await rateLimitedTzKTFetch(`https://api.tzkt.io/v1/accounts/${address}`);
        if (!response.ok) return { total: 0, spendable: 0, staked: 0, unstaked: 0 };
        const data = await response.json();

        const total = (data.balance || 0) / 1_000_000;
        const staked = (data.stakedBalance || 0) / 1_000_000;
        const unstaked = (data.unstakedBalance || 0) / 1_000_000;
        const spendable = total - staked - unstaked;

        return { total, spendable, staked, unstaked };
    } catch (error) {
        console.error("[Tezos] Error fetching balance breakdown:", error);
        return { total: 0, spendable: 0, staked: 0, unstaked: 0 };
    }
}

/**
 * Fetch TezDomain for an address
 */
export async function fetchTezDomain(address: string): Promise<string | null> {
    try {
        const response = await rateLimitedTzKTFetch(`https://api.tzkt.io/v1/domains?address=${address}&limit=1`);
        if (!response.ok) return null;

        const data = await response.json();
        if (data && data.length > 0 && data[0].name) {
            return data[0].name;
        }
        return null;
    } catch (error) {
        console.error("[Tezos] Error fetching TezDomain:", error);
        return null;
    }
}

export async function fetchTezosTokens(address: string): Promise<TokenBalance[]> {
    try {
        const allTokens: TokenBalance[] = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const response = await rateLimitedTzKTFetch(
                `https://api.tzkt.io/v1/tokens/balances?account=${address}&balance.gt=0&limit=${limit}&offset=${offset}`
            );
            if (!response.ok) break;
            const data = await response.json();

            if (data.length === 0) {
                hasMore = false;
                break;
            }

            const tokens = data
                .filter((token: any) => {
                    const metadata = token.token.metadata;
                    if (!metadata) return false;

                    // Must have decimals
                    if (metadata.decimals === undefined || metadata.decimals === null) return false;

                    // Exclude NFTs by checking for isBooleanAmount (NFTs are typically amount 1)
                    // or by checking symbol - NFTs usually don't have standard ticker symbols
                    const hasSymbol = metadata.symbol && metadata.symbol.length > 0 && metadata.symbol.length < 10;

                    // Exclude if has image/artifact URIs typical of NFTs but is missing proper fungible token symbol
                    const hasNFTMedia = (metadata.artifactUri || metadata.displayUri) && !hasSymbol;

                    return !hasNFTMedia;
                })
                .map((token: any) => ({
                    symbol: token.token.metadata?.symbol || "UNKNOWN",
                    name: token.token.metadata?.name || "Unknown Token",
                    balance: Number.parseFloat(token.balance) / Math.pow(10, token.token.metadata.decimals),
                    decimals: token.token.metadata.decimals,
                    contractAddress: token.token.contract.address,
                    thumbnailUri: token.token.metadata?.thumbnailUri,
                    tokenId: token.token.tokenId,
                }));

            allTokens.push(...tokens);

            // If we got fewer results than the limit, we've reached the end
            if (data.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
            }
        }

        return allTokens;
    } catch (error) {
        console.error("[v0] Error fetching Tezos tokens:", error);
        return [];
    }
}

export async function fetchDelegationStatus(address: string) {
    try {
        const response = await rateLimitedTzKTFetch(`https://api.tzkt.io/v1/accounts/${address}`);
        if (!response.ok) return { status: "undelegated" as const };
        const data = await response.json();

        if (data.stakedBalance && data.stakedBalance > 0) {
            return {
                status: "staked" as const,
                delegatedTo: data.delegate?.address,
                stakedAmount: data.stakedBalance / 1_000_000,
            };
        } else if (data.delegate) {
            return {
                status: "delegated" as const,
                delegatedTo: data.delegate.address,
            };
        }

        return { status: "undelegated" as const };
    } catch (error) {
        console.error("[v0] Error fetching delegation status:", error);
        return { status: "undelegated" as const };
    }
}

export async function fetchDelegationDetails(address: string): Promise<DelegationDetails | null> {
    try {
        const accountResponse = await rateLimitedTzKTFetch(`https://api.tzkt.io/v1/accounts/${address}`);
        if (!accountResponse.ok) return null;
        const accountData = await accountResponse.json();

        if (!accountData.delegate) return null;

        const bakerAddress = accountData.delegate.address;
        const bakerResponse = await rateLimitedTzKTFetch(`https://api.tzkt.io/v1/delegates/${bakerAddress}`);
        if (!bakerResponse.ok) return null;
        const bakerData = await bakerResponse.json();

        return {
            baker: bakerAddress,
            bakerName: bakerData.alias || bakerAddress,
            stakingBalance: (bakerData.stakingBalance || 0) / 1_000_000,
            stakingCapacity: (bakerData.stakingCapacity || 0) / 1_000_000,
            freeSpace: (bakerData.freeSpace || 0) / 1_000_000,
            fee: bakerData.fee || 0,
            estimatedRoi: bakerData.estimatedRoi || 0,
        };
    } catch (error) {
        console.error("[v0] Error fetching delegation details:", error);
        return null;
    }
}

export async function fetchTezosHistory(address: string, days = 30) {
    try {
        // Use end of yesterday to avoid incomplete current day data
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today
        const endTime = new Date(now.getTime() - 1); // End of yesterday (23:59:59.999)
        const past = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

        // Calculate approximate number of blocks in the time range (30 seconds per block)
        const totalSeconds = days * 24 * 60 * 60;
        const estimatedBlocks = Math.floor(totalSeconds / 30);
        // Aim for ~100-200 data points max
        const step = Math.max(1, Math.floor(estimatedBlocks / 150));

        // Use balance_history endpoint with quote parameter to get USD and EUR prices in ONE call
        const response = await rateLimitedTzKTFetch(
            `https://api.tzkt.io/v1/accounts/${address}/balance_history?step=${step}&quote=usd,eur&limit=1000`
        );
        if (!response.ok) return [];

        const data = await response.json();

        // Filter to only include points within our date range (up to end of yesterday)
        const filteredData = data
            .filter((point: any) => {
                const pointTime = new Date(point.timestamp).getTime();
                return pointTime >= past.getTime() && pointTime <= endTime.getTime();
            })
            .map((point: any) => ({
                level: point.level,
                timestamp: new Date(point.timestamp).getTime(),
                balance: point.balance / 1_000_000, // Convert from mutez to XTZ
                usdValue: point.quote?.usd,
                eurValue: point.quote?.eur,
            }));

        // Remove trailing zeros (incomplete current day data)
        while (filteredData.length > 0 && filteredData[filteredData.length - 1].balance === 0) {
            filteredData.pop();
        }

        return filteredData;
    } catch (error) {
        console.error("[Tezos] Error fetching balance history:", error);
        return [];
    }
}

export async function fetchTezosOperations(address: string, limit = 20) {
    try {
        const response = await rateLimitedTzKTFetch(
            `https://api.tzkt.io/v1/accounts/${address}/operations?limit=${limit}&sort.desc=id`
        );
        if (!response.ok) return [];
        const data = await response.json();

        return data.map((op: any) => ({
            type: op.type,
            hash: op.hash,
            timestamp: new Date(op.timestamp).getTime(),
            amount: op.amount ? op.amount / 1_000_000 : 0,
            sender: op.sender?.address,
            target: op.target?.address,
            status: op.status,
        }));
    } catch (error) {
        console.error("[v0] Error fetching Tezos operations:", error);
        return [];
    }
}
