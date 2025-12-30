import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string().default('file:./dev.db'),
  solanaRpcUrl: z.string().url(),
  webhookSecret: z.string().min(16),
  queueConcurrency: z.coerce.number().default(3),
  maxLaunchesResponse: z.coerce.number().default(100),
});

const rawConfig = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  solanaRpcUrl: process.env.SOLANA_RPC_URL,
  webhookSecret: process.env.WEBHOOK_SECRET,
  queueConcurrency: process.env.QUEUE_CONCURRENCY,
  maxLaunchesResponse: process.env.MAX_LAUNCHES_RESPONSE,
};

export const config = configSchema.parse(rawConfig);