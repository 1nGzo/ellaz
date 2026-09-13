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
const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
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
await page.getByRole('button',{name:'Language: English'}).click();
await page.getByRole('menuitemradio',{name:'简体中文'}).click();
await page.getByRole('combobox',{name:'游戏模式'}).selectOption('preschool');
await page.getByRole('combobox',{name:'游戏模式'}).waitFor();
const links = await page.locator('#root a[href*="/games/"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')));
assert(links.length >= 2, 'daily and game grid should both offer Memory');
assert(links.every(h=>h==='/games/memory/?play=preschool'), JSON.stringify(links));
await page.screenshot({path:'/tmp/ellaz-preschool-home.png',fullPage:false});
await page.locator('#root a[href="/games/memory/?play=preschool"]').first().click();
await page.getByRole('button',{name:'再听一次',exact:true}).waitFor();
const cards=page.locator('#game-frame button').filter({has:page.locator('xpath=self::*[@aria-label="翻牌" or @aria-label="猫" or @aria-label="苹果" or @aria-label="车"]')});
assert.equal(await cards.count(),4);
// Speech is recorded at the browser API boundary. This proves Mandarin request,
// not physical sound from the device.
await page.evaluate(()=>{
 window.__spoken=[];
 window.SpeechSynthesisUtterance=class { constructor(text){this.text=text;} };
 const synth=window.speechSynthesis;
 synth.getVoices=()=>[{lang:'zh-CN',name:'Probe Mandarin',localService:true,default:true,voiceURI:'probe'}];
 synth.speak=u=>{if(u.text.trim())window.__spoken.push({text:u.text,lang:u.lang});u.onend?.();};
 synth.dispatchEvent(new Event('voiceschanged'));
});
await cards.nth(0).click();
await page.getByRole('button',{name:'再听一次',exact:true}).click();
const spoken=await page.evaluate(()=>window.__spoken);
assert(spoken.length>=2 && spoken.every(x=>x.lang==='zh-CN'),JSON.stringify(spoken));
assert.equal(spoken.at(-1).text,spoken.at(-2).text);
// Learn the tiny board through actual taps, then match it.
for(let i=0;i<4;i++) {
 await cards.nth(i).click();
 if(await page.getByRole('button',{name:/再玩一次/}).count())break;
 await page.waitForTimeout(1450);
}
// Read IDs from the settled session only to locate pairs after the interaction check.
await page.waitForTimeout(5100);
const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ellaz:memory:preschool:zh-CN:session')??'null'));
if(saved) {
 await page.reload();
 await page.getByRole('button',{name:'再听一次',exact:true}).waitFor();
 for(const face of ['cat','apple']) {
  const indices=saved.s.state.cards.flatMap((c,i)=>c.face===face?[i]:[]);
  for(const i of indices) await cards.nth(i).click();
  await page.waitForTimeout(1450);
 }
}
await page.getByRole('button',{name:/再玩一次/}).waitFor();
assert(await page.getByRole('button',{name:'猫',exact:true}).count()===2);
assert(await page.getByRole('button',{name:'苹果',exact:true}).count()===2);
assert.equal(await page.evaluate(()=>localStorage.getItem('ellaz:memory:score:easy')),null);
assert(await page.evaluate(()=>localStorage.getItem('ellaz:memory:preschool:zh-CN:score:two')));
await page.screenshot({path:'/tmp/ellaz-preschool-memory-win.png',fullPage:false});
console.log('PASS preschool home/daily, Chinese 2-pair play, repeat Mandarin API requests, win and isolated score');
await page.reload();
await page.getByRole('button',{name:'再听一次',exact:true}).waitFor();
assert.equal(await cards.count(),4);
await page.getByRole('button',{name:/2 🐱🍎/}).click();
assert.equal(await cards.count(),6);
await page.screenshot({path:'/tmp/ellaz-preschool-memory-three.png',fullPage:false});
await page.goto('https://ellaz.test/games/snake/?play=preschool');
await page.waitForURL('https://ellaz.test/?play=preschool');
console.log('PASS 3 pairs and disallowed direct game redirects home');
for(const locale of ['en','he','es']) {
 await page.goto(`https://ellaz.test/${locale==='en'?'':locale+'/'}games/memory/?play=standard`);
 await page.locator('#game-frame button[aria-label="card"]').first().waitFor();
 assert.equal(await page.locator('#game-frame button[aria-label="card"]').count(),12);
 assert.equal(await page.getByRole('button',{name:'再听一次',exact:true}).count(),0);
 console.log(`PASS ${locale} standard Memory 6 pairs`);
}
assert.equal(errors.length,0,errors.join('\n'));
console.log('PASS no browser page errors');
await browser.close();
