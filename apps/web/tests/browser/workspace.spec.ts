import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { connectProvider,mockProvider } from './mockProvider';

test('accepted outline, coworkers, manual revision, review, reload and real downloads',async({page})=>{
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  const stages=await mockProvider(page);
  await page.goto('/workspace'); await page.getByRole('button',{name:'Reject optional cookies',exact:true}).click();
  await page.getByRole('textbox',{name:'Your document request'}).fill('Compare TCP and UDP for a report, slides and a labelled diagram.');
  await connectProvider(page); await page.getByRole('button',{name:'Create an outline'}).click();
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
  for(const label of ['Word report','PDF report','Presentation','Vector diagram','Diagram image']) {
    const row=page.locator('.export-list > div').filter({hasText:label});
    const downloadPromise=page.waitForEvent('download',{timeout:45000}); await row.getByRole('button',{name:'Download',exact:true}).click();
    const download=await downloadPromise; expect(await download.failure()).toBeNull();
    await download.saveAs(`../../qa-output/browser-${download.suggestedFilename()}`);
  }
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
  await page.getByRole('button',{name:'Create an outline'}).click();
  await expect(page.getByText(/Enabled fallback order exhausted/)).toBeVisible(); expect(stages).toEqual(['planner:groq','planner:gemini']);
  await expect(page.getByText(/Switching planner to your enabled gemini/)).toBeVisible();
});
test('cancellation, interrupted reload and offline states preserve the brief',async({page,context})=>{
  await mockProvider(page,'slow'); await page.goto('/workspace');
  await page.getByRole('button',{name:'Reject optional cookies',exact:true}).click();
  await connectProvider(page); await page.getByRole('textbox',{name:'Your document request'}).fill('A synthetic request whose stage will be cancelled.');
  await page.getByRole('button',{name:'Create an outline'}).click(); await page.getByRole('button',{name:'Stop',exact:true}).click();
  await page.waitForTimeout(2200); await expect(page.getByText('Your outline, for approval')).toHaveCount(0);
  await page.reload(); await expect(page.getByText('A synthetic request whose stage will be cancelled.')).toBeVisible();
  await context.setOffline(true); await expect(page.getByText(/Offline · local review/)).toBeVisible(); await context.setOffline(false);
});
