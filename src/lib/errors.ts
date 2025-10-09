// Enhanced error types for blockchain APIs
export class BlockchainError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode?: number,
        public readonly endpoint?: string
    ) {
        super(message);
        this.name = "BlockchainError";
    }
}

export class NetworkError extends BlockchainError {
    constructor(message: string, endpoint?: string) {
        super(message, "NETWORK_ERROR", undefined, endpoint);
        this.name = "NetworkError";
    }
}

export class RateLimitError extends BlockchainError {
    constructor(message: string, endpoint?: string) {
        super(message, "RATE_LIMIT_ERROR", 429, endpoint);
        this.name = "RateLimitError";
    }
}

export class APIError extends BlockchainError {
    constructor(message: string, statusCode: number, endpoint?: string) {
        super(message, "API_ERROR", statusCode, endpoint);
        this.name = "APIError";
    }
}

export class TimeoutError extends BlockchainError {
    constructor(message: string, endpoint?: string) {
        super(message, "TIMEOUT_ERROR", 408, endpoint);
        this.name = "TimeoutError";
    }
}

// Error handling utilities
export function handleFetchError(error: unknown, endpoint: string): never {
    if (!navigator.onLine) {
        throw new NetworkError("No internet connection", endpoint);
    }

    if (error instanceof Error) {
        if (error.name === "AbortError") {
            throw new TimeoutError("Request timed out", endpoint);
        }

        if (error.message?.includes("Failed to fetch")) {
            throw new NetworkError("Unable to connect to blockchain services", endpoint);
        }

        throw new BlockchainError(error.message || "Unknown error occurred", "UNKNOWN_ERROR", undefined, endpoint);
    }

    throw new BlockchainError("Unknown error occurred", "UNKNOWN_ERROR", undefined, endpoint);
}

export function handleAPIResponse(response: Response, endpoint: string): void {
    if (response.status === 429) {
        throw new RateLimitError("Too many requests. Please wait before trying again.", endpoint);
    }

    if (response.status >= 500) {
        throw new APIError("Blockchain services are temporarily unavailable", response.status, endpoint);
    }

    if (!response.ok) {
        throw new APIError(`API request failed: ${response.status} ${response.statusText}`, response.status, endpoint);
    }
}

// Enhanced fetch wrapper with better error handling
export async function enhancedFetch(url: string, options?: RequestInit, timeout = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        handleAPIResponse(response, url);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        handleFetchError(error, url);
    }
}

// Type guards for error handling
export function isNetworkError(error: Error): error is NetworkError {
    return error instanceof NetworkError;
}

export function isRateLimitError(error: Error): error is RateLimitError {
    return error instanceof RateLimitError;
}

export function isAPIError(error: Error): error is APIError {
    return error instanceof APIError;
}

export function isTimeoutError(error: Error): error is TimeoutError {
    return error instanceof TimeoutError;
}

export function isBlockchainError(error: Error): error is BlockchainError {
    return error instanceof BlockchainError;
}
