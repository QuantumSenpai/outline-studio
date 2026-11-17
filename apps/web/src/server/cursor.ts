import { z } from 'zod';
import { ApiError } from './errors';
const cursorSchema = z.object({ at: z.iso.datetime(), id: z.uuid() }).strict();
export function decodeCursor(raw?: string) {
  if (!raw) return { at: new Date().toISOString(), id: undefined };
  if (raw.length > 256) throw new ApiError('invalid_input', 'Invalid page cursor.');
  if (z.iso.datetime().safeParse(raw).success) return { at: raw, id: undefined };
  try { return cursorSchema.parse(JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))); }
  catch { throw new ApiError('invalid_input', 'Invalid page cursor.'); }
}
export function encodeCursor(at: Date, id: string) {
  return Buffer.from(JSON.stringify({ at: at.toISOString(), id })).toString('base64url');
}
