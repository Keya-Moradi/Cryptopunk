import { describe, it, expect } from 'vitest';
import {
  detectPumpfunCreate,
  PUMPFUN_PROGRAM_ID,
  CREATE_DISCRIMINATOR,
} from './pumpfun-detector';
import bs58 from 'bs58';
import type { RawTransaction } from './pumpfun-detector';

describe('Pump.fun Detector', () => {
  it('should detect valid Pump.fun create instruction', () => {
    // Create a valid instruction data with correct discriminator
    const instructionData = Buffer.concat([CREATE_DISCRIMINATOR, Buffer.alloc(32)]);

    const tx: RawTransaction = {
      signature: '5Q9...',
      slot: 123456,
      blockTime: 1234567890,
      transaction: {
        message: {
          accountKeys: [
            '7Np...', // creator (fee payer)
            'Mint1111111111111111111111111111111111111', // mint
            'Auth1111111111111111111111111111111111111',
          ],
          instructions: [
            {
              programIdIndex: 3,
              accounts: [1, 0, 2], // mint at index 1 (accounts[0])
              data: bs58.encode(instructionData),
            },
          ],
        },
      },
      meta: { err: null },
    };

    // Add program ID to account keys
    tx.transaction.message.accountKeys.push(PUMPFUN_PROGRAM_ID);

    const result = detectPumpfunCreate(tx);

    expect(result).not.toBeNull();
    expect(result?.mint).toBe('Mint1111111111111111111111111111111111111');
    expect(result?.creator).toBe('7Np...');
    expect(result?.signature).toBe('5Q9...');
  });

  it('should return null for wrong program ID', () => {
    const instructionData = Buffer.concat([CREATE_DISCRIMINATOR, Buffer.alloc(32)]);

    const tx: RawTransaction = {
      signature: '5Q9...',
      slot: 123456,
      blockTime: 1234567890,
      transaction: {
        message: {
          accountKeys: [
            '7Np...',
            'Mint1111111111111111111111111111111111111',
            'OtherProgram11111111111111111111111111',
          ],
          instructions: [
            {
              programIdIndex: 2,
              accounts: [1, 0],
              data: bs58.encode(instructionData),
            },
          ],
        },
      },
      meta: { err: null },
    };

    const result = detectPumpfunCreate(tx);
    expect(result).toBeNull();
  });

  it('should return null for wrong discriminator', () => {
    const wrongDiscriminator = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);
    const instructionData = Buffer.concat([wrongDiscriminator, Buffer.alloc(32)]);

    const tx: RawTransaction = {
      signature: '5Q9...',
      slot: 123456,
      blockTime: 1234567890,
      transaction: {
        message: {
          accountKeys: [
            '7Np...',
            'Mint1111111111111111111111111111111111111',
            PUMPFUN_PROGRAM_ID,
          ],
          instructions: [
            {
              programIdIndex: 2,
              accounts: [1, 0],
              data: bs58.encode(instructionData),
            },
          ],
        },
      },
      meta: { err: null },
    };

    const result = detectPumpfunCreate(tx);
    expect(result).toBeNull();
  });

  it('should return null for failed transactions', () => {
    const instructionData = Buffer.concat([CREATE_DISCRIMINATOR, Buffer.alloc(32)]);

    const tx: RawTransaction = {
      signature: '5Q9...',
      slot: 123456,
      blockTime: 1234567890,
      transaction: {
        message: {
          accountKeys: ['7Np...', 'Mint1111111111111111111111111111111111111', PUMPFUN_PROGRAM_ID],
          instructions: [
            {
              programIdIndex: 2,
              accounts: [1, 0],
              data: bs58.encode(instructionData),
            },
          ],
        },
      },
      meta: { err: { InstructionError: [0, 'Custom error'] } },
    };

    const result = detectPumpfunCreate(tx);
    expect(result).toBeNull();
  });
});