# zh-CN runtime foundation (Round 2)

`APP_LOCALES` includes `zh-CN`. `PAGE_LOCALES` remains en/he/es/fr;
`SHIPPED_LOCALES` remains en/he/es. No Chinese document routes or game text
records are claimed by this change.

The picker saves `ellaz:locale`. The home and content-page boot paths share
`runtimeLocaleFor`: an app-only preference survives an English fallback
page; an explicit translated page URL still wins. Static prose and page
header controls retain the document language. The mounted runtime frame
receives its own `lang` and `dir`.

GameContext separates the selected `runtimeLocale` from `contentLocale`
(en/he/es/zh-CN). New Chinese games should select their content and call
`speech.available(ctx.contentLocale)` / `speech.speak(text, { locale:
ctx.contentLocale })` with the content locale. `ctx.locale` remains the
legacy en/he/es record-indexing language, so existing games continue to use
English where their Chinese content has not been authored. `ctx.t` resolves
public controls in the content locale. GameHost exposes both new values on
`data-runtime-locale` and `data-content-locale` for inspection.

`dict/zh-CN.ts` intentionally contains only shared controls. It loads through
an explicit dynamic import into a `locale-zh-CN` chunk, excluded from service
worker precache by the existing locale-chunk rule. Missing entries and failed
chunk requests resolve through English. Existing dictionaries remain complete.

Speech uses the existing browser Web Speech API. Mandarin matching prefers
zh-CN, then explicit Simplified/Mandarin tags; it does not substitute an
English or Cantonese voice. No voice assets are bundled. Availability and
audible output depend on the browser/OS; games must remain usable silently.

`SCRIPT["zh-CN"]` is `han`, direction is LTR. Runtime Chinese uses system-ui,
PingFang SC, Microsoft YaHei, Noto Sans CJK SC, then sans-serif. This declares
no downloadable fonts. Chinese page/OG font coverage is outside this round
because no Chinese pages are emitted.

## Verification

On 2026-09-13, local Node 24:

- `npm test`: 191 files, 4744 tests passed.
- Built-page Chromium probe: Chinese picker and shared home text, no Chinese
  chunk requested before selection, real Memory navigation and reload retained
  both runtime/content locale values; en/he/es/fr home-to-Memory paths passed;
  no page errors. Run `node scripts/repro/repro-zh-cn-runtime.mjs` with an
  existing Playwright installation (see the script's environment options).
- First visit: 56,140 B gzip against 56,800 B, 660 B spare. This is a local
  measurement; deployment Node versions can produce slightly different gzip.
- 251 pages emitted, still only en/he/es/fr; Chinese dictionary is outside
  initial module preloads and service-worker precache.
- Speech voice selection is unit-tested; physical audible Mandarin output was
  not verified on a device.
- `npm run build:check`: passed, including tier, first-visit/precache, payload,
  emitted-page and catalogue-slope gates. Slope: 32.9 B gzip/game versus 45 B
  budget (also below the 40 B target).
