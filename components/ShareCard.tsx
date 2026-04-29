import type { Outcome, Puzzle } from "@/lib/types";

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

  return (
    <div
      className="relative w-[320px] h-[320px] rounded-[12px] overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--hairline)" }}
    >
      <div className="absolute inset-6 pointer-events-none" style={{ border: "1px solid var(--hairline)", borderRadius: 10 }} />

      <div className="relative p-6 flex flex-col h-full">
        <div className="flex items-baseline justify-between">
          <div className="text-[20px] font-bold tracking-[-0.04em]">
            statle<span className="text-[--accent]">.</span>
          </div>
          <div className="mono text-[12px] text-[--fg-faint]">№ {puzzle.issueNo}</div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-[14px] font-semibold tracking-[0.16em] text-[--fg-faint] uppercase">
            {puzzle.season} SEASON
          </div>

          <div className="mt-5 mono font-medium tracking-[-0.02em] leading-none text-[48px]">
            <span>{t.stats.ppg.toFixed(1)}</span>
            <span className="opacity-40"> / </span>
            <span>{t.stats.rpg.toFixed(1)}</span>
            <span className="opacity-40"> / </span>
            <span>{t.stats.apg.toFixed(1)}</span>
          </div>

          <div className="mt-3 grid grid-cols-3 w-full text-[12px] font-semibold tracking-[0.16em] text-[--fg-faint] uppercase">
            {["PPG", "RPG", "APG"].map((x) => (
              <div key={x} className="text-center">
                {x}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[14px] font-bold tracking-[-0.02em]">
            SOLVED {score ? `${score}/6` : "X/6"}
            <span className="text-[--accent]">.</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 6 }).map((_, i) => {
              const used = i < guessesUsed;
              const fill =
                outcome === "win" ? (used ? "var(--hit)" : "var(--hairline)") : used ? "var(--miss)" : "var(--hairline)";
              return <div key={i} className="h-4 w-4 rounded-[4px]" style={{ background: fill }} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

