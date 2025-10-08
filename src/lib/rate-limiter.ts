import RateKeeper from "rate-keeper";

// TzKT API rate limit: ~1 request per second to be safe (conservative)
const TZKT_QUEUE_ID = 1001;
const TZKT_DELAY = 1000; // 1 second between calls

// Etherlink RPC rate limit: ~5 requests per second
const ETHERLINK_QUEUE_ID = 2001;
const ETHERLINK_DELAY = 200; // 200ms between calls

// Rate-limited fetch wrapper for TzKT API
export const rateLimitedTzKTFetch = RateKeeper(
    async (url: string, options?: RequestInit) => {
        const response = await fetch(url, options);
        return response;
    },
    TZKT_DELAY,
    { id: TZKT_QUEUE_ID }
);

// Rate-limited fetch wrapper for Etherlink RPC
export const rateLimitedEtherlinkFetch = RateKeeper(
    async (url: string, options?: RequestInit) => {
        const response = await fetch(url, options);
        return response;
    },
    ETHERLINK_DELAY,
    { id: ETHERLINK_QUEUE_ID }
);
