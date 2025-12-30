# Operational Runbook

## Local Development

### Prerequisites
- Node.js 20+ (with npm)
- Git

### Initial Setup
```bash
cd solana-pump-radar
cp .env.example .env
# Edit .env with your values (especially SOLANA_RPC_URL and WEBHOOK_SECRET)
npm install
npm run db:generate
npm run db:migrate
```

### Running Locally
```bash
npm run dev
```

Server will start on port 3000 (or PORT from .env).

### Testing Webhook Locally
```bash
# In another terminal
npm run replay
```

This sends `fixtures/pumpfun-create.sample.json` to your local webhook endpoint.

### Running Tests
```bash
npm test          # Watch mode
npm run test:ci   # CI mode (run once)
```

### Database Management
```bash
npm run db:studio  # Open Prisma Studio (GUI)
npm run db:migrate # Run pending migrations
```

---

## Deployment

### Environment Variables Required
```bash
PORT=3000
NODE_ENV=production
DATABASE_URL=file:./prod.db  # Or PostgreSQL URL
SOLANA_RPC_URL=https://your-rpc-provider.com
WEBHOOK_SECRET=<generate with: openssl rand -hex 32>
QUEUE_CONCURRENCY=5
MAX_LAUNCHES_RESPONSE=100
```

### Build and Start
```bash
npm ci --only=production
npm run db:generate
npm run db:migrate
npm run build
npm start
```

### Process Management (Recommended)
Use a process manager like PM2 or systemd:

```bash
# PM2 example
pm2 start npm --name "pump-radar" -- start
pm2 save
pm2 startup
```

### Reverse Proxy (Optional)
Run behind nginx or Caddy for HTTPS:

```nginx
location /webhooks/helius {
    proxy_pass http://localhost:3000/webhooks/helius;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## Webhook Provider Setup (Helius Example)

### 1. Create Webhook
Go to Helius dashboard → Webhooks → Create Webhook

### 2. Configure Webhook
- **Type:** Raw Transaction
- **URL:** `https://your-domain.com/webhooks/helius`
- **Auth Header:** `Bearer <your WEBHOOK_SECRET>`
- **Account Addresses:** `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` (Pump.fun program)
- **Transaction Types:** All

### 3. Test Webhook
Helius provides a "Test" button to send sample payloads. Verify your server returns 200.

---

## Operations

### Rotating Webhook Secret

**When to rotate:**
- Suspected compromise
- Regular rotation policy (quarterly recommended)
- Team member departure with access

**Steps:**
1. Generate new secret: `openssl rand -hex 32`
2. Update environment variable on server: `WEBHOOK_SECRET=<new-secret>`
3. Restart service: `pm2 restart pump-radar`
4. Update webhook provider configuration with new Bearer token
5. Test with a sample webhook
6. Invalidate old secret (remove from provider)

**Rollback Plan:**
If issues arise, revert to old secret in both service and provider.

---

### Handling Duplicate Transactions

**Expected Behavior:** Duplicates are automatically deduped by transaction signature (UNIQUE constraint).

**What You'll See:**
- Logs: `Mint already processed, skipping`
- Database: No new rows for duplicate signatures
- API: Same data returned regardless of how many times webhook is sent

**Action Required:** None - this is by design. Providers warn about retries/duplicates.

---

### Database Backup

**SQLite:**
```bash
# Manual backup
cp prod.db prod.db.backup-$(date +%Y%m%d-%H%M%S)

# Automated (cron example)
0 2 * * * cd /path/to/app && cp prod.db /backups/prod.db.$(date +\%Y\%m\%d)
```

**PostgreSQL:**
```bash
pg_dump -U user -h host -d dbname > backup.sql
```

---

### Database Restore

**SQLite:**
```bash
# Stop service
pm2 stop pump-radar

# Restore backup
cp prod.db.backup-20241230 prod.db

# Restart service
pm2 start pump-radar
```

**PostgreSQL:**
```bash
psql -U user -h host -d dbname < backup.sql
```

---

### Monitoring Checklist

#### Health Checks
- `GET /healthz` returns 200
- Database connectivity is OK

#### Key Metrics to Track
- Webhook latency (p50, p95, p99)
- Risk scoring duration
- Queue depth and pending count
- Launch detection rate (launches/hour)
- RPC error rate
- Database write latency

#### Log Analysis
- Look for patterns of `401 Unauthorized` (possible attack)
- Monitor `Error detecting Pump.fun create` (instruction format changes?)
- Track `Failed to process mint` (RPC issues?)

#### Alerts to Set Up
- /healthz returns non-200 for >2 minutes
- RPC error rate >10% sustained
- Queue depth >100 for >5 minutes
- No launches detected for >1 hour (possible detection failure)

---

### Troubleshooting

#### Webhook Returns 401
**Cause:** Authorization header mismatch.

**Fix:**
- Verify WEBHOOK_SECRET in .env matches provider config
- Check for extra spaces or newlines in secret
- Regenerate secret and update both sides

#### Risk Scores Not Computing
**Cause:** RPC failures or queue backlog.

**Debug:**
1. Check logs for RPC errors
2. Verify SOLANA_RPC_URL is valid and not rate limited
3. Check queue stats: `curl localhost:3000/healthz`
4. Test RPC directly: `curl $SOLANA_RPC_URL -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'`

**Fix:**
- Switch to more reliable RPC provider
- Increase queue concurrency (if RPC can handle it)
- Restart service to clear queue

#### No Launches Detected
**Cause:** Instruction format change or webhook not configured correctly.

**Debug:**
1. Check webhook provider dashboard for delivery status
2. Review logs for any `Received webhook transactions` entries
3. Test with replay fixture: `npm run replay`
4. Verify Pump.fun program ID hasn't changed

**Fix:**
- Confirm webhook is sending to correct URL
- Verify account address filter in webhook config
- Check for Pump.fun protocol updates

#### Database Locked Errors
**Cause:** High write concurrency with SQLite.

**Short-term fix:**
- Enable WAL mode (should be default): `PRAGMA journal_mode=WAL;`
- Reduce webhook traffic temporarily

**Long-term fix:**
- Migrate to PostgreSQL: Update DATABASE_URL and redeploy

---

## Rollback Procedure

If a deployment introduces issues:

1. **Stop current service:**
   ```bash
   pm2 stop pump-radar
   ```

2. **Revert code:**
   ```bash
   git checkout <previous-commit>
   npm ci --only=production
   npm run build
   ```

3. **Restore database if needed:**
   ```bash
   cp prod.db.backup-<timestamp> prod.db
   ```

4. **Restart service:**
   ```bash
   pm2 start pump-radar
   ```

5. **Verify health:**
   ```bash
   curl http://localhost:3000/healthz
   ```

---

## Scaling Considerations

### When to Scale

- Queue depth consistently >50
- Webhook latency p95 >200ms
- RPC rate limiting occurs frequently
- Database write contention errors

### Scaling Options

1. **Vertical Scaling:**
   - Increase server resources (CPU, memory)
   - Increase QUEUE_CONCURRENCY

2. **Horizontal Scaling:**
   - Migrate to PostgreSQL
   - Deploy multiple instances behind load balancer
   - Use distributed job queue (BullMQ + Redis)

3. **Database Scaling:**
   - PostgreSQL with read replicas
   - Partition LaunchEvent table by date
   - Archive old data

---

## Support Contacts

- **Code Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **RPC Provider:** [Your provider support]
- **Webhook Provider:** [Your provider support]