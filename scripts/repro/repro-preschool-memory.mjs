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
const cards=page.locator('.ellaz-play-surface > div button');
assert.equal(await cards.count(),4);
assert.equal(await page.locator('.gc-level').count(),0);
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
// Use actual persisted decks to complete a board, then reload during celebration.
const progressKey='ellaz:memory:preschool:zh-CN:stage-progress';
const sessionKey='ellaz:memory:preschool:zh-CN:session';
for (const [stage, rows, cols, pairs, levels] of [[1,2,2,2,10],[2,2,3,3,15],[3,3,4,6,20],[4,4,4,8,20]]) {
 await page.evaluate(({progressKey,sessionKey,stage,levels})=>{
  localStorage.setItem(progressKey,JSON.stringify({version:1,stage,level:levels,completed:false}));
  localStorage.removeItem(sessionKey);
 },{progressKey,sessionKey,stage,levels});
 await page.reload();
 await cards.first().waitFor();
 assert.equal(await cards.count(),pairs*2);
 assert.equal(await cards.first().evaluate(el=>getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length),cols);
 await page.screenshot({path:`/tmp/ellaz-preschool-stage-${stage}.png`,fullPage:false});
 await page.waitForTimeout(5200);
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),sessionKey);
 const faces=[...new Set(saved.s.state.cards.map(c=>c.face))];
 assert.equal(faces.length,pairs);
 for(const face of faces) {
  const indices=saved.s.state.cards.flatMap((c,i)=>c.face===face?[i]:[]);
  assert.equal(indices.length,2);
  for(const i of indices) await cards.nth(i).click();
 }
 await page.getByRole('status').filter({hasText:stage===4?'全部完成':'已解锁'}).waitFor();
 const next=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),progressKey);
 assert.equal(next.stage,Math.min(4,stage+1));
 assert.equal(next.level,stage===4?20:1);
 assert.equal(next.completed,stage===4);
 await page.reload();
 await page.getByRole('button',{name:'再听一次',exact:true}).waitFor();
 if(stage===4) await page.getByRole('button',{name:'再玩第 4 阶段',exact:true}).waitFor();
 else assert.equal(await cards.count(),[2,3,6,8][stage]*2);
 console.log(`PASS Stage ${stage}: ${rows}x${cols}, ${pairs} unique pairs, unlock and reload`);
}
assert.equal(await page.evaluate(()=>localStorage.getItem('ellaz:memory:score:easy')),null);
console.log('PASS Mandarin repeat requests and no standard score writes');
await page.goto('https://ellaz.test/games/snake/?play=preschool');
await page.waitForURL('https://ellaz.test/?play=preschool');
console.log('PASS disallowed direct game redirects home');
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
