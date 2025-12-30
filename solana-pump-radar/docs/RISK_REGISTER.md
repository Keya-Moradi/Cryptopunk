# Risk Register (FMEA-Lite)

## Format
For each risk: Failure Mode | Impact (1-5) | Likelihood (1-5) | Risk Score | Mitigation | Monitoring

---

## R1: Webhook Duplicate Delivery

**Failure Mode:** Provider sends same transaction multiple times due to retries.

**Impact:** 3 (Data duplication, wasted processing)

**Likelihood:** 4 (Providers explicitly warn about this)

**Risk Score:** 12 (High)

**Mitigation:**
- UNIQUE constraint on LaunchEvent.signature
- Upsert pattern in database operations
- Queue checks for existing risk reports before processing

**Monitoring:**
- Log duplicate detection events
- Track duplicate rate in metrics

---

## R2: Solana RPC Rate Limiting / Downtime

**Failure Mode:** RPC provider rate limits or goes down during risk scoring.

**Impact:** 4 (Cannot compute risk scores, user-facing errors)

**Likelihood:** 3 (Moderate, depends on provider)

**Risk Score:** 12 (High)

**Mitigation:**
- Queue with concurrency limit (default 3) to avoid overwhelming RPC
- Retry logic in risk scorer (with exponential backoff)
- Graceful error handling (return HIGH risk with error reason)
- Use reliable RPC providers (Helius, QuickNode, Alchemy)

**Monitoring:**
- Track RPC error rates
- Alert on sustained failures
- Log RPC latency

---

## R3: Database Write Contention

**Failure Mode:** SQLite write locks under concurrent webhook load.

**Impact:** 3 (Webhook processing delays, timeouts)

**Likelihood:** 2 (Low for MVP scale, higher at scale)

**Risk Score:** 6 (Medium)

**Mitigation:**
- Write operations are async (don't block webhook response)
- SQLite WAL mode enabled for better concurrency
- Batch upserts where possible
- Migration path to PostgreSQL documented

**Monitoring:**
- Log database write latencies
- Track webhook processing time distribution

---

## R4: Webhook Secret Compromise

**Failure Mode:** WEBHOOK_SECRET is leaked or stolen.

**Impact:** 5 (Unauthorized access, spam, potential service abuse)

**Likelihood:** 2 (Low with good practices)

**Risk Score:** 10 (High)

**Mitigation:**
- Secret stored in environment variables only (never in code)
- .env.example provided without real secrets
- RUNBOOK.md documents rotation procedure
- 401 responses logged with IP for audit trail

**Monitoring:**
- Alert on unusual webhook traffic patterns
- Log all unauthorized attempts with source IP

---

## R5: False Negatives (Missing Rug Pulls)

**Failure Mode:** Heuristics fail to detect a malicious token.

**Impact:** 4 (Users trust a bad token, financial loss)

**Likelihood:** 3 (Heuristics are imperfect)

**Risk Score:** 12 (High)

**Mitigation:**
- Clearly label scores as "heuristic, not financial advice"
- Provide explainable reasons (users can interpret themselves)
- Conservative scoring (err on side of higher risk)
- Document known limitations in README

**Monitoring:**
- Track reported false negatives from community
- Iterate on scoring rules based on feedback

---

## R6: False Positives (Flagging Legitimate Tokens)

**Failure Mode:** Heuristics incorrectly label safe token as high risk.

**Impact:** 3 (Reputation damage, missed opportunities)

**Likelihood:** 3 (Heuristics are imperfect)

**Risk Score:** 9 (Medium)

**Mitigation:**
- Provide detailed reasons (users can override judgment)
- Multiple factors contribute to score (not single-factor fail)
- Community feedback loop for calibration
- Document common false positive scenarios

**Monitoring:**
- Track user reports of false positives
- Regularly review score distribution

---

## R7: Instruction Format Changes

**Failure Mode:** Pump.fun changes create instruction format or discriminator.

**Impact:** 5 (Complete detection failure)

**Likelihood:** 2 (Low, breaking changes are rare)

**Risk Score:** 10 (High)

**Mitigation:**
- Log unmatched Pump.fun program instructions for investigation
- Monitor launch detection rate over time
- Have rollback plan for quick updates
- Subscribe to Pump.fun developer updates

**Monitoring:**
- Alert on sudden drop in detection rate
- Log ratio of program ID matches vs discriminator matches

---

## R8: Memory Leak from Queue Buildup

**Failure Mode:** Queue grows unbounded if scoring is slower than ingestion.

**Impact:** 4 (Service crash, data loss)

**Likelihood:** 2 (Low with rate limiting)

**Risk Score:** 8 (Medium)

**Mitigation:**
- Fixed concurrency limit on queue
- Queue deduplication (don't reprocess same mint)
- Monitor queue depth in logs
- Restart strategy in deployment (supervisor/systemd)

**Monitoring:**
- Log queue size and pending count
- Alert if queue depth exceeds threshold
- Track processing time per mint

---

## R9: Database Corruption

**Failure Mode:** SQLite file becomes corrupted (power loss, disk failure, etc.).

**Impact:** 5 (Total data loss without backups)

**Likelihood:** 1 (Very low with modern systems)

**Risk Score:** 5 (Medium)

**Mitigation:**
- Enable SQLite WAL mode
- Regular database backups (deployment-specific)
- Replay capability via webhook fixtures for recovery
- Document backup/restore in RUNBOOK.md

**Monitoring:**
- Health check endpoint tests database connectivity
- Alert on database connection failures

---

## R10: Unbounded API Response Size

**Failure Mode:** GET /launches returns millions of records without pagination.

**Impact:** 3 (Service slowdown, memory issues)

**Likelihood:** 2 (Low, needs many launches)

**Risk Score:** 6 (Medium)

**Mitigation:**
- MAX_LAUNCHES_RESPONSE env var with default 100
- Hard limit in code (Math.min)
- Document pagination in API
- Future: cursor-based pagination

**Monitoring:**
- Track response sizes and latencies
- Log when limit is hit