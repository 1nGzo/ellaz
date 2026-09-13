import type { SessionSpec } from "@sdk/types";
import { newGame, shuffle, type MemoryState } from "./logic";

// Memory-local only. Each stage adds concrete words while retaining all earlier words.
export const PRESCHOOL_CONTENT = [
  { id: "cat", picture: "🐱", word: "猫" },
  { id: "apple", picture: "🍎", word: "苹果" },
  { id: "car", picture: "🚗", word: "车" },
  { id: "dog", picture: "🐶", word: "狗" },
  { id: "banana", picture: "🍌", word: "香蕉" },
  { id: "sun", picture: "☀️", word: "太阳" },
  { id: "rabbit", picture: "🐰", word: "兔子" },
  { id: "watermelon", picture: "🍉", word: "西瓜" },
  { id: "bus", picture: "🚌", word: "公交车" },
  { id: "moon", picture: "🌙", word: "月亮" },
  { id: "ball", picture: "⚽", word: "球" },
  { id: "fish", picture: "🐟", word: "鱼" },
  { id: "strawberry", picture: "🍓", word: "草莓" },
  { id: "bread", picture: "🍞", word: "面包" },
  { id: "train", picture: "🚂", word: "火车" },
  { id: "flower", picture: "🌻", word: "花" },
  { id: "tree", picture: "🌳", word: "树" },
  { id: "umbrella", picture: "☂️", word: "雨伞" },
  { id: "bear", picture: "🐻", word: "熊" },
  { id: "elephant", picture: "🐘", word: "大象" },
  { id: "grapes", picture: "🍇", word: "葡萄" },
  { id: "egg", picture: "🥚", word: "鸡蛋" },
  { id: "plane", picture: "✈️", word: "飞机" },
  { id: "rainbow", picture: "🌈", word: "彩虹" },
  { id: "shoe", picture: "👟", word: "鞋子" },
  { id: "hat", picture: "🧢", word: "帽子" },
] as const;
export const PRESCHOOL_STAGES = [
  { rows: 2, cols: 2, pairs: 2, levels: 10, poolSize: 6 },
  { rows: 2, cols: 3, pairs: 3, levels: 15, poolSize: 11 },
  { rows: 3, cols: 4, pairs: 6, levels: 20, poolSize: 18 },
  { rows: 4, cols: 4, pairs: 8, levels: 20, poolSize: 26 },
] as const;
// One-based cursor. Earlier stages are unlocked by construction; no duplicate unlock list.
export interface PreschoolProgress { version: 1; stage: number; level: number; completed: boolean }
export const PRESCHOOL_PROGRESS_KEY = "stage-progress";
export const INITIAL_PROGRESS: PreschoolProgress = { version: 1, stage: 1, level: 1, completed: false };
export function validProgress(value: unknown): value is PreschoolProgress {
  const p = value as PreschoolProgress | null;
  if (!p || p.version !== 1 || !Number.isInteger(p.stage) || !Number.isInteger(p.level) ||
    typeof p.completed !== "boolean") return false;
  const stage = PRESCHOOL_STAGES[p.stage - 1];
  return !!stage && p.level >= 1 && p.level <= stage.levels &&
    (!p.completed || (p.stage === 4 && p.level === stage.levels));
}
export function advanceProgress(p: PreschoolProgress): PreschoolProgress {
  if (p.completed) return p;
  if (p.level < PRESCHOOL_STAGES[p.stage - 1].levels) return { ...p, level: p.level + 1 };
  if (p.stage < PRESCHOOL_STAGES.length) return { ...p, stage: p.stage + 1, level: 1 };
  return { ...p, completed: true };
}
export function preschoolPool(stage: number) {
  return PRESCHOOL_CONTENT.slice(0, PRESCHOOL_STAGES[stage - 1].poolSize);
}
export function preschoolDeck(stage: number): MemoryState {
  const config = PRESCHOOL_STAGES[stage - 1];
  // Sampling without replacement guarantees exactly two cards for each selected ID.
  return newGame(shuffle(preschoolPool(stage)).slice(0, config.pairs).map((c) => c.id));
}
export interface PreschoolSession { stage: number; level: number; state: MemoryState }
export const PRESCHOOL_SESSION: SessionSpec<PreschoolSession> = {
  version: 2,
  validate(value): value is PreschoolSession {
    const s = value as PreschoolSession | null;
    if (!s || !validProgress({ version: 1, stage: s.stage, level: s.level, completed: false })) return false;
    const config = PRESCHOOL_STAGES[s.stage - 1];
    const g = s.state;
    if (!g || !Array.isArray(g.cards) || g.cards.length !== config.pairs * 2 ||
      g.totalPairs !== config.pairs || g.lock !== false || g.firstPick !== null ||
      !Number.isInteger(g.moves) || g.moves < 0 || !Number.isInteger(g.matchedPairs)) return false;
    if (!g.cards.every((c, i) => c && c.id === i && typeof c.matched === "boolean" &&
      c.flipped === c.matched)) return false;
    const faces = [...new Set(g.cards.map((c) => c.face))];
    if (faces.length !== config.pairs || !faces.every((face) => {
      if (!preschoolPool(s.stage).some((item) => item.id === face)) return false;
      const pair = g.cards.filter((c) => c.face === face);
      return pair.length === 2 && pair[0].matched === pair[1].matched;
    })) return false;
    return g.matchedPairs === g.cards.filter((c) => c.matched).length / 2;
  },
};
