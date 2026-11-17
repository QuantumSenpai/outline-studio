import { chatEventSchema, errorSchema, type ChatDocumentation } from '@outline-studio/schemas';
import { ClientError } from '@/lib/api';

export async function readChatStream(response: Response, requestId: string, onText: (text: string) => void) {
  const reader = response.body?.getReader(); if (!reader) throw new Error('Chat response was empty. Retry your saved message.');
  const decoder = new TextDecoder(); let buffer = ''; let text = ''; let result: { text: string; documentation: ChatDocumentation } | undefined;
  function consume(line: string) {
    if (!line.trim()) return;
    const value: unknown = JSON.parse(line);
    if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'error') {
      const failure = errorSchema.parse(value); if (failure.requestId !== requestId) throw new Error('Stale chat error rejected.');
      throw new ClientError(failure);
    }
    const event = chatEventSchema.parse(value);
    if (event.requestId !== requestId || result) throw new Error('A stale or duplicate chat response was rejected.');
    if (event.type === 'delta') { text += event.text; if (text.length > 16000) throw new Error('Chat exceeded the response limit.'); onText(text); }
    else result = { text: event.text, documentation: event.documentation };
  }
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      if (buffer.length > 80000) throw new Error('Chat event exceeded its limit.');
      const lines = buffer.split('\n'); buffer = lines.pop() ?? ''; lines.forEach(consume);
    }
    buffer += decoder.decode(); if (buffer.trim()) consume(buffer);
    if (!result) throw new ClientError({ code: 'uncertain', message: 'Reply was interrupted. Your message is saved; retry explicitly.' });
    return result;
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}
