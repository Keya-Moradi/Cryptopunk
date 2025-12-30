# Product Requirements Document: Pump.fun Launch Radar + Rug-Risk Scanner

## Overview
Real-time detection and risk analysis system for new Pump.fun token launches on Solana.

## Goals
1. Detect Pump.fun token creation events in near real-time via webhooks
2. Generate explainable, heuristic-based rug-risk scores for new tokens
3. Provide queryable API for launch data and risk reports
4. Maintain production-grade reliability (idempotency, error handling, observability)

## Non-Goals
- Not a financial advice platform
- Not a trading bot or execution engine
- Not a front-end application (API only)
- Not a comprehensive security audit (heuristics only)
- Not multi-chain (Solana only for MVP)

## Scope

### In Scope
- Webhook ingestion (POST /webhooks/helius)
- Pump.fun create instruction detection
- Risk scoring based on:
  - Mint authority presence
  - Freeze authority presence
  - Holder concentration (top holder %, top 5%)
  - Metadata existence
- REST API endpoints:
  - GET /launches (list recent)
  - GET /tokens/:mint (detail + risk)
  - GET /healthz
- SQLite persistence with Prisma
- Async processing queue
- Idempotent webhook handling
- CI/CD with quality gates

### Out of Scope (Future)
- Real-time WebSocket updates
- Historical backfill
- Advanced ML-based risk models
- Social sentiment analysis
- On-chain interaction tracing
- Multi-provider webhook support
- Alerting/notification system

## User Stories

**As a researcher**, I want to see all recent Pump.fun launches so I can analyze token creation patterns.

**As a trader**, I want to check the rug-risk score of a specific token before investing.

**As a developer**, I want to integrate launch data into my application via REST API.

## Acceptance Criteria

### Webhook Handler
- ✓ Accepts POST /webhooks/helius with raw transaction arrays
- ✓ Validates Authorization header (bearer token)
- ✓ Returns 200 within 100ms (async processing)
- ✓ Deduplicates by transaction signature
- ✓ Validates payload shape with Zod

### Detection
- ✓ Identifies Pump.fun create instructions (program ID + discriminator match)
- ✓ Extracts mint address from instruction accounts
- ✓ Stores launch event in LaunchEvent table

### Risk Scoring
- ✓ Computes score 0-100 based on heuristics
- ✓ Assigns label: LOW / MED / HIGH
- ✓ Provides human-readable reasons array
- ✓ Fetches on-chain data (mint info, holder accounts, metadata)
- ✓ Handles RPC failures gracefully

### API
- ✓ GET /launches returns sorted list with pagination
- ✓ GET /tokens/:mint returns launch + risk report
- ✓ Returns "pending" status if risk not yet computed
- ✓ GET /healthz checks database connectivity

### Quality
- ✓ All tests pass
- ✓ TypeScript strict mode
- ✓ ESLint + Prettier
- ✓ CI workflow runs on PR
- ✓ Structured logging with pino
- ✓ No secrets in code

## Success Metrics
- Webhook latency p95 < 100ms
- Risk computation time p95 < 5 seconds
- Zero duplicate launch events
- API uptime > 99%
- Test coverage > 70%

## Timeline
MVP: 1-2 days (this implementation)