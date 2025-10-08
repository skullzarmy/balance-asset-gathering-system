import RateKeeper from "rate-keeper";

// Coinbase API rate limit: 10 requests per second, but be conservative
const COINBASE_QUEUE_ID = 3001;
const COINBASE_DELAY = 500; // 500ms between calls

const rateLimitedCoinbaseFetch = RateKeeper(
    async (url: string) => {
        const response = await fetch(url);
        return response;
    },
    COINBASE_DELAY,
    { id: COINBASE_QUEUE_ID }
);

export interface PriceData {
    price: number;
    currency: string;
    timestamp: Date;
}

/**
 * Fetch current spot price for a currency pair from Coinbase
 * @param currencyPair - e.g., "XTZ-USD", "ETH-USD"
 */
export async function getCurrentPrice(currencyPair: string): Promise<number | null> {
    try {
        const response = await rateLimitedCoinbaseFetch(`https://api.coinbase.com/v2/prices/${currencyPair}/spot`);

        if (!response.ok) {
            console.error(`[pricing] Failed to fetch price for ${currencyPair}: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return Number.parseFloat(data.data.amount);
    } catch (error) {
        console.error(`[pricing] Error fetching current price for ${currencyPair}:`, error);
        return null;
    }
}

/**
 * Fetch historical spot price for a currency pair from Coinbase
 * @param currencyPair - e.g., "XTZ-USD", "ETH-USD"
 * @param date - Date object or YYYY-MM-DD string (UTC)
 */
export async function getHistoricalPrice(currencyPair: string, date: Date | string): Promise<number | null> {
    try {
        const dateStr = typeof date === "string" ? date : date.toISOString().split("T")[0];

        const response = await rateLimitedCoinbaseFetch(
            `https://api.coinbase.com/v2/prices/${currencyPair}/spot?date=${dateStr}`
        );

        if (!response.ok) {
            console.error(
                `[pricing] Failed to fetch historical price for ${currencyPair} on ${dateStr}: ${response.status}`
            );
            return null;
        }

        const data = await response.json();
        return Number.parseFloat(data.data.amount);
    } catch (error) {
        console.error(`[pricing] Error fetching historical price for ${currencyPair} on ${date}:`, error);
        return null;
    }
}

/**
 * Fetch current prices for multiple currency pairs
 */
export async function getCurrentPrices(currencyPairs: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    await Promise.all(
        currencyPairs.map(async (pair) => {
            const price = await getCurrentPrice(pair);
            if (price !== null) {
                prices.set(pair, price);
            }
        })
    );

    return prices;
}

/**
 * Fetch historical prices for multiple dates
 */
export async function getHistoricalPrices(
    currencyPair: string,
    dates: (Date | string)[]
): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    await Promise.all(
        dates.map(async (date) => {
            const dateStr = typeof date === "string" ? date : date.toISOString().split("T")[0];
            const price = await getHistoricalPrice(currencyPair, date);
            if (price !== null) {
                prices.set(dateStr, price);
            }
        })
    );

    return prices;
}

/**
 * Convert XTZ amount to USD using current price
 */
export async function convertXtzToUsd(xtzAmount: number): Promise<number | null> {
    const price = await getCurrentPrice("XTZ-USD");
    if (price === null) return null;
    return xtzAmount * price;
}

/**
 * Convert ETH amount to USD using current price
 */
export async function convertEthToUsd(ethAmount: number): Promise<number | null> {
    const price = await getCurrentPrice("ETH-USD");
    if (price === null) return null;
    return ethAmount * price;
}

/**
 * Convert XTZ amount to EUR using current price
 */
export async function convertXtzToEur(xtzAmount: number): Promise<number | null> {
    const price = await getCurrentPrice("XTZ-EUR");
    if (price === null) return null;
    return xtzAmount * price;
}

/**
 * Convert ETH amount to EUR using current price
 */
export async function convertEthToEur(ethAmount: number): Promise<number | null> {
    const price = await getCurrentPrice("ETH-EUR");
    if (price === null) return null;
    return ethAmount * price;
}

/**
 * Fetch all pricing data for a currency at once (USD and EUR)
 */
export async function getAllPrices(baseCurrency: "XTZ" | "ETH"): Promise<{
    usd: number | null;
    eur: number | null;
    timestamp: number;
}> {
    const [usd, eur] = await Promise.all([
        getCurrentPrice(`${baseCurrency}-USD`),
        getCurrentPrice(`${baseCurrency}-EUR`),
    ]);

    return {
        usd,
        eur,
        timestamp: Date.now(),
    };
}
