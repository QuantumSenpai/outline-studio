import { test, expect } from '@playwright/test';
import { connectProvider, mockProvider } from './mockProvider';

test('a direct playground visit initializes and persists its project', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/playground');
  const composer = page.getByPlaceholder('Send a message…');
  await composer.fill('Keep my playground draft.');
  await expect(composer).toHaveValue('Keep my playground draft.');
  await expect(page).toHaveURL(/\/playground\?project=/);
  const url = page.url();
  await expect(page.getByRole('status')).toContainText('Saved on this device');
  await page.reload();
  await expect(composer).toHaveValue('Keep my playground draft.');
  await expect(page).toHaveURL(url);
  expect(errors).toEqual([]);
  await page.screenshot({ path: '../../qa-output/playground.png', fullPage: true });
});

test('playground sends sequential fallbacks and cancels late replies', async ({ page }) => {
  await mockProvider(page);
  const sent: string[] = [];
  let fail = false;
  let release: () => void = () => {};
  await page.route('**/api/chat', async route => {
    const input = route.request().postDataJSON(); sent.push(input.connection.provider);
    if (sent.length === 1) await new Promise<void>(resolve => { release = resolve; });
    if (fail && input.connection.provider === 'groq') {
      await route.fulfill({ status: 429, json: { code: 'rate_limit', message: 'Synthetic limit.', retryAfter: 2 } }); return;
    }
    await route.fulfill({ contentType: 'application/x-ndjson', body: JSON.stringify({ type: 'done', requestId: input.requestId,
      text: 'Synthetic playground reply.', documentation: { sources: [] } }) + '\n' });
  });
  await page.goto('/playground');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  await connectProvider(page); await connectProvider(page, 'gemini');
  await page.getByRole('button', { name: 'groq connected', exact: true }).click();
  await page.getByRole('checkbox', { name: /Enable automatic switching/ }).check();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  const composer = page.getByPlaceholder('Send a message…');
  await composer.fill('Cancel this reply.'); await composer.press('Enter');
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible();
  await expect(composer).toBeDisabled();
  await expect.poll(() => sent.length).toBe(1);
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  release();
  await expect(page.locator('.playground-error')).toContainText('Reply stopped');
  await expect(page.getByRole('log')).not.toContainText('Synthetic playground reply.');
  await expect(page.getByRole('log')).not.toContainText('Cancelled unfinished work.');
  expect(sent).toEqual(['groq']);
  fail = true;
  await composer.fill('Try the enabled fallback.'); await composer.press('Enter');
  await expect(page.getByRole('log')).toContainText('Synthetic playground reply.');
  expect(sent).toEqual(['groq', 'groq', 'gemini']);
});

test('personal assistant mode omits documentation and attachments from submission', async ({ page }) => {
  await mockProvider(page);
  const sent: { documentation?: unknown; attachments: unknown[]; messages: { attachments?: unknown[] }[] }[] = [];
  await page.route('**/api/chat', async route => {
    const input = route.request().postDataJSON(); sent.push(input);
    await route.fulfill({ contentType: 'application/x-ndjson', body: JSON.stringify({ type: 'done', requestId: input.requestId,
      text: 'Assistant mode reply.', documentation: { sources: [] } }) + '\n' });
  });
  await page.goto('/playground');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  await connectProvider(page);
  await page.getByText('Look up documentation', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Use current software documentation for this reply' }).check();
  await page.getByLabel('Documentation question', { exact: true }).fill('How does useState work?');
  await page.locator('input[type=file][multiple]').setInputFiles({ name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from('A local note.') });
  await expect(page.getByText('notes.md')).toBeVisible();
  await page.getByLabel('Personal Assistant Mode', { exact: true }).check();
  await page.getByPlaceholder('Send a message…').fill('Hello assistant.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('Assistant mode reply.');
  expect(sent[0].documentation).toBeUndefined();
  expect(sent[0].attachments).toEqual([]);
  expect(sent[0].messages.at(-1)?.attachments ?? []).toEqual([]);
});
