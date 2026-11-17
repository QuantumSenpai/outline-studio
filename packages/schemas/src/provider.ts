import { z } from 'zod';

export const providerIdSchema = z.enum(['nvidia', 'groq', 'gemini', 'openrouter']);
export type ProviderId = z.infer<typeof providerIdSchema>;
export const connectionSchema = z.object({
  provider: providerIdSchema,
  model: z.string().trim().min(1).max(160).regex(/^[\w./:@-]+$/),
  key: z.string().trim().min(8).max(512).regex(/^[\x21-\x7E]+$/),
  authorized: z.literal(true),
}).strict();
export type Connection = z.infer<typeof connectionSchema>;
export const errorSchema = z.object({
  code: z.enum(['invalid_input', 'unauthorized', 'forbidden', 'rate_limit', 'credit', 'credentials',
    'unavailable', 'timeout', 'cancelled', 'conflict', 'uncertain', 'model', 'invalid_output', 'offline']),
  message: z.string(), retryAfter: z.number().nonnegative().optional(),
});
export type ErrorData = z.infer<typeof errorSchema>;
export const modelListSchema = z.object({ data: z.array(z.object({ id: z.string().max(160) })).max(5000) });
