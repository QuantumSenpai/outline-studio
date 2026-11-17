import { describe, afterEach, expect, it, vi } from 'vitest';
import { providers } from '@outline-studio/config';
import { listModels, upstreamError } from '@/server/providers/transport';
import { streamModel } from '@/server/providers/stream';
import { parseModelOutput } from '@/server/providers/prompts';
import { stageRequestSchema } from '@outline-studio/schemas';
import { outline } from './fixtures';

afterEach(() => vi.unstubAllGlobals());
describe('advertised provider contracts, not live model verification', () => {
  for (const provider of providers) it(`${provider.name}: model listing and streamed text use the allowlisted adapter`, async () => {
    const seen: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
      seen.push({ url: input, init });
      if (input.endsWith('/models')) return Response.json({ data: [{ id: 'test/chat' }, { id: 'test/embedding' }] });
      return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: '{"result":"synthetic"}' }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`);
    });
    const connection = { provider: provider.id, key: 'synthetic-test-key', model: 'test/chat', authorized: true as const };
    expect(await listModels(connection, new AbortController().signal)).toEqual(['test/chat']);
    expect(await streamModel(connection, 'Synthetic instruction', 'Synthetic task', new AbortController().signal, () => {})).toContain('synthetic');
    expect(seen.map(item => item.url)).toEqual([`${provider.base}/models`, `${provider.base}/chat/completions`]);
    expect(seen.every(item => item.init?.redirect === 'error')).toBe(true);
    if (provider.id === 'openrouter') expect(JSON.parse(String(seen[1].init?.body)).provider.allow_fallbacks).toBe(false);
  });
  it('distinguishes credentials, exhausted credit and bounded rate-limit guidance without echoing raw failures', async () => {
    expect(await upstreamError(new Response('private key rejected', { status: 401 }))).toMatchObject({ code: 'credentials' });
    expect(await upstreamError(new Response('insufficient_quota', { status: 429 }))).toMatchObject({ code: 'credit' });
    const rate = await upstreamError(new Response('raw upstream details', { status: 429, headers: { 'retry-after': '99999' } }));
    expect(rate).toMatchObject({ code: 'rate_limit', retryAfter: 300 }); expect(rate.message).not.toContain('raw upstream');
  });
  it('marks every unassessed accepted requirement unverified instead of showing an incomplete review as complete', () => {
    const request = stageRequestSchema.parse({ requestId: crypto.randomUUID(), runId: crypto.randomUUID(), revision: 1, attempt: 1, stage: 'reviewer',
      brief: 'A synthetic forest-restoration study.', outline, settings: {}, document: { version: 1, title: 'Forest study', sections: [{ heading: 'Findings', paragraphs: ['Synthetic study.'] }] },
      connection: { provider: 'groq', model: 'test/chat', key: 'synthetic-test-key', authorized: true } });
    const result = parseModelOutput(JSON.stringify({ criteria: [{ requirement: 'An invented criterion', status: 'met', detail: 'Not an accepted requirement.' }], warnings: [] }), request);
    if (result.stage !== 'reviewer') throw new Error('Wrong stage');
    expect(result.output.criteria.map(item => item.requirement)).toEqual(outline.requirements);
    expect(result.output.criteria.every(item => item.status === 'unverified')).toBe(true);
  });
});
