import { useEffect, useRef, useState } from "react";
import type { GameContext } from "@sdk/index";
import { GameChrome } from "@ui/GameChrome";
import { Button } from "@ui/components";
import { useGameSession, winMoment } from "@shared/index";
import { burst, haptic } from "@juice/index";
import { flip, isWon, resolveMismatch, settle } from "./logic";
import { PRESCHOOL_CONTENT, PRESCHOOL_STAGES, PRESCHOOL_SESSION, PRESCHOOL_PROGRESS_KEY, INITIAL_PROGRESS, validProgress, advanceProgress, preschoolDeck } from "./preschool";

export function PreschoolMemory({ ctx }: { ctx: GameContext }) {
  const chinese = ctx.contentLocale === "zh-CN";
  const [progress, setProgress] = useState(() => {
    const saved = ctx.storage.get<unknown>(PRESCHOOL_PROGRESS_KEY, null);
    return validProgress(saved) ? saved : INITIAL_PROGRESS;
  });
  const { stage, level } = progress;
  const config = PRESCHOOL_STAGES[stage - 1];
  const [state, setState] = useState(() => {
    const saved = ctx.session.load(PRESCHOOL_SESSION);
    return saved?.stage === stage && saved.level === level && !isWon(saved.state)
      ? saved.state : preschoolDeck(stage, level);
  });
  const [celebration, setCelebration] = useState(progress.completed ? (chinese ? "🎉 全部完成！" : "🎉 ✓") : "");
  const live = useRef(state);
  live.current = state;
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const paid = useRef(false);
  const grid = useRef<HTMLDivElement>(null);
  const [voice, setVoice] = useState(() => ctx.speech.available(ctx.contentLocale));
  const [lastWord, setLastWord] = useState("点一张图片，再找它的朋友。");
  const won = isWon(state);
  useGameSession(ctx, PRESCHOOL_SESSION, () => ({ stage, level, state: settle(live.current) }), { live: !won && !progress.completed });
  useEffect(() => {
    ctx.lifecycle.gameplayStart();
    ctx.analytics.levelStart(`preschool-${stage}-${level}`);
    const off = ctx.speech.onAvailabilityChange(setVoice);
    return () => { off(); clearTimeout(timer.current); ctx.speech.cancel(); };
  }, [ctx]);

  function say(word: string) {
    if (!chinese) return;
    setLastWord(word);
    ctx.speech.unlock();
    void ctx.speech.speak(word, { locale: "zh-CN", rate: 0.8 });
  }
  function reset() {
    clearTimeout(timer.current);
    ctx.speech.cancel();
    // After the full course, replay Stage 4 without relocking any earlier stage.
    const cursor = won && !progress.completed ? advanceProgress(progress) : progress;
    const next = cursor.completed ? { ...cursor, level: 1, completed: false } : cursor;
    ctx.storage.set(PRESCHOOL_PROGRESS_KEY, next);
    setProgress(next);
    const fresh = preschoolDeck(next.stage, next.level);
    live.current = fresh;
    setState(fresh);
    setCelebration("");
    paid.current = false;
    ctx.analytics.levelStart(`preschool-${next.stage}-${next.level}`);
  }
  function onCard(index: number) {
    ctx.audio.unlock();
    const before = live.current;
    const card = before.cards[index];
    const item = PRESCHOOL_CONTENT.find((c) => c.id === card.face)!;
    // Face-up and matched cards remain tappable to repeat the word.
    if (card.flipped || card.matched) { say(item.word); return; }
    if (progress.completed) return;
    setCelebration("");
    const { state: next, outcome } = flip(before, index);
    if (outcome.kind === "ignored") return;
    live.current = next;
    setState(next);
    say(item.word);
    if (outcome.kind === "matched") {
      ctx.audio.play("success");
      haptic.success();
      const r = grid.current?.getBoundingClientRect();
      const at = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined;
      if (at) burst(at.x, at.y, { count: 10 });
      if (isWon(next) && !paid.current) {
        paid.current = true;
        const nextProgress = advanceProgress(progress);
        // Commit the cursor before cosmetics. Old snapshots cannot restore a paid level.
        ctx.storage.set(PRESCHOOL_PROGRESS_KEY, nextProgress);
        ctx.session.clear();
        const stageEnd = level === config.levels;
        const message = nextProgress.completed ? "🎉 全部完成！" : stageEnd
          ? `🎉 第 ${stage} 阶段完成！🔓 第 ${nextProgress.stage} 阶段已解锁`
          : "🎉 找齐了！";
        setCelebration(chinese ? message : nextProgress.completed ? "🎉 ✓" : stageEnd ? `🎉 ${stage} ✓ · 🔓 ${nextProgress.stage}` : "🎉 ✓");
        winMoment(ctx, { reason: "level_complete", tier: "easy", level: `preschool-${stage}-${level}`,
          at, runEnded: false });
        // Short celebration, then continue automatically. This is not a gameplay clock.
        timer.current = setTimeout(() => {
          setProgress(nextProgress);
          if (!nextProgress.completed) {
            const fresh = preschoolDeck(nextProgress.stage, nextProgress.level);
            live.current = fresh;
            setState(fresh);
            paid.current = false;
            ctx.analytics.levelStart(`preschool-${nextProgress.stage}-${nextProgress.level}`);
          }
        }, stageEnd ? 3000 : 1600);
      }
    } else {
      ctx.audio.play("flip");
      haptic.tap();
      if (outcome.kind === "mismatch") {
        timer.current = setTimeout(() => {
          const settled = resolveMismatch(live.current, outcome.a, outcome.b);
          live.current = settled;
          setState(settled);
        }, 1400);
      }
    }
  }
  return <GameChrome ctx={ctx}
    stats={[
      { icon: "cards", label: ctx.t("pairs"), value: `${state.matchedPairs}/${state.totalPairs}`, ltr: true },
      { icon: "flag", label: chinese ? "阶段" : "🌱", value: `${stage} / 4`, ltr: true },
      { icon: "flag", label: chinese ? "关卡" : "🚩", value: `${level} / ${config.levels}`, ltr: true },
    ]}
    onRestart={reset}
    footer={<div style={{ display: "grid", gap: 8, textAlign: "center" }}>
      {chinese && <>
        <span>找朋友：🐱 ↔ 猫 · 🍎 ↔ 苹果</span>
        <Button kids onClick={() => say(lastWord)} ariaLabel="再听一次">🔊 再听一次</Button>
        {!voice && <small>此设备暂无普通话语音，可以看小图片找朋友。</small>}
      </>}
      {celebration && <strong role="status">{celebration}</strong>}
      {progress.completed && <Button kids onClick={reset}>{chinese ? "再玩第 4 阶段" : "↻ 4"}</Button>}
    </div>}>
    <div ref={grid} style={{ display: progress.completed ? "none" : "grid", gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`, gap: 12,
      width: "min(90vw, 56vh, 440px)", flexShrink: 0 }}>
      {state.cards.map((card, index) => {
        const item = PRESCHOOL_CONTENT.find((c) => c.id === card.face)!;
        const wordCard = chinese && state.cards.findIndex((c) => c.face === card.face) !== index;
        const up = card.flipped || card.matched;
        return <button key={card.id} type="button" onClick={() => onCard(index)}
          aria-label={up ? (chinese ? item.word : item.picture) : (chinese ? "翻牌" : "❓")}
          style={{ aspectRatio: "1", minHeight: 64, border: "none", borderRadius: 16,
            fontSize: "clamp(20px, 5vw, 32px)", padding: 2, overflowWrap: "anywhere", lineHeight: 1.1, fontFamily: "inherit", color: "#222",
            boxShadow: "var(--shadow-1)", cursor: "pointer",
            background: up ? (card.matched ? "#55efc4" : "#fff") : "linear-gradient(180deg,var(--brand-2),var(--brand))" }}>
          {up ? wordCard ? <><small style={{ display: "block", fontSize: 24 }}>{item.picture}</small>{item.word}</> : item.picture : "❓"}
        </button>;
      })}
    </div>
  </GameChrome>;
}
