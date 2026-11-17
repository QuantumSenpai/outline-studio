import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ClientError, messageFrom } from '@/lib/api';
import { canFallback } from '@/adapters/providers/fallback';

afterEach(() => vi.unstubAllGlobals());
describe('safe and actionable API failures', () => {
  it('distinguishes deadline failures from explicit cancellation for eligible fallback', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('network request ended'); });
    const timeout = new AbortController(); timeout.abort(new DOMException('deadline', 'TimeoutError'));
    const cancellation = new AbortController(); cancellation.abort();
    try { await api('/stages', {}, timeout.signal); throw new Error('Expected timeout'); }
    catch (error) { expect(error).toBeInstanceOf(ClientError); if (error instanceof ClientError) { expect(error.details.code).toBe('timeout'); expect(canFallback(error.details)).toBe(true); } }
    await expect(api('/stages', {}, cancellation.signal)).rejects.toMatchObject({ details: { code: 'cancelled' } });
  });
  it('preserves non-sensitive server correlation IDs without returning raw failures', async () => {
    const requestId = crypto.randomUUID();
    vi.stubGlobal('fetch', async () => Response.json({ code: 'unavailable', message: 'Try the unfinished stage again.', requestId }, { status: 503 }));
    try { await api('/stages', {}); } catch (error) { expect(messageFrom(error)).toContain(requestId); }
    vi.stubGlobal('fetch', async () => new Response('<html>private upstream stack</html>', { status: 502 }));
    await expect(api('/stages', {})).rejects.toMatchObject({ details: { code: 'unavailable' } });
  });
});
