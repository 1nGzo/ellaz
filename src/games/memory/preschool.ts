import type { SessionSpec } from "@sdk/types";
import { newGame, type MemoryState } from "./logic";

// Curriculum introduction order; two consecutive records per level. Memory-lazy only.
export const PRESCHOOL_CONTENT = [
  { id: "cat", picture: "🐱", word: "猫" },
  { id: "apple", picture: "🍎", word: "苹果" },
  { id: "car", picture: "🚗", word: "汽车" },
  { id: "dog", picture: "🐶", word: "狗" },
  { id: "banana", picture: "🍌", word: "香蕉" },
  { id: "sun", picture: "☀️", word: "太阳" },
  { id: "rabbit", picture: "🐰", word: "兔子" },
  { id: "watermelon", picture: "🍉", word: "西瓜" },
  { id: "bus", picture: "🚌", word: "公交车" },
  { id: "moon", picture: "🌙", word: "月亮" },
  { id: "ball", picture: "⚽", word: "足球" },
  { id: "fish", picture: "🐟", word: "鱼" },
  { id: "strawberry", picture: "🍓", word: "草莓" },
  { id: "bread", picture: "🍞", word: "面包" },
  { id: "train", picture: "🚂", word: "火车" },
  { id: "flower", picture: "🌻", word: "向日葵" },
  { id: "tree", picture: "🌳", word: "树" },
  { id: "umbrella", picture: "☂️", word: "雨伞" },
  { id: "bear", picture: "🐻", word: "熊" },
  { id: "elephant", picture: "🐘", word: "大象" },
  { id: "panda", picture: "🐼", word: "熊猫" },
  { id: "grapes", picture: "🍇", word: "葡萄" },
  { id: "plane", picture: "✈️", word: "飞机" },
  { id: "rainbow", picture: "🌈", word: "彩虹" },
  { id: "balloon", picture: "🎈", word: "气球" },
  { id: "shoe", picture: "👟", word: "鞋子" },
  { id: "eye", picture: "👁️", word: "眼睛" },
  { id: "toothbrush", picture: "🪥", word: "牙刷" },
  { id: "tiger", picture: "🐯", word: "老虎" },
  { id: "egg", picture: "🥚", word: "鸡蛋" },
  { id: "bicycle", picture: "🚲", word: "自行车" },
  { id: "cloud", picture: "☁️", word: "云" },
  { id: "teddy", picture: "🧸", word: "泰迪熊" },
  { id: "hat", picture: "🧢", word: "帽子" },
  { id: "ear", picture: "👂", word: "耳朵" },
  { id: "soap", picture: "🧼", word: "肥皂" },
  { id: "lion", picture: "🦁", word: "狮子" },
  { id: "pear", picture: "🍐", word: "梨" },
  { id: "ambulance", picture: "🚑", word: "救护车" },
  { id: "snowflake", picture: "❄️", word: "雪花" },
  { id: "kite", picture: "🪁", word: "风筝" },
  { id: "tshirt", picture: "👕", word: "短袖衫" },
  { id: "nose", picture: "👃", word: "鼻子" },
  { id: "sponge", picture: "🧽", word: "海绵" },
  { id: "monkey", picture: "🐵", word: "猴子" },
  { id: "peach", picture: "🍑", word: "桃子" },
  { id: "fireengine", picture: "🚒", word: "消防车" },
  { id: "mountain", picture: "⛰️", word: "山" },
  { id: "yoyo", picture: "🪀", word: "悠悠球" },
  { id: "trousers", picture: "👖", word: "裤子" },
  { id: "mouth", picture: "👄", word: "嘴巴" },
  { id: "broom", picture: "🧹", word: "扫帚" },
  { id: "pig", picture: "🐷", word: "猪" },
  { id: "cherries", picture: "🍒", word: "樱桃" },
  { id: "policecar", picture: "🚓", word: "警车" },
  { id: "shell", picture: "🐚", word: "贝壳" },
  { id: "puzzle", picture: "🧩", word: "拼图" },
  { id: "dress", picture: "👗", word: "裙子" },
  { id: "hand", picture: "✋", word: "手" },
  { id: "basket", picture: "🧺", word: "篮子" },
  { id: "cow", picture: "🐮", word: "牛" },
  { id: "pineapple", picture: "🍍", word: "菠萝" },
  { id: "taxi", picture: "🚕", word: "出租车" },
  { id: "leaf", picture: "🍁", word: "枫叶" },
  { id: "socks", picture: "🧦", word: "袜子" },
  { id: "foot", picture: "🦶", word: "脚" },
  { id: "chair", picture: "🪑", word: "椅子" },
  { id: "horse", picture: "🐴", word: "马" },
  { id: "lemon", picture: "🍋", word: "柠檬" },
  { id: "helicopter", picture: "🚁", word: "直升机" },
  { id: "gloves", picture: "🧤", word: "手套" },
  { id: "tooth", picture: "🦷", word: "牙齿" },
  { id: "bed", picture: "🛏️", word: "床" },
  { id: "sheep", picture: "🐑", word: "绵羊" },
  { id: "orange", picture: "🍊", word: "橘子" },
  { id: "sailboat", picture: "⛵", word: "帆船" },
  { id: "scarf", picture: "🧣", word: "围巾" },
  { id: "door", picture: "🚪", word: "门" },
  { id: "chicken", picture: "🐔", word: "鸡" },
  { id: "mango", picture: "🥭", word: "芒果" },
  { id: "truck", picture: "🚚", word: "货车" },
  { id: "coat", picture: "🧥", word: "外套" },
  { id: "key", picture: "🔑", word: "钥匙" },
  { id: "duck", picture: "🦆", word: "鸭子" },
  { id: "kiwi", picture: "🥝", word: "猕猴桃" },
  { id: "backpack", picture: "🎒", word: "书包" },
  { id: "spoon", picture: "🥄", word: "勺子" },
  { id: "chick", picture: "🐥", word: "小鸡" },
  { id: "coconut", picture: "🥥", word: "椰子" },
  { id: "bowl", picture: "🥣", word: "碗" },
  { id: "penguin", picture: "🐧", word: "企鹅" },
  { id: "tomato", picture: "🍅", word: "西红柿" },
  { id: "chopsticks", picture: "🥢", word: "筷子" },
  { id: "bird", picture: "🐦", word: "小鸟" },
  { id: "carrot", picture: "🥕", word: "胡萝卜" },
  { id: "scissors", picture: "✂️", word: "剪刀" },
  { id: "butterfly", picture: "🦋", word: "蝴蝶" },
  { id: "corn", picture: "🌽", word: "玉米" },
  { id: "book", picture: "📕", word: "书" },
  { id: "bee", picture: "🐝", word: "蜜蜂" },
  { id: "cucumber", picture: "🥒", word: "黄瓜" },
  { id: "ant", picture: "🐜", word: "蚂蚁" },
  { id: "potato", picture: "🥔", word: "土豆" },
  { id: "snail", picture: "🐌", word: "蜗牛" },
  { id: "eggplant", picture: "🍆", word: "茄子" },
  { id: "turtle", picture: "🐢", word: "乌龟" },
  { id: "broccoli", picture: "🥦", word: "西兰花" },
  { id: "frog", picture: "🐸", word: "青蛙" },
  { id: "mushroom", picture: "🍄", word: "蘑菇" },
  { id: "snake", picture: "🐍", word: "蛇" },
  { id: "peanut", picture: "🥜", word: "花生" },
  { id: "whale", picture: "🐳", word: "鲸鱼" },
  { id: "rice", picture: "🍚", word: "米饭" },
  { id: "dolphin", picture: "🐬", word: "海豚" },
  { id: "noodles", picture: "🍜", word: "面条" },
  { id: "octopus", picture: "🐙", word: "章鱼" },
  { id: "dumpling", picture: "🥟", word: "饺子" },
  { id: "crab", picture: "🦀", word: "螃蟹" },
  { id: "cookie", picture: "🍪", word: "饼干" },
  { id: "giraffe", picture: "🦒", word: "长颈鹿" },
  { id: "cake", picture: "🎂", word: "生日蛋糕" },
  { id: "zebra", picture: "🦓", word: "斑马" },
  { id: "icecream", picture: "🍦", word: "冰淇淋" },
  { id: "hedgehog", picture: "🦔", word: "刺猬" },
  { id: "candy", picture: "🍬", word: "糖果" },
  { id: "bat", picture: "🦇", word: "蝙蝠" },
  { id: "milk", picture: "🥛", word: "牛奶" },
  { id: "crocodile", picture: "🐊", word: "鳄鱼" },
  { id: "pizza", picture: "🍕", word: "披萨" },
  { id: "burger", picture: "🍔", word: "汉堡" },
] as const;
export const PRESCHOOL_STAGES = [
  { rows: 2, cols: 2, pairs: 2, levels: 10, poolSize: 20 },
  { rows: 2, cols: 3, pairs: 3, levels: 15, poolSize: 50 },
  { rows: 3, cols: 4, pairs: 6, levels: 20, poolSize: 90 },
  { rows: 4, cols: 4, pairs: 8, levels: 20, poolSize: 130 },
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
// Build once in course order. Least-recently-seen review is a fair queue:
// new words enter at the back; reviewed words move to the back. Ties use ID order
// in the content table, never randomness or the user's browsing/session history.
const LEVEL_CONTENT = (() => {
  const lastSeen: number[] = [];
  let turn = 0;
  return PRESCHOOL_STAGES.map((config) => Array.from({ length: config.levels }, () => {
    const introduced = lastSeen.length;
    const review = Array.from({ length: introduced }, (_, i) => i)
      .sort((a, b) => lastSeen[a] - lastSeen[b] || a - b)
      .slice(0, config.pairs - 2);
    const selected = [introduced, introduced + 1, ...review];
    for (const index of selected) lastSeen[index] = turn;
    turn++;
    return selected.map((i) => PRESCHOOL_CONTENT[i].id);
  }));
})();
export function preschoolDeck(stage: number, level: number): MemoryState {
  // Only card positions are shuffled. The content combination is fixed above.
  return newGame(LEVEL_CONTENT[stage - 1][level - 1]);
}
export interface PreschoolSession { stage: number; level: number; state: MemoryState }
export const PRESCHOOL_SESSION: SessionSpec<PreschoolSession> = {
  version: 3,
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
      if (!LEVEL_CONTENT[s.stage - 1][s.level - 1].some((id) => id === face)) return false;
      const pair = g.cards.filter((c) => c.face === face);
      return pair.length === 2 && pair[0].matched === pair[1].matched;
    })) return false;
    return g.matchedPairs === g.cards.filter((c) => c.matched).length / 2;
  },
};
