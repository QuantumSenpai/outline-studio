import { test, expect } from '@playwright/test';
import { mockProvider, connectProvider } from './mockProvider';

test('general chat retains context and sources without starting document coworkers', async ({ page }) => {
  const stages = await mockProvider(page); const requests: { messages: { role: string; text: string }[]; documentation?: { query: string; library: string } }[] = [];
  await page.route('**/api/chat', async route => {
    const input = route.request().postDataJSON(); requests.push(input);
    const text = requests.length === 1 ? 'Hello! Your example is mango.\n```js\nconst mango = 1;\n```' : 'You called the example mango.';
    await route.fulfill({ contentType: 'application/x-ndjson', body: JSON.stringify({ type: 'done', requestId: input.requestId, text,
      documentation: { sources: input.documentation ? [{ title: 'React state', url: 'https://react.dev/reference/react/useState' }] : [] } }) + '\n' });
  });
  await page.goto('/workspace'); await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Chat', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await connectProvider(page);
  const composer = page.getByRole('textbox', { name: 'Your document request' });
  await page.getByText('Context7 documentation', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Use current software documentation for this reply' }).check();
  await page.getByLabel('Documentation question', { exact: true }).fill('How does React useState work?');
  await page.getByLabel('Library or version (optional)', { exact: true }).fill('React');
  await composer.fill('Call my example mango and explain state.'); await composer.press('Enter');
  await expect(page.getByRole('log')).toContainText('Your example is mango');
  await page.getByText('Context7 documentation sources', { exact: true }).click();
  await expect(page.getByRole('link', { name: '[1] React state', exact: true })).toHaveAttribute('href', 'https://react.dev/reference/react/useState');
  await page.getByRole('checkbox', { name: 'Use current software documentation for this reply' }).uncheck();
  await composer.fill('What name did I give it?'); await composer.press('Enter');
  await expect(page.getByRole('log')).toContainText('You called the example mango.');
  expect(requests[1].messages.some(message => message.text.includes('Call my example mango'))).toBe(true);
  expect(requests[0].documentation).toEqual({ query: 'How does React useState work?', library: 'React' }); expect(stages).toEqual([]);
  await expect(page.getByText('Your outline, for approval')).toHaveCount(0);
  await page.getByText('Saved on this device', { exact: true }).waitFor(); await page.reload();
  await expect(page.getByRole('log')).toContainText('You called the example mango.');
  await expect(page.getByText('Context7 documentation sources', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Create document', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('You called the example mango.');
});

test('failed and cancelled chat preserves input history and rejects late replies', async ({ page }) => {
  await mockProvider(page); let mode = 'error';
  await page.route('**/api/chat', async route => {
    const input = route.request().postDataJSON();
    if (mode === 'error') { await route.fulfill({ status: 503, json: { code: 'unavailable', message: 'Synthetic chat outage.' } }); return; }
    if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 1000));
    await route.fulfill({ contentType: 'application/x-ndjson', body: JSON.stringify({ type: 'done', requestId: input.requestId, text: 'Synthetic recovered answer.', documentation: { sources: [], notice: 'Context7 unavailable in this synthetic test.' } }) });
  });
  await page.goto('/workspace'); await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click(); await connectProvider(page);
  const composer = page.getByRole('textbox', { name: 'Your document request' });
  await composer.fill('A synthetic conversation question.'); await composer.press('Enter');
  await expect(page.locator('p.notice.error')).toContainText('Synthetic chat outage');
  await expect(page.getByRole('log')).toContainText('A synthetic conversation question.');
  mode = 'slow'; await page.getByRole('button', { name: 'Retry saved message', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).click(); await page.waitForTimeout(1200);
  await expect(page.getByRole('log')).not.toContainText('Synthetic recovered answer.');
  mode = 'success'; await page.getByRole('button', { name: 'Retry saved message', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('Synthetic recovered answer.');
  await expect(page.getByRole('log')).toContainText('Context7 unavailable');
  await expect(page.getByRole('log').getByText('A synthetic conversation question.', { exact: true })).toHaveCount(1);
});

test('chat accepts a Markdown file and exposes camera capture', async ({ page }) => {
  await mockProvider(page);
  const attachments: { name: string; kind: string; text?: string }[] = [];
  await page.route('**/api/chat', async route => {
    const input = route.request().postDataJSON(); attachments.push(...input.attachments);
    await route.fulfill({ contentType: 'application/x-ndjson', body: JSON.stringify({ type: 'done', requestId: input.requestId, text: 'Synthetic attached answer.', documentation: { sources: [] } }) + '\n' });
  });
  await page.goto('/workspace'); await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click(); await connectProvider(page);
  await page.locator('input[type=file][multiple]').setInputFiles({ name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from('Synthetic attached note.') });
  await expect(page.getByText('notes.md')).toBeVisible();
  await expect(page.locator('input[type=file][capture="environment"]')).toHaveAttribute('accept', 'image/*');
  await page.getByRole('textbox', { name: 'Your document request' }).fill('Use the attached note.');
  await page.getByRole('textbox', { name: 'Your document request' }).press('Enter');
  await expect(page.getByRole('log')).toContainText('Synthetic attached answer.');
  expect(attachments).toMatchObject([{ name: 'notes.md', kind: 'markdown', text: 'Synthetic attached note.' }]);
  await expect(page.getByRole('button', { name: 'Solve step by step', exact: true })).toBeVisible();
});
