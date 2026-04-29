export type Conference = "East" | "West";

export type Division =
  | "Atlantic"
  | "Central"
  | "Southeast"
  | "Northwest"
  | "Pacific"
  | "Southwest";

export type Position = "G" | "F" | "C";

export type Player = {
  id: string;
  name: string; // display string
  first: string;
  last: string;
  initials: string;
  number: number;
  team: string;
  teamCode: string;
  teamColor: string;
  teamColor2: string;
  conference: Conference;
  division: Division;
  position: Position;
  height: string;
  heightIn: number;
  age: number;
  draft: number;
  draftPick?: number;
  college?: string;
  nationality?: string;
  seasons?: number;
  stats: {
    ppg: number;
    rpg: number;
    apg: number;
    fg: number; // percent, 0-100
    tp: number; // percent, 0-100
  };
  accolades?: string[];
  tagline?: string;
};

export type Puzzle = {
  date: string; // YYYY-MM-DD
  issueNo: number;
  season: string; // e.g. "2014-15"
  target: Player;
};

export type GuessCat = "team" | "conference" | "division" | "position" | "draft";

export type GuessResult = {
  cat: GuessCat;
  label: string;
  value: string;
  status: "hit" | "miss";
  dir?: "up" | "down";
};

export type Outcome = "playing" | "win" | "loss";

export type HistogramKey = 1 | 2 | 3 | 4 | 5 | 6 | "X";

export type StoredState = {
  lastPlayedIssue: number;
  todaysGuesses: Player[];
  todaysOutcome: Outcome | null;
  streak: number;
  bestStreak: number;
  totalSolved: number;
  histogram: Record<HistogramKey, number>;
};

