import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockProvider, connectProvider } from './mockProvider';

test('hero cards control a working preview without calling a provider', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/chat')) requests.push(request.url()); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional cookies' }).click();
  const preview = page.getByRole('region', { name: 'Interactive document preview' });
  await expect(preview).toContainText('Every drop counts.');
  await preview.getByRole('button', { name: 'Preview diagram', exact: true }).click();
  await expect(preview.getByText('Campus use', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try Groq in the preview', exact: true }).click();
  await expect(preview).toContainText('Groq');
  await preview.getByRole('button', { name: 'Try another idea' }).click();
  await expect(preview).toContainText('Solar');
  for (const name of ['Preview report', 'Preview slides', 'Preview diagram', 'Preview report']) {
    await preview.getByRole('button', { name, exact: true }).click();
  }
  await expect(preview.getByRole('button', { name: 'Preview report', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(preview).toContainText('A brighter campus.');
  expect(requests).toEqual([]);
  await expect.poll(() => page.evaluate(() => document.querySelector('.hero-preview-stage')!.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0);
  await expect(preview).toHaveAttribute('data-animating', 'false');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('hero works with a thumb, keyboard and reduced motion at narrow widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional cookies' }).click();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const preview = page.getByRole('region', { name: 'Interactive document preview' });
    const slides = preview.getByRole('button', { name: 'Preview slides', exact: true });
    await slides.focus(); await page.keyboard.press('Enter');
    await expect(slides).toHaveAttribute('aria-pressed', 'true');
    const box = await preview.boundingBox();
    expect(box && box.x >= 0 && box.x + box.width <= width).toBeTruthy();
    expect((await slides.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
    await page.screenshot({ path: `../../qa-output/hero-interactive-${width}.png`, fullPage: true });
  }
});

test('chat keeps streamed content stable and dialogs recover after repeated opening', async ({ page }) => {
  await mockProvider(page);
  await page.route('**/api/chat', route => route.fulfill({ contentType: 'application/x-ndjson', body: JSON.stringify({
    type: 'done', requestId: route.request().postDataJSON().requestId, text: 'A steady synthetic reply.', documentation: { sources: [] },
  }) + '\n' }));
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Reject optional cookies' }).click();
  await connectProvider(page);
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Data controls', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.getByLabel('Your document request', { exact: true }).fill('A message with a smooth arrival.');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('A message with a smooth arrival.');
  await expect(page.getByRole('log')).toContainText('A steady synthetic reply.');
  await expect(page.getByLabel('Your document request', { exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.body.style.pointerEvents)).not.toBe('none');
});
