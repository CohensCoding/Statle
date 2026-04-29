import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

type PlayersRow = {
  personId: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  school?: string;
  country?: string;
  heightInches?: string;
  jersey?: string;
  draftYear?: string;
  draftNumber?: string;
  fromYear?: string;
  toYear?: string;
};

type PerGameRow = {
  season: string; // end year, e.g. "2026"
  lg: string;
  player: string;
  age: string;
  team: string;
  pos: string;
  g: string;
  pts_per_game: string;
  trb_per_game: string;
  ast_per_game: string;
  fg_percent: string;
  x3p_percent: string;
};

function readCsv<T extends Record<string, string>>(absPath: string): T[] {
  const raw = fs.readFileSync(absPath, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true }) as T[];
}

function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toInt(x: string | undefined): number {
  const n = Number.parseInt(String(x ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function toFloat(x: string | undefined): number {
  const n = Number.parseFloat(String(x ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function seasonLabel(endYear: number): string {
  const start = endYear - 1;
  return `${start}-${String(endYear).slice(-2)}`;
}

function heightLabel(inches: number): string {
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${inch}"`;
}

function addDaysISO(startIso: string, days: number): string {
  const [y, m, d] = startIso.split("-").map((v) => Number(v));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const RAW = ROOT; // raw CSVs live in repo root
const OUT_DIR = path.resolve(import.meta.dirname, "..", "data");

const LAUNCH_DATE = process.env.STATLE_LAUNCH_DATE ?? "2026-04-29";
const MAX_PUZZLES = Number(process.env.STATLE_PUZZLES ?? "730"); // 2 years

const playersCsv = path.join(RAW, "Players.csv");
const perGameCsv = path.join(RAW, "Player Per Game.csv");

const players = readCsv<PlayersRow>(playersCsv);
const perGame = readCsv<PerGameRow>(perGameCsv).filter((r) => r.lg === "NBA");

const byName = new Map<string, PlayersRow>();
for (const p of players) {
  const full = normName(`${p.firstName} ${p.lastName}`);
  if (!byName.has(full)) byName.set(full, p);
}

type SeasonLine = {
  personId: string;
  first: string;
  last: string;
  age: number;
  teamCode: string;
  pos: string;
  seasonEnd: number;
  g: number;
  ppg: number;
  rpg: number;
  apg: number;
  fgPct: number; // 0-1
  tpPct: number; // 0-1
  draft: number;
  draftPick?: number;
  heightIn: number;
  college?: string;
  nationality?: string;
  jersey: number;
  seasons: number;
};

const eligible: SeasonLine[] = [];

for (const r of perGame) {
  const full = normName(r.player);
  const p = byName.get(full);
  if (!p) continue;

  const seasonEnd = toInt(r.season);
  const g = toInt(r.g);
  const ppg = toFloat(r.pts_per_game);
  if (g < 50) continue;
  if (ppg < 18) continue;

  const fromYear = toInt(p.fromYear);
  const toYear = toInt(p.toYear);
  const seasons = fromYear && toYear ? Math.max(0, toYear - fromYear + 1) : 0;
  if (seasons && seasons < 3) continue;

  eligible.push({
    personId: String(p.personId),
    first: p.firstName,
    last: p.lastName,
    age: toInt(r.age),
    teamCode: r.team,
    pos: r.pos,
    seasonEnd,
    g,
    ppg,
    rpg: toFloat(r.trb_per_game),
    apg: toFloat(r.ast_per_game),
    fgPct: r.fg_percent === "NA" ? 0 : toFloat(r.fg_percent),
    tpPct: r.x3p_percent === "NA" ? 0 : toFloat(r.x3p_percent),
    draft: toInt(p.draftYear),
    draftPick: p.draftNumber ? toInt(p.draftNumber) : undefined,
    heightIn: toInt(p.heightInches),
    college: p.school || undefined,
    nationality: p.country || undefined,
    jersey: toInt(p.jersey),
    seasons,
  });
}

eligible.sort((a, b) => {
  if (a.seasonEnd !== b.seasonEnd) return b.seasonEnd - a.seasonEnd; // newer first
  if (a.ppg !== b.ppg) return b.ppg - a.ppg;
  return a.personId.localeCompare(b.personId);
});

// Build representative player pool: use the newest eligible season as the player's base stats.
const repById = new Map<string, SeasonLine>();
for (const line of eligible) {
  if (!repById.has(line.personId)) repById.set(line.personId, line);
}

function simplifyPos(pos: string): "G" | "F" | "C" {
  const p = pos.toUpperCase();
  if (p.includes("C")) return "C";
  if (p.includes("F")) return "F";
  if (p.includes("G")) return "G";
  // basketball-ref style
  if (p === "PF" || p === "SF") return "F";
  if (p === "PG" || p === "SG") return "G";
  return "F";
}

// Lazy-import to avoid bundling TS types into this script.
// (We keep the output schema aligned with web/lib/types.ts.)
function teamMeta(teamCode: string) {
  // minimal inline fallback; app has richer mapping in lib/teams.ts
  const code = teamCode.trim().toUpperCase();
  const isEast =
    ["ATL", "BOS", "BRK", "BKN", "CHA", "CHO", "CHI", "CLE", "DET", "IND", "MIA", "MIL", "NYK", "ORL", "PHI", "TOR", "WAS"].includes(
      code,
    );
  return {
    team: code,
    teamCode: code,
    teamColor: "#3b342a",
    teamColor2: "#f2ede3",
    conference: (isEast ? "East" : "West") as "East" | "West",
    division: (isEast ? "Atlantic" : "Pacific") as "Atlantic" | "Pacific",
  };
}

const playersOut = Array.from(repById.values()).map((p) => {
  const initials = `${p.first[0] ?? ""}${p.last[0] ?? ""}`.toUpperCase();
  const display = `${p.first[0] ?? ""}. ${p.last}`.trim();
  const team = teamMeta(p.teamCode);
  return {
    id: p.personId,
    name: display,
    first: p.first,
    last: p.last,
    initials,
    number: p.jersey || 0,
    team: team.team,
    teamCode: team.teamCode,
    teamColor: team.teamColor,
    teamColor2: team.teamColor2,
    conference: team.conference,
    division: team.division,
    position: simplifyPos(p.pos),
    height: p.heightIn ? heightLabel(p.heightIn) : "",
    heightIn: p.heightIn,
    age: p.age,
    draft: p.draft,
    draftPick: p.draftPick,
    college: p.college,
    nationality: p.nationality,
    seasons: p.seasons || undefined,
    stats: {
      ppg: Math.round(p.ppg * 10) / 10,
      rpg: Math.round(p.rpg * 10) / 10,
      apg: Math.round(p.apg * 10) / 10,
      fg: Math.round(p.fgPct * 1000) / 10,
      tp: Math.round(p.tpPct * 1000) / 10,
    },
    tagline: undefined,
  };
});

// Deterministic puzzle queue: newest-first eligible lines, then repeat.
const puzzlesOut = eligible.slice(0, Math.max(MAX_PUZZLES, 365)).map((line, idx) => {
  const base = repById.get(line.personId)!;
  const initials = `${line.first[0] ?? ""}${line.last[0] ?? ""}`.toUpperCase();
  const display = `${line.first[0] ?? ""}. ${line.last}`.trim();
  const team = teamMeta(line.teamCode);
  const issueNo = idx + 1;
  const date = addDaysISO(LAUNCH_DATE, idx);

  return {
    date,
    issueNo,
    season: seasonLabel(line.seasonEnd),
    target: {
      id: line.personId,
      name: display,
      first: line.first,
      last: line.last,
      initials,
      number: line.jersey || 0,
      team: team.team,
      teamCode: team.teamCode,
      teamColor: team.teamColor,
      teamColor2: team.teamColor2,
      conference: team.conference,
      division: team.division,
      position: simplifyPos(line.pos),
      height: line.heightIn ? heightLabel(line.heightIn) : "",
      heightIn: line.heightIn,
      age: line.age,
      draft: line.draft,
      draftPick: line.draftPick,
      college: line.college,
      nationality: line.nationality,
      seasons: line.seasons || undefined,
      stats: {
        ppg: Math.round(line.ppg * 10) / 10,
        rpg: Math.round(line.rpg * 10) / 10,
        apg: Math.round(line.apg * 10) / 10,
        fg: Math.round(line.fgPct * 1000) / 10,
        tp: Math.round(line.tpPct * 1000) / 10,
      },
      tagline: undefined,
    },
  };
});

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "players.json"), JSON.stringify(playersOut, null, 2));
fs.writeFileSync(path.join(OUT_DIR, "puzzles.json"), JSON.stringify(puzzlesOut, null, 2));

console.log(`Wrote ${playersOut.length} players -> ${path.relative(process.cwd(), path.join(OUT_DIR, "players.json"))}`);
console.log(`Wrote ${puzzlesOut.length} puzzles -> ${path.relative(process.cwd(), path.join(OUT_DIR, "puzzles.json"))}`);

