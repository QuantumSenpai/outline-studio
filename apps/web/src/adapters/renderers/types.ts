import { z } from 'zod';
import { documentSchema, settingsSchema, diagramSchema } from '@outline-studio/schemas';
export const exportInputSchema = z.object({ document: documentSchema, settings: settingsSchema,
  diagram: diagramSchema.optional(), diagramPng: z.string().max(12000000).optional() }).strict();
export type ExportInput = z.infer<typeof exportInputSchema>;
export type ExportFormat = 'docx' | 'pdf' | 'pptx';
