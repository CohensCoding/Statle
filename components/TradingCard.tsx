import type { Outcome, Puzzle } from "@/lib/types";

function editionLabel(e: "base" | "gold" | "holo"): string {
  if (e === "gold") return "Gold Edition";
  if (e === "holo") return "Holo Edition";
  return "Standard Edition";
}

export function TradingCard({
  puzzle,
  guessesUsed,
  outcome,
  edition,
}: {
  puzzle: Puzzle;
  guessesUsed: number;
  outcome: Outcome;
  edition: "base" | "gold" | "holo";
}) {
  const p = puzzle.target;
  const solvedIn = outcome === "win" ? guessesUsed : 0;

  return (
    <div
      className="relative w-[320px] h-[460px] rounded-[18px] overflow-hidden border border-[rgba(242,237,227,0.12)]"
      style={{ background: "var(--card)", color: "var(--cardInk)" }}
    >
      {edition === "gold" ? (
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(80% 60% at 30% 20%, rgba(216,157,62,0.22) 0%, rgba(15,12,7,0) 70%)",
          }}
        />
      ) : null}
      {edition === "holo" ? (
        <div
          className="absolute inset-0 mix-blend-soft-light opacity-45"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 50%, rgba(216,157,62,0.9), rgba(92,203,255,0.85), rgba(195,109,255,0.85), rgba(216,157,62,0.9))",
          }}
        />
      ) : null}

      {/* shimmer sweep */}
      {edition === "holo" ? (
        <div
          className="absolute -left-1/2 top-0 h-full w-1/2 opacity-0"
          style={{
            background: "linear-gradient(90deg, rgba(242,237,227,0) 0%, rgba(242,237,227,0.22) 50%, rgba(242,237,227,0) 100%)",
            animation: "cardShimmer 2.6s ease-in-out infinite",
          }}
        />
      ) : null}

      <div className="relative p-5 h-full flex flex-col">
        <div className="absolute right-4 top-2 tabular-nums font-[var(--font-display)] tracking-[-0.04em] text-[240px] leading-none opacity-[0.08] text-[--color-cardAccent]">
          {p.number ? String(p.number) : "0"}
        </div>

        <div className="relative">
          <div className="font-[var(--font-ui)] text-[10px] tracking-[0.26em] text-[rgba(242,237,227,0.7)]">
            {p.teamCode} · {p.position} · {p.height || "—"} · №{p.number || 0}
          </div>
          <div className="mt-3 font-[var(--font-display)] tracking-[-0.05em] text-[44px] leading-[0.95]">
            <div>{p.first}</div>
            <div className="italic">{p.last}</div>
          </div>
          <div className="mt-3 font-[var(--font-display)] italic tracking-[-0.02em] text-[16px] text-[rgba(242,237,227,0.75)]">
            {p.tagline ?? "A season line worth remembering."}
          </div>
        </div>

        <div className="mt-5 h-px bg-[rgba(216,157,62,0.35)]" />

        <div className="mt-5 grid grid-cols-4 gap-3 tabular-nums">
          <StatSmall label="PPG" value={p.stats.ppg.toFixed(1)} />
          <StatSmall label="RPG" value={p.stats.rpg.toFixed(1)} />
          <StatSmall label="APG" value={p.stats.apg.toFixed(1)} />
          <StatSmall label="FG%" value={`${p.stats.fg.toFixed(1)}%`} />
        </div>

        <div className="mt-6 flex-1" />

        <div className="flex items-center justify-between">
          <div className="font-[var(--font-ui)] text-[10px] tracking-[0.24em] text-[rgba(242,237,227,0.72)]">
            SOLVED IN {solvedIn ? `${solvedIn}/6` : "X/6"} · {editionLabel(edition)}
          </div>
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 6 }).map((_, i) => {
              const used = outcome === "win" && i < guessesUsed;
              return (
                <div
                  key={i}
                  className="h-3 w-3 rounded-[4px] border"
                  style={{
                    background: used ? "var(--hit)" : "rgba(242,237,227,0.14)",
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

function StatSmall({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <div className="font-[var(--font-ui)] text-[10px] tracking-[0.24em] text-[rgba(242,237,227,0.7)]">{label}</div>
      <div className="mt-1 font-[var(--font-display)] tracking-[-0.04em] text-[38px] leading-none">{value}</div>
    </div>
  );
}

