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
import { PRESCHOOL_SESSION, preschoolDeck } from "./preschool";

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

  it("starts with two pairs and offers three as the only other preschool level", () => {
    const { ctx } = makeContext("preschool", "zh-CN");
    const { host, root } = mount(ctx);
    expect(boardButtons(host)).toHaveLength(4);
    expect(host.querySelector<HTMLButtonElement>(".gc-level")?.textContent).toContain("2");

    click(host.querySelector<HTMLButtonElement>(".gc-level")!);
    expect(boardButtons(host)).toHaveLength(6);
    expect(host.querySelector<HTMLButtonElement>(".gc-level")?.textContent).toContain("3");

    root.unmount();
  });

  it("renders Chinese picture and word cards, speaks Mandarin, and repeats the last word", () => {
    const { ctx, speech } = makeContext("preschool", "zh-CN");
    const { host, root } = mount(ctx);
    const deck = preschoolDeck("two");
    const first = deck.cards[0];
    const firstButton = boardButtons(host)[0];
    const firstWord = first.face === "cat" ? "猫" : "苹果";
    const firstPicture = first.face === "cat" ? "🐱" : "🍎";

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

  it("awards a completed preschool deal once, while standard locales retain 6/8/10 pairs", () => {
    const preschool = makeContext("preschool", "zh-CN");
    const { host, root } = mount(preschool.ctx);
    const deck = preschoolDeck("two");
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
      level: "preschool-two",
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
    const good = { level: "two", state: preschoolDeck("two") };
    expect(PRESCHOOL_SESSION.validate(good)).toBe(true);
    expect(PRESCHOOL_SESSION.validate({ level: "easy", state: good.state })).toBe(false);
    expect(PRESCHOOL_SESSION.validate({ level: "three", state: good.state })).toBe(false);
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
