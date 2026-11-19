import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';

const label = process.argv[2] ?? 'current';
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 1440]) for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 200000, uploadThroughput: 100000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.motionMetrics = { lcp: 0, cls: 0 };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.motionMetrics.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.motionMetrics.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('http://127.0.0.1:3000/');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    results.push(await page.evaluate(({ width, run }) => {
      const resources = performance.getEntriesByType('resource');
      const nav = performance.getEntriesByType('navigation')[0];
      const sum = entries => entries.reduce((total, item) => total + item.transferSize, 0);
      return { width, run, ...window.motionMetrics, load: nav.loadEventEnd, domContentLoaded: nav.domContentLoadedEventEnd,
        transfer: sum(resources) + nav.transferSize, scripts: sum(resources.filter(item => item.initiatorType === 'script')),
        fonts: resources.filter(item => /woff/.test(item.name)).map(item => ({ url: new URL(item.name).pathname, bytes: item.transferSize })),
        requests: resources.length, resources: resources.map(item => ({ url: new URL(item.name).pathname, bytes: item.transferSize, type: item.initiatorType })) };
    }, { width, run }));
    await context.close();
  }
} finally { await browser.close(); }
await mkdir('../../qa-output', { recursive: true });
await writeFile(`../../qa-output/load-${label}.json`, JSON.stringify({ label, methodology: 'Local production Chromium, cold contexts/cache disabled, 4x CPU slowdown, 40ms latency, 1.6Mbps download. Three runs per width. Metrics are local lab measurements, not hosted field data.', results }, null, 2));
for (const width of [390, 1440]) {
  const rows = results.filter(row => row.width === width);
  const median = key => rows.map(row => row[key]).sort((a, b) => a - b)[1];
  console.log(JSON.stringify({ label, width, lcp: median('lcp'), load: median('load'), transfer: median('transfer'), scripts: median('scripts'), requests: median('requests'), cls: median('cls') }));
}
