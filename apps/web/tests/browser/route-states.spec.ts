import { test, expect } from '@playwright/test';
import { mockProvider, connectProvider } from './mockProvider';

test('public controls survive reduced motion, refresh and restored scroll', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/how-it-works', '/providers', '/templates', '/projects', '/history', '/workspace', '/feedback', '/privacy', '/terms']) {
      await page.goto(route);
      await expect(page.locator('main h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.goto('/providers');
  const link = page.getByRole('link', { name: 'Set up a provider', exact: true });
  await link.scrollIntoViewIfNeeded();
  await page.reload();
  await expect(link).toHaveCSS('visibility', 'visible');
  expect(await link.evaluate(el => getComputedStyle(el).color === getComputedStyle(el).backgroundColor)).toBe(false);
  await page.screenshot({ path: '../../qa-output/providers-fixed-restored-scroll.png' });
  expect(errors).toEqual([]);
});

test('template choice, style dropdown and keyboard tabs produce the intended state', async ({ page }) => {
  await page.goto('/templates');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  await page.locator('.template-option').filter({ hasText: 'Professional' }).click();
  await expect(page.locator('.sample-paper h2')).toHaveText('Professional Report');
  await page.getByRole('link', { name: 'Use this style' }).click();
  await page.getByRole('button', { name: 'Document style settings' }).click();
  await expect(page.getByRole('combobox', { name: 'Starting style', exact: true })).toHaveValue('professional');
  await page.getByRole('combobox', { name: 'Starting style', exact: true }).selectOption('research');
  await page.getByRole('button', { name: 'Use these requirements' }).click();
  await expect(page.getByRole('button', { name: 'Document style settings' })).toBeFocused();
  await page.getByRole('tab', { name: 'Conversation', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Document', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('feedback pending label survives failure then succeeds without losing input', async ({ page }) => {
  await page.route('**/api/session', route => route.fulfill({ json: { connected: true } }));
  let fail = true;
  await page.route('**/api/feedback', async route => {
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.fulfill(fail ? { status: 503, json: { code: 'unavailable', message: 'Synthetic feedback failure.' } } : { status: 201, json: { saved: true } });
  });
  await page.goto('/feedback');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  await page.getByLabel('Your message').fill('Synthetic feedback for pending-state verification.');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByRole('button', { name: 'Saving your message…' })).toBeDisabled();
  await expect(page.getByLabel('Your message')).toBeDisabled();
  await expect(page.locator('form').getByRole('alert')).toContainText('Synthetic feedback failure');
  await expect(page.getByLabel('Your message')).toBeEnabled();
  await expect(page.getByLabel('Your message')).toHaveValue('Synthetic feedback for pending-state verification.');
  fail = false;
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByRole('status')).toContainText('Message received');
  await page.getByRole('button', { name: 'Send another message' }).click();
  await expect(page.getByLabel('Your message')).toHaveValue('');
});

test('touch navigation and dialogs remain operable', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 360, height: 800 } });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).tap();
  await page.getByRole('button', { name: 'Open navigation' }).tap();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Templates', exact: true }).tap();
  await expect(page).toHaveURL(/templates/);
  await page.getByRole('link', { name: 'Use this style' }).tap();
  await page.getByRole('button', { name: 'Connect AI', exact: true }).tap();
  await page.getByRole('button', { name: 'Close dialog' }).tap();
  await expect(page.locator('.dialog-overlay')).toHaveCount(0);
  await context.close();
});

test('failed planner retry recovers through the actual task control', async ({ page }) => {
  await mockProvider(page, 'exhausted');
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  await connectProvider(page);
  await page.getByRole('textbox', { name: 'Your document request' }).fill('Synthetic planner request for retry verification.');
  await page.getByRole('button', { name: 'Create document', exact: true }).click(); await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByRole('tab', { name: 'Planner', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry task', exact: true })).toBeEnabled();
  await mockProvider(page);
  await page.getByRole('button', { name: 'Retry task', exact: true }).click();
  await page.getByRole('button', { name: 'Review outline', exact: true }).click();
  await expect(page.getByText('Your outline, for approval')).toBeVisible();
});
