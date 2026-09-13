import { allowsGame, currentPlayMode, playHref } from "@sdk/playMode";

/** Emitted recommendations are outside React. Apply the same allow-list there. */
export function applyPlayPolicy(doc: Document = document): void {
  const mode = currentPlayMode();
  // The emitted article describes the standard 6/8/10-pair game. Its runtime
  // replacement teaches the preschool rules inside the frame instead.
  if (mode === "preschool" && doc.body.dataset.game === "memory") {
    let sibling = doc.querySelector(".stage")?.nextElementSibling;
    while (sibling) {
      if (sibling.tagName !== "H1") (sibling as HTMLElement).hidden = true;
      sibling = sibling.nextElementSibling;
    }
  }
  for (const link of doc.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) continue;
    const game = /\/games\/([^/]+)\/$/.exec(url.pathname)?.[1];
    if (game && !allowsGame(game, mode)) {
      (link.closest("li") ?? link).remove();
      continue;
    }
    if (mode === "preschool" && /\/(?:print|boards)\//.test(url.pathname)) {
      (link.closest("li") ?? link).remove();
      continue;
    }
    if (!url.search && !url.hash) link.href = playHref(url.pathname, mode);
  }
  for (const grid of doc.querySelectorAll("ul.grid")) {
    if (grid.children.length) continue;
    if (grid.previousElementSibling?.tagName === "H2") grid.previousElementSibling.remove();
    grid.remove();
  }
}
