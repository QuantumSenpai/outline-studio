import { test, expect } from '@playwright/test';
import { mockProvider, connectProvider } from './mockProvider';

for (const path of ['/workspace', '/playground']) {
  test(`${path} displays clean bold labels, numbered lists and literal code`, async ({ page }) => {
    await mockProvider(page);
    await page.route('**/api/chat', route => route.fulfill({ contentType: 'application/x-ndjson', body: JSON.stringify({
      type: 'done', requestId: route.request().postDataJSON().requestId,
      text: '## Academic response\n\n1. **Refine the Text:** Keep the language clear.\n2. **Document workflow:** Use Create document for downloads.\n\nA short paragraph with *emphasis* and `**literal code**`.\n\n```js\nconst label = "**literal**";\n```\n\n[Official source](https://example.org/guide)\n\n<img src=x onerror=alert(1)>',
      documentation: { sources: [] },
    }) + '\n' }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await page.getByRole('button', { name: 'Reject optional cookies' }).click();
    await connectProvider(page);
    const composer = page.getByRole('textbox', { name: path === '/workspace' ? 'Your document request' : 'Your message', exact: true });
    await composer.fill('Please refine this academic text.'); await composer.press('Enter');
    const reply = page.locator(path === '/workspace' ? '.message.studio .chat-text' : '.playground-message.studio .chat-text').last();
    await expect(reply.locator('ol > li')).toHaveCount(2);
    await expect(reply.locator('strong').first()).toHaveText('Refine the Text:');
    await expect(reply.locator('strong').first()).toHaveCSS('font-weight', '700');
    await expect(reply).not.toContainText('**Refine the Text:**');
    await expect(reply.locator('pre code')).toHaveText('const label = "**literal**";');
    await expect(reply.locator('a')).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(reply.locator('img, script')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await reply.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `../../qa-output/chat-formatting-${path.slice(1)}.png`, fullPage: true });
    await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
    await page.reload();
    await expect(reply.locator('strong').first()).toHaveText('Refine the Text:');
  });
}
