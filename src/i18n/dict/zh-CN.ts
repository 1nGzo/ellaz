import type { StringKey } from "./he";

// Round 2: shared runtime controls only. Unauthored keys resolve through English.
export const zhCN = {
  appName: "Ellaz", tagline: "人人都能玩的游戏", play: "开始游戏", back: "返回",
  restart: "重新开始", score: "得分", best: "最佳成绩", time: "时间",
  youWon: "你赢了！", gameOver: "游戏结束", loading: "加载中…", sound: "声音",
  pause: "暂停", resume: "继续", language: "语言", rotateHint: "请旋转设备",
  allGames: "所有游戏", forKids: "儿童", learn: "学习", think: "思考", speed: "速度",
  create: "创作", classics: "经典", allCategories: "全部", keepPlaying: "继续玩",
  enterWorld: "进入", worldInvite: "玩游戏赚金币", noStarsYet: "尚未玩过",
  starsEarned: "颗星", starEarnedOne: "颗星", gameMissing: "找不到这个游戏",
  gameLoadFailed: "游戏加载失败", tryAgain: "重试", moves: "步数", pairs: "配对",
  installHint: "添加到主屏幕，离线也能玩", world: "我的世界", boards: "排行榜",
  coins: "金币", stars: "星星", dailyPuzzle: "每日挑战", dailyDone: "今日已完成",
  reportHome: "反馈问题", difficulty: "难度",
} satisfies Partial<Record<StringKey, string>>;
