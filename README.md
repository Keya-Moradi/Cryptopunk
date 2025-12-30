# Cryptopunk

This repository contains two on-chain data projects:

1. **Solana (NEW): Pump.fun Launch Radar + Rug-Risk Scanner**
2. **Ethereum (Legacy): The Graph subgraph for CryptoPunksMarket**

The goal of the Solana project is to detect new Pump.fun token creations in near real-time and generate an explainable, heuristic "rug-risk" report (mint/freeze authorities, holder concentration, metadata presence). It is designed as a practical, production-ready indexing pipeline: webhook ingestion, idempotency, async processing, persistence, and an API for consumers.

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

## License

See repository license (if present). If missing, add one before public distribution.
