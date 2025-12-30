# Solana Pump.fun Launch Radar + Rug-Risk Scanner

Real-time detection and risk analysis for new Pump.fun token launches on Solana.

## Features

- **Real-time Detection:** Webhook-based ingestion of Solana transactions
- **Pump.fun Focus:** Identifies token `create` instructions via program ID and discriminator matching
- **Risk Scoring:** Heuristic-based analysis (0-100 score, LOW/MED/HIGH labels)
  - Mint authority presence
  - Freeze authority presence
  - Holder concentration (top holder %, top 5%)
  - Metadata existence check
- **REST API:** Query launches and token risk reports
- **Production-Ready:** Idempotency, async processing, structured logging, CI/CD

## Architecture

```
┌─────────────┐
│  Webhook    │ POST /webhooks/helius
│  Provider   │ (e.g., Helius)
│  (Solana)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Fastify Server                     │
│  ┌──────────────────────────────┐  │
│  │  Webhook Handler             │  │
│  │  - Auth check                │  │
│  │  - Payload validation (Zod)  │  │
│  │  - Pump.fun detection        │  │
│  │  - Upsert LaunchEvent        │  │
│  │  - Enqueue for risk scoring  │  │
│  │  - Return 200 (async)        │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Processing Queue (p-queue)  │  │
│  │  - Concurrency: 3 (default)  │  │
│  │  - Deduplication             │  │
│  │  - Async risk computation    │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Risk Scorer                 │  │
│  │  - Fetch mint info (RPC)     │  │
│  │  - Check authorities         │  │
│  │  - Holder concentration      │  │
│  │  - Metadata check            │  │
│  │  - Compute score + label     │  │
│  │  - Store TokenRiskReport     │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  SQLite DB  │
│  (Prisma)   │
│             │
│  - LaunchEvent
│  - TokenRiskReport
└─────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
# Clone repo and navigate to this folder
cd solana-pump-radar

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Set up database
npm run db:generate
npm run db:migrate
```

### Running Locally

```bash
npm run dev
```

Server starts on http://localhost:3000

### Testing Webhook

```bash
# In another terminal
npm run replay
```

Sends `fixtures/pumpfun-create.sample.json` to your local webhook.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `3000` |
| `NODE_ENV` | Environment (development/production/test) | No | `development` |
| `DATABASE_URL` | Database connection string | No | `file:./dev.db` |
| `SOLANA_RPC_URL` | Solana RPC endpoint | **Yes** | - |
| `WEBHOOK_SECRET` | Shared secret for webhook auth | **Yes** | - |
| `QUEUE_CONCURRENCY` | Max concurrent risk computations | No | `3` |
| `MAX_LAUNCHES_RESPONSE` | Max launches returned by API | No | `100` |

### Generating a Webhook Secret

```bash
openssl rand -hex 32
```

## API Endpoints

### POST /webhooks/helius

Accepts raw Solana transaction webhooks.

**Headers:**
- `Authorization: Bearer <WEBHOOK_SECRET>`
- `Content-Type: application/json`

**Body:** Array of raw transactions (see `fixtures/pumpfun-create.sample.json`)

**Response:**
```json
{
  "success": true,
  "received": 10,
  "detected": 2,
  "processed": 2
}
```

---

### GET /launches

List recent token launches.

**Query Parameters:**
- `limit` (optional): Max results (default 50, max 100)

**Response:**
```json
{
  "launches": [
    {
      "signature": "5Q9p...",
      "slot": "250000000",
      "blockTime": "2024-01-01T00:00:00.000Z",
      "mint": "MintAbc123...",
      "creator": "7NpF...",
      "source": "pumpfun",
      "createdAt": "2024-01-01T00:00:10.000Z"
    }
  ],
  "count": 1
}
```

---

### GET /tokens/:mint

Get token details and risk report.

**Response (with risk report):**
```json
{
  "launch": {
    "signature": "5Q9p...",
    "slot": "250000000",
    "blockTime": "2024-01-01T00:00:00.000Z",
    "mint": "MintAbc123...",
    "creator": "7NpF...",
    "source": "pumpfun"
  },
  "risk": {
    "mint": "MintAbc123...",
    "score": 65,
    "label": "HIGH",
    "reasons": [
      "Mint authority is active - creator can mint unlimited tokens",
      "Freeze authority is active - creator can freeze accounts",
      "High holder concentration: top holder owns 45.2%"
    ],
    "authorities": {
      "mintAuthority": "7NpF...",
      "freezeAuthority": "7NpF..."
    },
    "topHolders": [
      { "address": "Holder1...", "percentage": 45.2 },
      { "address": "Holder2...", "percentage": 12.3 }
    ],
    "computedAt": "2024-01-01T00:00:15.000Z"
  }
}
```

**Response (risk pending):**
```json
{
  "launch": { ... },
  "risk": {
    "status": "pending",
    "message": "Risk analysis in progress"
  }
}
```

---

### GET /healthz

Health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

## Webhook Provider Setup

### Helius Example

1. Go to [Helius Dashboard](https://dashboard.helius.xyz) → Webhooks
2. Create new webhook:
   - **Type:** Raw Transaction
   - **URL:** `https://your-domain.com/webhooks/helius`
   - **Auth Header:** `Bearer <your-WEBHOOK_SECRET>`
   - **Account Addresses:** `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
   - **Transaction Types:** All
3. Test webhook delivery
4. Save and activate

### Other Providers

Any provider that supports raw Solana transaction webhooks will work. Ensure they can send an `Authorization` header.

## Development

### Running Tests

```bash
npm test          # Watch mode
npm run test:ci   # CI mode (run once)
```

### Linting

```bash
npm run lint       # Check
npm run lint:fix   # Fix auto-fixable issues
```

### Type Checking

```bash
npm run typecheck
```

### Database

```bash
npm run db:studio   # Open Prisma Studio (GUI)
npm run db:migrate  # Create/apply migrations
```

## Deployment

See [RUNBOOK.md](./docs/RUNBOOK.md) for detailed deployment instructions.

**Quick Deploy:**
```bash
npm ci --only=production
npm run db:generate
npm run db:migrate
npm run build
npm start
```

Use a process manager like PM2 or systemd for production.

## Documentation

- [PRD.md](./docs/PRD.md) - Product requirements and scope
- [DECISION_LOG.md](./docs/DECISION_LOG.md) - Technical decisions with rationale
- [RISK_REGISTER.md](./docs/RISK_REGISTER.md) - Identified risks and mitigations
- [RUNBOOK.md](./docs/RUNBOOK.md) - Operational procedures
- [CODEX_SAFE.md](./docs/CODEX_SAFE.md) - AI-assisted development guidelines
- [HELLFIRE_MODE.md](./docs/HELLFIRE_MODE.md) - Quality gates and enforcement

## How It Works

### Detection

1. Webhook receives Solana transactions
2. For each instruction in each transaction:
   - Check if `programIdIndex` points to Pump.fun program: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
   - Decode instruction data from base58
   - Check if first 8 bytes match create discriminator: `[24, 30, 200, 40, 5, 28, 7, 119]`
   - If match, extract mint address from `accounts[0]`
3. Store as `LaunchEvent` (dedupe by signature)

### Risk Scoring

Heuristic-based, explainable scoring:

| Factor | Weight | Description |
|--------|--------|-------------|
| Mint Authority | +35 | Can print unlimited tokens |
| Freeze Authority | +25 | Can freeze holder accounts |
| Top Holder >50% | +30 | Extreme concentration risk |
| Top Holder 30-50% | +20 | High concentration |
| Top Holder 15-30% | +10 | Moderate concentration |
| Top 5 >80% | +10 | Few holders control supply |
| No Metadata | +5 | Missing Metaplex metadata (unusual) |

**Labels:**
- **HIGH:** Score ≥60
- **MED:** Score 30-59
- **LOW:** Score <30

**Disclaimer:** Risk scores are heuristics, not guarantees. Not financial advice. Always DYOR.

## Troubleshooting

**Webhook returns 401:**
- Check `WEBHOOK_SECRET` matches provider config
- Verify Authorization header format: `Bearer <secret>`

**Risk scores not computing:**
- Check `SOLANA_RPC_URL` is valid and not rate limited
- Review logs for RPC errors
- Try different RPC provider (Helius, QuickNode, Alchemy)

**No launches detected:**
- Verify webhook is sending to correct URL
- Check webhook account filter includes Pump.fun program ID
- Test with `npm run replay`

See [RUNBOOK.md](./docs/RUNBOOK.md) for more troubleshooting.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run quality checks: `npm run lint && npm run typecheck && npm test`
5. Submit PR

All PRs must pass CI (see [HELLFIRE_MODE.md](./docs/HELLFIRE_MODE.md)).

## License

See repository root LICENSE file.