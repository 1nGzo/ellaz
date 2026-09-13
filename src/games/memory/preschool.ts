import type { SessionSpec } from "@sdk/types";
import { newGame, type MemoryState } from "./logic";

// Local to Memory: stable match key, picture, and the first authored Chinese words.
// Pictures remain on word cards as small clues: reading and speech are optional.
export const PRESCHOOL_CONTENT = [
  { id: "cat", picture: "🐱", word: "猫" },
  { id: "apple", picture: "🍎", word: "苹果" },
  { id: "car", picture: "🚗", word: "车" },
] as const;
export const PRESCHOOL_LEVELS = [
  { id: "two", pairs: 2, label: { en: "2 🐱🍎", he: "2 🐱🍎", es: "2 🐱🍎" } },
  { id: "three", pairs: 3, label: { en: "3 🐱🍎🚗", he: "3 🐱🍎🚗", es: "3 🐱🍎🚗" } },
] as const;
export type PreschoolLevel = "two" | "three";
export function preschoolDeck(level: PreschoolLevel): MemoryState {
  return newGame(PRESCHOOL_CONTENT.slice(0, level === "three" ? 3 : 2).map((c) => c.id));
}
export interface PreschoolSession { level: PreschoolLevel; state: MemoryState }
export const PRESCHOOL_SESSION: SessionSpec<PreschoolSession> = {
  version: 1,
  validate(value): value is PreschoolSession {
    const s = value as PreschoolSession | null;
    if (!s || (s.level !== "two" && s.level !== "three")) return false;
    const expected = PRESCHOOL_CONTENT.slice(0, s.level === "three" ? 3 : 2);
    const g = s.state;
    if (!g || !Array.isArray(g.cards) || g.cards.length !== expected.length * 2 ||
      g.totalPairs !== expected.length || g.lock !== false || g.firstPick !== null ||
      !Number.isInteger(g.moves) || g.moves < 0 || !Number.isInteger(g.matchedPairs)) return false;
    if (!g.cards.every((c, i) => c && c.id === i && typeof c.matched === "boolean" &&
      c.flipped === c.matched)) return false;
    if (!expected.every(({ id }) => {
      const pair = g.cards.filter((c) => c.face === id);
      return pair.length === 2 && pair[0].matched === pair[1].matched;
    })) return false;
    return g.matchedPairs === g.cards.filter((c) => c.matched).length / 2;
  },
};
