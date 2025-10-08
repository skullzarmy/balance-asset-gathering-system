# 💰 B.A.G.S.

**Balance & Asset Gathering System**

A portfolio tracker for Tezos & Etherlink wallets that actually works. A FAFO ~~lab~~ joint.

[![Built with Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

### 🔍 Multi-Wallet Support

-   Track unlimited Tezos (XTZ) wallets
-   Track unlimited Etherlink (EVM) wallets
-   Automatic balance aggregation across all wallets
-   Support for .tez domain resolution

### 💼 Comprehensive Portfolio View

-   Real-time balance tracking for native assets (XTZ, ETH)
-   FA2/FA1.2 token support for Tezos
-   ERC-20 token support for Etherlink
-   Historical balance charting
-   Portfolio timeline with snapshots
-   Chain breakdown visualization

### 📊 Analytics & Insights

-   Top tokens by balance across all wallets
-   Portfolio statistics and trends
-   Balance history over time
-   Token distribution charts
-   Activity feed tracking

### 🎨 User Experience

-   Fully responsive mobile design
-   Dark mode support
-   Smooth animations with Framer Motion
-   Smart wallet auto-detection
-   Import/Export functionality (v2.0 format)
-   Privacy-focused (all data stored locally)

### 🔒 Privacy First

-   **No backend servers** - everything runs in your browser
-   **No data collection** - your wallet addresses never leave your device
-   **No tracking** - no analytics, no cookies, no surveillance
-   **Local storage only** - all data stored in your browser's localStorage

## 🚀 Getting Started

### Prerequisites

-   [Bun](https://bun.sh/) (recommended) or Node.js 18+

### Installation

```bash
# Clone the repository
git clone https://github.com/skullzarmy/balance-asset-gathering-system.git
cd balance-asset-gathering-system

# Install dependencies
bun install
# or
npm install

# Run the development server
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Built With

### Core Technologies

-   **[Next.js 15](https://nextjs.org/)** - React framework with App Router
-   **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
-   **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
-   **[Motion](https://motion.dev/)** - Framer Motion for animations

### UI Components

-   **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
-   **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
-   **[Lucide React](https://lucide.dev/)** - Beautiful icon set
-   **[Recharts](https://recharts.org/)** - Composable charting library

### Data Sources

-   **[TzKT API](https://tzkt.io/)** - Tezos blockchain indexer
-   **[Etherlink Explorer](https://explorer.etherlink.com/)** - Etherlink blockchain data

## 📦 Project Structure

```
balance-asset-gathering-system/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout with metadata
│   │   ├── page.tsx           # Dashboard page
│   │   ├── privacy/           # Privacy policy page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── add-wallet-dialog.tsx
│   │   ├── dashboard-overview.tsx
│   │   ├── portfolio-stats.tsx
│   │   ├── wallet-card.tsx
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   │   └── use-wallets.ts    # Wallet management hook
│   ├── lib/                   # Utilities and core logic
│   │   ├── blockchain/        # Blockchain integrations
│   │   │   ├── etherlink.ts  # Etherlink data fetching
│   │   │   └── tezos.ts      # Tezos data fetching
│   │   ├── analytics.ts       # Portfolio analytics
│   │   ├── types.ts           # TypeScript type definitions
│   │   ├── wallet-storage.tsx # LocalStorage management
│   │   └── site-config.ts     # Site configuration
│   └── components/ui/         # shadcn/ui components
├── public/                    # Static assets
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## 🎯 Usage

### Adding Wallets

1. Click the "**+ Add Wallet**" button
2. Enter a Tezos address (tz1...), .tez domain, or Etherlink address (0x...)
3. B.A.G.S. will auto-detect the chain and fetch balances
4. Optionally add a nickname for easy identification

### Viewing Portfolio

-   **Dashboard Overview**: See all wallets with balances and portfolio stats
-   **Balance History**: Track portfolio value over time
-   **Chain Breakdown**: Visualize asset distribution across chains
-   **Top Tokens**: View your most held tokens across all wallets
-   **Activity Feed**: Monitor recent wallet activity

### Import/Export

-   **Export**: Download your wallet list as JSON (v2.0 format)
-   **Import**: Upload a previously exported JSON file to restore wallets
-   Supports migration from v1.0 format

## 🔐 Privacy & Security

B.A.G.S. is built with privacy as a core principle:

-   ✅ **Client-side only** - No server, no database
-   ✅ **Open source** - Fully auditable code
-   ✅ **No API keys required** - Uses public blockchain data
-   ✅ **No wallet connection** - View-only, read addresses from public APIs
-   ✅ **Local storage** - Data never leaves your browser

> ⚠️ **Note**: B.A.G.S. is a portfolio tracker only. It cannot sign transactions or access your funds. Always verify addresses before sending crypto.

## 🤝 Contributing

Contributions are welcome! This is a FAFO joint, so feel free to experiment and break things.

### Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
bun dev

# Build to verify production readiness
bun build

# Commit with a descriptive message
git commit -m "✨ Add your feature"

# Push and create a pull request
git push origin feature/your-feature-name
```

### Code Style

-   Use TypeScript for type safety
-   Follow existing component patterns
-   Keep components focused and reusable
-   Add comments for complex logic
-   Use descriptive variable names

## 📝 License

[MIT License](LICENSE) - Feel free to use this project however you want.

## 🙏 Acknowledgments

-   **[TzKT](https://tzkt.io/)** - Excellent Tezos blockchain indexer
-   **[Etherlink](https://etherlink.com/)** - EVM-compatible layer 2 on Tezos
-   **[Fileship.xyz](https://fileship.xyz)** - IPFS gateway for token metadata
-   **FAFO Community** - For the vibes and the chaos

## 🐛 Known Issues & Roadmap

### Current Limitations

-   Token prices not yet implemented (coming soon!)
-   Historical data limited to created snapshots
-   No NFT gallery view (intentionally filtered for now)

### Planned Features

-   [ ] Token price integration via DEX aggregators
-   [ ] USD/EUR portfolio valuation
-   [ ] Advanced analytics and trends
-   [ ] Mobile app (PWA)
-   [ ] Multi-device sync (optional, privacy-respecting)
-   [ ] Custom token lists
-   [ ] DeFi position tracking

## 💬 Support

-   **Issues**: [GitHub Issues](https://github.com/skullzarmy/balance-asset-gathering-system/issues)
-   **Discussions**: [GitHub Discussions](https://github.com/skullzarmy/balance-asset-gathering-system/discussions)

---

Made with ☕ and chaos by [@skullzarmy](https://github.com/skullzarmy)

[**a FAFO ~~lab~~ joint**](https://fafolab.xyz)
