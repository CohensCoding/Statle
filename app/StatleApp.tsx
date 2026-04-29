"use client";

import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { GuessResult, Outcome, Player, Puzzle, StoredState } from "@/lib/types";
import { compareGuess, isWinningGuess } from "@/lib/engine";
import { formatIssueDate, getPlayers, getPuzzleByIssue, getTodayPuzzle } from "@/lib/puzzles";
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

  const inputRef = useRef<HTMLInputElement | null>(null);

  const guesses = stored.todaysGuesses ?? [];
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
    const score = stored.todaysOutcome === "win" ? stored.todaysGuesses.length : 0;
    const url = `${window.location.origin}/?p=${puzzle.issueNo}`;
    const text = score
      ? `I solved Statle №${puzzle.issueNo} in ${score}/6.`
      : `Statle №${puzzle.issueNo} got me. Can you solve it?`;

    const imageUrl = `/api/share/${puzzle.date}?score=${encodeURIComponent(String(score))}`;

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
    <div className="flex-1 flex flex-col items-center px-4 py-8 sm:py-10">
      <div className="w-full max-w-[420px]">
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
          />
        )}
      </div>
    </div>
  );
}

function Masthead({ puzzle, guessesMade }: { puzzle: Puzzle; guessesMade: number }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <div className="font-[var(--font-display)] italic tracking-[-0.03em] text-[22px] leading-none">
          Statle
        </div>
        <div className="font-[var(--font-ui)] text-[11px] tracking-[0.22em] text-[--color-ink2]">
          №{puzzle.issueNo} · {formatIssueDate(puzzle.date)}
        </div>
      </div>
      <div className="flex gap-1.5 pt-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-2.5 w-2.5 rounded-full border border-[--color-ruleSoft]"
            style={{ background: i < guessesMade ? "var(--ink)" : "transparent" }}
          />
        ))}
      </div>
    </div>
  );
}

function MysteryHero({ puzzle }: { puzzle: Puzzle }) {
  const t = puzzle.target;
  return (
    <div className="mt-5 rounded-[18px] overflow-hidden border border-[--color-ruleSoft]">
      <div
        className="relative p-5"
        style={{
          background: "linear-gradient(180deg, #1a1410 0%, #0a0805 100%)",
          color: "var(--cardInk)",
        }}
      >
        <div className="flex items-baseline justify-between">
          <div className="font-[var(--font-ui)] text-[11px] tracking-[0.24em] text-[rgba(242,237,227,0.78)]">
            SEASON STAT LINE
          </div>
          <div className="font-[var(--font-ui)] text-[11px] tracking-[0.24em] text-[rgba(242,237,227,0.78)]">
            {puzzle.season}
          </div>
        </div>

        <div className="mt-4 tabular-nums font-[var(--font-display)] tracking-[-0.04em]">
          <div className="flex items-end justify-between gap-3">
            <StatBig value={t.stats.ppg} label="PPG" />
            <StatBig value={t.stats.rpg} label="RPG" />
            <StatBig value={t.stats.apg} label="APG" />
            <StatBig value={t.stats.fg} label="FG%" />
            <StatBig value={t.stats.tp} label="3P%" />
          </div>
        </div>

        <div className="mt-5 h-px bg-[rgba(242,237,227,0.18)]" />

        <div className="mt-5 flex items-center gap-4">
          <div className="h-[64px] w-[52px] rounded-md bg-[rgba(242,237,227,0.08)] border border-[rgba(242,237,227,0.18)]" />
          <div className="flex flex-col">
            <div className="font-[var(--font-display)] italic text-[18px] tracking-[-0.02em]">Locked.</div>
            <div className="font-[var(--font-ui)] text-[11px] tracking-[0.22em] text-[rgba(242,237,227,0.75)]">
              UNLOCK WITH 6 GUESSES
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBig({ value, label }: { value: number; label: string }) {
  const fmt =
    label.endsWith("%") ? `${value.toFixed(1)}%` : value >= 10 ? value.toFixed(1) : value.toFixed(1);
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <div className="text-[22px] leading-none">{fmt}</div>
      <div className="mt-1 font-[var(--font-ui)] text-[10px] tracking-[0.22em] text-[rgba(242,237,227,0.7)]">
        {label}
      </div>
    </div>
  );
}

function SectionHeader({ guessesMade }: { guessesMade: number }) {
  const left = Math.max(0, 6 - guessesMade);
  return (
    <div className="mt-6 flex items-baseline justify-between">
      <div className="font-[var(--font-ui)] text-[11px] tracking-[0.24em] text-[--color-ink2]">YOUR GUESSES</div>
      <div className="font-[var(--font-ui)] text-[11px] tracking-[0.2em] text-[--color-ink2]">
        {guessesMade} of 6 · <span className="text-[--color-accent]">{left}</span> left
      </div>
    </div>
  );
}

function GuessRowView({ idx, row }: { idx: number; row: GuessRow }) {
  return (
    <div
      className="mt-3 rounded-[14px] border border-[--color-ruleSoft] bg-[--color-paper] overflow-hidden"
      style={{ animation: "rowSlideV2 220ms ease-out both" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[--color-ruleSoft]">
        <div className="font-[var(--font-display)] tracking-[-0.03em] text-[18px]">
          {uiFullName(row.guess)}
        </div>
        <div className="flex items-baseline gap-2 tabular-nums">
          <div className="font-[var(--font-display)] tracking-[-0.03em] text-[18px]">{row.guess.stats.ppg.toFixed(1)}</div>
          <div className="font-[var(--font-ui)] text-[11px] tracking-[0.22em] text-[--color-ink2]">#{idx + 1}</div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 px-4 py-3">
        {row.results.map((r, i) => (
          <div
            key={r.cat}
            className="h-[46px] rounded-[10px] flex flex-col items-center justify-center border"
            style={{
              background: r.status === "hit" ? "var(--hit)" : "var(--miss)",
              borderColor: "rgba(0,0,0,0.18)",
              animation: "cellFlipV2 300ms ease-out both",
              animationDelay: `${i * 45}ms`,
              transformOrigin: "50% 50%",
            }}
          >
            <div className="font-[var(--font-ui)] text-[10px] tracking-[0.22em] text-[rgba(242,237,227,0.85)]">
              {r.label}
            </div>
            <div className="font-[var(--font-display)] tabular-nums tracking-[-0.03em] text-[15px] text-[--color-cardInk]">
              {r.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyRow() {
  return (
    <div className="mt-3 rounded-[14px] border border-dashed border-[--color-ruleSoft] bg-[--color-paper] px-4 py-5">
      <div className="font-[var(--font-display)] italic tracking-[-0.02em] text-[16px] text-[--color-ink2]">
        Make your next guess…
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
    <div className="mt-4">
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={(e) => {
              if (!open) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((highlight + 1) % suggestions.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((highlight - 1 + suggestions.length) % suggestions.length);
              } else if (e.key === "Enter") {
                e.preventDefault();
                onSubmitGuess(suggestions[highlight]!);
              }
            }}
            placeholder="Enter a player…"
            className="w-full h-[54px] rounded-[14px] border border-[--color-ruleSoft] bg-[--color-paper] px-4 font-[var(--font-display)] italic tracking-[-0.02em] text-[16px] placeholder:text-[--color-ink2]/70 focus:outline-none focus:ring-2 focus:ring-[--color-accent]/30"
          />
          {open ? (
            <div className="absolute left-0 right-0 mt-2 rounded-[14px] border border-[--color-ruleSoft] bg-[--color-paper] shadow-sm overflow-hidden z-20">
              {suggestions.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSubmitGuess(p)}
                  className="w-full text-left px-4 py-3 border-b last:border-b-0 border-[--color-ruleSoft] hover:bg-[--color-paper2] focus:bg-[--color-paper2] focus:outline-none"
                  style={{ background: i === highlight ? "var(--paper2)" : "var(--paper)" }}
                >
                  <div className="font-[var(--font-display)] tracking-[-0.03em] text-[16px]">{uiFullName(p)}</div>
                  <div className="mt-1 font-[var(--font-ui)] text-[10px] tracking-[0.22em] text-[--color-ink2]">
                    {p.teamCode} · {p.position}
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            if (suggestions[0]) onSubmitGuess(suggestions[highlight] ?? suggestions[0]);
          }}
          className="h-[54px] px-5 rounded-[14px] bg-[--color-accent] text-[--color-paper] font-[var(--font-ui)] text-[12px] tracking-[0.22em] hover:bg-[--color-accent2] active:translate-y-px transition"
        >
          GUESS
        </button>
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
      <Masthead puzzle={puzzle} guessesMade={guessesMade} />
      <MysteryHero puzzle={puzzle} />
      <SectionHeader guessesMade={guessesMade} />
      <div className="mt-1">
        {rows.map((row, i) => (
          <GuessRowView key={`${row.guess.id}-${i}`} idx={i} row={row} />
        ))}
        {guessesMade < 6 ? <EmptyRow /> : null}
      </div>
      <InputBar
        query={query}
        setQuery={setQuery}
        suggestions={suggestions}
        highlight={highlight}
        setHighlight={setHighlight}
        inputRef={inputRef}
        onSubmitGuess={onSubmitGuess}
      />
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
}: {
  puzzle: Puzzle;
  rows: GuessRow[];
  outcome: Outcome;
  activeTab: "card" | "share";
  setActiveTab: (t: "card" | "share") => void;
  edition: "base" | "gold" | "holo";
  setEdition: (e: "base" | "gold" | "holo") => void;
  onShare: () => void;
}) {
  const solvedIn = outcome === "win" ? rows.length : null;
  return (
    <div>
      <Masthead puzzle={puzzle} guessesMade={rows.length} />

      <div className="mt-6">
        <div className="font-[var(--font-ui)] text-[11px] tracking-[0.24em] text-[--color-accent]">
          {outcome === "win" ? "CASE CLOSED" : "STREAK BROKEN"}
        </div>
        <div className="mt-1 font-[var(--font-display)] tracking-[-0.04em] text-[34px] leading-[1.05]">
          {outcome === "win" ? (
            <>
              Solved in <span className="italic">{solvedIn}.</span>
            </>
          ) : (
            <>
              It was <span className="italic">{puzzle.target.last}.</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("card")}
          className="flex-1 rounded-[14px] border border-[--color-ruleSoft] px-4 py-3 text-left"
          style={{
            background: activeTab === "card" ? "var(--ink)" : "var(--paper)",
            color: activeTab === "card" ? "var(--paper)" : "var(--ink)",
          }}
        >
          <div className="font-[var(--font-ui)] text-[11px] tracking-[0.24em]">CARD</div>
          <div className="mt-1 font-[var(--font-ui)] text-[10px] tracking-[0.22em] opacity-80">private</div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("share")}
          className="flex-1 rounded-[14px] border border-[--color-ruleSoft] px-4 py-3 text-left"
          style={{
            background: activeTab === "share" ? "var(--ink)" : "var(--paper)",
            color: activeTab === "share" ? "var(--paper)" : "var(--ink)",
          }}
        >
          <div className="font-[var(--font-ui)] text-[11px] tracking-[0.24em]">SHARE</div>
          <div className="mt-1 font-[var(--font-ui)] text-[10px] tracking-[0.22em] opacity-80">spoiler-free</div>
        </button>
      </div>

      <div className="mt-4 rounded-[18px] border border-[--color-ruleSoft] bg-[--color-paper2] p-5 flex justify-center">
        {activeTab === "card" ? (
          <TradingCard puzzle={puzzle} guessesUsed={rows.length} outcome={outcome} edition={edition} />
        ) : (
          <ShareCard puzzle={puzzle} guessesUsed={rows.length} outcome={outcome} />
        )}
      </div>

      {activeTab === "card" ? (
        <div className="mt-4 flex items-center justify-between">
          <div className="font-[var(--font-ui)] text-[11px] tracking-[0.22em] text-[--color-ink2]">EDITION</div>
          <div className="flex gap-2">
            {(["base", "gold", "holo"] as const).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEdition(e)}
                className="px-3 py-2 rounded-[12px] border border-[--color-ruleSoft] font-[var(--font-ui)] text-[11px] tracking-[0.2em]"
                style={{ background: edition === e ? "var(--paper2)" : "var(--paper)" }}
              >
                {e.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onShare}
        className="mt-5 w-full h-[54px] rounded-[14px] bg-[--color-accent] text-[--color-paper] font-[var(--font-ui)] text-[12px] tracking-[0.22em] hover:bg-[--color-accent2] active:translate-y-px transition"
      >
        {activeTab === "card" ? "SHARE" : "POST THE RIDDLE"}
      </button>
    </div>
  );
}

