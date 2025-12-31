# Cryptopunk

This repository contains two on-chain data projects:

1. **Solana (NEW): Pump.fun Launch Radar + Rug-Risk Scanner**
2. **Ethereum (Legacy): The Graph subgraph for CryptoPunksMarket**

The goal of the Solana project is to detect new Pump.fun token creations in near real-time and generate an explainable, heuristic "rug-risk" report (mint/freeze authorities, holder concentration, metadata presence). It is designed as a practical, production-ready indexing pipeline: webhook ingestion, idempotency, async processing, persistence, and an API for consumers.

---

## Getting Started (For Beginners)

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

1. **Node.js** (version 20 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

### Installation Steps

#### Option 1: Setting Up the Solana Pump Radar Project

```bash
# 1. Clone the repository
git clone https://github.com/Keya-Moradi/Cryptopunk.git
cd Cryptopunk/solana-pump-radar

# 2. Install dependencies
npm install

# 3. Set up your environment variables
cp .env.example .env

# 4. Edit the .env file with your configuration
# You'll need:
#   - A Solana RPC URL (get free tier from Helius, QuickNode, or Alchemy)
#   - A webhook secret (generate with: openssl rand -hex 32)

# 5. Set up the database
npm run db:generate
npm run db:migrate

# 6. Start the development server
npm run dev

# 7. In a new terminal, test the webhook (optional)
npm run replay
```

Your server should now be running at `http://localhost:3000`!

#### Option 2: Working with the Ethereum Subgraph

```bash
# 1. Clone the repository (if not already done)
git clone https://github.com/Keya-Moradi/Cryptopunk.git
cd Cryptopunk/liveatethglobalwaterloo

# 2. Install dependencies
npm install

# 3. Follow The Graph documentation for deployment
# See: https://thegraph.com/docs/
```

### Quick Start Checklist

- [ ] Node.js 20+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env` file)
- [ ] Database migrations run (`npm run db:migrate`)
- [ ] Server running (`npm run dev`)
- [ ] Tested webhook endpoint (optional: `npm run replay`)

### Common Issues

**Issue: "npm: command not found"**
- Solution: Install Node.js from https://nodejs.org/

**Issue: "Port 3000 already in use"**
- Solution: Change the `PORT` in your `.env` file to a different port (e.g., 3001)

**Issue: Database migration fails**
- Solution: Delete `solana-pump-radar/prisma/dev.db` and run `npm run db:migrate` again

For more detailed troubleshooting, see the [Solana Pump Radar README](solana-pump-radar/README.md).

---

## 1) Solana: Pump.fun Launch Radar + Rug-Risk Scanner

**Location:** [solana-pump-radar/](solana-pump-radar/)

### What it does
- Ingests real-time Solana transaction events via webhooks (raw or enhanced)
- Detects Pump.fun token **create** events using instruction parsing
- Stores launches (signature, slot/time, mint, raw payload)
- Computes a risk score + label (**LOW / MED / HIGH**) with explicit reasons
- Serves a REST API:
  - `POST /webhooks/helius` - Webhook ingestion endpoint
  - `GET /launches` - List all detected token launches
  - `GET /tokens/:mint` - Get risk analysis for specific token
  - `GET /healthz` - Health check endpoint

### Core Features Delivered

**Backend Server:** Fastify-based REST API with webhook ingestion
**Detection Engine:** Pump.fun instruction parser (program ID + discriminator matching)
**Risk Scorer:** Heuristic-based analysis (authorities, holder concentration, metadata)
**Processing Queue:** Async job processing with p-queue
**Database:** SQLite + Prisma with migrations
**Tests:** Vitest test suite with detector unit tests
**CI/CD:** GitHub Actions workflow with quality gates

### Quick Start
```bash
cd solana-pump-radar
cp .env.example .env
# Edit .env with your SOLANA_RPC_URL and WEBHOOK_SECRET
npm install
npm run db:generate
npm run db:migrate
npm run dev

# Test in another terminal:
npm run replay
```

### Architecture Highlights
- **Webhook → Detection → Storage → Queue → Risk Scoring**
- SQLite for MVP (easy PostgreSQL migration later)
- Raw webhooks for reliable instruction parsing
- Heuristic scoring (0-100 with LOW/MED/HIGH labels)
- 3 concurrent risk computations (configurable)

### Documentation
All comprehensive documentation is located in [solana-pump-radar/docs/](solana-pump-radar/docs/):

- [PRD.md](solana-pump-radar/docs/PRD.md) - Product requirements, scope, acceptance criteria
- [DECISION_LOG.md](solana-pump-radar/docs/DECISION_LOG.md) - Technical decisions with rationale
- [RISK_REGISTER.md](solana-pump-radar/docs/RISK_REGISTER.md) - FMEA-lite risk analysis
- [RUNBOOK.md](solana-pump-radar/docs/RUNBOOK.md) - Operations guide (deploy, monitor, troubleshoot)
- [CODEX_SAFE.md](solana-pump-radar/docs/CODEX_SAFE.md) - AI-assisted development safety rules
- [HELLFIRE_MODE.md](solana-pump-radar/docs/HELLFIRE_MODE.md) - Non-negotiable quality gates
- [IMPLEMENTATION_SUMMARY.md](solana-pump-radar/docs/IMPLEMENTATION_SUMMARY.md) - Complete implementation overview

See the full [Solana Pump Radar README](solana-pump-radar/README.md) for detailed setup and usage instructions.

### Quality Gates (Enforced by CI)
- ✅ Lint + Prettier formatting
- ✅ TypeScript strict mode
- ✅ All tests pass
- ✅ Build succeeds
- ✅ No secrets in code

### Next Steps
1. Set up RPC provider (Helius/QuickNode/Alchemy recommended)
2. Generate webhook secret: `openssl rand -hex 32`
3. Configure webhook provider (Helius example in README)
4. Deploy with PM2 or systemd
5. Set up monitoring (health checks, logs)

---

## 2) Ethereum (Legacy): CryptoPunksMarket Subgraph (The Graph)

**Location:** [liveatethglobalwaterloo/](liveatethglobalwaterloo/)

### What this is
A subgraph configuration targeting `0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB` (CryptoPunksMarket) on Ethereum mainnet. AssemblyScript mappings that process events such as `Assign`, `Transfer`, `PunkBought`, and others. A GraphQL schema describing indexed entities and tests for mapping behavior.

### Repo layout
- [liveatethglobalwaterloo/](liveatethglobalwaterloo/) - The Graph subgraph project (schema, mappings, tests, and deployment config)
- [abis/](abis/) - Contract ABI artifacts used by the subgraph

### Tech Stack
- The Graph (`@graphprotocol/graph-cli`, `@graphprotocol/graph-ts`)
- AssemblyScript for mappings
- GraphQL schema
- Node.js tooling and `matchstick-as` for tests
- Docker (local Graph node stack via `docker-compose.yml`)

---

## Important Notes

**Webhooks can be retried and duplicated.** The pipeline must be idempotent (dedupe by signature).

**Risk scores are heuristics, not guarantees.** This is not financial advice.

**No modifications to existing code.** All Solana work is isolated in `solana-pump-radar/` - the existing `liveatethglobalwaterloo/` codebase remains untouched.

---

## Screenshots & Visuals

### Solana Pump Radar API Examples

**Note:** Screenshots will be added as the application is deployed and used. For now, you can test the API endpoints locally using the examples in the [API Documentation](solana-pump-radar/README.md#api-endpoints).

#### Example API Response Structure

**GET /launches** - List recent token launches:

```json
{
  "launches": [
    {
      "signature": "5Q9p...",
      "slot": "250000000",
      "blockTime": "2024-01-01T00:00:00.000Z",
      "mint": "MintAbc123...",
      "creator": "7NpF...",
      "source": "pumpfun"
    }
  ],
  "count": 1
}
```

**GET /tokens/:mint** - Token risk analysis:

```json
{
  "risk": {
    "score": 65,
    "label": "HIGH",
    "reasons": [
      "Mint authority is active - creator can mint unlimited tokens",
      "Freeze authority is active - creator can freeze accounts"
    ]
  }
}
```

### Architecture Diagram

See the complete architecture diagram in the [Solana Pump Radar README](solana-pump-radar/README.md#architecture).

---

## Works Cited & References

### Technologies & Tools Used

#### Solana Pump.fun Launch Radar

**Runtime & Language:**

- [Node.js](https://nodejs.org/) - JavaScript runtime environment
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript superset

**Web Framework:**

- [Fastify](https://fastify.dev/) - Fast and low overhead web framework for Node.js

**Blockchain Integration:**

- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) - JavaScript SDK for Solana blockchain
- [Solana RPC API](https://docs.solana.com/api/) - Solana Remote Procedure Call API
- [Pump.fun](https://pump.fun/) - Solana token launch platform (Program ID: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`)

**Database:**

- [SQLite](https://www.sqlite.org/) - Lightweight embedded database
- [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js and TypeScript

**Validation & Processing:**

- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [p-queue](https://github.com/sindresorhus/p-queue) - Promise-based priority queue

**Logging:**

- [Pino](https://getpino.io/) - Fast JSON logger for Node.js

**Testing:**

- [Vitest](https://vitest.dev/) - Fast unit test framework powered by Vite

**Code Quality:**

- [ESLint](https://eslint.org/) - JavaScript/TypeScript linter
- [Prettier](https://prettier.io/) - Code formatter

**CI/CD:**

- [GitHub Actions](https://github.com/features/actions) - Continuous integration and deployment

**Webhook Providers (Recommended):**

- [Helius](https://www.helius.dev/) - Enhanced Solana RPC and webhook provider
- [QuickNode](https://www.quicknode.com/) - Blockchain infrastructure provider
- [Alchemy](https://www.alchemy.com/) - Web3 development platform

#### Ethereum CryptoPunksMarket Subgraph

**Blockchain Indexing:**

- [The Graph](https://thegraph.com/) - Decentralized protocol for indexing and querying blockchain data
- [Graph CLI](https://www.npmjs.com/package/@graphprotocol/graph-cli) - Command-line tools for The Graph
- [Graph TypeScript Library](https://www.npmjs.com/package/@graphprotocol/graph-ts) - TypeScript library for writing subgraph mappings

**Language:**

- [AssemblyScript](https://www.assemblyscript.org/) - TypeScript-like language for WebAssembly

**Testing:**

- [Matchstick](https://github.com/LimeChain/matchstick) - Unit testing framework for The Graph subgraphs

**Smart Contract:**

- [CryptoPunks Market Contract](https://etherscan.io/address/0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB) - Original CryptoPunks marketplace on Ethereum

### Documentation & Development Methodology

**Documentation Standards:**

- [Product Requirements Document (PRD)](solana-pump-radar/docs/PRD.md) - Formal requirements specification
- [Decision Log](solana-pump-radar/docs/DECISION_LOG.md) - Architecture Decision Records (ADR)
- [Risk Register](solana-pump-radar/docs/RISK_REGISTER.md) - FMEA-lite risk analysis
- [Runbook](solana-pump-radar/docs/RUNBOOK.md) - Operational procedures

**Quality Gates:**

- [Codex Safe](solana-pump-radar/docs/CODEX_SAFE.md) - AI-assisted development safety guidelines
- [Hellfire Mode](solana-pump-radar/docs/HELLFIRE_MODE.md) - Non-negotiable quality enforcement rules

### Research & References

**Solana Development:**

- [Solana Documentation](https://docs.solana.com/) - Official Solana developer documentation
- [Solana Cookbook](https://solanacookbook.com/) - Developer resource for Solana
- [Metaplex Documentation](https://docs.metaplex.com/) - NFT and token metadata standard

**Blockchain Security:**

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Web application security risks
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/) - Ethereum security guidelines

**Software Engineering:**

- [12-Factor App Methodology](https://12factor.net/) - Best practices for building SaaS applications
- [Semantic Versioning](https://semver.org/) - Version numbering specification

### Acknowledgments

This project was developed with assistance from:

- **Claude Sonnet 4.5** by Anthropic - AI-assisted development and documentation
- **GitHub Copilot** - Code completion and suggestions (if applicable)
- Community resources from Solana, The Graph, and Web3 developer communities

### Project Information Sources

All code and documentation in this repository were created specifically for this project. The Solana Pump.fun Launch Radar implementation is original work based on:

- Solana blockchain transaction structure analysis
- Pump.fun program instruction parsing methodology
- Industry-standard heuristic risk scoring approaches
- Production-grade API design patterns

The Ethereum subgraph implementation follows The Graph protocol standards and indexes the public CryptoPunksMarket smart contract.

---

## License

See repository license (if present). If missing, add one before public distribution.
