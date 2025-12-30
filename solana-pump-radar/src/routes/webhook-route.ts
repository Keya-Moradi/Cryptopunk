import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { webhookPayloadSchema } from '../schemas/webhook-schemas';
import { detectPumpfunCreates } from '../detector/pumpfun-detector';
import { processingQueue } from '../queue/processing-queue';
import { prisma } from '../db';
import { config } from '../config';
import { logger } from '../logger';

export async function webhookRoutes(fastify: FastifyInstance) {
  /**
   * POST /webhooks/helius
   * Accepts raw or enhanced transaction webhook arrays
   * Validates Authorization header (shared secret)
   * Returns 200 immediately, processes async
   */
  fastify.post(
    '/webhooks/helius',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();

      // Validate authorization header
      const authHeader = request.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${config.webhookSecret}`) {
        logger.warn({ ip: request.ip }, 'Unauthorized webhook attempt');
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      // Validate payload shape
      let transactions;
      try {
        transactions = webhookPayloadSchema.parse(request.body);
      } catch (error) {
        logger.error({ error }, 'Invalid webhook payload');
        return reply.code(400).send({ error: 'Invalid payload' });
      }

      logger.info({ count: transactions.length }, 'Received webhook transactions');

      // Detect Pump.fun creates
      const events = detectPumpfunCreates(transactions);
      logger.info({ detected: events.length }, 'Detected Pump.fun creates');

      // Process events (idempotent - upsert by signature)
      const processed = [];
      for (const event of events) {
        try {
          // Upsert launch event (signature is unique)
          const launchEvent = await prisma.launchEvent.upsert({
            where: { signature: event.signature },
            create: {
              signature: event.signature,
              slot: BigInt(event.slot),
              blockTime: new Date(event.blockTime * 1000),
              mint: event.mint,
              creator: event.creator,
              source: 'pumpfun',
              rawJson: JSON.stringify(
                transactions.find((tx) => tx.signature === event.signature)
              ),
            },
            update: {}, // No-op if already exists (idempotency)
          });

          processed.push(launchEvent.mint);

          // Enqueue for risk scoring (also idempotent)
          await processingQueue.enqueueMint(event.mint);
        } catch (error) {
          logger.error({ error, signature: event.signature }, 'Failed to process event');
        }
      }

      const duration = Date.now() - startTime;
      logger.info(
        {
          received: transactions.length,
          detected: events.length,
          processed: processed.length,
          duration,
        },
        'Webhook processed'
      );

      // Return 200 immediately
      return reply.code(200).send({
        success: true,
        received: transactions.length,
        detected: events.length,
        processed: processed.length,
      });
    }
  );
}