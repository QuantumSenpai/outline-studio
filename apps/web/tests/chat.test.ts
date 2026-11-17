import { afterEach, describe, expect, it, vi } from 'vitest';
import { chatAttachmentSchema, chatRequestSchema } from '@outline-studio/schemas';
import { lookupDocumentation } from '@/server/chat/context7';
import { chatPrompt } from '@/server/chat/prompt';

const connection = { provider: 'groq', key: 'synthetic-test-key', model: 'test/chat', authorized: true };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('chat and read-only documentation boundaries', () => {
  it('accepts short chat but rejects oversized history, wrong roles and credential-like documentation queries', () => {
    expect(chatRequestSchema.safeParse({ requestId: crypto.randomUUID(), connection, messages: [{ role: 'user', text: 'Hi' }] }).success).toBe(true);
    expect(chatRequestSchema.safeParse({ requestId: crypto.randomUUID(), connection, messages: [{ role: 'studio', text: 'Hi' }] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ requestId: crypto.randomUUID(), connection, messages: [{ role: 'user', text: 'Hi' }], documentation: { query: 'Bearer syntheticcredential123456789' } }).success).toBe(false);
  });
  it('sends only the explicit docs question to a fixed Context7 endpoint and returns safe sources', async () => {
    let seen = '';
    vi.stubGlobal('fetch', async (input: URL, options: RequestInit) => {
      seen = String(input); expect(options.redirect).toBe('error');
      return Response.json({ codeSnippets: [{ codeTitle: 'State', codeId: 'https://react.dev/reference/react/useState', rank: 1,
        codeList: [{ code: 'const [value, setValue] = useState(0);' }] }], infoSnippets: [{ pageId: 'javascript:alert(1)', content: 'Unsafe source', rank: 2 }] });
    });
    const result = await lookupDocumentation({ query: 'How to use React state?', library: 'React' }, new AbortController().signal);
    expect(seen).toContain('https://context7.com/api/v3/search?'); expect(seen).not.toContain('private conversation');
    expect(result.metadata.sources).toEqual([{ title: 'State', url: 'https://react.dev/reference/react/useState' }]);
    expect(result.context).toContain('useState');
  });
  it('keeps chat usable when documentation is unavailable without inventing grounding', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 429 }));
    const result = await lookupDocumentation({ query: 'React state', library: '' }, new AbortController().signal);
    expect(result.metadata.sources).toEqual([]); expect(result.metadata.notice).toContain('rate limit');
    const request = chatRequestSchema.parse({ requestId: crypto.randomUUID(), connection, messages: [{ role: 'user', text: 'Explain React state.' }] });
    expect(chatPrompt(request, result).system).toContain('untrusted');
  });
});

describe('chat checkpoint compatibility and context preservation', () => {
  it('keeps only bounded recent provider context while leaving original messages intact', async () => {
    const { chatHistory } = await import('@/domain/chat/history');
    const messages = Array.from({ length: 30 }, (_, index) => ({ role: 'user' as const, text: `${index}: ${'x'.repeat(4000)}` }));
    const context = chatHistory(messages);
    expect(context.length).toBeLessThanOrEqual(20); expect(context.reduce((size, item) => size + item.text.length, 0)).toBeLessThanOrEqual(60000);
    expect(messages).toHaveLength(30); expect(context.at(-1)?.text).toBe(messages.at(-1)?.text);
  });
  it('preserves old document projects and includes chat/source history in Markdown backups', async () => {
    const { newCheckpoint, checkpointSchema } = await import('@/domain/pipeline/checkpoint');
    const { projectMarkdown } = await import('@/domain/projects/markdown');
    const current = newCheckpoint(); expect(current.mode).toBe('chat');
    const old = { ...current, mode: undefined }; expect(checkpointSchema.parse(old).mode).toBe('document');
    current.messages = [{ id: 'a', role: 'user', text: 'Explain urban gardens.' }, { id: 'b', role: 'studio', text: 'A synthetic answer.', documentation: { sources: [{ title: 'Docs', url: 'https://react.dev/' }] } }];
    expect(projectMarkdown(current)).toContain('Explain urban gardens.'); expect(projectMarkdown(current)).toContain('https://react.dev/');
  });
  it('accepts only completed matching responses and rejects truncated or mismatched streams', async () => {
    const { readChatStream } = await import('@/adapters/providers/readChatStream'); const id = crypto.randomUUID();
    const result = { type: 'done', requestId: id, text: 'A complete answer.', documentation: { sources: [] } };
    expect((await readChatStream(new Response(JSON.stringify(result)), id, () => {})).text).toBe('A complete answer.');
    await expect(readChatStream(new Response(JSON.stringify({ ...result, requestId: crypto.randomUUID() })), id, () => {})).rejects.toThrow(/stale/);
    await expect(readChatStream(new Response(JSON.stringify({ type: 'delta', requestId: id, text: 'Partial' })), id, () => {})).rejects.toMatchObject({ details: { code: 'uncertain' } });
  });
});

describe('bounded chat attachments', () => {
  const base = { id: crypto.randomUUID(), name: 'notes.md', kind: 'markdown' as const, size: 12 };
  it('requires content, caps file size and rejects oversized requests', () => {
    expect(chatAttachmentSchema.safeParse({ ...base, text: 'A note.' }).success).toBe(true);
    expect(chatAttachmentSchema.safeParse({ ...base, text: '' }).success).toBe(false);
    expect(chatAttachmentSchema.safeParse({ ...base, size: 5000000, text: 'A note.' }).success).toBe(false);
    const input = { requestId: crypto.randomUUID(), connection, messages: [{ role: 'user' as const, text: 'Read this.' }],
      attachments: [{ ...base, text: 'x'.repeat(8000000) }] };
    expect(chatRequestSchema.safeParse(input).success).toBe(false);
  });
  it('extracts real PDF text on the server and drops binary data', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const document = await PDFDocument.create();
    document.addPage().drawText('Assignment attachment evidence');
    const bytes = await document.save();
    const data = `data:application/pdf;base64,${Buffer.from(bytes).toString('base64')}`;
    const { resolveAttachments, attachmentImages } = await import('@/server/chat/attachments');
    const result = await resolveAttachments([{ id: crypto.randomUUID(), name: 'brief.pdf', kind: 'pdf', size: bytes.length, data }], new AbortController().signal);
    expect(result[0].text).toContain('Assignment attachment evidence');
    expect(result[0].data).toBeUndefined(); expect(attachmentImages(result)).toEqual([]);
  });
});
