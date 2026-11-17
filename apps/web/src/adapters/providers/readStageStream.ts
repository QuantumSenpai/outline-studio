import { z } from 'zod';
import { errorSchema, stageOutputSchema, type StageRequest, type StageOutput } from '@outline-studio/schemas';
import { ClientError } from '@/lib/api';

const envelope = z.object({ type: z.enum(['delta', 'result', 'error']), requestId: z.uuid(), runId: z.uuid(), revision: z.number().int() });
export async function readStageStream(response: Response, request: StageRequest, onPartial: (text: string) => void): Promise<StageOutput> {
  const reader = response.body?.getReader();
  if (!reader) throw new ClientError({ code: 'invalid_output', message: 'No response stream was received.' });
  let pending = ''; let partial = ''; let result: StageOutput | undefined;
  const decoder = new TextDecoder();
  function consume(line: string) {
    if (!line.trim()) return;
    const value: unknown = JSON.parse(line);
    const event = envelope.parse(value);
    if (event.requestId !== request.requestId || event.runId !== request.runId || event.revision !== request.revision)
      throw new ClientError({ code: 'conflict', message: 'A stale stage response was rejected. Accepted work is unchanged.' });
    if (event.type === 'error') throw new ClientError(errorSchema.parse(value));
    if (event.type === 'delta') {
      const delta = z.object({ text: z.string().max(90000) }).parse(value);
      partial += delta.text;
      if (partial.length > 90000) throw new Error('Partial output exceeded its limit.');
      onPartial(partial);
    }
    if (event.type === 'result') {
      const output = stageOutputSchema.parse(value);
      if (output.stage !== request.stage) throw new ClientError({ code: 'conflict', message: 'The wrong stage response was rejected.' });
      result = output;
    }
  }
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      pending += decoder.decode(value, { stream: true });
      if (pending.length > 200000) throw new Error('Response event exceeded its limit.');
      const lines = pending.split('\n'); pending = lines.pop() ?? '';
      for (const line of lines) consume(line);
    }
    pending += decoder.decode(); if (pending.trim()) consume(pending);
    if (!result) throw new ClientError({ code: 'uncertain', message: 'Connection ended before a validated result arrived. Retry explicitly; partial output is not accepted.' });
    return result;
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}
