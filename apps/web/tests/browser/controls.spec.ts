import { test, expect } from '@playwright/test';

test('providers CTA has readable rendered text and opens the workspace', async ({ page }) => {
  await page.goto('/providers');
  const link = page.getByRole('link', { name: 'Set up a provider', exact: true });
  await link.scrollIntoViewIfNeeded();
  expect(await link.evaluate(el => getComputedStyle(el).color === getComputedStyle(el).backgroundColor)).toBe(false);
  await expect(link).toHaveCSS('opacity', '1');
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/workspace/);
  await expect(page.getByRole('textbox', { name: 'Your document request' })).toBeVisible();
});

test('workspace dialogs restore focus, unlock scrolling and have mobile names', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  const headingBounds = await page.locator('.conversation-intro h2').boundingBox();
  const transcriptBounds = await page.locator('.transcript').boundingBox();
  expect(headingBounds && transcriptBounds && headingBounds.y >= transcriptBounds.y).toBe(true);
  for (const name of ['Connect AI', 'Data controls']) {
    const trigger = page.getByRole('button', { name, exact: true });
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(page.locator('[data-scroll-locked]')).toHaveCount(0);
    expect(await page.locator('body').evaluate(el => getComputedStyle(el).pointerEvents)).not.toBe('none');
  }
});

test('provider validation recovers from failure to success with readable pending state', async ({ page }) => {
  await page.route('**/api/session', route => route.fulfill({ json: { connected: true } }));
  let fail = true;
  const submittedKeys: string[] = [];
  await page.route('**/api/providers/validate', async route => {
    submittedKeys.push(route.request().postDataJSON().key);
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.fulfill(fail ? { status: 503, json: { message: 'Synthetic validation outage.' } }
      : { json: { models: ['test/chat'], verifiedAt: new Date().toISOString() } });
  });
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  await page.getByRole('button', { name: 'Connect AI', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.getByLabel('API key', { exact: true }).fill('synthetic-test-key');
  await dialog.getByRole('checkbox', { name: /I authorize/ }).check();
  await dialog.getByRole('button', { name: 'Validate connection & load models' }).click();
  await expect(dialog.getByRole('button', { name: 'Validating connection…' })).toBeDisabled();
  await expect(dialog.getByRole('alert')).toBeVisible();
  fail = false;
  await dialog.getByRole('button', { name: 'Validate connection & load models' }).click();
  await dialog.getByRole('button', { name: 'Use this connection' }).click();
  expect(submittedKeys).toEqual(['synthetic-test-key', 'synthetic-test-key']);
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('button', { name: 'groq connected', exact: true })).toBeFocused();
});

test('closing pending validation discards stale results and permits a fresh attempt', async ({ page }) => {
  await page.route('**/api/session', route => route.fulfill({ json: { connected: true } }));
  await page.route('**/api/providers/validate', async route => {
    await new Promise(resolve => setTimeout(resolve, 900));
    await route.fulfill({ json: { models: ['test/chat'], verifiedAt: new Date().toISOString() } });
  });
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  await page.getByRole('button', { name: 'Connect AI', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.getByLabel('API key', { exact: true }).fill('synthetic-test-key');
  await dialog.getByRole('checkbox', { name: /I authorize/ }).check();
  await dialog.getByRole('button', { name: 'Validate connection & load models' }).click();
  await expect(dialog.getByRole('button', { name: '← Back', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Connect AI', exact: true }).click();
  await page.waitForTimeout(1100);
  await expect(dialog.getByRole('combobox', { name: 'Available model', exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(dialog.getByLabel('API key', { exact: true })).toHaveValue('');
  await expect(dialog.getByRole('button', { name: 'Validate connection & load models' })).toBeDisabled();
});
