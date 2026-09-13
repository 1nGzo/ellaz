import { useEffect, useRef, useState } from "react";
import type { GameContext } from "@sdk/index";
import { GameChrome } from "@ui/GameChrome";
import { Button } from "@ui/components";
import { useGameSession, useRememberedLevel, winMoment } from "@shared/index";
import { burst, haptic } from "@juice/index";
import { flip, isWon, resolveMismatch, settle } from "./logic";
import { PRESCHOOL_CONTENT, PRESCHOOL_LEVELS, PRESCHOOL_SESSION, preschoolDeck, type PreschoolLevel } from "./preschool";

export function PreschoolMemory({ ctx }: { ctx: GameContext }) {
  const chinese = ctx.contentLocale === "zh-CN";
  const [level, setLevel] = useRememberedLevel(ctx, ["two", "three"] as const, "two");
  const [state, setState] = useState(() => {
    const saved = ctx.session.load(PRESCHOOL_SESSION);
    return saved?.level === level && !isWon(saved.state) ? saved.state : preschoolDeck(level);
  });
  const live = useRef(state);
  live.current = state;
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const paid = useRef(false);
  const grid = useRef<HTMLDivElement>(null);
  const [voice, setVoice] = useState(() => ctx.speech.available(ctx.contentLocale));
  const [lastWord, setLastWord] = useState("点一张图片，再找它的朋友。");
  const won = isWon(state);
  useGameSession(ctx, PRESCHOOL_SESSION, () => ({ level, state: settle(state) }), { live: !won });
  useEffect(() => {
    ctx.lifecycle.gameplayStart();
    ctx.analytics.levelStart(`preschool-${level}`);
    const off = ctx.speech.onAvailabilityChange(setVoice);
    return () => { off(); clearTimeout(timer.current); ctx.speech.cancel(); };
  }, [ctx]);

  function say(word: string) {
    if (!chinese) return;
    setLastWord(word);
    ctx.speech.unlock();
    void ctx.speech.speak(word, { locale: "zh-CN", rate: 0.8 });
  }
  function reset(next: PreschoolLevel = level) {
    clearTimeout(timer.current);
    ctx.speech.cancel();
    setLevel(next);
    const fresh = preschoolDeck(next);
    live.current = fresh;
    setState(fresh);
    paid.current = false;
    ctx.analytics.levelStart(`preschool-${next}`);
  }
  function onCard(index: number) {
    ctx.audio.unlock();
    const before = live.current;
    const card = before.cards[index];
    const item = PRESCHOOL_CONTENT.find((c) => c.id === card.face)!;
    // Face-up and matched cards remain tappable to repeat the word.
    if (card.flipped || card.matched) { say(item.word); return; }
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
        winMoment(ctx, { reason: "level_complete", tier: "easy", level: `preschool-${level}`,
          at, score: { value: next.moves, unit: "moves", board: level } });
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
      { icon: "moves", label: ctx.t("moves"), value: state.moves },
    ]}
    levels={[...PRESCHOOL_LEVELS]} level={level} onLevel={reset} onRestart={() => reset()}
    footer={<div style={{ display: "grid", gap: 8, textAlign: "center" }}>
      {chinese && <>
        <span>找朋友：🐱 ↔ 猫 · 🍎 ↔ 苹果</span>
        <Button kids onClick={() => say(lastWord)} ariaLabel="再听一次">🔊 再听一次</Button>
        {!voice && <small>此设备暂无普通话语音，可以看小图片找朋友。</small>}
      </>}
      {won && <Button kids onClick={() => reset()}>{ctx.t("youWon")} · {chinese ? "再玩一次" : "↻"}</Button>}
    </div>}>
    <div ref={grid} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12,
      width: "min(80vw, 48vh, 360px)" }}>
      {state.cards.map((card, index) => {
        const item = PRESCHOOL_CONTENT.find((c) => c.id === card.face)!;
        const wordCard = chinese && state.cards.findIndex((c) => c.face === card.face) !== index;
        const up = card.flipped || card.matched;
        return <button key={card.id} type="button" onClick={() => onCard(index)}
          aria-label={up ? (chinese ? item.word : item.picture) : (chinese ? "翻牌" : "❓")}
          style={{ aspectRatio: "1", minHeight: 64, border: "none", borderRadius: 16,
            fontSize: "clamp(28px, 7vw, 46px)", fontFamily: "inherit", color: "#222",
            boxShadow: "var(--shadow-1)", cursor: "pointer",
            background: up ? (card.matched ? "#55efc4" : "#fff") : "linear-gradient(180deg,var(--brand-2),var(--brand))" }}>
          {up ? wordCard ? <><small style={{ display: "block", fontSize: 24 }}>{item.picture}</small>{item.word}</> : item.picture : "❓"}
        </button>;
      })}
    </div>
  </GameChrome>;
}
