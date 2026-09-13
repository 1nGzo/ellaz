/** Page zoom is off; a game-owned gesture surface may opt out of the JS guard
 * with data-game-zoom and touch-action:none, implementing its own local zoom.
 * Never stop propagation: game input and first-gesture audio still receive events.
 * Safari gesture events need an explicit non-passive preventDefault in addition
 * to CSS. The touchmove fallback cancels only multi-touch, never single-finger pan.
 */
export function preventPageZoom(): void {
  const guard = (event: Event) => {
    if (!(event.target instanceof Element && event.target.closest("[data-game-zoom]")) &&
      (!("touches" in event) || (event as TouchEvent).touches.length > 1)) event.preventDefault();
  };
  for (const type of ["gesturestart", "gesturechange", "touchmove"]) {
    document.addEventListener(type, guard, { passive: false, capture: true });
  }
}
