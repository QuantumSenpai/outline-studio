import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('public routes, metadata, cookie preference changes and mobile navigation',async({page})=>{
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/'); await expect(page.getByRole('heading',{level:1})).toHaveText('Every format.One flow.');
  await page.getByRole('button',{name:'Reject optional cookies',exact:true}).click();
  await page.reload(); await expect(page.getByLabel('Storage preferences',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Cookie preferences',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible(); await page.getByRole('button',{name:'Accept optional cookies',exact:true}).click();
  for(const route of ['/how-it-works','/templates','/providers','/feedback','/privacy','/terms']) {
    await page.goto(route); await expect(page.locator('main h1')).toBeVisible();
    expect(await page.locator('link[rel=canonical]').getAttribute('href')).toContain(route);
    const accessibility=await new AxeBuilder({page}).analyze(); expect(accessibility.violations).toEqual([]);
  }
  await page.setViewportSize({width:390,height:844}); await page.goto('/');
  await page.getByRole('button',{name:'Open navigation'}).click(); await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.getByRole('button',{name:'Open navigation'})).toBeFocused();
  await page.getByRole('button',{name:'Open navigation'}).click(); await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Templates'}).click();
  await expect(page).toHaveURL(/templates/); expect(errors).toEqual([]);
});
test('responsive layouts, reduced motion and private indexing',async({page})=>{
  for(const width of [360,390,768,1024,1440,1920]) {
    await page.setViewportSize({width,height:900});
    for(const path of ['/','/templates','/workspace']) {
      await page.goto(path); await page.waitForTimeout(350);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
      await page.screenshot({path:`../../qa-output/layout-${path==='/'?'home':path.slice(1)}-${width}.png`,fullPage:true});
    }
  }
  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto('/');
  await expect(page.getByRole('link',{name:'Start a document'}).first()).toBeVisible();
  await page.screenshot({path:'../../qa-output/reduced-motion.png',fullPage:true});
  await page.goto('/workspace'); expect(await page.locator('meta[name=robots]').getAttribute('content')).toContain('noindex');
  const sitemap=await page.request.get('/sitemap.xml'); expect(await sitemap.text()).not.toContain('/workspace');
});
test('feedback stays editable when persistence fails and acknowledges actual confirmation',async({page})=>{
  await page.goto('/feedback'); await page.getByRole('button',{name:'Reject optional cookies',exact:true}).click();
  await page.getByLabel('Your message').fill('This is a synthetic feedback test message.');
  await page.getByRole('button',{name:/Send feedback/}).click();
  await expect(page.getByRole('alert')).toBeVisible(); await expect(page.getByLabel('Your message')).toHaveValue('This is a synthetic feedback test message.');
  await page.route('**/api/session',route=>route.fulfill({json:{connected:true}}));
  await page.route('**/api/feedback',route=>route.fulfill({status:201,json:{saved:true,id:'synthetic'}}));
  await page.getByRole('button',{name:/Send feedback/}).click(); await expect(page.getByText('Message received.')).toBeVisible();
});
