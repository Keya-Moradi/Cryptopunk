# Decision Log

## Format
Each decision includes: Date, Decision, Rationale, Alternatives Considered, Consequences

---

## [2024-12-30] Use SQLite with Prisma for persistence

**Decision:** Use SQLite as the database and Prisma as the ORM.

**Rationale:**
- SQLite is zero-config and sufficient for MVP scale
- Prisma provides type-safe database access with great DX
- Easy migration path to PostgreSQL if needed
- No external database service required for local dev

**Alternatives Considered:**
- PostgreSQL: More features but adds deployment complexity for MVP
- In-memory only: Not persistent, loses data on restart
- JSON files: Poor query performance, concurrency issues

**Consequences:**
- Single-node deployment (SQLite doesn't support distributed)
- Need to handle concurrent writes carefully
- Migration to PostgreSQL later will require minimal code changes (just connection string)

---

## [2024-12-30] Use raw webhook payloads for instruction parsing

**Decision:** Accept and parse raw transaction webhooks instead of enhanced/decoded formats.

**Rationale:**
- Raw format provides direct access to instruction data and discriminators
- More reliable for detecting specific instruction patterns
- Enhanced formats may vary by provider or change over time
- Providers explicitly warn about retries/duplicates in webhook delivery

**Alternatives Considered:**
- Enhanced webhooks: Easier to parse but less reliable for specific instruction matching
- Direct RPC polling: More resource-intensive, higher latency

**Consequences:**
- Need to handle base58 decoding and binary instruction parsing
- More robust to provider API changes
- Must implement idempotency (signature-based deduplication)

---

## [2024-12-30] In-memory async queue with p-queue

**Decision:** Use p-queue for async processing with configurable concurrency.

**Rationale:**
- Simple, battle-tested library
- Prevents overwhelming Solana RPC with concurrent requests
- Sufficient for MVP (no distributed workers needed)
- Easy to reason about and debug

**Alternatives Considered:**
- BullMQ/Redis queue: Adds Redis dependency, overkill for MVP
- No queue (process inline): Blocks webhook response, poor UX
- Database-backed job queue: More complexity, not needed at MVP scale

**Consequences:**
- Queue state lost on restart (acceptable for MVP)
- Single-node processing only
- Need to monitor queue depth in production

---

## [2024-12-30] Heuristic-based risk scoring (not ML)

**Decision:** Use explicit, rule-based heuristics for risk scoring.

**Rationale:**
- Interpretable and explainable to users
- No training data or model maintenance required
- Fast computation (no inference overhead)
- Easy to iterate and adjust weights
- Rules based on known rug pull patterns (mint authority, freeze authority, concentration)

**Alternatives Considered:**
- ML-based scoring: Requires training data, black box, harder to explain
- Social sentiment analysis: API dependencies, rate limits, unreliable
- Historical trading pattern analysis: Complex, requires time-series data

**Consequences:**
- Score is a heuristic, not a guarantee
- May miss sophisticated attack patterns
- Need to clearly communicate limitations to users
- Can evolve rules based on observed patterns

---

## [2024-12-30] Bearer token webhook authentication

**Decision:** Use Authorization: Bearer <secret> header for webhook auth.

**Rationale:**
- Simple and standard
- Sufficient security for MVP (secret rotation supported)
- Compatible with all webhook providers
- No complex auth flows needed

**Alternatives Considered:**
- HMAC signature verification: More complex, provider-specific
- IP allowlisting: Brittle, doesn't work with dynamic IPs
- No auth: Unacceptable security risk

**Consequences:**
- Secret must be rotated if compromised
- Shared secret must be transmitted securely to provider
- Simple to implement and test

---

## Template for Future Decisions

**Decision:** [What was decided]

**Rationale:** [Why this decision was made]

**Alternatives Considered:** [Other options evaluated]

**Consequences:** [Trade-offs and implications]