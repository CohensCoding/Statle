import type { Outcome, Puzzle } from "@/lib/types";

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
      className="relative w-[320px] h-[460px] rounded-[12px] overflow-hidden"
      style={{ background: "var(--surface)", color: "var(--fg)", border: "1px solid var(--hairline)" }}
    >
      {/* edition treatments */}
      {edition === "gold" ? (
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(80% 60% at 0% 0%, rgba(216,157,62,0.16) 0%, rgba(0,0,0,0) 65%)",
          }}
        />
      ) : null}
      {edition === "holo" ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 50%, rgba(255,107,53,0.12), rgba(92,203,255,0.10), rgba(195,109,255,0.10), rgba(255,107,53,0.12))",
            mixBlendMode: "soft-light",
            opacity: 0.18,
            animation: "spin 8s linear infinite",
          }}
        />
      ) : null}

      <div className="relative p-5 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="text-[16px] font-bold tracking-[-0.04em]">
            statle<span style={{ color: "var(--accent)" }}>.</span>
          </div>
          <div className="mono text-[14px] text-[--fg-dim]">
            {solvedIn ? `${solvedIn}/6` : "X/6"}
            <span style={{ color: "var(--accent)" }}>.</span>
          </div>
        </div>

        <div className="mt-3 h-px bg-[--hairline]" />

        <div className="mt-8 flex items-center justify-center">
          <div
            className="h-[120px] w-[120px] rounded-full"
            style={{
              background: "rgba(255,255,255,0.06)",
              boxShadow: "0 0 0 1px var(--hairline) inset",
            }}
          />
        </div>

        <div className="mt-6 text-center">
          <div className="text-[32px] font-bold tracking-[-0.04em] uppercase">{p.first}</div>
          <div className="text-[32px] font-bold tracking-[-0.04em] uppercase">{p.last}</div>
          <div className="mt-3 mono text-[11px] font-medium tracking-[0.16em] text-[--fg-dim] uppercase">
            {p.teamCode} · {p.position} · {p.height || "—"}
          </div>
        </div>

        <div className="mt-8 h-px bg-[--hairline]" />

        <div className="mt-6 grid grid-cols-4 gap-6">
          <StatCell label="PPG" value={p.stats.ppg.toFixed(1)} />
          <StatCell label="RPG" value={p.stats.rpg.toFixed(1)} />
          <StatCell label="APG" value={p.stats.apg.toFixed(1)} />
          <StatCell label="FG%" value={p.stats.fg.toFixed(1)} />
        </div>

        <div className="mt-auto pt-6 flex items-center justify-between">
          <div className="mono text-[11px] text-[--fg-dim] tracking-[0.16em] uppercase">
            {Array.from({ length: 6 }).map((_, i) => (outcome === "win" && i < guessesUsed ? "▓" : "░")).join("")}
          </div>
          <div className="mono text-[11px] text-[--fg-dim] tracking-[0.16em] uppercase">
            {edition === "gold" ? "GOLD EDITION" : edition === "holo" ? "HOLO EDITION" : "STANDARD EDITION"}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="mono text-[28px] font-medium tracking-[-0.02em] leading-none">{value}</div>
      <div className="mt-2 text-[10px] font-semibold tracking-[0.16em] text-[--fg-faint] uppercase">{label}</div>
    </div>
  );
}

