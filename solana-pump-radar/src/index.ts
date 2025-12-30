import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { logger } from './logger';
import { webhookRoutes } from './routes/webhook';
import { apiRoutes } from './routes/api';
import { prisma } from './db';

async function main() {
  const fastify = Fastify({
    logger,
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true, // Allow all origins for now
  });

  // Register routes
  await fastify.register(webhookRoutes);
  await fastify.register(apiRoutes);

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    await fastify.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Start server
  try {
    await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    logger.info(`Server listening on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Queue concurrency: ${config.queueConcurrency}`);
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

main();