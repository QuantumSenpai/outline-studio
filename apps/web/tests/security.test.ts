import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeSession, verifySession, verifyOrigin } from '@/server/security';
import { readBody } from '@/server/http';
import { feedbackSchema } from '@outline-studio/schemas';

afterEach(() => vi.unstubAllEnvs());
describe('guest session security', () => {
  it('rejects forged, expired and malformed signed cookies', () => {
    vi.stubEnv('SESSION_SECRET', 'a'.repeat(48));
    const id = crypto.randomUUID(); const { token } = makeSession(id);
    expect(verifySession(token)).toBe(id);
    expect(() => verifySession(`${token.slice(0,-5)}other`)).toThrow('Session');
    expect(() => verifySession(makeSession(id,Date.now()-31*86400000).token)).toThrow('expired');
    expect(() => verifySession('not.a.session')).toThrow();
  });
  it('requires a matching origin on mutations', () => {
    vi.stubEnv('APP_ORIGIN','https://outline.example');
    expect(() => verifyOrigin(new Request('https://outline.example/api/feedback',{ method:'POST', headers:{ origin:'https://attacker.example' } }))).toThrow('originate');
    expect(() => verifyOrigin(new Request('https://outline.example/api/feedback',{ method:'POST' }))).toThrow();
    expect(() => verifyOrigin(new Request('https://outline.example/api/feedback',{ method:'POST', headers:{ origin:'https://outline.example' } }))).not.toThrow();
  });
  it('bounds streamed request bodies rather than trusting Content-Length', async () => {
    const request = new Request('https://outline.example/api/feedback', { method:'POST',headers:{ 'Content-Type':'application/json' },body:JSON.stringify({ message:'x'.repeat(1000) }) });
    await expect(readBody(request,feedbackSchema,100)).rejects.toMatchObject({ status:413 });
  });
});
