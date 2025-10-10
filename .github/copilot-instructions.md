# B.A.G.S. AI Agent Instructions

B.A.G.S. (Balance & Asset Gathering System) is a privacy-first portfolio tracker for Tezos and Etherlink wallets built with Next.js 15, TypeScript, and TanStack Query.

## Architecture Overview

### Core Design Principles

-   **Privacy-first**: No backend, no data collection, everything runs client-side using localStorage
-   **Multi-chain support**: Tezos (native + FA2/FA1.2 tokens) and Etherlink (ETH + ERC-20 tokens)
-   **Real-time data**: Blockchain APIs (TzKT, Etherlink Explorer) with aggressive caching via TanStack Query
-   **PWA-ready**: Service workers, offline support, and mobile-optimized experience

### Data Flow Architecture

1. **Wallet Storage** (`src/lib/wallet-storage.tsx`): localStorage abstraction with import/export
2. **Blockchain Integration** (`src/lib/blockchain/`): API adapters for TzKT and Etherlink Explorer
3. **Query Layer** (`src/lib/queries.ts` + `src/lib/query-client.ts`): TanStack Query with optimistic mutations
4. **State Management** (`src/hooks/use-wallets.ts`): Custom hook combining localStorage and remote data

## Key Patterns & Conventions

### Wallet Management Pattern

```typescript
// Always use the central hook for wallet operations
const { wallets, addWallet, removeWallet, refreshWallet } = useWallets();

// Wallet IDs follow format: `${type}-${address}-${timestamp}`
// Types are strictly "tezos" | "etherlink"
```

### Blockchain Data Fetching

-   **Rate limiting**: All API calls go through `rateLimitedTzKTFetch()` rate limiter
-   **Parallel fetching**: Use Promise.all for independent data (balance, tokens, delegation)
-   **Error resilience**: All blockchain calls have `.catch(() => fallback)` for graceful degradation

### Query Management

```typescript
// Use structured query keys from query-client.ts
queryKeys.tezos.breakdown(address);
queryKeys.etherlink.tokens(address);

// Optimistic mutations with rollback on error
// See use-wallets.ts addWalletMutation pattern
```

### Component Structure

-   **Page-level**: `src/app/` (Next.js App Router)
-   **Feature components**: `src/components/` (wallet-card, dashboard-overview, etc.)
-   **UI primitives**: `src/components/ui/` (shadcn/ui components)
-   **Custom hooks**: `src/hooks/` (use-wallets, use-cache-persistence, etc.)

## Development Workflows

### Adding New Wallet Types

1. Extend `WalletType` union in `src/lib/types.ts`
2. Create blockchain adapter in `src/lib/blockchain/[chain].ts`
3. Add queries in `src/lib/queries.ts`
4. Update `useWallets` hook for new type
5. Add UI components for chain-specific features

### Working with Blockchain APIs

```bash
# TzKT API (Tezos) - all amounts in mutez, divide by 1_000_000
https://api.tzkt.io/v1/accounts/{address}
https://api.tzkt.io/v1/tokens/balances?account={address}

# Etherlink Explorer - native ETH + ERC-20 tokens
https://explorer.etherlink.com/api/v2/addresses/{address}
```

### Token Filtering Logic

-   **Tezos**: Exclude NFTs (decimals=0, individual tokenIds, NFT metadata)
-   **Etherlink**: Standard ERC-20 filtering
-   See `fetchTezosTokens()` for NFT detection patterns

### Build & Deployment

```bash
bun dev        # Development with hot reload
bun build      # Production build with PWA generation
bun start      # Production server
```

## Project-Specific Gotchas

### localStorage State Synchronization

-   Changes to `walletStorage` must also update React state via `setWallets()`
-   Use `walletStorage.getWallets()` to sync after mutations
-   TanStack Query cache and localStorage can drift - always sync both

### TzKT API Peculiarities

-   Delegation vs staking: `delegatedTo` (old) vs `stakedBalance` (new Tezos consensus)
-   Domain resolution requires separate API call to `/domains` endpoint
-   Historical data needs `step` parameter to avoid massive payloads

### PWA Configuration

-   Service worker caches TzKT API calls for 5 minutes via `next-pwa`
-   Offline fallback page at `/_offline`
-   Manifest and icons configured in `app/layout.tsx`

### Type Safety Patterns

```typescript
// Always use discriminated unions for wallet types
if (wallet.type === "tezos") {
    // TypeScript narrows to TezosWallet
    wallet.stakedBalance; // ✅ Available
}

// Use branded types for addresses to prevent mixing chains
type TezosAddress = string & { __brand: "TezosAddress" };
```

### Error Handling Strategy

-   Blockchain API failures → graceful degradation with cached/default data
-   Rate limiting → exponential backoff via TanStack Query retry logic
-   Network errors → show stale data with retry options
-   Never throw errors to UI - always provide fallback states

## Key Files Reference

-   `src/hooks/use-wallets.ts` - Central wallet state management
-   `src/lib/wallet-storage.tsx` - localStorage persistence layer
-   `src/lib/blockchain/tezos.ts` - Tezos API integration
-   `src/lib/query-client.ts` - TanStack Query configuration
-   `src/lib/analytics.ts` - Portfolio calculation utilities
-   `src/components/dashboard-overview.tsx` - Main UI orchestration

When working on this codebase, prioritize privacy, error resilience, and maintaining the client-side-only architecture.
