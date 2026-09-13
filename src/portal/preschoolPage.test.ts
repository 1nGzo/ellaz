// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dailyGameId } from "./dailyRotation";
import { applyPlayPolicy } from "./preschoolPage";

function seedLinks(): void {
  document.body.innerHTML = `
    <section id="related">
      <h2>Related games</h2>
      <ul class="grid">
        <li><a id="memory" href="/games/memory/">Memory</a></li>
        <li><a id="snake" href="/games/snake/">Snake</a></li>
      </ul>
    </section>
    <section id="empty">
      <h2>More games</h2>
      <ul class="grid">
        <li><a id="shadows" href="/games/shadows/">Shadows</a></li>
      </ul>
    </section>
    <a id="print" href="/he/print/sudoku/">Print</a>
    <a id="boards" href="/boards/">Boards</a>
    <a id="home" href="/">Home</a>`;
}

describe("Preschool portal policy", () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "/?play=preschool");
    seedLinks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    history.replaceState(null, "", "/");
  });

  it("filters static related links and non-child destinations", () => {
    applyPlayPolicy(document);

    expect(document.querySelector("#related #memory")).not.toBeNull();
    expect(document.querySelector("#related #snake")).toBeNull();
    expect(document.querySelector("#empty ul.grid")).toBeNull();
    expect(document.querySelector("#empty h2")).toBeNull();
    expect(document.querySelector("#print")).toBeNull();
    expect(document.querySelector("#boards")).toBeNull();
    expect(new URL(document.querySelector<HTMLAnchorElement>("#memory")!.href).search).toBe(
      "?play=preschool",
    );
    expect(new URL(document.querySelector<HTMLAnchorElement>("#home")!.href).search).toBe(
      "?play=preschool",
    );
  });

  it("keeps every standard recommendation when standard mode is explicit", () => {
    history.replaceState(null, "", "/?play=standard");
    applyPlayPolicy(document);

    expect(document.querySelector("#related #memory")).not.toBeNull();
    expect(document.querySelector("#related #snake")).not.toBeNull();
    expect(document.querySelector("#empty")).not.toBeNull();
    expect(document.querySelector("#print")).not.toBeNull();
    expect(document.querySelector("#boards")).not.toBeNull();
  });

  it("makes the daily recommendation come from the same allow-list", () => {
    expect(dailyGameId("2026-09-13", "preschool")).toBe("memory");
    expect(dailyGameId("2026-09-13", "standard")).toBeTruthy();
  });
});
