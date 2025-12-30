# Codex Safe: AI-Assisted Development Guidelines

## Purpose
When using AI coding assistants (GitHub Copilot, Claude, GPT-4, etc.), follow these rules to maintain code quality, security, and maintainability.

---

## Rule 1: No Secrets in Code

**Requirement:** NEVER commit secrets, API keys, private keys, or passwords.

**Implementation:**
- ✓ All secrets in environment variables (.env)
- ✓ .env.example provided without real values
- ✓ .env in .gitignore
- ✓ CI uses secrets management (GitHub Secrets, etc.)

**Pre-commit Check:**
```bash
# Search for potential secrets
git diff --staged | grep -E "(api_key|secret|password|private_key)" --color=always
```

---

## Rule 2: Diff-Review Before Commit

**Requirement:** ALWAYS review AI-generated code diffs before committing.

**What to Check:**
- Logic correctness (does it actually solve the problem?)
- Edge cases (null checks, error handling)
- Performance implications (loops, database queries)
- Security issues (input validation, SQL injection, XSS)
- Unnecessary changes (bloat, over-engineering)

**Practice:**
```bash
# Always review before committing
git diff
git add -p  # Interactive staging lets you review chunks
```

---

## Rule 3: Simulate/Replay Before Deploy

**Requirement:** Test with realistic data before deploying to production.

**Implementation:**
- ✓ Fixtures provided in `fixtures/`
- ✓ Replay script: `npm run replay`
- ✓ Test suite covers critical paths
- ✓ Staging environment for pre-production testing

**Pre-Deploy Checklist:**
- [ ] Tests pass locally
- [ ] Replay fixture succeeds
- [ ] Health check returns 200
- [ ] Database migrations applied
- [ ] Environment variables set

---

## Rule 4: Tests Required for Critical Paths

**Requirement:** All critical functionality must have tests.

**Critical Paths:**
- Webhook ingestion and validation
- Pump.fun detection logic
- Risk scoring heuristics
- Database idempotency (upsert behavior)
- API endpoint responses

**What Not to Test (Avoid Over-Testing):**
- Trivial getters/setters
- Third-party library behavior
- Framework internals

**Test Quality Standards:**
- Tests must be deterministic (no flaky tests)
- Tests must be fast (<5s for full suite)
- Use mocks for external dependencies (RPC, etc.)

---

## Rule 5: Input Validation

**Requirement:** Validate ALL external input with strict schemas.

**Implementation:**
- ✓ Zod schemas for webhook payloads
- ✓ Path parameter validation (mint address format)
- ✓ Authorization header checks
- ✓ Reject malformed requests early (fail fast)

**Example:**
```typescript
// GOOD
const params = tokenMintParamsSchema.parse(request.params);

// BAD
const mint = request.params.mint; // No validation
```

---

## Rule 6: Explicit Error Handling

**Requirement:** Handle errors explicitly, don't let them crash the service.

**Patterns:**
- Try-catch around I/O operations (database, RPC, file system)
- Return safe defaults on error (high-risk score, empty arrays)
- Log errors with context (mint address, signature, etc.)
- Never expose internal errors to API clients

**Example:**
```typescript
// GOOD
try {
  const report = await computeRiskScore(mint);
  return report;
} catch (error) {
  logger.error({ error, mint }, 'Failed to compute risk');
  return { mint, score: 90, label: 'HIGH', reasons: ['Error fetching data'] };
}

// BAD
const report = await computeRiskScore(mint); // Unhandled rejection
```

---

## Rule 7: Type Safety

**Requirement:** Use TypeScript strict mode, avoid `any` unless absolutely necessary.

**Configuration:**
```json
{
  "strict": true,
  "noImplicitAny": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**Practice:**
- Prefer interfaces/types over `any`
- Use Zod for runtime validation + type inference
- `npm run typecheck` must pass

---

## Rule 8: Idempotency by Design

**Requirement:** Repeated operations must produce the same result.

**Implementation:**
- ✓ UNIQUE constraints on signatures
- ✓ Upsert pattern (update if exists, insert if not)
- ✓ Queue deduplication checks
- ✓ No side effects in GET endpoints

**Testing:**
- Send same webhook twice → same data in DB
- Process same mint twice → same risk report

---

## Rule 9: Observability

**Requirement:** Log enough information to debug production issues.

**What to Log:**
- Webhook received (count, source IP if available)
- Detections (signature, mint)
- Risk scores computed (mint, score, duration)
- Errors (with full context)
- Queue stats (pending, size)

**What NOT to Log:**
- Full transaction payloads (PII, bloat) → store in DB instead
- Secrets or auth tokens
- Excessive debug noise in production

**Log Levels:**
- `error`: Something went wrong, needs investigation
- `warn`: Unexpected but handled
- `info`: Normal operations (detections, scores)
- `debug`: Development only (queries, etc.)

---

## Rule 10: Documentation

**Requirement:** Update docs when behavior changes.

**When to Update:**
- API changes → Update README + OpenAPI/examples
- New environment variable → Update .env.example + README
- Operational changes → Update RUNBOOK
- Design decisions → Update DECISION_LOG
- New risks → Update RISK_REGISTER

**Documentation is Code:**
- Treat docs like code (review in PRs)
- Keep docs close to code (in repo, not external wiki)

---

## AI Assistant Best Practices

### When Asking for Code
- Provide context (what exists, what's needed)
- Specify constraints (libraries allowed, patterns to follow)
- Ask for tests alongside implementation
- Request error handling explicitly

### When Reviewing AI Code
- Check for over-engineering (keep it simple)
- Verify library usage (is it in package.json?)
- Look for missing error handling
- Ensure it follows existing patterns

### Red Flags in AI Code
- ❌ No error handling
- ❌ Using `any` extensively
- ❌ No input validation
- ❌ Hardcoded values (should be config)
- ❌ Inconsistent with existing code style
- ❌ Over-complex solutions to simple problems

---

## Enforcement

**Pre-Commit:**
- Run `npm run lint`
- Run `npm run typecheck`
- Review `git diff`

**CI:**
- All tests must pass
- No lint errors
- Type check passes
- Build succeeds

**Code Review:**
- At least one human review required
- Check against this document
- Question AI-generated code that feels wrong