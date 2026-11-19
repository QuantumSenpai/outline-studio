import { test, expect } from '@playwright/test';
test('corrected composition, compact shell and footer', async ({ page }) => {
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({ width, height:900 });
    for (const path of ['/','/workspace','/workspace?style=academic','/playground']) {
      await page.goto(path);
      const reject = page.getByRole('button',{name:'Reject optional cookies'});
      if (await reject.isVisible()) await reject.click();
      await expect(page.locator('main')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (path === '/') {
        const box = await page.locator('.hero .button-primary').boundingBox();
        expect(box && box.y + box.height < 844).toBeTruthy();
      } else await expect(page.locator('.site-header')).toHaveCount(0);
      await page.screenshot({path:`../../qa-output/correct-${width}-${path === '/' ? 'home' : path.includes('style') ? 'document' : path.slice(1)}.png`,fullPage:true});
    }
  }
  await page.goto('/');
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await page.screenshot({path:'../../qa-output/correct-footer.png'});
});
