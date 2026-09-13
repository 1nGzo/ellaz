# Preschool Memory (Round 4)

Opt in with the home mode selector or `?play=preschool`. Only Memory is eligible.
Choose 简体中文 for picture/Chinese-word pairs and Mandarin speech. Standard en/he/es
Memory keeps its existing 6/8/10 pairs, controls, scores and versus behavior.

## Stages and content

| Stage | Rows × columns | Pairs | Levels | Cumulative pool |
| --- | --- | --- | --- | --- |
| 1 | 2 × 2 | 2 | 10 | 6 words |
| 2 | 2 × 3 | 3 | 15 | 11 words |
| 3 | 3 × 4 | 6 | 20 | 18 words |
| 4 | 4 × 4 | 8 | 20 | 26 words |

- Stage 1: 猫、苹果、车、狗、香蕉、太阳。
- Stage 2 adds 兔子、西瓜、公交车、月亮、球。
- Stage 3 adds 鱼、草莓、面包、火车、花、树、雨伞。
- Stage 4 adds 熊、大象、葡萄、鸡蛋、飞机、彩虹、鞋子、帽子。

Each stage retains the complete earlier pool. Every deal samples without
replacement, then shuffles exactly two cards per selected ID. Content stays in
Memory-local `{ id, picture, word }` records with no downloaded assets. Stage
configuration and words are reachable only through Memory's lazy game module.

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

Version 2 session snapshots store `{ stage, level, state }`. Only a matching,
validated, unfinished snapshot is restored. Settled snapshots retain matched
pairs, turn temporary picks face down, and remove mismatch locks. The getter
reads the live board ref so an immediate exit includes the latest match.
The existing pause/unmount/5-second flush mechanism remains in use. Old Round 3
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
