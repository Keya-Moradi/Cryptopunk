import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : ['error', 'warn'],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug({ query: e.query, duration: e.duration }, 'Prisma query');
  });
}

prisma.$on('error' as never, (e: any) => {
  logger.error({ error: e }, 'Prisma error');
});

prisma.$on('warn' as never, (e: any) => {
  logger.warn({ warning: e }, 'Prisma warning');
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});