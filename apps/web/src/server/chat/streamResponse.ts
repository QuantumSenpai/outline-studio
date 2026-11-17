import type { ChatAttachment, ChatRequest } from '@outline-studio/schemas';
import { streamModel } from '../providers/stream';
import { ApiError } from '../errors';
import { chatPrompt } from './prompt';
import type { DocumentationResult } from './context7';

export function streamChatResponse(request: ChatRequest, docs: DocumentationResult, parent: AbortSignal, attachments: ChatAttachment[] = [], images: string[] = []) {
  const controller = new AbortController(); const signal = AbortSignal.any([parent, controller.signal]); const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(stream) {
      const emit = (event: object) => { signal.throwIfAborted(); stream.enqueue(encoder.encode(JSON.stringify({ ...event, requestId: request.requestId }) + '\n')); };
      try {
        const prompt = chatPrompt(request, docs, attachments);
        const text = await streamModel(request.connection, prompt.system, prompt.prompt, signal, text => emit({ type: 'delta', text }), { maxTokens: 2200, maxChars: 16000, images });
        emit({ type: 'done', text, documentation: docs.metadata });
      } catch (error) {
        const problem = error instanceof ApiError ? error : new ApiError(signal.reason?.name === 'TimeoutError' ? 'timeout' : signal.aborted ? 'cancelled' : 'unavailable',
          signal.reason?.name === 'TimeoutError' ? 'Chat timed out. Your message is saved; retry explicitly.' : 'Chat disconnected or was cancelled. Your message is saved; provider usage may still apply.', 502);
        try { stream.enqueue(encoder.encode(JSON.stringify({ type: 'error', ...problem.toJSON(), requestId: request.requestId }) + '\n')); } catch { controller.abort(); }
      } finally { try { stream.close(); } catch { controller.abort(); } }
    },
    cancel() { controller.abort(); },
  });
  return new Response(body, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no' } });
}
