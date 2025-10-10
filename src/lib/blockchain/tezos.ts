// Tezos blockchain integration utilities
import type { TokenBalance, DelegationDetails, WalletRewards } from "../types";
import { rateLimitedTzKTFetch } from "../rate-limiter";

export interface TezosBalanceBreakdown {
    total: number;
    spendable: number;
    staked: number;
    unstaked: number;
}

export interface TezosAccountData {
    balance: number;
    stakedBalance: number;
    unstakedBalance: number;
    delegatedTo?: {
        address: string;
        alias?: string;
    };
    delegate?: {
        address: string;
        alias?: string;
    };
    counter: number;
    type: string;
}

/**
 * Consolidated account data fetching - gets all account info in one API call
 * This replaces separate calls for balance breakdown and delegation status
 */
export async function fetchTezosAccountData(address: string): Promise<TezosAccountData | null> {
    try {
        const response = await rateLimitedTzKTFetch(`https://api.tzkt.io/v1/accounts/${address}`);
        if (!response.ok) return null;
        const data = await response.json();

        return {
            balance: data.balance || 0,
            stakedBalance: data.stakedBalance || 0,
            unstakedBalance: data.unstakedBalance || 0,
            delegatedTo: data.delegate,
            delegate: data.delegate,
            counter: data.counter || 0,
            type: data.type || "user",
        };
    } catch (error) {
        console.error("[Tezos] Error fetching account data:", error);
        return null;
    }
}

export async function fetchTezosBalance(address: string): Promise<number> {
    try {
        const accountData = await fetchTezosAccountData(address);
        return accountData ? accountData.balance / 1_000_000 : 0;
    } catch (error) {
        console.error("[Tezos] Error fetching balance:", error);
        return 0;
    }
}

export async function fetchTezosBalanceBreakdown(address: string): Promise<TezosBalanceBreakdown> {
    try {
        const accountData = await fetchTezosAccountData(address);
        if (!accountData) return { total: 0, spendable: 0, staked: 0, unstaked: 0 };

        const total = accountData.balance / 1_000_000;
        const staked = accountData.stakedBalance / 1_000_000;
        const unstaked = accountData.unstakedBalance / 1_000_000;
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
        const response = await rateLimitedTzKTFetch(
            `https://api.tzkt.io/v1/domains?address=${address}&reverse=true&limit=1`
        );
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

                    // NFTs typically have decimals of 0
                    if (metadata.decimals === 0) return false;

                    // Must have a reasonable symbol (fungible tokens have short symbols)
                    const hasValidSymbol =
                        metadata.symbol && metadata.symbol.length > 0 && metadata.symbol.length <= 10;
                    if (!hasValidSymbol) return false;

                    // Exclude if has NFT-specific metadata
                    const hasNFTMetadata =
                        metadata.artifactUri || metadata.displayUri || metadata.creators || metadata.formats;

                    // Exclude if it has a tokenId (fungible tokens usually don't have individual token IDs)
                    const hasTokenId = token.token.tokenId && token.token.tokenId !== "0";

                    // If it has NFT metadata AND a tokenId, it's likely an NFT
                    if (hasNFTMetadata && hasTokenId) return false;

                    // Additional check: if balance is exactly 1 with 0 decimals, likely NFT
                    const balanceValue = Number.parseFloat(token.balance);
                    if (balanceValue === 1 && metadata.decimals === 0) return false;

                    return true;
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
        const accountData = await fetchTezosAccountData(address);
        if (!accountData) return { status: "undelegated" as const };

        if (accountData.stakedBalance && accountData.stakedBalance > 0) {
            return {
                status: "staked" as const,
                delegatedTo: accountData.delegate?.address,
                stakedAmount: accountData.stakedBalance / 1_000_000,
            };
        } else if (accountData.delegate) {
            return {
                status: "delegated" as const,
                delegatedTo: accountData.delegate.address,
            };
        } else {
            return { status: "undelegated" as const };
        }
    } catch (error) {
        console.error("[Tezos] Error fetching delegation status:", error);
        return { status: "undelegated" as const };
    }
}

export async function fetchWalletRewards(address: string): Promise<WalletRewards | null> {
    try {
        // Fetch last 10 cycles to find one with actual paid rewards
        const response = await rateLimitedTzKTFetch(`https://api.tzkt.io/v1/rewards/delegators/${address}?limit=10`);

        if (!response.ok) return null;

        const data = await response.json();
        if (!data || data.length === 0) return null;

        // Find first cycle with actual paid rewards (non-zero)
        const rewardCycle = data.find((r: any) => {
            const stakingRewards =
                (r.attestationRewardsStakedOwn || 0) +
                (r.blockRewardsStakedOwn || 0) +
                (r.dalAttestationRewardsStakedOwn || 0) +
                (r.endorsementRewardsStakedOwn || 0);
            const delegatingRewards =
                (r.attestationRewardsDelegated || 0) +
                (r.blockRewardsDelegated || 0) +
                (r.dalAttestationRewardsDelegated || 0) +
                (r.endorsementRewardsDelegated || 0);
            return stakingRewards + delegatingRewards > 0;
        });

        // If no paid cycle found, use the most recent one for future rewards info
        const reward = rewardCycle || data[0];

        // Calculate staking rewards (delegator's own staked rewards)
        const stakingRewards =
            ((reward.attestationRewardsStakedOwn || 0) +
                (reward.blockRewardsStakedOwn || 0) +
                (reward.dalAttestationRewardsStakedOwn || 0) +
                (reward.endorsementRewardsStakedOwn || 0)) /
            1_000_000;

        // Calculate delegating rewards (delegator's share from delegating)
        const delegatingRewards =
            ((reward.attestationRewardsDelegated || 0) +
                (reward.blockRewardsDelegated || 0) +
                (reward.dalAttestationRewardsDelegated || 0) +
                (reward.endorsementRewardsDelegated || 0)) /
            1_000_000;

        // Calculate future rewards from the current cycle
        const currentCycle = data[0];
        const futureRewards =
            ((currentCycle.futureBlockRewards || 0) +
                (currentCycle.futureEndorsementRewards || 0) +
                (currentCycle.futureDalAttestationRewards || 0)) /
            1_000_000;

        const totalRewards = stakingRewards + delegatingRewards;

        return {
            cycle: reward.cycle,
            totalRewards,
            futureRewards,
            delegatedBalance: (reward.delegatedBalance || 0) / 1_000_000,
            stakingRewards,
            delegatingRewards,
            bakingPower: (reward.bakingPower || 0) / 1_000_000,
        };
    } catch (error) {
        console.error("[v0] Error fetching wallet rewards:", error);
        return null;
    }
}

export async function fetchDelegationDetails(address: string): Promise<DelegationDetails | null> {
    try {
        const accountResponse = await rateLimitedTzKTFetch(`https://api.tzkt.io/v1/accounts/${address}`);
        if (!accountResponse.ok) return null;
        const accountData = await accountResponse.json();

        if (!accountData.delegate) return null;

        const bakerAddress = accountData.delegate.address;
        const bakerAlias = accountData.delegate.alias || bakerAddress;

        // Get baker details for staking info - MUST fetch baker's own account data
        const bakerResponse = await rateLimitedTzKTFetch(`https://api.tzkt.io/v1/delegates/${bakerAddress}`);
        if (!bakerResponse.ok) {
            console.error(`[v0] Failed to fetch baker data for ${bakerAddress}`);
            return {
                baker: bakerAddress,
                bakerName: bakerAlias,
                stakingBalance: 0,
                stakingCapacity: 0,
                freeSpace: 0,
                fee: 0,
                estimatedRoi: 0,
            };
        }
        const bakerData = await bakerResponse.json();
        console.log(`[v0] Baker ${bakerAddress} stakedBalance:`, bakerData.stakedBalance);

        // Get rewards data for ROI and fee calculation
        const rewardsResponse = await rateLimitedTzKTFetch(
            `https://api.tzkt.io/v1/rewards/delegators/${address}?limit=1`
        );

        let estimatedRoi = 0;
        let fee = 0;

        if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            if (rewardsData && rewardsData.length > 0) {
                const reward = rewardsData[0];
                const bakingPower = reward.bakingPower || 0;

                // Calculate ROI from future rewards
                const futureRewards =
                    (reward.futureBlockRewards || 0) +
                    (reward.futureEndorsementRewards || 0) +
                    (reward.futureDalAttestationRewards || 0);

                if (bakingPower > 0 && futureRewards > 0) {
                    // Future rewards are for one cycle, annualize it (73 cycles per year approximately)
                    const annualRewards = futureRewards * 73;
                    estimatedRoi = annualRewards / bakingPower;
                }

                // Estimate fee from edge parameter (edgeOfBakingOverStaking)
                const edge = bakerData.edgeOfBakingOverStaking || 0;
                fee = edge / 1_000_000_000; // Convert from billionth to decimal
            }
        }

        const totalStaked = (bakerData.totalStakedBalance || 0) / 1_000_000;
        const bakerOwnStake = (bakerData.stakedBalance || 0) / 1_000_000; // Baker's own staked balance

        // Calculate total capacity: baker's own stake + (own stake * limit multiplier)
        // Formula: bakerOwnStake * (limitOfStakingOverBaking / 1_000_000 + 1)
        // Example: 1,845.296303 * (9 + 1) = 18,452.96303 XTZ total capacity
        const limit = bakerData.limitOfStakingOverBaking || 9000000;
        const stakingCapacity = bakerOwnStake * (limit / 1_000_000 + 1);
        const freeSpace = Math.max(0, stakingCapacity - totalStaked);

        return {
            baker: bakerAddress,
            bakerName: bakerData.alias || bakerAlias,
            stakingBalance: totalStaked,
            stakingCapacity,
            freeSpace,
            fee,
            estimatedRoi,
        };
    } catch (error) {
        console.error("[v0] Error fetching delegation details:", error);
        return null;
    }
}
export async function fetchTezosHistory(address: string, days = 30) {
    try {
        // Check localStorage first for historical data (immutable)
        const cacheKey = `tezos_history_${address}_${days}`;
        const cached = localStorage.getItem(cacheKey);
        const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours for historical data

        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < cacheExpiry) {
                return data;
            }
        }

        // For longer periods, use daily statistics for better performance
        const useDailyStats = days > 7;
        let response: Response;

        if (useDailyStats) {
            // Use daily balance statistics - much more efficient for long periods
            const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
            response = await rateLimitedTzKTFetch(
                `https://api.tzkt.io/v1/statistics/daily?address=${address}&from=${fromDate}&quote=usd,eur&limit=365`
            );
        } else {
            // Use balance_history for shorter periods with optimized step
            const totalSeconds = days * 24 * 60 * 60;
            const estimatedBlocks = Math.floor(totalSeconds / 30);
            const step = Math.max(1, Math.floor(estimatedBlocks / 100)); // More conservative step

            response = await rateLimitedTzKTFetch(
                `https://api.tzkt.io/v1/accounts/${address}/balance_history?step=${step}&quote=usd,eur&limit=500`
            );
        }

        if (!response.ok) return [];

        const data = await response.json();
        let processedData: Array<{
            level: number;
            timestamp: number;
            balance: number;
            usdValue?: number;
            eurValue?: number;
        }>;

        if (useDailyStats) {
            // Process daily statistics format
            processedData = data.map(
                (point: { level: number; date: string; balance: number; quote?: { usd?: number; eur?: number } }) => ({
                    level: point.level,
                    timestamp: new Date(point.date).getTime(),
                    balance: point.balance / 1_000_000, // Convert from mutez to XTZ
                    usdValue: point.quote?.usd,
                    eurValue: point.quote?.eur,
                })
            );
        } else {
            // Process balance_history format
            const recentData = data.slice(-100); // Limit to 100 most recent points
            processedData = recentData.map(
                (point: {
                    level: number;
                    timestamp: string;
                    balance: number;
                    quote?: { usd?: number; eur?: number };
                }) => ({
                    level: point.level,
                    timestamp: new Date(point.timestamp).getTime(),
                    balance: point.balance / 1_000_000, // Convert from mutez to XTZ
                    usdValue: point.quote?.usd,
                    eurValue: point.quote?.eur,
                })
            );
        }

        // Cache the processed data in localStorage
        localStorage.setItem(
            cacheKey,
            JSON.stringify({
                data: processedData,
                timestamp: Date.now(),
            })
        );

        return processedData;
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

        return data.map(
            (op: {
                type: string;
                hash: string;
                timestamp: string;
                amount?: number;
                sender?: { address: string };
                target?: { address: string };
                status: string;
            }) => ({
                type: op.type,
                hash: op.hash,
                timestamp: new Date(op.timestamp).getTime(),
                amount: op.amount ? op.amount / 1_000_000 : 0,
                sender: op.sender?.address,
                target: op.target?.address,
                status: op.status,
            })
        );
    } catch (error) {
        console.error("[v0] Error fetching Tezos operations:", error);
        return [];
    }
}
