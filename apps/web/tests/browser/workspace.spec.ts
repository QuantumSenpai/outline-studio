import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { connectProvider,mockProvider } from './mockProvider';

test('accepted outline, coworkers, manual revision, review, reload and real downloads',async({page})=>{
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{ if(message.type()==='error') errors.push(message.text()); });
  const stages=await mockProvider(page);
  await page.goto('/workspace'); await page.getByRole('button',{name:'Reject optional cookies',exact:true}).click();
  await page.getByRole('textbox',{name:'Your document request'}).fill('Compare TCP and UDP for a report, slides and a labelled diagram.');
  await connectProvider(page); await page.getByRole('button', { name: 'Create document', exact: true }).click(); await page.getByRole('button',{name:'Send message'}).click();
  await expect(page.getByText('Your outline, for approval')).toBeVisible(); expect(stages).toEqual(['planner:groq']);
  await page.getByRole('button',{name:'Accept outline & start coworkers'}).click();
  await expect(page.getByRole('button',{name:'Review against requirements'})).toBeVisible();
  expect(stages).toContain('writer:groq'); expect(stages).toContain('diagram:groq'); expect(stages).not.toContain('reviewer:groq');
  await page.getByRole('tab',{name:'Document',exact:true}).click(); await page.getByRole('button',{name:'Edit content'}).click();
  await page.getByLabel('Document title',{exact:true}).fill('TCP and UDP revised manually'); await page.getByRole('button',{name:'Save revision'}).click();
  await expect(page.getByText('TCP and UDP revised manually').first()).toBeVisible();
  await page.getByRole('tab',{name:'Conversation',exact:true}).click(); await page.getByRole('button',{name:'Review against requirements'}).click();
  await expect(page.getByText('Review finished. Your call next.')).toBeVisible();
  const accessibility=await new AxeBuilder({page}).analyze(); expect(accessibility.violations).toEqual([]);
  await page.getByRole('button',{name:'Prepare downloads'}).click();
  await page.getByRole('checkbox',{name:/I have read the review/}).check();
  await page.evaluate(() => {
    const OriginalWorker = window.Worker; let fail = true;
    window.Worker = class extends OriginalWorker {
      constructor(...args: ConstructorParameters<typeof Worker>) {
        super(...args);
        if (fail) { fail = false; queueMicrotask(() => this.dispatchEvent(new Event('error'))); }
      }
    };
  });
  await page.locator('.export-list > div').filter({hasText:'Word report'}).getByRole('button',{name:'Download',exact:true}).click();
  await expect(page.locator('.export-panel').getByRole('alert')).toContainText('renderer could not initialize');
  const originals = new Map<string, Buffer>();
  for(const label of ['Word report','PDF report','Presentation','Vector diagram','Diagram image','Markdown report']) {
    const row=page.locator('.export-list > div').filter({hasText:label});
    const downloadPromise=page.waitForEvent('download',{timeout:45000}); await row.getByRole('button',{name:'Download',exact:true}).click();
    const download=await downloadPromise; expect(await download.failure()).toBeNull();
    const path = await download.path(); if (!path) throw new Error('Missing generated file');
    originals.set(download.suggestedFilename(), await readFile(path));
    await download.saveAs(`../../qa-output/browser-${download.suggestedFilename()}`);
  }
  await page.getByRole('tab',{name:'History',exact:true}).click();
  await page.getByRole('button',{name:/Accepted export revision/}).first().click();
  await expect(page.getByRole('button',{name:/Download retained/})).toHaveCount(6);
  const retained = page.getByRole('button', { name: /Download retained/ }).first();
  const retainedName = (await retained.innerText()).replace('Download retained ', '');
  const retainedPromise = page.waitForEvent('download'); await retained.click();
  const retainedDownload = await retainedPromise; const retainedPath = await retainedDownload.path();
  if (!retainedPath) throw new Error('Missing retained file');
  expect(await readFile(retainedPath)).toEqual(originals.get(retainedName));
  await page.getByRole('combobox', { name: 'Regenerate snapshot format', exact: true }).selectOption('md');
  const historicalPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Regenerate snapshot file', exact: true }).click();
  const historicalPath = await (await historicalPromise).path();
  if (!historicalPath) throw new Error('Missing historical file');
  expect(await readFile(historicalPath, 'utf8')).toContain('TCP and UDP revised manually');
  const backupPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export complete project ZIP',exact:true}).click();
  const backup=await backupPromise; const backupPath=await backup.path();
  if(!backupPath) throw new Error('Project backup was not created.');
  await page.goto('/projects');
  await page.getByLabel('Import complete project ZIP',{exact:true}).setInputFiles(backupPath);
  await expect(page).toHaveURL(/workspace\?project=/);
  await page.waitForTimeout(350); await page.reload(); await page.getByRole('tab',{name:'Document',exact:true}).click();
  await expect(page.getByText('TCP and UDP revised manually').first()).toBeVisible(); expect(errors).toEqual([]);
});
test('explicit fallback order switches and stops when exhausted',async({page})=>{
  const stages=await mockProvider(page,'exhausted'); await page.goto('/workspace');
  await page.getByRole('button',{name:'Reject optional cookies',exact:true}).click();
  await page.getByRole('textbox',{name:'Your document request'}).fill('A synthetic request for testing fallback.');
  await connectProvider(page,'groq'); await connectProvider(page,'gemini');
  await page.getByRole('button',{name:'groq connected'}).click();
  await page.getByRole('checkbox',{name:/Enable automatic switching/}).check(); await page.getByRole('button',{name:'Close dialog'}).click();
  await page.getByRole('button', { name: 'Create document', exact: true }).click(); await page.getByRole('button',{name:'Send message'}).click();
  await expect(page.getByText(/Enabled fallback order exhausted/)).toBeVisible(); expect(stages).toEqual(['planner:groq','planner:gemini']);
  await expect(page.getByText(/Switching planner to your enabled gemini/)).toBeVisible();
});
test('cancellation, interrupted reload and offline states preserve the brief',async({page,context})=>{
  await mockProvider(page,'slow'); await page.goto('/workspace');
  await page.getByRole('button',{name:'Reject optional cookies',exact:true}).click();
  await connectProvider(page); await page.getByRole('textbox',{name:'Your document request'}).fill('A synthetic request whose stage will be cancelled.');
  await page.getByRole('button', { name: 'Create document', exact: true }).click(); await page.getByRole('button',{name:'Send message'}).click(); await page.getByRole('button',{name:'Stop',exact:true}).click();
  await page.waitForTimeout(2200); await expect(page.getByText('Your outline, for approval')).toHaveCount(0);
  await page.reload(); await expect(page.getByText('A synthetic request whose stage will be cancelled.')).toBeVisible();
  await context.setOffline(true); await expect(page.getByText(/Offline · local review/)).toBeVisible(); await context.setOffline(false);
});
