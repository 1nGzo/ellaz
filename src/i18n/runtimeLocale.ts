import { DEFAULT_LOCALE, isAppLocale, isPageLocale, type AppLocale } from "./locales";

export const LOCALE_KEY = "ellaz:locale";

/** Explicit translated URLs win. App-only preferences survive fallback documents. */
export function runtimeLocaleFor(page?: AppLocale): AppLocale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (isAppLocale(saved) && (!page || (page === DEFAULT_LOCALE && !isPageLocale(saved)))) return saved;
  } catch { /* Storage may be unavailable. */ }
  return page ?? DEFAULT_LOCALE;
}
