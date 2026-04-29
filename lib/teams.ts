import type { Conference, Division } from "@/lib/types";

export type TeamInfo = {
  code: string; // e.g. "LAL"
  name: string; // e.g. "Los Angeles Lakers"
  conference: Conference;
  division: Division;
  color: string;
  color2: string;
};

// No logos/marks; used only for text + subtle accents.
export const TEAMS: Record<string, TeamInfo> = {
  ATL: { code: "ATL", name: "Atlanta Hawks", conference: "East", division: "Southeast", color: "#C8102E", color2: "#FDB927" },
  BOS: { code: "BOS", name: "Boston Celtics", conference: "East", division: "Atlantic", color: "#007A33", color2: "#BA9653" },
  BRK: { code: "BRK", name: "Brooklyn Nets", conference: "East", division: "Atlantic", color: "#000000", color2: "#FFFFFF" },
  BKN: { code: "BKN", name: "Brooklyn Nets", conference: "East", division: "Atlantic", color: "#000000", color2: "#FFFFFF" },
  CHA: { code: "CHA", name: "Charlotte Hornets", conference: "East", division: "Southeast", color: "#1D1160", color2: "#00788C" },
  CHO: { code: "CHO", name: "Charlotte Hornets", conference: "East", division: "Southeast", color: "#1D1160", color2: "#00788C" },
  CHI: { code: "CHI", name: "Chicago Bulls", conference: "East", division: "Central", color: "#CE1141", color2: "#000000" },
  CLE: { code: "CLE", name: "Cleveland Cavaliers", conference: "East", division: "Central", color: "#6F263D", color2: "#FFB81C" },
  DAL: { code: "DAL", name: "Dallas Mavericks", conference: "West", division: "Southwest", color: "#00538C", color2: "#B8C4CA" },
  DEN: { code: "DEN", name: "Denver Nuggets", conference: "West", division: "Northwest", color: "#0E2240", color2: "#FEC524" },
  DET: { code: "DET", name: "Detroit Pistons", conference: "East", division: "Central", color: "#C8102E", color2: "#1D42BA" },
  GSW: { code: "GSW", name: "Golden State Warriors", conference: "West", division: "Pacific", color: "#1D428A", color2: "#FFC72C" },
  HOU: { code: "HOU", name: "Houston Rockets", conference: "West", division: "Southwest", color: "#CE1141", color2: "#C4CED4" },
  IND: { code: "IND", name: "Indiana Pacers", conference: "East", division: "Central", color: "#002D62", color2: "#FDBB30" },
  LAC: { code: "LAC", name: "Los Angeles Clippers", conference: "West", division: "Pacific", color: "#C8102E", color2: "#1D428A" },
  LAL: { code: "LAL", name: "Los Angeles Lakers", conference: "West", division: "Pacific", color: "#552583", color2: "#FDB927" },
  MEM: { code: "MEM", name: "Memphis Grizzlies", conference: "West", division: "Southwest", color: "#5D76A9", color2: "#12173F" },
  MIA: { code: "MIA", name: "Miami Heat", conference: "East", division: "Southeast", color: "#98002E", color2: "#F9A01B" },
  MIL: { code: "MIL", name: "Milwaukee Bucks", conference: "East", division: "Central", color: "#00471B", color2: "#EEE1C6" },
  MIN: { code: "MIN", name: "Minnesota Timberwolves", conference: "West", division: "Northwest", color: "#0C2340", color2: "#78BE20" },
  NOP: { code: "NOP", name: "New Orleans Pelicans", conference: "West", division: "Southwest", color: "#0C2340", color2: "#C8102E" },
  NOH: { code: "NOH", name: "New Orleans Hornets", conference: "West", division: "Southwest", color: "#00778B", color2: "#1D428A" },
  NYK: { code: "NYK", name: "New York Knicks", conference: "East", division: "Atlantic", color: "#006BB6", color2: "#F58426" },
  OKC: { code: "OKC", name: "Oklahoma City Thunder", conference: "West", division: "Northwest", color: "#007AC1", color2: "#EF3B24" },
  ORL: { code: "ORL", name: "Orlando Magic", conference: "East", division: "Southeast", color: "#0077C0", color2: "#C4CED4" },
  PHI: { code: "PHI", name: "Philadelphia 76ers", conference: "East", division: "Atlantic", color: "#006BB6", color2: "#ED174C" },
  PHO: { code: "PHO", name: "Phoenix Suns", conference: "West", division: "Pacific", color: "#1D1160", color2: "#E56020" },
  PHX: { code: "PHX", name: "Phoenix Suns", conference: "West", division: "Pacific", color: "#1D1160", color2: "#E56020" },
  POR: { code: "POR", name: "Portland Trail Blazers", conference: "West", division: "Northwest", color: "#E03A3E", color2: "#000000" },
  SAC: { code: "SAC", name: "Sacramento Kings", conference: "West", division: "Pacific", color: "#5A2D81", color2: "#63727A" },
  SAS: { code: "SAS", name: "San Antonio Spurs", conference: "West", division: "Southwest", color: "#C4CED4", color2: "#000000" },
  TOR: { code: "TOR", name: "Toronto Raptors", conference: "East", division: "Atlantic", color: "#CE1141", color2: "#000000" },
  UTA: { code: "UTA", name: "Utah Jazz", conference: "West", division: "Northwest", color: "#002B5C", color2: "#F9A01B" },
  WAS: { code: "WAS", name: "Washington Wizards", conference: "East", division: "Southeast", color: "#002B5C", color2: "#E31837" },
};

export const UNKNOWN_TEAM: TeamInfo = {
  code: "UNK",
  name: "Unknown",
  conference: "East",
  division: "Atlantic",
  color: "#3b342a",
  color2: "#f2ede3",
};

export function teamInfo(code: string | null | undefined): TeamInfo {
  if (!code) return UNKNOWN_TEAM;
  const t = TEAMS[code];
  if (t) return t;
  // common variants
  const norm = code.trim().toUpperCase();
  return TEAMS[norm] ?? UNKNOWN_TEAM;
}

