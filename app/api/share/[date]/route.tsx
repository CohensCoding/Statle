import { ImageResponse } from "next/og";
import puzzles from "@/data/puzzles.json";
import type { Puzzle } from "@/lib/types";

export const runtime = "edge";

const geistSans = fetch(
  new URL("../../../../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff2", import.meta.url),
).then((r) => r.arrayBuffer());
const geistSansBold = fetch(
  new URL("../../../../node_modules/geist/dist/fonts/geist-sans/Geist-Bold.woff2", import.meta.url),
).then((r) => r.arrayBuffer());
const geistMono = fetch(
  new URL("../../../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Medium.woff2", import.meta.url),
).then((r) => r.arrayBuffer());

function findPuzzle(dateIso: string): Puzzle | null {
  const p = (puzzles as unknown as Puzzle[]).find((x) => x.date === dateIso);
  return p ?? null;
}

export async function GET(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const puzzle = findPuzzle(date);
  if (!puzzle) return new Response("Not found", { status: 404 });

  const t = puzzle.target;
  const url = new URL(req.url);
  const scoreParam = url.searchParams.get("score");
  const score = scoreParam ? Number(scoreParam) : 0;
  const solvedIn = Number.isFinite(score) && score >= 1 && score <= 6 ? Math.floor(score) : 0;
  const usedParam = url.searchParams.get("used");
  const usedRaw = usedParam ? Number(usedParam) : 0;
  const used = Number.isFinite(usedRaw) ? Math.max(0, Math.min(6, Math.floor(usedRaw))) : 0;
  const outcomeParam = url.searchParams.get("outcome");
  const outcome = outcomeParam === "win" || outcomeParam === "loss" ? outcomeParam : "win";

  const [gs, gsb, gm] = await Promise.all([geistSans, geistSansBold, geistMono]);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          background: "#0E0E10",
          color: "#EDEAE4",
          borderRadius: 0,
          padding: 48,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            top: 24,
            bottom: 24,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: "GeistSans", fontWeight: 700, fontSize: 32, letterSpacing: "-0.04em" }}>
            statle<span style={{ color: "#FF6B35" }}>.</span>
          </div>
          <div style={{ fontFamily: "GeistMono", fontSize: 16, opacity: 0.32 }}>№ {puzzle.issueNo}</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontFamily: "GeistSans", fontSize: 14, fontWeight: 600, letterSpacing: "0.16em", opacity: 0.32 }}>
            {puzzle.season} SEASON
          </div>

          <div
            style={{
              marginTop: 40,
              fontFamily: "GeistMono",
              fontSize: 144,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            <span>{t.stats.ppg.toFixed(1)}</span>
            <span style={{ opacity: 0.4 }}> / </span>
            <span>{t.stats.rpg.toFixed(1)}</span>
            <span style={{ opacity: 0.4 }}> / </span>
            <span>{t.stats.apg.toFixed(1)}</span>
          </div>

          <div style={{ marginTop: 22, display: "flex", justifyContent: "center", gap: 90 }}>
            {["PPG", "RPG", "APG"].map((x) => (
              <div key={x} style={{ fontFamily: "GeistSans", fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", opacity: 0.32 }}>
                {x}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "GeistSans", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
            SOLVED {outcome === "win" ? `${solvedIn}/6` : "X/6"}
            <span style={{ color: "#FF6B35" }}>.</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 16px)", gap: 4 }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const isUsed = i < (outcome === "win" ? solvedIn : used);
              const fill =
                outcome === "win"
                  ? isUsed
                    ? "#4ADE80"
                    : "rgba(255,255,255,0.08)"
                  : isUsed
                    ? "#EF4444"
                    : "rgba(255,255,255,0.08)";
              return <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: fill }} />;
            })}
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600",
      },
      fonts: [
        { name: "GeistSans", data: gs, weight: 400, style: "normal" },
        { name: "GeistSans", data: gsb, weight: 700, style: "normal" },
        { name: "GeistMono", data: gm, weight: 500, style: "normal" },
      ],
    },
  );
}

