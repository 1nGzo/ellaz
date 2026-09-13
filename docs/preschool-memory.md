# Preschool Memory (Round 3)

Opt in with the home mode selector, or `?play=preschool`. An explicit
`?play=standard` overrides the saved mode. The selector stores
`ellaz:play-mode`; internal navigation carries explicit mode through URLs,
including when storage is unavailable. The language selector remains separate:
choose 简体中文, then Preschool. Chinese has no new document route.

`src/sdk/playMode.ts` is the small allow-list policy: only Memory is eligible.
Home grid, recent games, categories and daily rotation filter by it. The game
host and context factory refuse disallowed direct mounts; the page boot redirects
disallowed game URLs home. Emitted recommendations are filtered by
`portal/preschoolPage.ts`. Standard Memory prose is hidden in Preschool because
it describes different rules. This is a runtime play policy, not a parental
security lock or a new set of static SEO documents.

Standard mode keeps all existing storage keys and Memory behavior. Preschool
uses `ellaz:memory:preschool:<contentLocale>:` for level, session and scores.
Its two/three-pair scores are local only: neither published to standard boards
nor included in the existing standard score-backup scanner. Session validation
checks the settled deck and known pair IDs. Locale separation prevents a Chinese
word-pair session/score being mistaken for an image-only session/score.

Wallet, stars, room and daily streak remain shared. A completed Preschool board
uses the existing `winMoment` with the easy reward tier, with one payout per
board; there is no new reward amount, economy or course system.

Memory-local content in `games/memory/preschool.ts` is three records with
`id`, `picture`, `word`: cat/🐱/猫, apple/🍎/苹果, car/🚗/车. Existing Memory
logic matches the stable ID; in Chinese one copy renders the picture, the
other the word with a small picture clue. Other content locales use two copies
of the picture. No common content-pack abstraction was added.

A new child starts with four face-down cards (two pairs), taps to reveal and
hear a word, then finds its friend. Matching cards stay up; a miss stays visible
for 1.4 seconds. Face-up/matched cards and the speaker button repeat the word.
The picture clues let a pre-reader finish without recognizing Chinese or hearing
sound. After all pairs match, existing success effects and room rewards run;
“再玩一次” deals again. The existing difficulty control can select three pairs.
No timer, versus mode, theme carousel or competitive record is shown here.

Mandarin uses `ctx.contentLocale === "zh-CN"` and the existing Web Speech port,
including async availability and the global mute control. No downloaded voice
assets or dependencies. Automated speech-call assertions are not evidence of
physical audible output; the browser/OS must supply a suitable voice. No child
playtest is claimed.

## Verification (2026-09-13, local Node 24)

- `npm test`: 194 files, 4,755 tests passed. Includes real component mounts for
  preschool 2/3 pairs and en/he/es standard 6/8/10, Mandarin call/repeat, one
  reward per finished board, invalid session rejection, storage isolation,
  standard-only score publication and static recommendation filtering.
- `scripts/repro/repro-preschool-memory.mjs`: built-page Chromium at 390×844;
  actual language/mode selection, home and daily links, picture/word matching,
  repeated Mandarin API requests, win, isolated score, reload, three-pair choice,
  rejected direct Snake route and en/he/es standard navigation all passed.
  No browser page errors. Browser speech is simulated at the API boundary;
  physical audible Mandarin and a real child playtest remain unverified.
- First visit: 56,663 B gzip / 56,800 B ceiling (137 B spare). Preschool content
  stays in Memory's game chunk; static-page policy stays in the page chunk.
- `npm run build:check`: passed, including tier, preload/precache, first-visit
  payload, emitted pages and catalogue slope. Slope: 32.6 B gzip/game against
  the 45 B limit and 40 B target (43-game vs 35-game isolated builds).
