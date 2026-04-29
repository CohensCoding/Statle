import type { Outcome, Puzzle } from "@/lib/types";
import { formatIssueDate } from "@/lib/puzzles";

export function ShareCard({
  puzzle,
  guessesUsed,
  outcome,
}: {
  puzzle: Puzzle;
  guessesUsed: number;
  outcome: Outcome;
}) {
  const t = puzzle.target;
  const score = outcome === "win" ? guessesUsed : 0;
  const dateLabel = formatIssueDate(puzzle.date);

  return (
    <div
      className="relative w-[320px] h-[320px] rounded-[18px] overflow-hidden"
      style={{ background: "var(--card)", color: "var(--cardInk)" }}
    >
      {/* grain */}
      <svg className="absolute inset-0" width="320" height="320" aria-hidden="true">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.18" />
          </feComponentTransfer>
        </filter>
        <rect width="320" height="320" filter="url(#grain)" opacity="0.6" />
      </svg>

      <div className="relative p-5 flex flex-col h-full">
        <div className="flex items-baseline justify-between">
          <div className="font-[var(--font-display)] italic tracking-[-0.03em] text-[18px] text-[--color-cardAccent]">
            Statle
          </div>
          <div className="font-[var(--font-ui)] text-[10px] tracking-[0.24em] text-[rgba(242,237,227,0.72)]">
            №{puzzle.issueNo} · {dateLabel}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="font-[var(--font-ui)] text-[10px] tracking-[0.26em] text-[rgba(242,237,227,0.68)]">
            SEASON STAT LINE · {puzzle.season}
          </div>
          <div className="mt-3 tabular-nums font-[var(--font-display)] tracking-[-0.05em] text-[64px] leading-none">
            {t.stats.ppg.toFixed(1)} / {t.stats.rpg.toFixed(1)} / {t.stats.apg.toFixed(1)}
          </div>
          <div className="mt-2 flex gap-6">
            {["PPG", "RPG", "APG"].map((x) => (
              <div
                key={x}
                className="font-[var(--font-ui)] text-[9px] tracking-[0.24em] text-[rgba(242,237,227,0.62)]"
              >
                {x}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="font-[var(--font-ui)] text-[10px] tracking-[0.24em] text-[rgba(242,237,227,0.7)]">
              SOLVED IN
            </div>
            <div className="tabular-nums font-[var(--font-display)] tracking-[-0.03em] text-[20px]">
              {score ? `${score}/6` : "X/6"}
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 6 }).map((_, i) => {
              const hit = outcome === "win" && i < guessesUsed;
              return (
                <div
                  key={i}
                  className="h-3 w-3 rounded-[4px] border"
                  style={{
                    background: hit ? "var(--hit)" : "var(--miss)",
                    borderColor: "rgba(0,0,0,0.35)",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

