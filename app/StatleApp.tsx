"use client";

import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { GuessResult, Outcome, Player, Puzzle, StoredState } from "@/lib/types";
import { compareGuess, isWinningGuess } from "@/lib/engine";
import { getPlayers, getPuzzleByIssue, getTodayPuzzle } from "@/lib/puzzles";
import { bumpHistogram, loadStoredState, saveStoredState } from "@/lib/storage";
import { TradingCard } from "@/components/TradingCard";
import { ShareCard } from "@/components/ShareCard";

type GuessRow = {
  guess: Player;
  results: GuessResult[];
};

function clampGuesses(gs: Player[]): Player[] {
  return gs.slice(0, 6);
}

function computeRows(guesses: Player[], target: Player): GuessRow[] {
  return guesses.map((guess) => ({ guess, results: compareGuess(guess, target) }));
}

function uiFullName(p: Player): string {
  return `${p.first} ${p.last}`.replace(/\s+/g, " ").trim();
}

export default function StatleApp() {
  const params = useSearchParams();
  const issueParam = params.get("p");

  const puzzle: Puzzle = useMemo(() => {
    const issue = issueParam ? Number(issueParam) : NaN;
    if (Number.isFinite(issue)) {
      return getPuzzleByIssue(issue) ?? getTodayPuzzle();
    }
    return getTodayPuzzle();
  }, [issueParam]);

  const players = useMemo(() => getPlayers(), []);

  const [stored, setStored] = useState<StoredState>(() => loadStoredState());
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [activeTab, setActiveTab] = useState<"card" | "share">("share");
  const [edition, setEdition] = useState<"base" | "gold" | "holo">("base");
  const [shareBump, setShareBump] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const guesses = useMemo(() => stored.todaysGuesses ?? [], [stored.todaysGuesses]);
  const outcome: Outcome = stored.todaysOutcome ?? "playing";

  const rows = useMemo(() => computeRows(guesses, puzzle.target), [guesses, puzzle.target]);

  useEffect(() => {
    // rollover / archive stats when issue changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStored((prev) => {
      if (prev.lastPlayedIssue === puzzle.issueNo) return prev;

      const next = { ...prev, lastPlayedIssue: puzzle.issueNo, todaysGuesses: [], todaysOutcome: null };

      const prevOutcome = prev.todaysOutcome;
      if (prev.lastPlayedIssue && prevOutcome) {
        if (prevOutcome === "win") {
          const n = clampGuesses(prev.todaysGuesses ?? []).length as 1 | 2 | 3 | 4 | 5 | 6;
          next.totalSolved = (prev.totalSolved ?? 0) + 1;
          next.streak = (prev.streak ?? 0) + 1;
          next.bestStreak = Math.max(next.bestStreak ?? 0, next.streak);
          next.histogram = bumpHistogram(prev.histogram ?? next.histogram, n);
        } else {
          next.streak = 0;
          next.bestStreak = Math.max(prev.bestStreak ?? 0, prev.streak ?? 0);
          next.histogram = bumpHistogram(prev.histogram ?? next.histogram, "X");
        }
      } else if (prev.lastPlayedIssue) {
        // skipped day breaks streak
        next.streak = 0;
      }

      return next;
    });
  }, [puzzle.issueNo]);

  useEffect(() => {
    saveStoredState(stored);
  }, [stored]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const scored = players
      .map((p) => {
        const full = uiFullName(p).toLowerCase();
        const display = p.name.toLowerCase();
        const idx = full.indexOf(q);
        const idx2 = display.indexOf(q);
        const hit = idx !== -1 || idx2 !== -1;
        const score = hit ? Math.min(idx === -1 ? 999 : idx, idx2 === -1 ? 999 : idx2) : 9999;
        return { p, hit, score };
      })
      .filter((x) => x.hit)
      .sort((a, b) => a.score - b.score || a.p.last.localeCompare(b.p.last))
      .slice(0, 5)
      .map((x) => x.p);
    return scored;
  }, [players, query]);

  function submitGuess(player: Player) {
    if (outcome !== "playing") return;
    setStored((prev) => {
      const nextGuesses = clampGuesses([...(prev.todaysGuesses ?? []), player]);
      let nextOutcome: Outcome | null = "playing";
      if (isWinningGuess(player, puzzle.target)) nextOutcome = "win";
      else if (nextGuesses.length >= 6) nextOutcome = "loss";
      return { ...prev, todaysGuesses: nextGuesses, todaysOutcome: nextOutcome };
    });
    setQuery("");
    setHighlight(0);
    inputRef.current?.focus();
  }

  async function share() {
    // tap feedback (brief) before launching share sheet
    setShareBump(true);
    window.setTimeout(() => setShareBump(false), 180);
    await new Promise((r) => setTimeout(r, 120));
    const score = stored.todaysOutcome === "win" ? stored.todaysGuesses.length : 0;
    const used = stored.todaysGuesses.length;
    const outcomeParam = stored.todaysOutcome === "win" ? "win" : stored.todaysOutcome === "loss" ? "loss" : "playing";
    const url = `${window.location.origin}/?p=${puzzle.issueNo}`;
    const text = score
      ? `I solved Statle №${puzzle.issueNo} in ${score}/6.`
      : `Statle №${puzzle.issueNo} got me. Can you solve it?`;

    const imageUrl = `/api/share/${puzzle.date}?score=${encodeURIComponent(String(score))}&used=${encodeURIComponent(
      String(used),
    )}&outcome=${encodeURIComponent(outcomeParam)}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav: any = navigator;
    if (nav.share) {
      try {
        const blob = await fetch(imageUrl).then((r) => r.blob());
        const file = new File([blob], `statle-${puzzle.issueNo}.png`, { type: "image/png" });
        await nav.share({ text, url, files: [file] });
        return;
      } catch {
        // fall through
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
    } catch {
      // ignore
    }
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,107,53,0.04), transparent 60%)",
      }}
    >
      <div className="px-6">
        {outcome === "playing" ? (
          <GameScreen
            puzzle={puzzle}
            rows={rows}
            guessesMade={guesses.length}
            query={query}
            setQuery={setQuery}
            suggestions={suggestions}
            highlight={highlight}
            setHighlight={setHighlight}
            inputRef={inputRef}
            onSubmitGuess={submitGuess}
          />
        ) : (
          <ResultScreen
            puzzle={puzzle}
            rows={rows}
            outcome={outcome}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            edition={edition}
            setEdition={setEdition}
            onShare={share}
            shareBump={shareBump}
          />
        )}
      </div>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="text-[18px] font-bold tracking-[-0.04em]">
      statle<span className="text-[--accent]">.</span>
    </div>
  );
}

function Masthead({ guessesMade }: { guessesMade: number }) {
  return (
    <div className="sticky top-0 z-30 bg-[--bg]">
      <div className="h-[56px] flex items-center justify-between">
        <Wordmark />
        <div className="flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full"
              style={{ background: i < guessesMade ? "var(--fg)" : "var(--hairline)" }}
            />
          ))}
        </div>
      </div>
      <div className="h-px w-full bg-[--hairline]" />
    </div>
  );
}

function StatHero({ puzzle }: { puzzle: Puzzle }) {
  const t = puzzle.target;
  const [anim, setAnim] = useState(() => ({
    ppg: 0,
    rpg: 0,
    apg: 0,
    fg: 0,
    tp: 0,
  }));

  useEffect(() => {
    const start = performance.now();
    const dur = 600;
    const from = { ppg: 0, rpg: 0, apg: 0, fg: 0, tp: 0 };
    const to = { ppg: t.stats.ppg, rpg: t.stats.rpg, apg: t.stats.apg, fg: t.stats.fg, tp: t.stats.tp };
    let raf = 0;
    const tick = (now: number) => {
      const x = Math.min(1, (now - start) / dur);
      const ease = 1 - Math.pow(1 - x, 3);
      setAnim({
        ppg: from.ppg + (to.ppg - from.ppg) * ease,
        rpg: from.rpg + (to.rpg - from.rpg) * ease,
        apg: from.apg + (to.apg - from.apg) * ease,
        fg: from.fg + (to.fg - from.fg) * ease,
        tp: from.tp + (to.tp - from.tp) * ease,
      });
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.issueNo]);

  return (
    <div className="py-8">
      <div className="text-[11px] font-semibold tracking-[0.16em] text-[--fg-faint]">
        {puzzle.season} SEASON
      </div>

      <div className="mt-3 mono font-medium tracking-[-0.02em] leading-[1.05] text-[52px] sm:text-[72px]">
        <StatSlash value={anim.ppg.toFixed(1)} />
        <span className="opacity-40"> / </span>
        <StatSlash value={anim.rpg.toFixed(1)} />
        <span className="opacity-40"> / </span>
        <StatSlash value={anim.apg.toFixed(1)} />
        <span className="opacity-40"> / </span>
        <StatSlash value={anim.fg.toFixed(1)} suffix="%" />
        <span className="opacity-40"> / </span>
        <StatSlash value={anim.tp.toFixed(1)} suffix="%" />
      </div>

      <div className="mt-3 grid grid-cols-5 text-[10px] font-semibold tracking-[0.16em] text-[--fg-faint]">
        {["PPG", "RPG", "APG", "FG%", "3P%"].map((x) => (
          <div key={x} className="text-center">
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatSlash({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <span>
      {value}
      {suffix ? <span className="opacity-40">{suffix}</span> : null}
    </span>
  );
}

function Divider() {
  return <div className="h-px w-full bg-[--hairline]" />;
}

function Counter({ guessesMade }: { guessesMade: number }) {
  const left = Math.max(0, 6 - guessesMade);
  return (
    <div className="py-4 text-[12px] text-[--fg-dim]">
      {guessesMade} of 6 · <span className="text-[--accent]">{left} left</span>
    </div>
  );
}

function GuessRowView({ row, animate, pulse }: { row: GuessRow; animate: boolean; pulse: boolean }) {
  const p = row.guess;
  return (
    <div
      className="rounded-[12px] bg-[--surface] p-4"
      style={{
        animation: animate ? "rowSlideV2 200ms cubic-bezier(0.2,0.8,0.2,1) both" : undefined,
        ...(pulse ? { animation: "winPulse 400ms ease-in-out both" } : null),
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[14px] font-semibold">{uiFullName(p)}</div>
        <div className="mono text-[11px] text-[--fg-faint]">{p.teamCode}</div>
      </div>
      <div className="mt-1 mono text-[11px] text-[--fg-faint]">
        {p.teamCode} · {p.position} · {p.height || "—"} · {p.draft || "—"}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {row.results.map((r, i) => (
          <ResultCell key={r.cat} r={r} delayMs={i * 80} animate={animate} />
        ))}
      </div>
    </div>
  );
}

function ResultCell({ r, delayMs, animate }: { r: GuessResult; delayMs: number; animate: boolean }) {
  const icon = r.cat === "draft" && r.status === "miss" && r.dir ? (r.dir === "up" ? "↑" : "↓") : r.status === "hit" ? "✓" : "✗";
  return (
    <div
      className="h-[44px] rounded-[8px] flex items-center justify-center"
      style={{
        background: r.status === "hit" ? "var(--hit)" : "var(--miss)",
        animation: animate ? "cellFlipV2 280ms cubic-bezier(0.2,0.8,0.2,1) both" : undefined,
        animationDelay: animate ? `${delayMs}ms` : undefined,
        transformOrigin: "50% 50%",
      }}
      title={`${r.cat}: ${r.value}`}
    >
      <div className="flex flex-col items-center leading-none">
        <div className="text-[14px] font-bold text-black/90">{icon}</div>
        <div className="mono text-[11px] font-bold tracking-[0.16em] text-black/80">{r.value}</div>
      </div>
    </div>
  );
}

function InputBar({
  query,
  setQuery,
  suggestions,
  highlight,
  setHighlight,
  inputRef,
  onSubmitGuess,
}: {
  query: string;
  setQuery: (v: string) => void;
  suggestions: Player[];
  highlight: number;
  setHighlight: (n: number) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  onSubmitGuess: (p: Player) => void;
}) {
  const open = query.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="sticky top-[56px] z-20 bg-[--bg] pt-4 pb-4">
      <div className="relative">
        {open ? (
          <div className="absolute left-0 right-0 -top-2 -translate-y-full rounded-[8px] overflow-hidden bg-[--surface] shadow-lg">
            {suggestions.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSubmitGuess(p)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[--surface-2] focus:bg-[--surface-2] focus:outline-none"
                style={{ background: i === highlight ? "var(--surface-2)" : "var(--surface)" }}
              >
                <div className="text-[15px]">{uiFullName(p)}</div>
                <div className="mono text-[11px] text-[--fg-faint]">
                  {p.teamCode} · {p.position}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (open) onSubmitGuess(suggestions[highlight]!);
              return;
            }
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((highlight + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((highlight - 1 + suggestions.length) % suggestions.length);
            }
          }}
          placeholder="Search players"
          className="w-full h-[56px] rounded-[8px] bg-[--surface] px-4 text-[16px] placeholder:text-[--fg-dim] focus:outline-none focus:ring-2 focus:ring-[--accent-soft]"
        />
      </div>
    </div>
  );
}

function GameScreen({
  puzzle,
  rows,
  guessesMade,
  query,
  setQuery,
  suggestions,
  highlight,
  setHighlight,
  inputRef,
  onSubmitGuess,
}: {
  puzzle: Puzzle;
  rows: GuessRow[];
  guessesMade: number;
  query: string;
  setQuery: (v: string) => void;
  suggestions: Player[];
  highlight: number;
  setHighlight: (n: number) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  onSubmitGuess: (p: Player) => void;
}) {
  return (
    <div>
      <Masthead guessesMade={guessesMade} />
      <StatHero puzzle={puzzle} />
      <Divider />
      <InputBar
        query={query}
        setQuery={setQuery}
        suggestions={suggestions}
        highlight={highlight}
        setHighlight={setHighlight}
        inputRef={inputRef}
        onSubmitGuess={onSubmitGuess}
      />
      <div className="pt-2">
        <Counter guessesMade={guessesMade} />
        <div className="flex flex-col gap-3 pb-10">
          {rows.map((row, i) => {
            const isLast = i === rows.length - 1;
            const isWinRow = isLast && isWinningGuess(row.guess, puzzle.target);
            return (
              <GuessRowView
                key={`${row.guess.id}-${i}`}
                row={row}
                animate={isLast}
                pulse={isWinRow}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ResultScreen({
  puzzle,
  rows,
  outcome,
  activeTab,
  setActiveTab,
  edition,
  setEdition,
  onShare,
  shareBump,
}: {
  puzzle: Puzzle;
  rows: GuessRow[];
  outcome: Outcome;
  activeTab: "card" | "share";
  setActiveTab: (t: "card" | "share") => void;
  edition: "base" | "gold" | "holo";
  setEdition: (e: "base" | "gold" | "holo") => void;
  onShare: () => void;
  shareBump: boolean;
}) {
  const solvedIn = outcome === "win" ? rows.length : null;
  return (
    <div>
      <Masthead guessesMade={rows.length} />

      <div className="pt-8 pb-6" style={{ animation: "fadeUp 200ms ease-out both" }}>
        <div className="text-[56px] leading-[0.95] font-bold tracking-[-0.04em] uppercase">
          {outcome === "win" ? (
            <>
              SOLVED IN {solvedIn}
              <span className="text-[--accent]">.</span>
            </>
          ) : (
            <>OUT OF GUESSES</>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {(["card", "share"] as const).map((t) => {
          const selected = activeTab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className="flex-1 h-[44px] rounded-[8px] bg-[--surface] text-[14px] font-semibold"
              style={{
                background: selected ? "var(--fg)" : "var(--surface)",
                color: selected ? "var(--bg)" : "var(--fg-dim)",
              }}
            >
              {t === "card" ? "Card" : "Share"}
            </button>
          );
        })}
      </div>

      {activeTab === "card" ? (
        <div className="mt-4 flex gap-2">
          {(["base", "gold", "holo"] as const).map((e) => {
            const selected = edition === e;
            const label = e === "base" ? "Standard" : e[0]!.toUpperCase() + e.slice(1);
            return (
              <button
                key={e}
                type="button"
                onClick={() => setEdition(e)}
                className="flex-1 h-[36px] rounded-[8px] bg-[--surface] text-[13px] font-semibold"
                style={{
                  background: selected ? "var(--fg)" : "var(--surface)",
                  color: selected ? "var(--bg)" : "var(--fg-dim)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6 flex justify-center">
        <div style={{ transform: shareBump ? "scale(1.02)" : "scale(1)", filter: shareBump ? "brightness(1.04)" : "none", transition: "transform 180ms ease, filter 180ms ease" }}>
          {activeTab === "card" ? (
            <TradingCard puzzle={puzzle} guessesUsed={rows.length} outcome={outcome} edition={edition} />
          ) : (
            <ShareCard puzzle={puzzle} guessesUsed={rows.length} outcome={outcome} />
          )}
        </div>
      </div>

      <div className="h-[84px]" />

      <div className="fixed bottom-0 left-0 right-0 flex justify-center bg-[--bg]">
        <div className="w-full max-w-[440px] px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={onShare}
            className="w-full h-[56px] rounded-[8px] bg-[--accent] text-[--bg] font-bold text-[14px] tracking-[-0.01em]"
          >
            {activeTab === "card" ? "Save card" : "Share"}
          </button>
          <div className="mt-2 text-[12px] text-[--fg-faint]">Next puzzle in —</div>
        </div>
      </div>
    </div>
  );
}

