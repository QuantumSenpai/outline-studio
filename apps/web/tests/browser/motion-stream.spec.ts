import { test, expect } from '@playwright/test';
import { connectProvider, mockProvider } from './mockProvider';

for (const path of ['/workspace', '/playground']) {
  test(`${path} animates arrivals once, keeps streaming stable and restores history quietly`, async ({ page }) => {
    await mockProvider(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (...args: Parameters<Element['animate']>) {
        if (this.matches('.message, .playground-message')) document.documentElement.dataset.messageMotions = String(Number(document.documentElement.dataset.messageMotions ?? '0') + 1);
        return animate.apply(this, args);
      };
      const fetch = window.fetch;
      window.fetch = function (input, init) {
        const url = input instanceof Request ? input.url : String(input);
        if (!url.endsWith('/api/chat')) return fetch.call(this, input, init);
        const { requestId } = JSON.parse(String(init?.body));
        const encoder = new TextEncoder();
        return Promise.resolve(new Response(new ReadableStream({ start(controller) {
          setTimeout(() => controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', requestId, text: 'A calm beginning.' }) + '\n')), 100);
          setTimeout(() => controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', requestId, text: ' A steady finish.' }) + '\n')), 500);
          setTimeout(() => { controller.enqueue(encoder.encode(JSON.stringify({ type: 'done', requestId, text: 'A calm beginning. A steady finish.', documentation: { sources: [] } }) + '\n')); controller.close(); }, 1000);
        } }), { headers: { 'Content-Type': 'application/x-ndjson' } }));
      };
    });
    await page.goto(path);
    await page.getByRole('button', { name: 'Reject optional cookies' }).click();
    await connectProvider(page);
    const composer = page.getByRole('textbox', { name: path === '/workspace' ? 'Your document request' : 'Your message', exact: true });
    await composer.fill('Show a smooth reply.'); await composer.press('Enter');
    const stream = page.locator('[data-streaming=true]');
    await expect(stream).toContainText('A calm beginning.');
    await expect.poll(() => page.evaluate(() => Number(document.documentElement.dataset.messageMotions ?? '0'))).toBe(2);
    await expect(stream).toContainText('A steady finish.');
    await expect(page.getByRole('log')).toContainText('A calm beginning. A steady finish.');
    await expect(stream).toHaveCount(0);
    expect(await page.evaluate(() => Number(document.documentElement.dataset.messageMotions ?? '0'))).toBe(2);
    await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('log')).toContainText('A calm beginning. A steady finish.');
    expect(await page.evaluate(() => Number(document.documentElement.dataset.messageMotions ?? '0'))).toBe(0);
    await connectProvider(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await composer.fill('A reply with reduced motion.'); await composer.press('Enter');
    await expect(stream).toBeVisible();
    await expect(stream).toHaveCount(0);
    expect(await page.evaluate(() => Number(document.documentElement.dataset.messageMotions ?? '0'))).toBe(0);
  });
}

test('hero transitions settle after rapid changes under CPU throttling', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional cookies' }).click();
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const profile = await page.evaluate(async () => {
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.hero-preview-formats button'));
    const samples: number[] = []; let previous = performance.now(); let count = 0; let peak = 0;
    await new Promise<void>(resolve => {
      function frame(now: number) {
        if (count > 0) samples.push(now - previous);
        previous = now;
        if (count % 3 === 0) buttons[(count / 3) % buttons.length].click();
        peak = Math.max(peak, document.querySelector('.hero-preview-stage')!.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length);
        if (++count < 90) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
    samples.sort((a, b) => a - b);
    return { p95: samples[Math.floor(samples.length * .95)], max: samples.at(-1), peak, frames: samples.length };
  });
  console.log('Hero motion at 4x CPU throttling:', JSON.stringify(profile));
  await expect.poll(() => page.evaluate(() => document.querySelectorAll('.hero-preview-page[data-active=true]').length)).toBe(1);
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
  await expect(page.locator('.gallery-center')).toHaveAttribute('data-animating', 'false');
  expect(profile.peak).toBeLessThanOrEqual(12);
  expect(errors).toEqual([]);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
});
