import { z } from 'zod';

// Raw transaction schema (minimal shape we need)
export const rawTransactionSchema = z.object({
  signature: z.string(),
  slot: z.number(),
  blockTime: z.number(),
  transaction: z.object({
    message: z.object({
      accountKeys: z.array(z.string()),
      instructions: z.array(
        z.object({
          programIdIndex: z.number(),
          accounts: z.array(z.number()),
          data: z.string(),
        })
      ),
    }),
  }),
  meta: z
    .object({
      err: z.union([z.null(), z.object({}).passthrough()]),
    })
    .optional(),
});

// Webhook payload can be a single transaction or an array
export const webhookPayloadSchema = z.union([
  z.array(rawTransactionSchema),
  rawTransactionSchema.transform((tx) => [tx]),
]);

export type RawTransaction = z.infer<typeof rawTransactionSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;