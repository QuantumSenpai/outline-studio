import { test, expect } from '@playwright/test';
import { mockProvider, connectProvider } from './mockProvider';

test('short messages send without quota and Enter/Shift+Enter preserve an actionable conversation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const stages = await mockProvider(page);
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  await page.getByRole('button', { name: 'Create document', exact: true }).click();
  const composer = page.getByRole('textbox', { name: 'Your document request' });
  const send = page.getByRole('button', { name: 'Send message', exact: true });
  await composer.fill('   '); await expect(send).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Latest messages' })).toHaveCount(0);
  await composer.fill('Hii'); await expect(send).toBeEnabled(); await composer.press('Enter');
  await expect(page.getByRole('log', { name: 'Main conversation' })).toContainText('Hi!');
  await expect(composer).toHaveValue(''); expect(stages).toEqual([]);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(send).toBeVisible();
    await page.screenshot({ path: `../../qa-output/composer-greeting-${width}.png` });
  }
  await composer.fill('Forest'); await composer.press('Shift+Enter');
  await expect(composer).toHaveValue('Forest\n');
  await composer.fill('Create an academic assignment about forest restoration with a simple diagram.');
  await connectProvider(page); await send.click();
  await expect(page.getByText('Your outline, for approval')).toBeVisible();
  await expect(page.getByRole('log', { name: 'Main conversation' })).toContainText('Hii');
  expect(stages).toEqual(['planner:groq']);
});
