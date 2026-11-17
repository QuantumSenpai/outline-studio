import { Hono } from 'hono';
import { z } from 'zod';
import { stageRequestSchema } from '@outline-studio/schemas';
import { readBody, owner } from '../http';
import { acquireStage, currentRevision, finishStage, openRun } from '../db/stageRepository';
import { limit } from '../db/limits';
import { buildPrompt, parseModelOutput } from '../providers/prompts';
import { streamModel } from '../providers/stream';
import { ApiError } from '../errors';

export const stageRoutes = new Hono();
stageRoutes.post('/runs', async c => {
  const id = await owner(c);
  const data = await readBody(c.req.raw, z.object({ runId: z.uuid(), revision: z.number().int().min(1).max(1000) }).strict(), 2000);
  await limit(`runs:${id}`, 60);
  await openRun(id, data.runId, data.revision);
  return c.json({ saved: true });
});
stageRoutes.post('/stages', async c => {
  const id = await owner(c);
  const request = await readBody(c.req.raw, stageRequestSchema, 850000);
  await limit(`stages:${id}`, 100);
  await acquireStage(id, request);
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(new Error('deadline')), 45000);
  const signal = AbortSignal.any([c.req.raw.signal, controller.signal]);
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(stream) {
      const emit = (data: object) => { if (!signal.aborted) stream.enqueue(encoder.encode(`${JSON.stringify({ ...data,
        requestId: request.requestId, runId: request.runId, revision: request.revision })}\n`)); };
      try {
        const { system, prompt } = buildPrompt(request);
        const text = await streamModel(request.connection, system, prompt, signal, text => emit({ type: 'delta', text }));
        signal.throwIfAborted();
        const output = parseModelOutput(text, request);
        await currentRevision(id, request);
        await finishStage(request, 'completed');
        emit({ type: 'result', ...output });
      } catch (error) {
        await finishStage(request, signal.aborted ? 'cancelled' : 'failed').catch(() => undefined);
        const problem = error instanceof ApiError ? error : new ApiError(controller.signal.aborted ? 'timeout' : signal.aborted ? 'cancelled' : 'unavailable',
          controller.signal.aborted ? 'Stage exceeded its 45-second deadline. Partial output was not accepted. Retry or reduce the brief.' : 'Provider request disconnected or was cancelled. Partial output was not accepted. Provider usage may still apply.', 502);
        try { stream.enqueue(encoder.encode(`${JSON.stringify({ type: 'error', ...problem.toJSON(), requestId: request.requestId,
          runId: request.runId, revision: request.revision })}\n`)); } catch { controller.abort(); }
      } finally {
        clearTimeout(deadline);
        try { stream.close(); } catch { controller.abort(); }
      }
    },
    cancel() { controller.abort(); clearTimeout(deadline); },
  });
  return new Response(body, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no' } });
});
