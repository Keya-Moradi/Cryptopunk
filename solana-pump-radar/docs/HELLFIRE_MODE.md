# Hellfire Mode: Non-Negotiable Quality Gates

## Philosophy
"Hellfire Mode" means quality gates are **enforced by automation**, not optional. If CI fails, the code does not merge. No exceptions.

---

## Gate 1: All Tests Must Pass

**Enforcement:** CI workflow runs `npm run test:ci`

**Standard:**
- ✓ 100% of tests passing
- ✓ No skipped tests without documented reason
- ✓ Tests must be deterministic (no flaky tests)

**What Happens if This Fails:**
- PR cannot merge
- Investigate failure immediately
- Fix the test or fix the code
- Never comment out failing tests

---

## Gate 2: TypeScript Compilation

**Enforcement:** CI workflow runs `npm run typecheck`

**Standard:**
- ✓ Zero TypeScript errors
- ✓ Strict mode enabled
- ✓ No `@ts-ignore` without justification comment

**What Happens if This Fails:**
- PR cannot merge
- Fix type errors at the source
- Do not add `any` to bypass types

---

## Gate 3: Linting (ESLint)

**Enforcement:** CI workflow runs `npm run lint`

**Standard:**
- ✓ Zero ESLint errors
- ✓ Warnings should be addressed (can be overridden with justification)
- ✓ Prettier formatting enforced

**What Happens if This Fails:**
- PR cannot merge
- Run `npm run lint:fix` locally
- Commit formatting changes

---

## Gate 4: Idempotency

**Enforcement:** Manual review + tests

**Standard:**
- ✓ Webhook can be sent multiple times without creating duplicates
- ✓ Signature UNIQUE constraint enforced
- ✓ Upsert patterns used for writes
- ✓ GET endpoints have no side effects

**How to Test:**
```bash
# Send same fixture twice
npm run replay
npm run replay

# Check database - should have only one record per signature
```

**What Happens if This Fails:**
- PR cannot merge
- Add UNIQUE constraint or upsert logic
- Add test case for idempotency

---

## Gate 5: Input Validation

**Enforcement:** Code review + Zod schemas

**Standard:**
- ✓ All API inputs validated with Zod
- ✓ Authorization headers checked
- ✓ Path parameters validated
- ✓ Malformed input returns 400, not 500

**How to Test:**
```bash
# Invalid mint address
curl -X GET http://localhost:3000/tokens/invalid

# Missing auth header
curl -X POST http://localhost:3000/webhooks/helius -d '{}'

# Malformed JSON
curl -X POST http://localhost:3000/webhooks/helius \
  -H "Authorization: Bearer secret" -d 'not-json'
```

**What Happens if This Fails:**
- PR cannot merge
- Add validation schema
- Add test case for invalid input

---

## Gate 6: Observability

**Enforcement:** Code review + structured logging

**Standard:**
- ✓ All errors logged with context (mint, signature, error details)
- ✓ Pino structured logging used
- ✓ No `console.log` in production code
- ✓ Log levels appropriate (debug/info/warn/error)

**What to Check:**
- Can you debug a production issue from the logs?
- Are error logs actionable (clear next steps)?
- Is sensitive data (secrets, PII) excluded from logs?

**What Happens if This Fails:**
- PR cannot merge
- Add proper logging
- Remove console.log statements

---

## Gate 7: No Secrets in Code

**Enforcement:** Automated + manual review

**Standard:**
- ✓ Zero hardcoded secrets, API keys, or passwords
- ✓ .env.example provided without real values
- ✓ CI uses GitHub Secrets or equivalent

**How to Check:**
```bash
# Search staged changes for potential secrets
git diff --staged | grep -iE "(api_key|secret|password|private_key|token)"
```

**What Happens if This Fails:**
- PR cannot merge
- Remove secret from code
- Add to .env.example as placeholder
- Rotate compromised secret immediately

---

## Gate 8: Build Success

**Enforcement:** CI workflow runs `npm run build`

**Standard:**
- ✓ TypeScript compiles to JavaScript
- ✓ No build errors or warnings
- ✓ Output in dist/ directory

**What Happens if This Fails:**
- PR cannot merge
- Fix import paths, type errors, or missing dependencies
- Test build locally before pushing

---

## Gate 9: Database Migrations

**Enforcement:** Code review

**Standard:**
- ✓ Schema changes require migration file
- ✓ Migrations are reversible (down migration)
- ✓ Migrations tested locally before merge
- ✓ No breaking changes without migration plan

**How to Check:**
- If prisma/schema.prisma changed, is there a migration?
- Can migration run successfully on clean database?

**What Happens if This Fails:**
- PR cannot merge
- Generate migration: `npm run db:migrate`
- Test migration on clean DB
- Document breaking changes in PR

---

## Gate 10: Documentation

**Enforcement:** Code review

**Standard:**
- ✓ README updated if user-facing changes
- ✓ .env.example updated if new env vars
- ✓ DECISION_LOG updated if design decisions made
- ✓ RISK_REGISTER updated if new risks introduced

**What to Check:**
- Does README reflect current state?
- Can a new developer set up the project from docs?
- Are operational changes documented in RUNBOOK?

**What Happens if This Fails:**
- PR cannot merge (unless docs-only change)
- Update relevant documentation
- Commit doc changes with code changes

---

## Bypassing Gates (Emergency Only)

**When Allowed:**
- Production is down and hotfix is critical
- Security vulnerability requires immediate patch

**Process:**
1. Document reason in PR description
2. Get approval from at least 2 maintainers
3. Merge with `[BYPASS-HELLFIRE]` in commit message
4. Create follow-up PR to fix any bypassed gates within 24 hours

**Example:**
```
[BYPASS-HELLFIRE] Fix critical RPC timeout causing service outage

Reason: Production is down, cannot wait for full test suite.
Follow-up: #123 to add missing tests.
```

---

## CI Workflow Summary

```yaml
# .github/workflows/solana-pump-radar-ci.yml

- Lint (Gate 3)
- Type check (Gate 2)
- Tests (Gate 1)
- Build (Gate 8)
```

All must pass for PR to merge.

---

## Local Pre-Push Checklist

Before pushing code:

```bash
# 1. Lint
npm run lint

# 2. Type check
npm run typecheck

# 3. Tests
npm test

# 4. Build
npm run build

# 5. Check for secrets
git diff | grep -iE "(api_key|secret|password)"

# 6. Review diff
git diff
```

If all pass locally, CI will likely pass too.

---

## Enforcement Culture

**Hellfire Mode is not punishment**, it's a shared commitment to quality.

**Mindset:**
- ✓ Failing CI is normal (we're human)
- ✓ Fixing issues quickly is what matters
- ✓ Gates catch mistakes before they reach production
- ✓ "It works on my machine" is not good enough

**Team Practices:**
- Don't bypass gates without emergency justification
- Help teammates understand why their PR failed
- Improve gates if they're catching false positives
- Celebrate when gates catch real bugs

---

## Metrics

Track these to measure Hellfire effectiveness:

- **Mean Time to Green:** How long from push to CI pass?
- **First-Pass Rate:** % of PRs that pass CI on first try
- **Gate Violations:** Which gates fail most often?
- **Production Issues:** Are we catching bugs before production?

**Goal:** First-pass rate >80%, zero production issues from bypassed gates.