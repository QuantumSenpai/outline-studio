import { describe, expect, it } from 'vitest';
import { diagramSchema, feedbackSchema, settingsSchema, stageRequestSchema } from '@outline-studio/schemas';

describe('trust boundaries', () => {
  it('rejects diagrams with unknown edges and duplicate identifiers', () => {
    expect(diagramSchema.safeParse({ caption: 'Flow', nodes: [{ id: 'a', label: 'A', shape: 'start' },
      { id: 'a', label: 'B', shape: 'process' }], edges: [{ from: 'a', to: 'b' }] }).success).toBe(false);
  });
  it('does not accept hidden diagnostic data with feedback', () => {
    expect(feedbackSchema.safeParse({ category: 'idea', message: 'Make this useful',
      submissionId: crypto.randomUUID(), apiKey: 'private-key' }).success).toBe(false);
  });
  it('requires accepted dependencies before review', () => {
    expect(stageRequestSchema.safeParse({ runId: crypto.randomUUID(), revision: 1, attempt: 1,
      stage: 'reviewer', requestId: crypto.randomUUID(), brief: 'Explain TCP and UDP',
      settings: settingsSchema.parse({}), connection: { provider: 'groq', model: 'model', key: 'test-key', authorized: true } }).success).toBe(false);
  });
  it('rejects active uploaded content', () => {
    expect(settingsSchema.safeParse({ logo: 'data:image/svg+xml;base64,PHN2Zz4=' }).success).toBe(false);
  });
});
