// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { preventPageZoom } from "./pageZoom";

describe("global page zoom guard", () => {
  preventPageZoom();
  function send(type: string, touches?: number, target: Element = document.body) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    if (touches !== undefined) Object.defineProperty(event, "touches", { value: Array(touches).fill({}) });
    target.dispatchEvent(event);
    return event;
  }
  it("cancels Safari gestures and multi-touch movement without stopping delivery", () => {
    const receive = vi.fn();
    document.body.addEventListener("gesturestart", receive, { once: true });
    expect(send("gesturestart").defaultPrevented).toBe(true);
    expect(receive).toHaveBeenCalledOnce();
    expect(send("gesturechange").defaultPrevented).toBe(true);
    expect(send("touchmove", 2).defaultPrevented).toBe(true);
    expect(send("touchmove", 3).defaultPrevented).toBe(true);
  });
  it("leaves taps, single-finger pan, drag Pointer Events and audio unlock events alone", () => {
    for (const type of ["click", "dblclick", "pointerdown", "pointermove", "pointerup", "touchstart", "touchend", "keydown", "wheel"]) {
      expect(send(type, 1).defaultPrevented, type).toBe(false);
    }
    expect(send("touchmove", 1).defaultPrevented).toBe(false);
  });
  it("allows an explicit game-local gesture handler, then restores protection on exit", () => {
    const surface = document.createElement("div");
    surface.setAttribute("data-game-zoom", "");
    const child = surface.appendChild(document.createElement("span"));
    document.body.append(surface);
    expect(send("gesturestart", undefined, child).defaultPrevented).toBe(false);
    expect(send("touchmove", 2, child).defaultPrevented).toBe(false);
    surface.removeAttribute("data-game-zoom");
    expect(send("gesturechange", undefined, child).defaultPrevented).toBe(true);
    surface.remove();
  });
  it("covers both page shapes and nested scrollers without overriding game drag CSS", () => {
    const css = readFileSync("src/ui/global.css", "utf8");
    expect(css).toMatch(/:where\(html, body, body \*\)\s*\{\s*touch-action: pan-x pan-y;/);
    expect(css).toMatch(/\.ellaz-play-surface\s*\{[^}]*touch-action: none;/);
    const entry = readFileSync("src/main.tsx", "utf8");
    expect(entry.indexOf("preventPageZoom();")).toBeLessThan(entry.indexOf('if (page.kind === "app")'));
  });
});
