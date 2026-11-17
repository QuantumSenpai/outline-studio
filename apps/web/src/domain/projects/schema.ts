import { z } from 'zod';
import { checkpointSchema } from '../pipeline/checkpoint';

export const projectSchema = z.object({ id: z.uuid(), name: z.string().trim().min(1).max(160),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), checkpoint: checkpointSchema }).strict();
export const versionSchema = z.object({ id: z.uuid(), projectId: z.uuid(), number: z.number().int().min(1).max(10000),
  name: z.string().trim().min(1).max(160), createdAt: z.iso.datetime(), checkpoint: checkpointSchema }).strict();
export const retainedFileSchema = z.object({ id: z.uuid(), projectId: z.uuid(), runId: z.uuid(), revision: z.number().int().min(1).max(1000),
  name: z.string().min(1).max(180).regex(/^[a-zA-Z0-9._-]+$/), mime: z.enum(['application/pdf', 'application/zip', 'application/json', 'text/markdown',
    'image/png', 'image/svg+xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation']), createdAt: z.iso.datetime() }).strict();
export type Project = z.infer<typeof projectSchema>;
export type ProjectVersion = z.infer<typeof versionSchema>;
export type RetainedFile = z.infer<typeof retainedFileSchema> & { data: Uint8Array<ArrayBuffer> };
