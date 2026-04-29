import { ImageResponse } from "next/og";
import puzzles from "@/data/puzzles.json";
import type { Puzzle } from "@/lib/types";

export const runtime = "edge";

const interRegular = fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff2").then((r) =>
  r.arrayBuffer(),
);
const interSemi = fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.woff2").then((r) =>
  r.arrayBuffer(),
);
const frauncesRegular = fetch("https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-500-normal.woff2").then(
  (r) => r.arrayBuffer(),
);
const frauncesItalic = fetch("https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-500-italic.woff2").then(
  (r) => r.arrayBuffer(),
);

function formatDate(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function findPuzzle(dateIso: string): Puzzle | null {
  const p = (puzzles as unknown as Puzzle[]).find((x) => x.date === dateIso);
  return p ?? null;
}

export async function GET(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const puzzle = findPuzzle(date);
  if (!puzzle) return new Response("Not found", { status: 404 });

  const t = puzzle.target;
  const dateLabel = formatDate(puzzle.date);
  const url = new URL(req.url);
  const scoreParam = url.searchParams.get("score");
  const score = scoreParam ? Number(scoreParam) : 0;
  const solvedIn = Number.isFinite(score) && score >= 1 && score <= 6 ? Math.floor(score) : 0;

  const [interR, interS, frauR, frauI] = await Promise.all([interRegular, interSemi, frauncesRegular, frauncesItalic]);

  return new ImageResponse(
    (
      <div
        style={{
          width: 320,
          height: 320,
          background: "#0F0C07",
          color: "#F2EDE3",
          borderRadius: 18,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          width="320"
          height="320"
          viewBox="0 0 320 320"
          style={{ position: "absolute", inset: 0, opacity: 0.6 }}
        >
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.18" />
            </feComponentTransfer>
          </filter>
          <rect width="320" height="320" filter="url(#grain)" />
        </svg>

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 18, color: "#D89D3E" }}>Statle</div>
          <div style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.24em", opacity: 0.72 }}>
            №{puzzle.issueNo} · {dateLabel}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.26em", opacity: 0.68 }}>
            SEASON STAT LINE · {puzzle.season}
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: "Fraunces",
              fontSize: 64,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {t.stats.ppg.toFixed(1)} / {t.stats.rpg.toFixed(1)} / {t.stats.apg.toFixed(1)}
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 26 }}>
            {["PPG", "RPG", "APG"].map((x) => (
              <div key={x} style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.24em", opacity: 0.62 }}>
                {x}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.24em", opacity: 0.7 }}>SOLVED IN</div>
            <div style={{ fontFamily: "Fraunces", fontSize: 20, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
              {solvedIn ? `${solvedIn}/6` : "X/6"}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 12px)", gap: 4 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: solvedIn && i < solvedIn ? "#2F6B3F" : "#B83A22",
                  border: "1px solid rgba(0,0,0,0.35)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: 320,
      height: 320,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600",
      },
      fonts: [
        { name: "Inter", data: interR, weight: 400, style: "normal" },
        { name: "Inter", data: interS, weight: 600, style: "normal" },
        { name: "Fraunces", data: frauR, weight: 500, style: "normal" },
        { name: "Fraunces", data: frauI, weight: 500, style: "italic" },
      ],
    },
  );
}

