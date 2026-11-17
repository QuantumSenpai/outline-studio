import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
const origin = process.env.OUTLINE_BENCHMARK_ORIGIN ?? 'http://127.0.0.1:3002';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Use a local production server for this benchmark.');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => {
    window.outlineCLS = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.outlineCLS += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(origin); await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const resources = await page.evaluate(() => ({ cls: window.outlineCLS,
    scripts: performance.getEntriesByType('resource').filter(item => item.initiatorType === 'script').map(item => ({ url: new URL(item.name).pathname, transfer: item.transferSize, decoded: item.decodedBodySize })),
    navigation: performance.getEntriesByType('navigation').map(item => ({ domContentLoaded: item.domContentLoadedEventEnd, load: item.loadEventEnd })) }));
  await page.getByRole('button', { name: 'Reject optional cookies', exact: true }).click();
  const start = performance.now(); await page.getByRole('button', { name: 'Connect provider', exact: true }).click();
  await page.getByRole('dialog').waitFor(); const clickToDialogMs = performance.now() - start;
  await page.getByRole('button', { name: 'Close dialog' }).click();
  const health = [];
  for (let i = 0; i < 5; i++) {
    const at = performance.now(); const response = await fetch(`${origin}/api/health`); await response.json();
    health.push({ milliseconds: performance.now() - at, status: response.status, serverTiming: response.headers.get('server-timing') });
  }
  const result = { measuredAt: new Date().toISOString(), platform: process.platform, architecture: process.arch, node: process.version,
    browser: browser.version(), methodology: 'Local production, new Chromium profile, 1440x1000, no throttling. Automation click-to-dialog includes protocol overhead. Health timings exclude DB/provider calls; no Vercel cold-start claim.',
    ...resources, scriptTransferBytes: resources.scripts.reduce((total, item) => total + item.transfer, 0), clickToDialogMs, health };
  await mkdir('../../qa-output', { recursive: true }); await writeFile('../../qa-output/performance.json', JSON.stringify(result, null, 2));
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} finally { await browser.close(); }
