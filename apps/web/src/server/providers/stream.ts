import { z } from 'zod';
import type { Connection } from '@outline-studio/schemas';
import { endpoint, headers, upstreamError } from './transport';
import { ApiError } from '../errors';

const chunkSchema = z.object({ choices: z.array(z.object({ delta: z.object({ content: z.string().nullable().optional() }),
  finish_reason: z.string().nullable().optional() })).optional(), error: z.unknown().optional() });
export async function streamModel(connection: Connection, system: string, prompt: string,
  signal: AbortSignal, onText: (text: string) => void) {
  const response = await fetch(endpoint(connection, '/chat/completions'), { method: 'POST',
    headers: headers(connection), signal, redirect: 'error', cache: 'no-store',
    body: JSON.stringify({ model: connection.model, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      stream: true, max_tokens: 6500, ...(connection.provider === 'openrouter' ? { provider: { allow_fallbacks: false } } : {}) }),
  });
  if (!response.ok) throw await upstreamError(response);
  const reader = response.body?.getReader();
  if (!reader) throw new ApiError('invalid_output', 'Provider returned an empty stream.', 502);
  const decoder = new TextDecoder();
  let pending = ''; let output = ''; let finished = false;
  function consume(line: string) {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trim();
    if (!data) return;
    if (data === '[DONE]') { finished = true; return; }
    let value: unknown;
    try { value = JSON.parse(data); } catch { throw new ApiError('invalid_output', 'Provider sent malformed stream data.', 502); }
    const result = chunkSchema.safeParse(value);
    if (!result.success || result.data.error) throw new ApiError('invalid_output', 'Provider stream could not be read.', 502);
    const choice = result.data.choices?.[0];
    if (choice?.finish_reason === 'length') throw new ApiError('invalid_output', 'The model reached its output limit. Shorten the brief or request fewer sections.', 502);
    if (choice?.finish_reason === 'stop') finished = true;
    const text = choice?.delta.content;
    if (text) {
      output += text;
      if (output.length > 90000) throw new ApiError('invalid_output', 'Model output exceeded the stage size limit.', 502);
      onText(text);
    }
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      if (pending.length > 200000) throw new ApiError('invalid_output', 'Provider stream event is too large.', 502);
      const lines = pending.split('\n'); pending = lines.pop() ?? '';
      for (const line of lines) consume(line.replace(/\r$/, ''));
    }
    pending += decoder.decode();
    if (pending.trim()) consume(pending);
    if (!finished || !output.trim()) throw new ApiError('invalid_output', 'Connection ended before the model finished. Partial output is unaccepted; retry explicitly.', 502);
    return output;
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}
