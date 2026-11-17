import type { Page } from '@playwright/test';
import { stageRequestSchema } from '@outline-studio/schemas';
import { outline,document,diagram,review } from '../fixtures';

export async function mockProvider(page: Page, failure?: 'fallback' | 'exhausted' | 'slow') {
  const stages: string[] = [];
  await page.route('**/api/session',route=>route.fulfill({json:{connected:true}}));
  await page.route('**/api/providers/validate',route=>route.fulfill({json:{models:['test/chat'],verifiedAt:new Date().toISOString()}}));
  await page.route('**/api/runs',route=>route.fulfill({json:{saved:true}}));
  await page.route('**/api/stages',async route=>{
    const request = stageRequestSchema.parse(route.request().postDataJSON()); stages.push(`${request.stage}:${request.connection.provider}`);
    if (failure === 'exhausted' || failure === 'fallback' && request.connection.provider === 'groq') {
      await route.fulfill({status:429,json:{code:'rate_limit',message:'Synthetic provider limit.',retryAfter:2}}); return;
    }
    if (failure === 'slow') await new Promise(resolve=>setTimeout(resolve,2000));
    const outputs = {planner:outline,writer:document,diagram,reviewer:review};
    const event = {requestId:request.requestId,runId:request.runId,revision:request.revision};
    await route.fulfill({contentType:'application/x-ndjson',body:[{...event,type:'delta',text:'{"title":'},
      {...event,type:'result',stage:request.stage,output:outputs[request.stage]}].map(e=>JSON.stringify(e)).join('\n')});
  });
  return stages;
}
export async function connectProvider(page: Page, provider='groq') {
  await page.getByRole('button',{name:/Connect AI|groq connected|gemini connected/}).click();
  const dialog = page.getByRole('dialog',{name:'Connect your AI'});
  await dialog.getByLabel('Provider',{exact:true}).selectOption(provider);
  await dialog.getByLabel('API key',{exact:true}).fill('synthetic-test-key');
  await dialog.getByRole('checkbox',{name:/I authorize/}).check();
  await dialog.getByRole('button',{name:'Validate connection & load models'}).click();
  await dialog.getByRole('button',{name:'Use this connection'}).click();
  await dialog.getByRole('button',{name:'Close dialog'}).click();
}
