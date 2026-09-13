// Built-page navigation probe. Use an existing Playwright installation/browser;
// no package or browser downloads are needed.
// PLAYWRIGHT_MODULE may point to its index.mjs; CHROME_PATH selects a browser.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import assert from 'node:assert/strict';
const root=process.argv[2] ?? 'dist';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const context=await browser.newContext({serviceWorkers:'block'});
await context.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.hostname!=='ellaz.test') return route.abort();
 let file=join(root,decodeURI(url.pathname));
 if(!extname(file)) file=join(file,'index.html');
 if(!existsSync(file)) return route.fulfill({status:404,body:''});
 await route.fulfill({status:200,contentType:types[extname(file)]??'application/octet-stream',body:await readFile(file)});
});
const page=await context.newPage(); const requests=[];const errors=[];
page.on('request',r=>requests.push(r.url())); page.on('pageerror',e=>errors.push(e.message));
await page.goto('https://ellaz.test/');
await page.getByRole('button',{name:'Language: English'}).waitFor();
assert(!requests.some(u=>u.includes('locale-zh-CN')));
await page.getByRole('button',{name:'Language: English'}).click();
await page.getByRole('menuitemradio',{name:'简体中文'}).click();
await page.getByText('人人都能玩的游戏',{exact:true}).waitFor();
assert(requests.some(u=>u.includes('locale-zh-CN')));
assert.equal(await page.evaluate(()=>localStorage.getItem('ellaz:locale')),'zh-CN');
await page.locator('a[href="/games/memory/"]').first().click();
await page.locator('[data-runtime-locale="zh-CN"][data-content-locale="zh-CN"]').waitFor();
assert.equal(new URL(page.url()).pathname,'/games/memory/');
await page.reload();
await page.locator('[data-runtime-locale="zh-CN"][data-content-locale="zh-CN"]').waitFor();
console.log('PASS picker, lazy request, Chinese home, real Memory navigation and reload');
for(const locale of ['en','he','es','fr']) {
 await page.goto(`https://ellaz.test/${locale==='en'?'':locale+'/'}`);
 if(locale==='en') { await page.getByRole('button',{name:'语言: 简体中文'}).click(); await page.getByRole('menuitemradio',{name:'English',exact:true}).click(); }
 await page.locator(`html[lang="${locale}"]`).waitFor();
 const href=`/${locale==='en'?'':locale+'/'}games/memory/`;
 await page.locator(`a[href="${href}"]`).first().click();
 await page.locator(`[data-runtime-locale="${locale}"][data-content-locale="${locale==='fr'?'en':locale}"]`).waitFor();
 console.log(`PASS ${locale} home to Memory`);
}
assert.equal(errors.length,0,errors.join('\n'));
console.log('PASS no browser page errors');
await browser.close();
