# Contributing to BAGS 💰

First off, thanks for taking the time to contribute! This is a FAFO ~~lab~~ joint, so don't be afraid to experiment and break things.

## Code of Conduct

Be cool. Don't be a jerk. We're all here to build something useful.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

-   **Use a clear and descriptive title**
-   **Describe the exact steps to reproduce the problem**
-   **Provide specific examples** (wallet addresses, screenshots, etc.)
-   **Describe the behavior you observed and what you expected**
-   **Include browser/OS information**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

-   **Use a clear and descriptive title**
-   **Provide a detailed description of the suggested enhancement**
-   **Explain why this enhancement would be useful**
-   **List some examples of how it would work**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** with clear, descriptive commits
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request**

## Development Workflow

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/balance-asset-gathering-system.git
cd balance-asset-gathering-system

# Install dependencies
bun install

# Start development server
bun dev
```

### Making Changes

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Test your changes
bun dev

# Build to verify production readiness
bun build

# Commit your changes
git add .
git commit -m "✨ Add your feature"

# Push to your fork
git push origin feature/your-feature-name
```

### Commit Messages

We use descriptive commit messages with emoji prefixes:

-   ✨ `:sparkles:` - New feature
-   🐛 `:bug:` - Bug fix
-   📝 `:memo:` - Documentation
-   🎨 `:art:` - UI/styling changes
-   ♻️ `:recycle:` - Refactoring
-   ⚡ `:zap:` - Performance improvements
-   🔒 `:lock:` - Security fixes
-   🚀 `:rocket:` - Deployment/releases
-   🧪 `:test_tube:` - Experiments

Example:

```
✨ Add token price fetching from QuipuSwap
🐛 Fix balance calculation for FA2 tokens
📝 Update README with new features
```

## Code Style

### TypeScript

-   Use TypeScript for all new code
-   Define proper types/interfaces (avoid `any`)
-   Use descriptive variable and function names
-   Add JSDoc comments for complex functions

### React Components

-   Use functional components with hooks
-   Keep components focused and single-purpose
-   Extract reusable logic into custom hooks
-   Use proper prop types with TypeScript

Example:

```typescript
interface WalletCardProps {
    wallet: Wallet;
    onDelete?: (id: string) => void;
}

export function WalletCard({ wallet, onDelete }: WalletCardProps) {
    // Component implementation
}
```

### File Organization

-   Components in `src/components/`
-   Hooks in `src/hooks/`
-   Utilities in `src/lib/`
-   Blockchain logic in `src/lib/blockchain/`
-   Types in `src/lib/types.ts`

### Styling

-   Use Tailwind CSS utility classes
-   Follow existing component patterns
-   Use `cn()` helper for conditional classes
-   Keep responsive design in mind

## Testing

While we don't have automated tests yet (PRs welcome!), please manually test:

-   ✅ Desktop browsers (Chrome, Firefox, Safari)
-   ✅ Mobile browsers (iOS Safari, Chrome)
-   ✅ Dark mode
-   ✅ Edge cases (empty states, errors, loading)
-   ✅ Different wallet types (Tezos, Etherlink, .tez domains)

## Privacy & Security Guidelines

BAGS is privacy-first. When contributing, ensure:

-   ✅ No data sent to external servers (except public blockchain APIs)
-   ✅ No analytics or tracking code
-   ✅ All user data stored locally only
-   ✅ No API keys or secrets in code
-   ✅ Wallet addresses never logged or transmitted

## Project-Specific Guidelines

### Blockchain Integrations

When adding new blockchain support:

1. Create new file in `src/lib/blockchain/`
2. Implement consistent interface matching existing chains
3. Handle errors gracefully
4. Rate limit API calls appropriately
5. Document API endpoints used

### Adding Features

Before implementing a major feature:

1. Open an issue to discuss the approach
2. Get feedback from maintainers
3. Break into smaller PRs if possible
4. Update relevant documentation

### Performance

-   Avoid unnecessary re-renders
-   Use React.memo() for expensive components
-   Debounce user inputs
-   Lazy load large components
-   Optimize images and assets

## Need Help?

-   💬 **Questions?** Open a [GitHub Discussion](https://github.com/skullzarmy/balance-asset-gathering-system/discussions)
-   🐛 **Found a bug?** Open an [Issue](https://github.com/skullzarmy/balance-asset-gathering-system/issues)
-   💡 **Have an idea?** Start a [Discussion](https://github.com/skullzarmy/balance-asset-gathering-system/discussions)

## Recognition

Contributors will be recognized in the README. Significant contributions may earn you a spot in the FAFO hall of fame. 🏆

---

**Remember**: This is a FAFO joint. Experiment, break things, learn, and have fun! 💰

Thanks for contributing! 🙏
