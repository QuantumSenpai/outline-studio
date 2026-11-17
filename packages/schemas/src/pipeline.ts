import { z } from 'zod';
import { connectionSchema } from './provider';
import { documentSchema, outlineSchema, diagramSchema, reviewSchema, sourceSchema } from './document';
import { settingsSchema } from './export';

export const stageNameSchema = z.enum(['planner', 'writer', 'diagram', 'reviewer']);
export type StageName = z.infer<typeof stageNameSchema>;
export const stageRequestSchema = z.object({
  runId: z.uuid(), revision: z.number().int().min(1).max(1000), attempt: z.number().int().min(1).max(3),
  stage: stageNameSchema, requestId: z.uuid(), connection: connectionSchema,
  brief: z.string().trim().min(10).max(12000), settings: settingsSchema,
  outline: outlineSchema.optional(), document: documentSchema.optional(), diagram: diagramSchema.optional(),
  sources: z.array(sourceSchema).max(20).default([]),
}).strict().superRefine((r, ctx) => {
  if (r.stage !== 'planner' && !r.outline) ctx.addIssue({ code: 'custom', message: 'Accept an outline first.' });
  if (r.stage === 'reviewer' && !r.document) ctx.addIssue({ code: 'custom', message: 'Review requires accepted content.' });
});
export type StageRequest = z.infer<typeof stageRequestSchema>;
export const stageOutputSchema = z.discriminatedUnion('stage', [
  z.object({ stage: z.literal('planner'), output: outlineSchema }),
  z.object({ stage: z.literal('writer'), output: documentSchema }),
  z.object({ stage: z.literal('diagram'), output: diagramSchema }),
  z.object({ stage: z.literal('reviewer'), output: reviewSchema }),
]);
export type StageOutput = z.infer<typeof stageOutputSchema>;
export const feedbackSchema = z.object({
  category: z.enum(['idea', 'problem', 'experience']), rating: z.number().int().min(1).max(5).optional(),
  message: z.string().trim().min(10).max(4000),
  contact: z.union([z.email().max(254), z.literal('')]).default(''),
  website: z.string().max(0).default(''), submissionId: z.uuid(),
}).strict();
export type Feedback = z.infer<typeof feedbackSchema>;
