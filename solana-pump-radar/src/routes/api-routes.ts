import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../db';
import { config } from '../config';
import { z } from 'zod';

const tokenMintParamsSchema = z.object({
  mint: z.string().min(32).max(44), // Base58 pubkey length
});

export async function apiRoutes(fastify: FastifyInstance) {
  /**
   * GET /launches
   * List recent token launches
   */
  fastify.get('/launches', async (request, reply) => {
    const limit = Math.min(
      parseInt((request.query as any).limit) || 50,
      config.maxLaunchesResponse
    );

    const launches = await prisma.launchEvent.findMany({
      orderBy: { blockTime: 'desc' },
      take: limit,
      select: {
        signature: true,
        slot: true,
        blockTime: true,
        mint: true,
        creator: true,
        source: true,
        createdAt: true,
      },
    });

    // Convert BigInt to string for JSON serialization
    const serialized = launches.map((launch) => ({
      ...launch,
      slot: launch.slot.toString(),
    }));

    return reply.send({
      launches: serialized,
      count: serialized.length,
    });
  });

  /**
   * GET /tokens/:mint
   * Get token info + risk report
   */
  fastify.get<{ Params: { mint: string } }>(
    '/tokens/:mint',
    async (request, reply) => {
      // Validate mint parameter
      let mint: string;
      try {
        const params = tokenMintParamsSchema.parse(request.params);
        mint = params.mint;
      } catch (error) {
        return reply.code(400).send({ error: 'Invalid mint address' });
      }

      // Get launch event
      const launch = await prisma.launchEvent.findFirst({
        where: { mint },
        select: {
          signature: true,
          slot: true,
          blockTime: true,
          mint: true,
          creator: true,
          source: true,
          createdAt: true,
        },
      });

      if (!launch) {
        return reply.code(404).send({ error: 'Token not found' });
      }

      // Get risk report
      const riskReport = await prisma.tokenRiskReport.findUnique({
        where: { mint },
      });

      // Serialize
      const response: any = {
        launch: {
          ...launch,
          slot: launch.slot.toString(),
        },
      };

      if (riskReport) {
        response.risk = {
          mint: riskReport.mint,
          score: riskReport.score,
          label: riskReport.label,
          reasons: JSON.parse(riskReport.reasonsJson),
          authorities: JSON.parse(riskReport.authoritiesJson),
          topHolders: JSON.parse(riskReport.topHoldersJson),
          computedAt: riskReport.computedAt,
        };
      } else {
        response.risk = {
          status: 'pending',
          message: 'Risk analysis in progress',
        };
      }

      return reply.send(response);
    }
  );

  /**
   * GET /healthz
   * Health check endpoint
   */
  fastify.get('/healthz', async (request, reply) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      return reply.send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
      });
    } catch (error) {
      return reply.code(503).send({
        status: 'unhealthy',
        error: 'Database connection failed',
      });
    }
  });
}