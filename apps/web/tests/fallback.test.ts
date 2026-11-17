import { describe, expect, it } from 'vitest';
import { canFallback, eligibleConnections } from '@/adapters/providers/fallback';
const connections = [
  { provider: 'groq' as const, model: 'model', key:'test-key',authorized:true as const,validated:true },
  { provider: 'gemini' as const, model:'model',key:'test-key',authorized:true as const,validated:true },
  { provider: 'nvidia' as const, model:'model',key:'test-key',authorized:true as const,validated:false },
];
describe('explicit provider switching', () => {
  it('never switches without opt-in and excludes cooldown and unverified connections', () => {
    expect(eligibleConnections(connections,'groq',false,{}).map(c => c.provider)).toEqual(['groq']);
    expect(eligibleConnections(connections,'groq',true,{groq:200},100).map(c => c.provider)).toEqual(['gemini']);
    expect(eligibleConnections(connections,'groq',false,{groq:200},100)).toEqual([]);
  });
  it('does not bypass invalid credentials, exhausted credit or model restrictions', () => {
    for (const code of ['credentials','credit','model','invalid_output'] as const) expect(canFallback({code,message:'provider error'})).toBe(false);
    for (const code of ['rate_limit','unavailable','timeout'] as const) expect(canFallback({code,message:'temporary error'})).toBe(true);
  });
});
