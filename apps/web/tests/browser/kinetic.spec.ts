import { test, expect } from '@playwright/test';

test('Explore animates in both directions and rapid toggles leave no stuck menu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional cookies' }).click();
  const trigger = page.getByRole('button', { name: 'Explore', exact: true });
  const panel = page.locator('#explore-panel');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  await expect.poll(() => panel.evaluate(node => Number(getComputedStyle(node).opacity))).toBe(1);
  for (let i = 0; i < 6; i++) await trigger.click({ delay: 20 });
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator('.hero-detail p').click();
  await expect(panel).toBeHidden();
});

test('the paper sculpture unfolds, changes format, and works on touch', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional cookies' }).click();
  const preview = page.getByRole('region', { name: 'Interactive document preview' });
  const unfold = preview.getByRole('button', { name: 'Fan the pages', exact: true });
  await unfold.click();
  await expect(unfold).toHaveAttribute('aria-pressed', 'false');
  await expect(preview.locator('.folio-page')).toHaveCount(4);
  await preview.getByRole('button', { name: 'Preview diagram', exact: true }).click();
  await expect(preview.locator('.folio-page[data-active=true]')).toContainText('Campus use');
  await page.setViewportSize({ width: 320, height: 740 });
  await preview.getByRole('button', { name: 'Preview slides', exact: true }).click();
  await expect(preview.locator('.folio-page[data-active=true]')).toContainText('Every drop counts.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await unfold.click();
  await expect(unfold).toHaveAttribute('aria-pressed', 'true');
});

test('phone taps operate the fan and navigation without sticky hover', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional cookies' }).tap();
  const fan = page.getByRole('button', { name: 'Fan the pages', exact: true });
  await fan.tap(); await expect(fan).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Preview diagram', exact: true }).tap();
  await expect(page.locator('.folio-page[data-active=true]')).toContainText('Campus use');
  await page.getByRole('button', { name: 'Open navigation' }).tap();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Templates', exact: true }).tap();
  await expect(page).toHaveURL(/templates/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
