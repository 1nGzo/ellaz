/** Opt-in policy. Only Memory has an authored preschool configuration. */
export type PlayMode = "standard" | "preschool";
export const PLAY_MODE_KEY = "ellaz:play-mode";
export function currentPlayMode(): PlayMode {
  try {
    const explicit = new URLSearchParams(location.search).get("play");
    if (explicit === "standard" || explicit === "preschool") return explicit;
    return localStorage.getItem(PLAY_MODE_KEY) === "preschool" ? "preschool" : "standard";
  } catch { return "standard"; }
}
export function allowsGame(id: string, mode: PlayMode): boolean {
  return mode === "standard" || id === "memory";
}
export function playHref(href: string, mode = currentPlayMode()): string {
  // Carry even standard explicitly, so a link overrides a saved preschool preference.
  return mode === "preschool" ? `${href}?play=preschool` :
    (typeof location !== "undefined" && new URLSearchParams(location.search).get("play") === "standard")
      ? `${href}?play=standard` : href;
}
export function choosePlayMode(mode: PlayMode): void {
  try { localStorage.setItem(PLAY_MODE_KEY, mode); } catch { /* URL still works. */ }
  const url = new URL(location.href);
  url.searchParams.set("play", mode);
  location.assign(url.href);
}
