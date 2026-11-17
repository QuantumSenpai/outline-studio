import { z } from 'zod';
import { settingsSchema, outlineSchema, documentSchema, diagramSchema, reviewSchema, sourceSchema, providerIdSchema, stageNameSchema } from '@outline-studio/schemas';

export const taskSchema = z.object({ stage: stageNameSchema,
  status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']), attempt: z.number().int().min(0).max(3),
  provider: providerIdSchema.optional(), model: z.string().max(160).optional(),
  summary: z.string().max(2000), partial: z.string().max(90000).default(''),
});
export const checkpointSchema = z.object({
  version: z.literal(1), runId: z.uuid(), revision: z.number().int().min(1).max(1000),
  brief: z.string().max(12000), composer: z.string().max(12000).default(''), settings: settingsSchema, outline: outlineSchema.optional(),
  outlineAccepted: z.boolean(), document: documentSchema.optional(), diagram: diagramSchema.optional(),
  review: reviewSchema.optional(), sources: z.array(sourceSchema).max(20),
  tasks: z.array(taskSchema).length(4), messages: z.array(z.object({ id: z.string(), role: z.enum(['user', 'studio']), text: z.string().max(16000) })).max(200),
  updatedAt: z.string(),
}).strict();
export type Checkpoint = z.infer<typeof checkpointSchema>;
export type Task = z.infer<typeof taskSchema>;
export function newCheckpoint(style: 'academic' | 'professional' | 'research' | 'solutions' = 'academic'): Checkpoint {
  return { version: 1, runId: crypto.randomUUID(), revision: 1, brief: '', settings: settingsSchema.parse({ style }),
    composer: '', outlineAccepted: false, sources: [], tasks: ['planner', 'writer', 'diagram', 'reviewer'].map(stage =>
      taskSchema.parse({ stage, status: 'queued', attempt: 0, summary: 'Waiting for the main request.' })),
    messages: [], updatedAt: new Date().toISOString() };
}
export function resumeCheckpoint(value: unknown): Checkpoint {
  const checkpoint = checkpointSchema.parse(value);
  return { ...checkpoint, tasks: checkpoint.tasks.map(task => task.status === 'running' ? { ...task,
    status: 'failed', summary: 'This request was interrupted. Retry explicitly; provider usage may have occurred.', partial: '' } : task) };
}
