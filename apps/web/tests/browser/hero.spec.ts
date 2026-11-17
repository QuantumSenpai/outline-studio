import { test, expect } from '@playwright/test';

test('hero provider setup and motion controls are usable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Connect provider', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Connect your AI' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Connect provider', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Pause illustration', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume illustration' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Pause scrolling strip', exact: true }).click();
  await expect(page.locator('.hero-strip')).toHaveAttribute('data-paused', 'true');
});

test('hero fits supported widths with readable cards and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const card of await page.locator('.orchestra-card').all()) {
      expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight)).toBe(true);
    }
    await expect(page.getByRole('link', { name: 'Illustrative output', exact: true })).toBeVisible();
    await expect(page.locator('.strip-track')).toHaveCSS('animation-name', 'none');
  }
});

test('illustration progresses, pauses, resumes and stops offscreen', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  const detail = page.locator('.slide-detail').first();
  await expect(detail).toHaveCSS('opacity', '1');
  await page.screenshot({ path: '../../qa-output/hero-motion-assembled.png' });
  await page.getByRole('button', { name: 'Pause illustration', exact: true }).click();
  const paused = await detail.getAttribute('style');
  await page.waitForTimeout(600);
  expect(await detail.getAttribute('style')).toBe(paused);
  await page.getByRole('button', { name: 'Resume illustration', exact: true }).click();
  await expect.poll(() => detail.getAttribute('style'), { timeout: 14000 }).not.toBe(paused);
  await page.screenshot({ path: '../../qa-output/hero-motion-next-cycle.png' });
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const offscreen = await detail.getAttribute('style');
  await page.waitForTimeout(600);
  expect(await detail.getAttribute('style')).toBe(offscreen);
  expect(errors).toEqual([]);
});

test('strip pauses for hover, focus and explicit controls', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  const strip = page.locator('.hero-strip');
  const track = page.locator('.strip-track');
  await strip.scrollIntoViewIfNeeded();
  await strip.hover();
  await expect(track).toHaveCSS('animation-play-state', 'paused');
  await page.locator('.strip-window').focus();
  await expect(track).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'Pause scrolling strip' }).click();
  await page.locator('h1').click();
  await expect(track).toHaveCSS('animation-play-state', 'paused');
  await page.getByRole('button', { name: 'Resume scrolling strip' }).click();
  await page.locator('h1').click();
  await expect(track).toHaveCSS('animation-play-state', 'running');
});

test('existing provider dialog updates hero and keeps the connection in workspace', async ({ page }) => {
  await page.route('**/api/session', route => route.fulfill({ json: { connected: true } }));
  await page.route('**/api/providers/validate', route => route.fulfill({ json: { models: ['test/chat'], verifiedAt: new Date().toISOString() } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  await page.getByRole('button', { name: 'Connect provider', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Connect your AI' });
  await dialog.getByLabel('API key', { exact: true }).fill('synthetic-test-key');
  await dialog.getByRole('checkbox', { name: /I authorize/ }).check();
  await dialog.getByRole('button', { name: 'Validate connection & load models' }).click();
  await dialog.getByRole('button', { name: 'Use this connection' }).click();
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByText('Provider connected', { exact: true })).toBeVisible();
  await expect(page.locator('.hero')).not.toContainText('synthetic-test-key');
  await page.getByRole('link', { name: 'Start a document', exact: true }).first().click();
  await expect(page.getByRole('button', { name: /groq connected/ })).toBeVisible();
});
