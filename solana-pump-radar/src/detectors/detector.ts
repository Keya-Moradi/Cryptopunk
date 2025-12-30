import bs58 from 'bs58';
import { logger } from '../logger';

// Pump.fun program ID
export const PUMPFUN_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

// Pump.fun "create" instruction discriminator (first 8 bytes)
export const CREATE_DISCRIMINATOR = Buffer.from([24, 30, 200, 40, 5, 28, 7, 119]);

export interface PumpfunCreateEvent {
  mint: string;
  creator: string;
  signature: string;
  slot: number;
  blockTime: number;
}

export interface RawTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  transaction: {
    message: {
      accountKeys: string[];
      instructions: Array<{
        programIdIndex: number;
        accounts: number[];
        data: string;
      }>;
    };
  };
  meta?: {
    err: null | object;
  };
}

/**
 * Detects Pump.fun token create events from raw Solana transactions
 */
export function detectPumpfunCreate(tx: RawTransaction): PumpfunCreateEvent | null {
  try {
    // Skip failed transactions
    if (tx.meta?.err) {
      return null;
    }

    const { accountKeys, instructions } = tx.transaction.message;

    for (const instruction of instructions) {
      const programId = accountKeys[instruction.programIdIndex];

      // Check if this instruction is for Pump.fun program
      if (programId !== PUMPFUN_PROGRAM_ID) {
        continue;
      }

      // Decode instruction data from base58
      const dataBuffer = bs58.decode(instruction.data);

      // Check if first 8 bytes match create discriminator
      if (dataBuffer.length < 8) {
        continue;
      }

      const discriminator = dataBuffer.slice(0, 8);
      if (!discriminator.equals(CREATE_DISCRIMINATOR)) {
        continue;
      }

      // For Pump.fun create instruction, mint is at account index 0
      if (instruction.accounts.length === 0) {
        logger.warn({ signature: tx.signature }, 'Create instruction has no accounts');
        continue;
      }

      const mintAccountIndex = instruction.accounts[0];
      const mint = accountKeys[mintAccountIndex];

      // Creator is typically the fee payer (first account in accountKeys)
      const creator = accountKeys[0];

      return {
        mint,
        creator,
        signature: tx.signature,
        slot: tx.slot,
        blockTime: tx.blockTime,
      };
    }

    return null;
  } catch (error) {
    logger.error({ error, signature: tx.signature }, 'Error detecting Pump.fun create');
    return null;
  }
}

/**
 * Process an array of transactions and extract Pump.fun creates
 */
export function detectPumpfunCreates(transactions: RawTransaction[]): PumpfunCreateEvent[] {
  const events: PumpfunCreateEvent[] = [];

  for (const tx of transactions) {
    const event = detectPumpfunCreate(tx);
    if (event) {
      events.push(event);
    }
  }

  return events;
}