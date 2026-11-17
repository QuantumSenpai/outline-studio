import { describe, expect, it } from 'vitest';
import { readStageStream } from '@/adapters/providers/readStageStream';
import { stageRequestSchema } from '@outline-studio/schemas';
import { settings, outline } from './fixtures';
const request = stageRequestSchema.parse({runId:crypto.randomUUID(),requestId:crypto.randomUUID(),revision:1,attempt:1,stage:'planner',brief:'Compare TCP and UDP.',settings,
  connection:{provider:'groq',model:'model',key:'test-key',authorized:true}});
const event = { requestId:request.requestId,runId:request.runId,revision:1 };
describe('stage streams', () => {
  it('requires a validated final event and rejects partial-only output', async () => {
    await expect(readStageStream(new Response(JSON.stringify({...event,type:'delta',text:'partial'})),request,()=>undefined)).rejects.toMatchObject({details:{code:'uncertain'}});
    const response = new Response(JSON.stringify({...event,type:'result',stage:'planner',output:outline}));
    expect((await readStageStream(response,request,()=>undefined)).stage).toBe('planner');
  });
  it('rejects stale run, revision and request responses', async () => {
    const response = new Response(JSON.stringify({...event,revision:2,type:'result',stage:'planner',output:outline}));
    await expect(readStageStream(response,request,()=>undefined)).rejects.toMatchObject({details:{code:'conflict'}});
  });
});
