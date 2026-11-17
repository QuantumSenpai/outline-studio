import { z } from 'zod';
import { retainedFileSchema } from '@/domain/projects/schema';
import { safeArchivePath } from './zipSafety';
const entry = z.object({ path: z.string().max(220).refine(safeArchivePath), hash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const manifestSchema = z.object({ format: z.literal('outline-studio-project'), version: z.literal(1), createdAt: z.iso.datetime(),
  project: entry, versions: z.array(entry).max(1000), files: z.array(entry.extend({ metadata: retainedFileSchema })).max(100) }).strict();
