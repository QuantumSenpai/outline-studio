import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockProvider } from './mockProvider';

test('provider steps remain readable and usable at six widths with reduced motion', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await mockProvider(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/workspace');
    const trigger = page.getByRole('button', { name: 'Connect AI', exact: true }); await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Connect your AI' });
    await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
    const validate = dialog.getByRole('button', { name: 'Validate connection & load models', exact: true });
    await expect(validate).toBeDisabled();
    await dialog.getByLabel('API key', { exact: true }).fill('synthetic-test-key');
    await dialog.getByRole('checkbox', { name: /I authorize/ }).check();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    if (width === 390) expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await validate.click(); await expect(dialog.getByRole('combobox', { name: 'Available model', exact: true })).toHaveValue('test/chat');
    await dialog.getByRole('button', { name: 'Use this connection', exact: true }).click();
    await dialog.getByRole('button', { name: 'Start generating', exact: true }).click();
    await expect(page.getByRole('button', { name: 'groq connected', exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});
