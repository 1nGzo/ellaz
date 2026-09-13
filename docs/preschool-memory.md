# Preschool Memory (Round 4.1)

Opt in with the home mode selector or `?play=preschool`. Only Memory is eligible.
Choose 简体中文 for picture/Chinese-word pairs and Mandarin speech. Standard en/he/es
Memory keeps its existing 6/8/10 pairs, controls, scores and versus behavior.

## Stages and content

| Stage | Rows × columns | Pairs | Levels | New words | Cumulative pool | Per level |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2 × 2 | 2 | 10 | 20 | 20 | 2 new |
| 2 | 2 × 3 | 3 | 15 | 30 | 50 | 2 new + 1 review |
| 3 | 3 × 4 | 6 | 20 | 40 | 90 | 2 new + 4 review |
| 4 | 4 × 4 | 8 | 20 | 40 | 130 | 2 new + 6 review |

The content table defines introduction order: each level introduces its next two
records. Review takes the least recently seen historical words, counting both
introduction and review as appearances; ties use content-table order. Selected
words move to the back of this fair queue. New arrivals cannot jump ahead of
waiting words. All 65 levels have no adjacent word overlap. The finite course
ends before its final words can all receive review; replay uses the same schedule,
and “new” means first introduction in the course, not first exposure in a lifetime.

The schedule is computed once inside the Memory lazy module. Stage + level fixes
its word combination independently of visit order, RNG, refresh or session state.
Only card positions shuffle on a fresh deal; a valid snapshot retains positions
and matched pairs. Content remains `{ id, picture, word }`, with no downloads,
category system, new dependency or shell import.

### Vocabulary inventory (130 words)

- 动物（35）：猫、狗、兔子、鱼、熊、大象、熊猫、老虎、狮子、猴子、猪、牛、马、绵羊、鸡、鸭子、小鸡、企鹅、小鸟、蝴蝶、蜜蜂、蚂蚁、蜗牛、乌龟、青蛙、蛇、鲸鱼、海豚、章鱼、螃蟹、长颈鹿、斑马、刺猬、蝙蝠、鳄鱼。
- 水果 / 食物（35）：苹果、香蕉、西瓜、草莓、面包、葡萄、鸡蛋、梨、桃子、樱桃、菠萝、柠檬、橘子、芒果、猕猴桃、椰子、西红柿、胡萝卜、玉米、黄瓜、土豆、茄子、西兰花、蘑菇、花生、米饭、面条、饺子、饼干、生日蛋糕、冰淇淋、糖果、牛奶、披萨、汉堡。
- 交通工具（12）：汽车、公交车、火车、飞机、自行车、救护车、消防车、警车、出租车、直升机、帆船、货车。
- 自然（10）：太阳、月亮、向日葵、树、彩虹、云、雪花、山、贝壳、枫叶。
- 玩具（6）：足球、气球、泰迪熊、风筝、悠悠球、拼图。
- 衣物（10）：鞋子、帽子、短袖衫、裤子、裙子、袜子、手套、围巾、外套、书包。
- 身体部位（7）：眼睛、耳朵、鼻子、嘴巴、手、脚、牙齿。
- 家居 / 日常用品（15）：雨伞、牙刷、肥皂、海绵、扫帚、篮子、椅子、床、门、钥匙、勺子、碗、筷子、剪刀、书。

Pictures are existing emoji, with concrete Chinese labels (for example 足球,
向日葵 and 枫叶). Emoji appearance varies by device; automated checks establish
unique records and schedule behavior, not recognition by children on every device.

## Progress and restoration

`stage-progress` stores `{ version: 1, stage, level, completed }`, with one-based
stage/level and validation against the stage limits. The current stage is also
the highest unlocked stage, so no second unlock list can diverge. All 65 levels
are completion-only: no failure, countdown, rating, score board or move stat.
The difficulty selector is removed; children enter their current cursor directly.

Each completed board immediately writes the next cursor and clears the old
session before reward effects. A 1.6-second celebration leads automatically to
the next level; stage finales show explicit completion/unlock feedback for
3 seconds. Exiting during either celebration resumes the already-saved next
level. Stage 4's finale saves `completed: true` and offers Stage 4 replay;
replay returns to its first level without relocking earlier stages.

Version 3 session snapshots store `{ stage, level, state }`. Only a matching,
validated, unfinished snapshot with exactly that level’s scheduled words is restored. Settled snapshots retain matched
pairs, turn temporary picks face down, and remove mismatch locks. The getter
reads the live board ref so an immediate exit includes the latest match.
The existing pause/unmount/5-second flush mechanism remains in use. Round 4.1
discards version 2 random-board snapshots while retaining the version 1 stage/level
cursor: the current level starts with its scheduled words. Old Round 3
version 1 deals are discarded; there was no stage cursor to migrate, so first
Round 4 entry starts Stage 1 level 1. Invalid progress also starts there.

Both records use the existing `ellaz:memory:preschool:<contentLocale>:` storage
namespace, isolated from standard Memory and from other content locales.
Changing content locale therefore selects that locale's Preschool progress.
Persistence remains best effort if browser storage is blocked or cleared.

## Rewards and interaction

Each finished board calls the existing `winMoment` exactly once using
`level_complete`, `easy`, and `preschool-<stage>-<level>`. Wallet coins, stars,
room spending, daily completion and existing economy caps stay shared. No new
amount or stage bonus is introduced. `runEnded: false` prevents a share/restart
prompt interrupting continuous play; Preschool no longer reports move scores.

Chinese cards retain one picture copy and one word copy with a small picture
clue. Face-up cards and “再听一次” repeat Mandarin through the existing speech
port, including asynchronous voice availability and global mute. Mismatches
remain visible for 1.4 seconds, with no penalty. Other content locales use
picture-picture pairs. Browser speech-call checks do not prove audible OS output.

## Round 4 verification (2026-09-13)

- `npm test`: 194 files, 4,759 tests passed. Targeted Preschool tests also
  passed after final adjustments. Covers exact stage configuration, all 65
  progression steps, unique cumulative pools, Mandarin repeat, single payout,
  automatic next level, partial-board restore, celebration-exit unlocks, and
  standard en/he/es 6/8/10 pair controls.
- Updated `scripts/repro/repro-preschool-memory.mjs`: built-page Chrome at
  390×844 passed all four grids, unique pairs, final-level unlock and reload,
  Chinese speech requests, isolated standard scores, mode routing and en/he/es
  standard entry. No browser page errors. Stage 4 screenshot visually inspected.
  Stage-final cursors are seeded in this browser probe; the 65-step sequence is
  checked by the progression test. No new child playtest or audible OS speech
  verification is claimed.
- First visit: 56,667 B gzip / 56,800 B limit, 133 B spare. No new word/stage
  metadata enters shell preloads or service-worker precache.
- `npm run build:check`: passed, including tier, precache/preloads, first-visit
  payload, emitted pages and catalogue slope. Isolated slope arms: 56,670 B
  (43 games) vs 56,399 B (35 games), 33.9 B gzip/game, below the 40 B target
  and 45 B limit. These isolated builds are distinct from the delivered first visit.

## Round 4 global page-zoom follow-up

The stage implementation above was already committed as `25d9c78` when this
follow-up started. This change adds the shared page guard, without modifying
standard Memory or moving stage metadata out of its lazy chunk.

`src/main.tsx` installs `preventPageZoom()` before either app-shell or content-page
mount. Global zero-specificity `touch-action: pan-x pan-y` permits single-finger
scrolling and excludes browser pinch/double-tap zoom, including nested scrollers.
Existing game `touch-action: none` declarations retain precedence for dragging.
Non-passive capture listeners cancel Safari `gesturestart` / `gesturechange` and
multi-touch `touchmove`; single-touch movement is untouched. No propagation is
stopped, and no pointer, click, touchstart, touchend or keyboard handler is added,
so the existing first-gesture audio/speech unlock still receives its input.
Viewport metadata is intentionally not the enforcement mechanism: Safari may
ignore zoom restrictions there. The old index comment promising page zoom was
removed to match the requested child-oriented interaction policy.

A future game can mark its own gesture surface `data-game-zoom`, set
`touch-action: none`, and handle/prevent its local pinch gesture itself. The JS
guard exempts descendants of that surface; removing it removes the exemption.
This does not enable browser page zoom or grant a persistent global opt-out.

References: [Apple Safari event handling](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html)
and [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action).
Page resize accessibility is deliberately limited by this requested policy;
browser/OS accessibility magnification and Safari chrome gestures are outside
page control. Real iPad Safari and installed iPad PWA testing remain separate
from Linux Chrome touch emulation and synthetic Safari-event assertions.

Follow-up validation (2026-09-13, local toolchain):

- `npm test`: 195 files / 4,763 tests passed. The new guard tests cover
  multi-touch cancellation, event propagation, untouched single-finger/input
  events, explicit local exemption and shared entry/CSS coverage.
- `scripts/repro/repro-page-zoom.mjs`: Chrome at 820×1180 with mobile/touch
  enabled passed trusted pinch and double-tap scale checks, nested scrolling,
  pointer capture dragging and game tap on both home and Memory pages.
  Safari gesture cancellation is checked with synthetic events only.
- `scripts/repro/repro-preschool-memory.mjs`: all four stage grids, unique
  pairs, finale unlock/reload, Mandarin repeat requests, isolated standard
  scores, mode routing and standard en/he/es entry passed; no page errors.
  Stage 4's 390×844 screenshot was visually inspected.
- Delivered first visit: **56,625 B gzip / 56,800 B**, **175 B spare**.
  Stage configuration and all word records remain Memory-lazy. No dependency,
  audit, economy or other-game changes. No physical iPad Safari/PWA or audible
  Mandarin output is claimed by these automated checks.
- `npm run build:check`: passed in full (tier, first-visit precache/preload,
  payload, emitted pages and slope). Isolated arms measured 56,616 / 56,360 B
  gzip, giving 32.0 B/game against the 45 B limit and 40 B target. Those arms
  are independent builds, not the delivered artifact's 56,625 B measurement.

## Round 4.1 verification (2026-09-13)

- `npm test`: 195 files / 4,766 tests passed. All 65 levels introduce exactly
  two words, with 0/1/4/6 historical reviews, no duplicate pairs and no adjacent
  overlap. Reviews never skip an older waiting word for a newer one. Tests also
  cover stable combinations under different RNGs and out-of-order access,
  rejection of off-schedule snapshots, progression, restoration, single payout,
  and standard en/he/es 6/8/10-pair controls.
- Built-page Chrome probe passed partial-board reload (including exact saved
  card positions and matches), stable words after snapshot removal, four stage
  finales/unlock/reload, Mandarin repeat requests, and standard en/he/es entry.
  No browser page errors. No new child recognition or audible OS speech test.
- Local Node 24 first visit: **56,623 B gzip / 56,800 B**, **177 B spare**.
  All vocabulary and scheduling remain in `game-memory` (7.18 kB gzip total).
  Preload and service-worker precache checks passed. This is the local artifact
  measurement; deployment on Node 22 can differ slightly.
- `npm run build:check`: passed in full, including tier, first-visit,
  payload, pages and slope. Isolated slope arms measured 56,623 / 56,350 B gzip
  (43 / 35 games): 34.1 B/game, below the 40 B target and 45 B limit.
