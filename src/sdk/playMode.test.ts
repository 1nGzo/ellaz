// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { publishScore } from "./cloudSync";
vi.mock("./cloudSync", () => ({ publishScore: vi.fn() }));
import type { SessionSpec } from "./types";
import { createHostControls } from "./createContext";
import {
  PLAY_MODE_KEY,
  allowsGame,
  currentPlayMode,
  playHref,
} from "./playMode";

describe("play mode policy", () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "/");
  });

  afterEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "/");
  });

  it("uses an explicit URL mode before the saved preference", () => {
    localStorage.setItem(PLAY_MODE_KEY, "preschool");
    expect(currentPlayMode()).toBe("preschool");

    history.replaceState(null, "", "/?play=standard");
    expect(currentPlayMode()).toBe("standard");

    history.replaceState(null, "", "/?play=not-a-mode");
    expect(currentPlayMode()).toBe("preschool");
  });

  it("allows only Memory in Preschool and leaves standard unrestricted", () => {
    expect(allowsGame("memory", "preschool")).toBe(true);
    for (const id of ["snake", "2048", "coloring", "unknown"]) {
      expect(allowsGame(id, "preschool"), id).toBe(false);
    }
    for (const id of ["memory", "snake", "2048", "coloring", "unknown"]) {
      expect(allowsGame(id, "standard"), id).toBe(true);
    }
  });

  it("carries Preschool and an explicit standard mode through game links", () => {
    expect(playHref("/games/memory/", "preschool")).toBe("/games/memory/?play=preschool");

    history.replaceState(null, "", "/?play=standard");
    expect(playHref("/games/memory/", "standard")).toBe("/games/memory/?play=standard");
  });
});

describe("mode-scoped game context storage", () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "/");
  });

  afterEach(() => localStorage.clear());

  it("keeps level, session, and score facts in separate namespaces", () => {
    type Position = { value: number };
    const spec: SessionSpec<Position> = {
      version: 1,
      validate: (value): value is Position =>
        typeof value === "object" && value !== null && typeof (value as Position).value === "number",
    };
    const standard = createHostControls("memory", "zh-CN", document.createElement("div"), "standard").context;
    const preschool = createHostControls("memory", "zh-CN", document.createElement("div"), "preschool").context;

    standard.storage.set("level", "hard");
    preschool.storage.set("level", "two");
    standard.session.save(spec, { value: 10 });
    preschool.session.save(spec, { value: 2 });
    vi.mocked(publishScore).mockClear();
    standard.score?.report({ value: 10, unit: "moves", board: "shared" });
    preschool.score?.report({ value: 2, unit: "moves", board: "shared" });
    expect(publishScore).toHaveBeenCalledTimes(1);
    expect(publishScore).toHaveBeenCalledWith("memory", "shared", 10, "moves");

    expect(standard.storage.get("level", null)).toBe("hard");
    expect(preschool.storage.get("level", null)).toBe("two");
    expect(standard.session.load(spec)).toEqual({ value: 10 });
    expect(preschool.session.load(spec)).toEqual({ value: 2 });
    expect(standard.score?.best("shared")).toBe(10);
    expect(preschool.score?.best("shared")).toBe(2);

    expect(localStorage.getItem("ellaz:memory:level")).toContain("hard");
    expect(localStorage.getItem("ellaz:memory:preschool:zh-CN:level")).toContain("two");
    expect(localStorage.getItem("ellaz:memory:session")).toContain('"value":10');
    expect(localStorage.getItem("ellaz:memory:preschool:zh-CN:session")).toContain('"value":2');
    expect(localStorage.getItem("ellaz:memory:score:shared")).toBe("10");
    expect(localStorage.getItem("ellaz:memory:preschool:zh-CN:score:shared")).toBe("2");
    preschool.session.clear();
    expect(standard.session.load(spec)).toEqual({ value: 10 });
    const reopened = createHostControls("memory", "zh-CN", document.createElement("div"), "standard").context;
    expect(reopened.storage.get("level", null)).toBe("hard");
    expect(reopened.score?.best("shared")).toBe(10);
    const english = createHostControls("memory", "en", document.createElement("div"), "preschool").context;
    expect(english.score?.best("shared")).toBeUndefined();
    expect(() => createHostControls("snake", "en", document.createElement("div"), "preschool")).toThrow();
  });
});
