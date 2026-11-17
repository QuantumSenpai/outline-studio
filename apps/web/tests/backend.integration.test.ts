import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { app } from '@/server/app';
import { stageRequestSchema } from '@outline-studio/schemas';
import { acquireStage, finishStage } from '@/server/db/stageRepository';
import { applyMigration, applyMigrations } from '@/server/db/migrate';
import { verifySession } from '@/server/security';
import { outline } from './fixtures';

const credentialsPath = process.env.OUTLINE_TEST_CREDENTIALS_FILE;
const original = { DATABASE_URL: process.env.DATABASE_URL, DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED, SESSION_SECRET: process.env.SESSION_SECRET, APP_ORIGIN: process.env.APP_ORIGIN };
const realFetch = globalThis.fetch;
let cookieA = ''; let cookieB = '';
let sql: NeonQueryFunction<false, false>;
function request(path: string, method = 'GET', cookie = cookieA, body?: unknown) {
  return app.request(`http://outline.test/api${path}`, { method, headers: { origin: 'http://outline.test', cookie,
    ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
}
async function session() {
  const response = await request('/session', 'POST', '');
  expect(response.status).toBe(200); return response.headers.get('set-cookie')?.split(';')[0] ?? '';
}
describe.skipIf(!credentialsPath)('isolated Neon database and real Hono contracts', () => {
  beforeAll(async () => {
    const credentials = JSON.parse(await readFile(credentialsPath!, 'utf8'));
    if (credentials.branch.name !== 'outline-completion-test-20261117' || credentials.branch.default || credentials.branch.primary)
      throw new Error('Integration tests require the dedicated isolated test branch.');
    const url = new URL(credentials.connection_uris[0].connection_uri); url.pathname = '/outline_completion_tests';
    process.env.DATABASE_URL = url.toString(); process.env.DATABASE_URL_UNPOOLED = url.toString();
    process.env.SESSION_SECRET = 'synthetic-isolated-test-session-secret-20261117'; process.env.APP_ORIGIN = 'http://outline.test';
    sql = neon(url.toString());
    const identity = await sql`select current_database() as name`;
    if (identity[0].name !== 'outline_completion_tests') throw new Error('Refusing to reset an unexpected database.');
    await sql.transaction([sql`DROP SCHEMA public CASCADE`, sql`CREATE SCHEMA public`]);
    await applyMigrations(url.toString());
    cookieA = await session(); cookieB = await session();
  }, 60000);
  afterAll(() => { vi.unstubAllGlobals(); for (const [key, value] of Object.entries(original)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  it('enforces origin and ownership before forwarding and emits safe request identifiers', async () => {
    expect((await app.request('http://outline.test/api/session', { method: 'POST' })).status).toBe(403);
    expect((await request('/session', 'GET', '')).status).toBe(401);
    const response = await request('/health'); expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toMatch(/^[a-f0-9-]{36}$/);
  }, 30000);
  it('applies journaled migrations reproducibly under concurrent invocations', async () => {
    const url = new URL(process.env.DATABASE_URL!); url.pathname = '/outline_migration_tests';
    await Promise.all([applyMigrations(url.toString()), applyMigrations(url.toString())]);
    const migrationSql = neon(url.toString());
    const rows = await migrationSql`select id from outline_migrations order by id`;
    expect(rows.map(row => row.id)).toEqual(['001_initial', '002_feedback_cursor']);
    await expect(applyMigration(migrationSql, '001_initial', 'SELECT 1;')).rejects.toThrow(/changed/);
  }, 60000);
  it('prevents run takeover and stale revision mutation', async () => {
    const runId = crypto.randomUUID();
    expect((await request('/runs', 'POST', cookieA, { runId, revision: 1 })).status).toBe(200);
    expect((await request('/runs', 'POST', cookieB, { runId, revision: 1 })).status).toBe(409);
    expect((await request('/runs', 'POST', cookieA, { runId, revision: 2 })).status).toBe(200);
    expect((await request('/runs', 'POST', cookieA, { runId, revision: 1 })).status).toBe(409);
  }, 30000);
  it('persists idempotent feedback without exposing another owner records', async () => {
    const data = { submissionId: crypto.randomUUID(), category: 'idea', message: 'Synthetic feedback in the isolated test database only.', contact: '', website: '' };
    expect((await request('/feedback', 'POST', cookieA, data)).status).toBe(201);
    expect((await request('/feedback', 'POST', cookieA, data)).status).toBe(200);
    expect((await request('/feedback', 'POST', cookieB, data)).status).toBe(409);
    expect(JSON.stringify(await (await request('/data', 'GET', cookieB)).json())).not.toContain(data.message);
    expect(JSON.stringify(await (await request('/data')).json())).toContain(data.message);
    expect((await request('/feedback', 'POST', cookieA, { ...data, submissionId: crypto.randomUUID(), rating: 9 })).status).toBe(400);
    const parallel = { ...data, submissionId: crypto.randomUUID() };
    const responses = await Promise.all([request('/feedback', 'POST', cookieA, parallel), request('/feedback', 'POST', cookieA, parallel)]);
    expect(responses.every(response => [200, 201].includes(response.status))).toBe(true);
  }, 30000);
  it('paginates equal-timestamp run metadata without losing records', async () => {
    const cookie = await session(); const owner = verifySession(cookie.split('=')[1]);
    const ids = Array.from({ length: 21 }, () => crypto.randomUUID()); const at = new Date(Date.now() - 1000).toISOString();
    await sql`insert into runs(id,owner,revision,updated_at) select unnest(${ids}::uuid[]),${owner}::uuid,1,${at}::timestamptz`;
    const first = await (await request('/runs', 'GET', cookie)).json();
    expect(first.items).toHaveLength(20);
    const second = await (await request(`/runs?before=${encodeURIComponent(first.next)}`, 'GET', cookie)).json();
    expect(second.items).toHaveLength(1);
    expect(new Set([...first.items, ...second.items].map((item: { id: string }) => item.id)).size).toBe(21);
  }, 30000);
  it('validates advertised model forwarding with synthetic provider responses', async () => {
    const seen: string[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('https://api.groq.com/')) { seen.push(url); return Response.json({ data: [{ id: 'test/chat' }] }); }
      return realFetch(input, init);
    });
    const response = await request('/providers/validate', 'POST', cookieA, { provider: 'groq', model: 'test/chat', key: 'synthetic-test-key', authorized: true });
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ models: ['test/chat'] });
    expect(seen).toEqual(['https://api.groq.com/openai/v1/models']); vi.unstubAllGlobals();
  }, 30000);
  it('streams validated stage output and refuses replay without another provider call', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).startsWith('https://api.groq.com/')) {
        calls++; return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: JSON.stringify(outline) }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`);
      }
      return realFetch(input, init);
    });
    const runId = crypto.randomUUID(); await request('/runs', 'POST', cookieA, { runId, revision: 1 });
    const data = stageRequestSchema.parse({ runId, revision: 1, attempt: 1, requestId: crypto.randomUUID(), stage: 'planner', brief: 'A synthetic report about urban cooling.', settings: {}, connection: { provider: 'groq', key: 'synthetic-test-key', model: 'test/chat', authorized: true } });
    const response = await request('/stages', 'POST', cookieA, data); expect(response.status).toBe(200);
    expect(await response.text()).toContain('"type":"result"');
    expect((await request('/stages', 'POST', cookieA, data)).status).toBe(409); expect(calls).toBe(1); vi.unstubAllGlobals();
  }, 30000);
  it('enforces the database concurrency lease atomically', async () => {
    const runId = crypto.randomUUID(); await request('/runs', 'POST', cookieA, { runId, revision: 1 });
    const owner = verifySession(cookieA.split('=')[1]);
    const make = (stage: 'planner' | 'writer' | 'diagram') => stageRequestSchema.parse({ runId, revision: 1, attempt: 1, requestId: crypto.randomUUID(), stage, brief: 'A synthetic report about forest restoration.', settings: {}, outline, connection: { provider: 'groq', model: 'test/chat', key: 'synthetic-test-key', authorized: true } });
    const first = make('writer'); const second = make('diagram');
    await Promise.all([acquireStage(owner, first), acquireStage(owner, second)]);
    await expect(acquireStage(owner, make('planner'))).rejects.toThrow(/concurrency/);
    await Promise.all([finishStage(first, 'failed'), finishStage(second, 'failed')]);
  }, 30000);
  it('streams owned general chat, rejects replay and sends only the explicit documentation question', async () => {
    const seen: string[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('https://context7.com/')) { seen.push(url); return Response.json({ codeSnippets: [], infoSnippets: [] }); }
      if (url.startsWith('https://api.groq.com/')) return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: 'Hello from a synthetic chat response.' }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`);
      return realFetch(input, init);
    });
    const data = { requestId: crypto.randomUUID(), connection: { provider: 'groq', model: 'test/chat', key: 'synthetic-test-key', authorized: true },
      messages: [{ role: 'user', text: 'Private synthetic conversation.' }], documentation: { query: 'React useState', library: 'React' } };
    const response = await request('/chat', 'POST', cookieA, data);
    expect(response.status).toBe(200); expect(await response.text()).toContain('"type":"done"');
    expect(seen).toHaveLength(1); expect(seen[0]).not.toContain('Private');
    expect((await request('/chat', 'POST', cookieA, data)).status).toBe(429);
    expect((await request('/chat', 'POST', '', data)).status).toBe(401); vi.unstubAllGlobals();
  }, 30000);

});
