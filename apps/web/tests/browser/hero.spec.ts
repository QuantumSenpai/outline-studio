import { test, expect } from '@playwright/test';

test('Explore can be opened by keyboard and dismissed by Escape or an outside click', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Explore', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const link = page.getByRole('link', { name: /Templates Four/ });
  await expect(link).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator('.hero-detail p').click();
  await expect(link).toBeHidden();
});

test('gallery and example work at phone and desktop widths with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional cookies' }).click();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('.hero .button-primary')).toBeVisible();
    await expect(page.locator('.perspective-panel').first()).toHaveCSS('position', 'absolute');
    await page.getByRole('button', { name: 'Files', exact: true }).click();
    await expect(page.locator('.walkthrough-preview')).toContainText('PPTX');
    await expect(page.locator('.route-enter')).toHaveCSS('animation-name', 'none');
  }
});

test('existing provider dialog updates hero and keeps the connection in workspace', async ({ page }) => {
  await page.route('**/api/session', route => route.fulfill({ json: { connected: true } }));
  await page.route('**/api/providers/validate', route => route.fulfill({ json: { models: ['test/chat'], verifiedAt: new Date().toISOString() } }));
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  await page.getByRole('button', { name: 'Connect AI', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Connect your AI' });
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.getByLabel('API key', { exact: true }).fill('synthetic-test-key');
  await dialog.getByRole('checkbox', { name: /I authorize/ }).check();
  await dialog.getByRole('button', { name: 'Validate connection & load models' }).click();
  await dialog.getByRole('button', { name: 'Use this connection' }).click();
  await dialog.getByRole('button', { name: 'Close dialog' }).click();

  await expect(page.locator('main')).not.toContainText('synthetic-test-key');

  await expect(page.getByRole('button', { name: /groq connected/ })).toBeVisible();
});
