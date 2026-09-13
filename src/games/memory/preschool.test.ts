// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import type {
  AdsPort,
  AnalyticsPort,
  AudioPort,
  DailyPort,
  GameContext,
  LifecyclePort,
  RewardsPort,
  SaveStore,
  ScorePort,
  SessionPort,
  SpeechPort,
} from "@sdk/index";
import { Memory } from "./Memory";
import { PRESCHOOL_SESSION, PRESCHOOL_STAGES, PRESCHOOL_CONTENT, PRESCHOOL_PROGRESS_KEY, INITIAL_PROGRESS, advanceProgress, preschoolPool, preschoolDeck } from "./preschool";

type Mounted = { host: HTMLElement; root: ReturnType<typeof createRoot> };

function makeContext(playMode: "standard" | "preschool", contentLocale: "en" | "he" | "es" | "zh-CN") {
  const values = new Map<string, unknown>();
  const storage: SaveStore = {
    get: <T,>(key: string, fallback: T) => (values.has(key) ? (values.get(key) as T) : fallback),
    set: <T,>(key: string, value: T) => void values.set(key, value),
    remove: (key) => void values.delete(key),
  };
  const session = {
    load: vi.fn(() => undefined),
    save: vi.fn(),
    clear: vi.fn(),
  } as unknown as SessionPort;
  const speech = {
    available: vi.fn(() => true),
    speak: vi.fn(() => Promise.resolve()),
    cancel: vi.fn(),
    unlock: vi.fn(),
    onAvailabilityChange: vi.fn(() => () => {}),
  } as unknown as SpeechPort;
  const audio = {
    muted: false,
    toggleMute: vi.fn(),
    onMuteChange: vi.fn(() => () => {}),
    play: vi.fn(),
    tone: vi.fn(),
    time: vi.fn(() => 0),
    unlock: vi.fn(),
  } as unknown as AudioPort;
  const rewards = {
    coins: 0,
    stars: 0,
    grant: vi.fn(() => ({
      coins: 3,
      stars: 1,
      totalCoins: 3,
      totalStars: 1,
      capped: false,
      persisted: true,
    })),
  } as unknown as RewardsPort;
  const score = {
    best: vi.fn(() => undefined),
    report: vi.fn(({ value }: { value: number }) => ({
      value,
      best: value,
      isPersonalBest: true,
      rejected: false,
    })),
  } as unknown as ScorePort;
  const analytics = {
    track: vi.fn(),
    levelStart: vi.fn(),
    levelComplete: vi.fn(),
    levelFail: vi.fn(),
  } as unknown as AnalyticsPort;
  const lifecycle = {
    loadingStart: vi.fn(),
    loadingFinished: vi.fn(),
    gameplayStart: vi.fn(),
    gameplayStop: vi.fn(),
  } as unknown as LifecyclePort;
  const daily = { complete: vi.fn() } as unknown as DailyPort;
  const ads = { interstitial: vi.fn(() => Promise.resolve()), rewarded: vi.fn(() => Promise.resolve(false)) } as unknown as AdsPort;
  const ctx = {
    mount: document.createElement("div"),
    playMode,
    locale: contentLocale === "zh-CN" ? "en" : contentLocale,
    runtimeLocale: contentLocale,
    contentLocale,
    dir: "ltr",
    t: (key: string) =>
      ({
        pairs: "Pairs",
        best: "Best",
        difficulty: "Difficulty",
        restart: "Restart",
        youWon: "You won",
        pause: "Pause",
        resume: "Resume",
      } as Record<string, string>)[key] ?? key,
    storage,
    analytics,
    audio,
    speech,
    lifecycle,
    ads,
    rewards,
    score,
    session,
    daily,
    onRequestExit: vi.fn(),
    requestExit: vi.fn(),
    onPause: vi.fn(() => () => {}),
    onResume: vi.fn(() => () => {}),
    onResize: vi.fn(() => () => {}),
  } as unknown as GameContext;
  return { ctx, speech, rewards };
}

function mount(ctx: GameContext): Mounted {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(createElement(Memory, { ctx })));
  return { host, root };
}

function boardButtons(host: HTMLElement): HTMLButtonElement[] {
  return [...host.querySelectorAll<HTMLButtonElement>(".ellaz-play-surface > div button")];
}

function click(button: HTMLButtonElement): void {
  flushSync(() => button.click());
}

const originalAnimate = Element.prototype.animate;

describe("Memory preschool mode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    localStorage.clear();
    document.body.innerHTML = "";
    history.replaceState(null, "", "/games/memory/?play=preschool");
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      value: vi.fn(() => ({ cancel: vi.fn() })),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    localStorage.clear();
    document.body.innerHTML = "";
    history.replaceState(null, "", "/");
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      value: originalAnimate,
    });
    vi.restoreAllMocks();
  });

  it("opens the saved stage directly without a difficulty selector", () => {
    for (let stage = 1; stage <= 4; stage++) {
      const { ctx } = makeContext("preschool", "zh-CN");
      ctx.storage.set(PRESCHOOL_PROGRESS_KEY, { ...INITIAL_PROGRESS, stage, level: 3 });
      const { host, root } = mount(ctx);
      expect(boardButtons(host)).toHaveLength(PRESCHOOL_STAGES[stage - 1].pairs * 2);
      expect(boardButtons(host)[0].parentElement!.style.gridTemplateColumns).toContain(`repeat(${PRESCHOOL_STAGES[stage - 1].cols},`);
      expect(host.querySelector(".gc-level")).toBeNull();
      expect(host.textContent).toContain(`3 / ${PRESCHOOL_STAGES[stage - 1].levels}`);
      root.unmount();
    }
  });

  it("renders Chinese picture and word cards, speaks Mandarin, and repeats the last word", () => {
    const { ctx, speech } = makeContext("preschool", "zh-CN");
    const { host, root } = mount(ctx);
    const deck = preschoolDeck(1, 1);
    const first = deck.cards[0];
    const firstButton = boardButtons(host)[0];
    const item = PRESCHOOL_CONTENT.find((c) => c.id === first.face)!;
    const firstWord = item.word;
    const firstPicture = item.picture;

    click(firstButton);
    expect(firstButton.textContent).toContain(firstPicture);
    expect(speech.speak).toHaveBeenCalledWith(firstWord, { locale: "zh-CN", rate: 0.8 });
    expect(host.textContent).toContain("找朋友");

    const repeat = host.querySelector<HTMLButtonElement>('button[aria-label="再听一次"]')!;
    click(repeat);
    expect(speech.speak).toHaveBeenCalledTimes(2);
    expect(speech.speak).toHaveBeenLastCalledWith(firstWord, { locale: "zh-CN", rate: 0.8 });

    root.unmount();
  });

  it("persists each next level immediately, including unlocks during celebration", () => {
    for (const stage of [1, 2, 3, 4]) {
      const { ctx, rewards } = makeContext("preschool", "zh-CN");
      const level = PRESCHOOL_STAGES[stage - 1].levels;
      ctx.storage.set(PRESCHOOL_PROGRESS_KEY, { ...INITIAL_PROGRESS, stage, level });
      const mounted = mount(ctx);
      const deck = preschoolDeck(stage, level);
      for (const face of new Set(deck.cards.map((c) => c.face))) {
        deck.cards.forEach((c, i) => { if (c.face === face) click(boardButtons(mounted.host)[i]); });
      }
      expect(rewards.grant).toHaveBeenCalledTimes(1);
      expect(ctx.score!.report).not.toHaveBeenCalled();
      expect(mounted.host.textContent).toContain(stage === 4 ? "全部完成" : "已解锁");
      mounted.root.unmount(); // Exit before the transition timer fires.
      const resumed = mount(ctx);
      expect(ctx.storage.get(PRESCHOOL_PROGRESS_KEY, null)).toEqual(
        advanceProgress({ ...INITIAL_PROGRESS, stage, level }));
      expect(resumed.host.textContent).toContain(stage === 4 ? "再玩第 4 阶段" : `1 / ${PRESCHOOL_STAGES[stage].levels}`);
      expect(rewards.grant).toHaveBeenCalledTimes(1);
      resumed.root.unmount();
    }
  });

  it("automatically advances and restores a settled partial board", () => {
    const { ctx } = makeContext("preschool", "zh-CN");
    const mounted = mount(ctx);
    const deck = preschoolDeck(1, 1);
    for (const face of new Set(deck.cards.map((c) => c.face))) {
      deck.cards.forEach((c, i) => { if (c.face === face) click(boardButtons(mounted.host)[i]); });
    }
    flushSync(() => vi.advanceTimersByTime(1600));
    expect(mounted.host.textContent).toContain("2 / 10");
    const fresh = preschoolDeck(1, 2);
    fresh.cards.forEach((c, i) => { if (c.face === fresh.cards[0].face) click(boardButtons(mounted.host)[i]); });
    mounted.root.unmount();
    const snapshot = vi.mocked(ctx.session.save).mock.calls.at(-1)![1];
    expect(PRESCHOOL_SESSION.validate(snapshot)).toBe(true);
    vi.mocked(ctx.session.load).mockReturnValue(snapshot);
    const resumed = mount(ctx);
    expect(resumed.host.textContent).toContain("2 / 10");
    expect(boardButtons(resumed.host).filter((b) => b.textContent !== "❓")).toHaveLength(2);
    resumed.root.unmount();
  });

  it("awards a completed preschool deal once, while standard locales retain 6/8/10 pairs", () => {
    const preschool = makeContext("preschool", "zh-CN");
    const { host, root } = mount(preschool.ctx);
    const deck = preschoolDeck(1, 1);
    const faces = [...new Set(deck.cards.map((card) => card.face))];
    for (const face of faces) {
      const indices = deck.cards.flatMap((card, index) => (card.face === face ? [index] : []));
      click(boardButtons(host)[indices[0]]);
      click(boardButtons(host)[indices[1]]);
    }
    expect(preschool.rewards.grant).toHaveBeenCalledTimes(1);
    expect(preschool.rewards.grant).toHaveBeenCalledWith({
      reason: "level_complete",
      tier: "easy",
      level: "preschool-1-1",
    });

    click(boardButtons(host)[0]);
    expect(preschool.rewards.grant).toHaveBeenCalledTimes(1);
    root.unmount();

    for (const locale of ["en", "he", "es"] as const) {
      const standard = makeContext("standard", locale);
      const mounted = mount(standard.ctx);
      expect(boardButtons(mounted.host), locale).toHaveLength(12);
      click(mounted.host.querySelector<HTMLButtonElement>(".gc-level")!);
      expect(boardButtons(mounted.host), `${locale} medium`).toHaveLength(16);
      click(mounted.host.querySelector<HTMLButtonElement>(".gc-level")!);
      expect(boardButtons(mounted.host), `${locale} hard`).toHaveLength(20);
      mounted.root.unmount();
    }
  });
});


describe("Preschool session validation", () => {
  it("accepts its own settled deck and refuses standard, unknown or partial pairs", () => {
    const good = { stage: 1, level: 1, state: preschoolDeck(1, 1) };
    expect(PRESCHOOL_SESSION.validate(good)).toBe(true);
    expect(PRESCHOOL_SESSION.validate({ level: "easy", state: good.state })).toBe(false);
    expect(PRESCHOOL_SESSION.validate({ stage: 2, level: 1, state: good.state })).toBe(false);
    expect(PRESCHOOL_SESSION.validate({ ...good, state: { ...good.state, lock: true } })).toBe(false);
    const corrupt = structuredClone(good);
    corrupt.state.cards[0].face = "unknown";
    expect(PRESCHOOL_SESSION.validate(corrupt)).toBe(false);
    const partial = structuredClone(good);
    partial.state.cards[0].matched = true;
    partial.state.cards[0].flipped = true;
    expect(PRESCHOOL_SESSION.validate(partial)).toBe(false);
  });
});


describe("Preschool stage progression", () => {
  it("unlocks only after 10, 15, 20 and 20 completions and stops at the end", () => {
    expect(PRESCHOOL_STAGES.map(({ rows, cols, pairs, levels }) => [rows, cols, pairs, levels]))
      .toEqual([[2, 2, 2, 10], [2, 3, 3, 15], [3, 4, 6, 20], [4, 4, 8, 20]]);
    let progress = INITIAL_PROGRESS;
    for (let stage = 1; stage <= 4; stage++) {
      const config = PRESCHOOL_STAGES[stage - 1];
      expect(config.rows * config.cols).toBe(config.pairs * 2);
      for (let level = 1; level <= config.levels; level++) {
        expect(progress).toEqual({ version: 1, stage, level, completed: false });
        progress = advanceProgress(progress);
      }
    }
    expect(progress).toEqual({ version: 1, stage: 4, level: 20, completed: true });
    expect(advanceProgress(progress)).toEqual(progress);
  });

  it("uses cumulative Chinese pools and never duplicates a selected pair", () => {
    for (let stage = 1; stage <= 4; stage++) {
      const pool = preschoolPool(stage);
      if (stage > 1) expect(pool).toEqual(expect.arrayContaining(preschoolPool(stage - 1)));
      expect(pool.every((c) => /[\u4e00-\u9fff]/.test(c.word) && c.picture)).toBe(true);
      expect(new Set(pool.map((c) => c.word)).size).toBe(pool.length);
      for (let level = 1; level <= PRESCHOOL_STAGES[stage - 1].levels; level++) {
        const state = preschoolDeck(stage, level);
        expect(PRESCHOOL_SESSION.validate({ stage, level, state })).toBe(true);
        expect(new Set(state.cards.map((c) => c.face)).size).toBe(PRESCHOOL_STAGES[stage - 1].pairs);
      }
    }
  });
});

describe("Round 4.1 vocabulary schedule", () => {
  const faces = (stage: number, level: number) =>
    [...new Set(preschoolDeck(stage, level).cards.map((c) => c.face))].sort();

  it("introduces exactly 20/30/40/40 words with fair historical review and no adjacent overlap", () => {
    const seen = new Map<string, number>();
    let previous: string[] = [];
    let turn = 0;
    const added: number[] = [];
    for (let stage = 1; stage <= 4; stage++) {
      const before = seen.size;
      const config = PRESCHOOL_STAGES[stage - 1];
      for (let level = 1; level <= config.levels; level++) {
        const current = faces(stage, level);
        const fresh = current.filter((id) => !seen.has(id));
        const review = current.filter((id) => seen.has(id));
        expect(current).toHaveLength(config.pairs);
        expect(fresh, `${stage}/${level} new`).toHaveLength(2);
        expect(review, `${stage}/${level} review`).toHaveLength(config.pairs - 2);
        expect(current.filter((id) => previous.includes(id))).toEqual([]);
        // No newer word may be reviewed while an older waiting word is skipped.
        const waiting = [...seen].filter(([id]) => !review.includes(id));
        for (const id of review) {
          for (const [, last] of waiting) expect(seen.get(id)!).toBeLessThanOrEqual(last);
        }
        current.forEach((id) => seen.set(id, turn));
        previous = current;
        turn++;
      }
      added.push(seen.size - before);
      expect(seen.size).toBe(config.poolSize);
    }
    expect(added).toEqual([20, 30, 40, 40]);
    expect(seen.size).toBe(130);
    for (const key of ["id", "word", "picture"] as const) {
      expect(new Set(PRESCHOOL_CONTENT.map((c) => c[key])).size).toBe(130);
    }
  });

  it("keeps every level's combination across random sources and out-of-order requests", () => {
    const random = vi.spyOn(Math, "random");
    try {
      for (let stage = 1; stage <= 4; stage++) {
        for (let level = 1; level <= PRESCHOOL_STAGES[stage - 1].levels; level++) {
          random.mockReturnValue(0.01);
          const expected = faces(stage, level);
          faces(4, 20);
          random.mockReturnValue(0.99);
          expect(faces(stage, level)).toEqual(expected);
        }
      }
    } finally { random.mockRestore(); }
  });

  it("rejects a valid-sized board from another level or the old random pool", () => {
    expect(PRESCHOOL_SESSION.version).toBe(3);
    expect(PRESCHOOL_SESSION.validate({ stage: 2, level: 2, state: preschoolDeck(2, 1) })).toBe(false);
    const old = preschoolDeck(1, 1);
    old.cards.forEach((c) => { if (c.face === "cat") c.face = "dog"; });
    expect(PRESCHOOL_SESSION.validate({ stage: 1, level: 1, state: old })).toBe(false);
  });
});
