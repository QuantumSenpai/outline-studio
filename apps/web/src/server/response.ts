import { ApiError } from './errors';

export async function responseText(response: Response, maximum: number, truncate = false) {
  const reader = response.body?.getReader(); if (!reader) return '';
  const decoder = new TextDecoder(); let text = ''; let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      const remaining = maximum - total; total += value.byteLength;
      if (total > maximum) {
        if (!truncate) throw new ApiError('invalid_output', 'The upstream response exceeded its safe size limit.', 502);
        text += decoder.decode(value.subarray(0, Math.max(0, remaining)), { stream: true }); break;
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}
export async function responseJson(response: Response, maximum = 2000000): Promise<unknown> {
  try { return JSON.parse(await responseText(response, maximum)); }
  catch (error) { if (error instanceof ApiError) throw error; throw new ApiError('invalid_output', 'Upstream JSON could not be read. Retry or choose another model.', 502); }
}
