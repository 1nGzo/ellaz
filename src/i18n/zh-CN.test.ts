// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { runtimeLocaleFor, LOCALE_KEY } from "./runtimeLocale";
import { APP_LOCALES, PAGE_LOCALES, SHIPPED_LOCALES, SCRIPT, dirOf, pageLocaleFor } from "./locales";
import { AVAILABLE, STATIC_LOCALES, isLoaded, loadDict, makeT } from "./strings";
import { createHostControls } from "../sdk/createContext";

afterEach(() => localStorage.clear());

it("loads only the requested Chinese chrome, with explicit English fallback", async () => {
  expect(APP_LOCALES).toContain("zh-CN");
  expect(AVAILABLE).toContain("zh-CN");
  expect(STATIC_LOCALES).not.toContain("zh-CN");
  expect(PAGE_LOCALES).not.toContain("zh-CN");
  expect(SHIPPED_LOCALES).not.toContain("zh-CN");
  expect(isLoaded("zh-CN")).toBe(false);
  expect(await loadDict("zh-CN")).toBe(true);
  expect(makeT("zh-CN")("play")).toBe("开始游戏");
  expect(makeT("zh-CN")("backupHint")).toBe(makeT("en")("backupHint"));
  expect(SCRIPT["zh-CN"]).toBe("han");
  expect(dirOf("zh-CN")).toBe("ltr");
});

it("retains the preference on English documents and respects translated URLs", () => {
  localStorage.setItem(LOCALE_KEY, "zh-CN");
  expect(runtimeLocaleFor()).toBe("zh-CN");
  expect(runtimeLocaleFor(pageLocaleFor("zh-CN"))).toBe("zh-CN");
  for (const page of ["he", "es", "fr"] as const) expect(runtimeLocaleFor(page)).toBe(page);
  for (const saved of ["en", "he", "es", "fr"] as const) {
    localStorage.setItem(LOCALE_KEY, saved);
    expect(runtimeLocaleFor()).toBe(saved);
    expect(runtimeLocaleFor("en")).toBe("en");
  }
  localStorage.setItem(LOCALE_KEY, "invalid");
  expect(runtimeLocaleFor()).toBe("en");
});

it("hands new games Chinese content while keeping legacy record indexing safe", () => {
  const ctx = createHostControls("memory", "zh-CN", document.createElement("div")).context;
  expect(ctx.runtimeLocale).toBe("zh-CN");
  expect(ctx.contentLocale).toBe("zh-CN");
  expect(ctx.locale).toBe("en");
  expect(ctx.t("play")).toBe("开始游戏");
  for (const locale of ["en", "he", "es"] as const) {
    const context = createHostControls("memory", locale, document.createElement("div")).context;
    expect(context.locale).toBe(locale);
    expect(context.contentLocale).toBe(locale);
  }
});
