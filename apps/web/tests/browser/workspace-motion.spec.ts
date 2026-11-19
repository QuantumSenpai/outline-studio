import { test, expect } from '@playwright/test';

test('workspace mode, sidebar and view selection move without losing a draft', async ({ page }) => {
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Reject optional cookies' }).click();
  const composer = page.getByLabel('Your document request', { exact: true });
  await composer.fill('Keep this draft through every transition.');
  const documentMode = page.getByRole('button', { name: 'Create document', exact: true });
  await documentMode.click();
  await expect(page.locator('.conversation-mode .selection-indicator')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Coworkers', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Researcher Source metadata/ }).click();
  await expect(page.getByRole('tab', { name: 'Researcher', exact: true })).toHaveAttribute('data-state', 'active');
  await expect(page.locator('.task-rail .selection-indicator')).toBeVisible();
  for (const name of ['Planner', 'Writer']) {
    await page.getByRole('button', { name: new RegExp(`^${name} queued`) }).click();
    await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute('data-state', 'active');
  }
  await expect.poll(() => page.locator('.workspace-main').evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0);
  await page.screenshot({ path: '../../qa-output/workspace-motion-sidebar.png' });
  for (const name of ['Document', 'History', 'Conversation']) await page.getByRole('tab', { name, exact: true }).click();
  await expect(composer).toHaveValue('Keep this draft through every transition.');
  await expect.poll(() => page.locator('.workspace-tabs').evaluate(node => {
    const selected = node.querySelector('[data-state=active]')!.getBoundingClientRect();
    const indicator = node.querySelector('.selection-indicator')!.getBoundingClientRect();
    return Math.abs(selected.left - indicator.left) < 1 && Math.abs(selected.width - indicator.width) < 1;
  })).toBe(true);
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await documentMode.click();
  }
  await page.getByRole('button', { name: 'Chat', exact: true }).click();
  await expect(page.locator('.workspace-sidebar')).toHaveAttribute('inert', '');
  await expect(page.getByRole('complementary', { name: 'Coworkers', exact: true })).toHaveCount(0);
  await expect(composer).toHaveValue('Keep this draft through every transition.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '../../qa-output/workspace-motion-desktop.png' });
});

test('phone workflow selection and reduced motion settle correctly', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Reject optional cookies' }).tap();
  await page.getByRole('button', { name: 'Create document', exact: true }).tap();
  await page.getByRole('button', { name: 'Workflow controls', exact: true }).tap();
  await expect(page.getByRole('dialog').locator('.selection-indicator')).toHaveCount(1);
  await page.getByRole('button', { name: /Researcher Source metadata/ }).tap();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Researcher', exact: true })).toHaveAttribute('data-state', 'active');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('tab', { name: 'Conversation', exact: true }).tap();
  await page.getByRole('button', { name: 'Chat', exact: true }).tap();
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
  await page.screenshot({ path: '../../qa-output/workspace-motion-phone.png' });
  await context.close();
});
