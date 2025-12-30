import PQueue from 'p-queue';
import { computeRiskScore } from '../risk/risk-scorer';
import { prisma } from '../db';
import { logger } from '../logger';
import { config } from '../config';

class ProcessingQueue {
  private queue: PQueue;
  private processedMints = new Set<string>();

  constructor(concurrency: number = 3) {
    this.queue = new PQueue({ concurrency });

    this.queue.on('active', () => {
      logger.info({ pending: this.queue.pending, size: this.queue.size }, 'Queue processing');
    });

    this.queue.on('idle', () => {
      logger.info('Queue is idle');
    });
  }

  /**
   * Enqueue a mint for risk scoring (idempotent)
   */
  async enqueueMint(mint: string): Promise<void> {
    // Skip if already processed in this session
    if (this.processedMints.has(mint)) {
      logger.debug({ mint }, 'Mint already processed, skipping');
      return;
    }

    // Check if we already have a report in the database
    const existing = await prisma.tokenRiskReport.findUnique({
      where: { mint },
    });

    if (existing) {
      logger.debug({ mint }, 'Risk report already exists in DB, skipping');
      this.processedMints.add(mint);
      return;
    }

    // Add to queue
    this.processedMints.add(mint);
    await this.queue.add(() => this.processMint(mint));
  }

  private async processMint(mint: string): Promise<void> {
    const startTime = Date.now();
    logger.info({ mint }, 'Processing mint for risk score');

    try {
      const report = await computeRiskScore(mint);

      await prisma.tokenRiskReport.upsert({
        where: { mint },
        create: {
          mint: report.mint,
          score: report.score,
          label: report.label,
          reasonsJson: JSON.stringify(report.reasons),
          authoritiesJson: JSON.stringify(report.authorities),
          topHoldersJson: JSON.stringify(report.topHolders),
        },
        update: {
          score: report.score,
          label: report.label,
          reasonsJson: JSON.stringify(report.reasons),
          authoritiesJson: JSON.stringify(report.authorities),
          topHoldersJson: JSON.stringify(report.topHolders),
        },
      });

      const duration = Date.now() - startTime;
      logger.info(
        { mint, score: report.score, label: report.label, duration },
        'Risk score computed and saved'
      );
    } catch (error) {
      logger.error({ error, mint }, 'Failed to process mint');
      // Don't throw - we don't want to crash the queue
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      pending: this.queue.pending,
      size: this.queue.size,
      isPaused: this.queue.isPaused,
    };
  }
}

// Singleton instance
export const processingQueue = new ProcessingQueue(config.queueConcurrency);