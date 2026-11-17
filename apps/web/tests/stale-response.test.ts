import 'fake-indexeddb/auto';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { stageRequestSchema, type StageRequest } from '@outline-studio/schemas';
import { newCheckpoint } from '@/domain/pipeline/checkpoint';
import { executeStage } from '@/domain/pipeline/executeStage';
import { useWorkspace } from '@/ui/stores/workspaceStore';
import { useProviders } from '@/ui/stores/providerStore';
import { document, outline } from './fixtures';

afterEach(() => { vi.unstubAllGlobals(); useProviders.getState().lock(); });
describe('input revision identity and preserved manual work', () => {
  it('rejects late streamed partials and results after a manual input revision', async () => {
    const checkpoint = { ...newCheckpoint(), brief: 'A synthetic report about renewable energy.', outline, outlineAccepted: true };
    useWorkspace.getState().hydrate(checkpoint);
    useProviders.getState().put({ provider: 'groq', model: 'test/chat', key: 'synthetic-test-key', authorized: true, validated: true, verifiedAt: new Date().toISOString() });
    let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
    let request: StageRequest | undefined;
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      if (url === '/api/stages') {
        request = stageRequestSchema.parse(JSON.parse(String(init?.body)));
        return new Response(new ReadableStream({ start: stream => { controller = stream; } }));
      }
      return Response.json({ connected: true, saved: true });
    });
    const pending = executeStage('writer', new AbortController().signal);
    const assertion = expect(pending).rejects.toThrow(/stale/);
    await vi.waitFor(() => expect(controller).toBeDefined());
    const manual = { ...document, title: 'My manually revised renewable-energy report' };
    useWorkspace.getState().editDocument(manual);
    if (!controller || !request) throw new Error('Synthetic stage did not start.');
    const encoder = new TextEncoder(); const identity = { requestId: request.requestId, runId: request.runId, revision: request.revision };
    controller.enqueue(encoder.encode(`${JSON.stringify({ ...identity, type: 'delta', text: 'old output' })}\n`));
    controller.enqueue(encoder.encode(`${JSON.stringify({ ...identity, type: 'result', stage: 'writer', output: document })}\n`)); controller.close();
    await assertion;
    const current = useWorkspace.getState().checkpoint;
    expect(current?.document?.title).toBe(manual.title);
    expect(current?.revision).toBeGreaterThan(checkpoint.revision);
    expect(current?.tasks.find(task => task.stage === 'writer')).toMatchObject({ status: 'cancelled', partial: '' });
  });
  it('preserves prior conversation records at the disclosed limit', () => {
    const checkpoint = newCheckpoint(); checkpoint.messages = Array.from({ length: 200 }, (_, index) => ({ id: String(index), role: 'user', text: `Preserved message ${index}` }));
    useWorkspace.getState().hydrate(checkpoint); useWorkspace.getState().message('A further status update');
    expect(useWorkspace.getState().checkpoint?.messages).toEqual(checkpoint.messages);
  });
});
