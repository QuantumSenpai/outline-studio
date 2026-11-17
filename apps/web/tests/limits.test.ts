import { afterEach, describe, expect, it, vi } from 'vitest';
import { responseJson, responseText } from '@/server/response';
import { readBody } from '@/server/http';
import { workerRequest } from '@/workers/workerRequest';
import { z } from 'zod';

afterEach(() => vi.useRealTimers());
describe('bounded request and worker failures', () => {
  it('rejects a stalled JSON body and cleans up the stream', async () => {
    vi.useFakeTimers(); const cancelled = vi.fn();
    const body = new ReadableStream({ cancel: cancelled });
    const request = new Request('http://outline.test', { method: 'POST', headers: { 'content-type': 'application/json' }, body, duplex: 'half' } as RequestInit);
    const promise = readBody(request, z.object({ value: z.string() }));
    const assertion = expect(promise).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(5001); await assertion; expect(cancelled).toHaveBeenCalled();
  });
  it('bounds model/metadata JSON and only reads a short upstream error prefix', async () => {
    await expect(responseJson(new Response('x'.repeat(200)), 100)).rejects.toMatchObject({ code: 'invalid_output' });
    expect(await responseText(new Response('x'.repeat(200)), 100, true)).toHaveLength(100);
  });
  it('fails promptly on worker bootstrap errors rather than leaving controls pending', async () => {
    const worker = new EventTarget(); const remove = vi.spyOn(worker, 'removeEventListener');
    const promise = workerRequest(worker, () => new Promise<string>(() => {}));
    const assertion = expect(promise).rejects.toThrow(/initialize/); worker.dispatchEvent(new Event('error'));
    await assertion; expect(remove).toHaveBeenCalledTimes(2);
  });
});
