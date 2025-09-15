# 🔨 CloakForge

> **The Ultimate Solana Token Management Suite**
>
> Professional-grade tools for creating, managing, and controlling Solana SPL tokens with complete privacy and security.

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Solana](https://img.shields.io/badge/Blockchain-Solana-9945FF?style=flat-square&logo=solana)](https://solana.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

## 🌟 Overview

CloakForge is a comprehensive, privacy-first platform for Solana blockchain token management. Built with modern web technologies and designed for both developers and non-technical users, it provides a complete suite of tools for token creation, management, and distribution.

### ✨ Key Features

- **🪙 Token Creator** - Create custom SPL tokens with advanced features
- **🔥 Token Burner** - Permanently reduce token supply with secure burning
- **💧 Liquidity Management** - Create and manage liquidity pools (Coming Soon)
- **📤 Multi-Sender** - Batch token transfers to multiple recipients
- **🔒 Authority Management** - Revoke mint/freeze authorities for decentralization
- **📊 Portfolio Tracker** - Monitor your Solana assets and transactions
- **🛡️ Privacy-First** - Zero data collection, no tracking, complete anonymity

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/MrDalo/cloakforge.git
cd cloakforge

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

```env
# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=your_rpc_endpoint

# Contentful CMS (Optional)
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_access_token

# IPFS Configuration
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY_URL=your_gateway_url

# Logging
LOG_LEVEL=info
```

## 🛠️ Tech Stack

### Frontend

- **[Next.js 15](https://nextjs.org)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org)** - Type safety and enhanced DX
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion)** - Smooth animations and interactions
- **[Radix UI](https://www.radix-ui.com)** - Accessible, unstyled UI components

### Blockchain & Web3

- **[@solana/web3.js](https://solana-labs.github.io/solana-web3.js)** - Solana JavaScript SDK
- **[@solana/spl-token](https://spl.solana.com)** - SPL Token library
- **[@solana/wallet-adapter](https://github.com/solana-labs/wallet-adapter)** - Wallet integration

### State Management & Data

- **[React Query](https://tanstack.com/query)** - Server state management
- **[Zustand](https://github.com/pmndrs/zustand)** - Client state management
- **[React Hook Form](https://react-hook-form.com)** - Form handling with validation
- **[Zod](https://zod.dev)** - Schema validation

### Development & Quality

- **[ESLint](https://eslint.org)** - Code linting
- **[Prettier](https://prettier.io)** - Code formatting
- **[Husky](https://typicode.github.io/husky)** - Git hooks
- **[Pino](https://getpino.io)** - High-performance logging

## 📁 Project Structure

```
cloakforge/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── tools/              # Tool-specific pages
│   │   │   ├── token-creator/
│   │   │   ├── burn-tokens/
│   │   │   ├── create-liquidity/
│   │   │   └── transaction-multisender/
│   │   └── api/                # API routes
│   ├── components/             # Reusable components
│   │   ├── common/             # Shared components
│   │   ├── pages/              # Page-specific components
│   │   └── ui/                 # Base UI components
│   ├── hooks/                  # Custom React hooks
│   │   ├── queries/            # React Query hooks
│   │   └── mutations/          # Mutation hooks
│   ├── lib/                    # Utility libraries
│   │   ├── solana/             # Solana-specific utilities
│   │   ├── logger/             # Logging system
│   │   └── utils/              # General utilities
│   ├── providers/              # React context providers
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
└── docs/                       # Documentation
```

## 🎯 Available Tools

### 1. Token Creator

Create professional SPL tokens with:

- Custom metadata and branding
- Authority management
- IPFS metadata storage
- Devnet testing support
- Batch operations

### 2. Token Burner

Permanently reduce token supply:

- Secure token burning
- Batch burning support
- Supply management
- Deflationary tokenomics

### 3. Multi-Sender

Distribute tokens efficiently:

- Batch transactions (up to 500 recipients)
- CSV import support
- Cost optimization
- Transaction tracking

### 4. Authority Management

Decentralize your tokens:

- Revoke mint authority
- Revoke freeze authority
- Transfer ownership
- Security best practices

### 5. Portfolio Tracker

Monitor your assets:

- Real-time balance tracking
- Transaction history
- Token analytics
- Portfolio overview

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint:nowarn     # Lint with zero warnings
npm run lint:fix        # Auto-fix linting issues
npm run format          # Check code formatting
npm run format:fix      # Auto-format code
```

### Code Quality Standards

- **ESLint**: Strict linting rules with zero warnings policy
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict type checking
- **Husky**: Pre-commit hooks for quality assurance

### Adding New Tools

1. Create page in `src/app/tools/[tool-name]/`
2. Add components in `src/components/pages/[ToolName]Page/`
3. Implement business logic in `src/lib/`
4. Add types in `src/types/`
5. Update navigation and routing

## 🛡️ Security & Privacy

### Privacy-First Design

- **Zero Data Collection**: No personal information stored
- **No Tracking**: No analytics, cookies, or user tracking
- **Client-Side Processing**: All operations happen in your browser
- **Self-Custody**: Your wallet remains under your complete control

### Security Features

- **Audited Smart Contracts**: Industry-standard security practices
- **Hardware Wallet Support**: Integration with Ledger and other hardware wallets
- **Multi-Signature Support**: Enhanced security for enterprise use
- **Open Source**: Transparent and auditable codebase

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
npm i -g vercel
vercel
```

### Docker

```bash
# Build and run with Docker
docker build -t cloakforge .
docker run -p 3000:3000 cloakforge
```

### Environment Setup

1. Configure environment variables
2. Set up RPC endpoints
3. Configure IPFS storage
4. Test on devnet before mainnet

## 📚 Documentation

- [Tool Configuration Guide](./docs/tool-configuration.md)
- [Error Handling Strategy](./docs/ERROR_HANDLING_STRATEGY.md)
- [API Documentation](./docs/api.md)
- [Component Library](./docs/components.md)
- [Copilot Instructions](./.github/.copilot-instructions.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- **Website**: [cloakforge.app](https://cloakforge.app)
- **Documentation**: [docs.cloakforge.app](https://docs.cloakforge.app)
- **Twitter**: [@cloakforge](https://twitter.com/cloakforge)
- **Discord**: [Join our community](https://discord.gg/cloakforge)

## 💎 Why CloakForge?

- **🏆 Lowest Fees**: Transparent pricing with no hidden costs
- **🚀 Lightning Fast**: Built on Solana's high-performance blockchain
- **🔒 Enterprise Security**: Military-grade encryption and security
- **🌍 Global Access**: Available worldwide with mobile optimization
- **🛠️ Developer Friendly**: Comprehensive APIs and documentation
- **🤝 Community Driven**: Open source with active community support

---

<div align="center">

**Built with ❤️ for the Solana ecosystem**

[⭐ Star us on GitHub](https://github.com/MrDalo/cloakforge) • [🐛 Report Bug](https://github.com/MrDalo/cloakforge/issues) • [💡 Request Feature](https://github.com/MrDalo/cloakforge/issues)

</div>
