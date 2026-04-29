import puzzles from "@/data/puzzles.json";
import players from "@/data/players.json";
import { daysSinceLaunch, isoDateLocal } from "@/lib/date";
import type { Player, Puzzle } from "@/lib/types";

export const LAUNCH_DATE_ISO = process.env.NEXT_PUBLIC_STATLE_LAUNCH_DATE ?? "2026-04-29";

export function getLaunchDate(): Date {
  const [y, m, d] = LAUNCH_DATE_ISO.split("-").map((v) => Number(v));
  return new Date(y, m - 1, d);
}

export function getTodayPuzzleIndex(): number {
  return daysSinceLaunch(getLaunchDate());
}

export function getPuzzleByIndex(idx: number): Puzzle {
  const i = ((idx % puzzles.length) + puzzles.length) % puzzles.length;
  return puzzles[i] as unknown as Puzzle;
}

export function getTodayPuzzle(): Puzzle {
  return getPuzzleByIndex(getTodayPuzzleIndex());
}

export function getPuzzleByIssue(issueNo: number): Puzzle | null {
  const found = (puzzles as unknown as Puzzle[]).find((p) => p.issueNo === issueNo);
  return found ?? null;
}

export function formatIssueDate(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
}

export function getPlayers(): Player[] {
  return players as unknown as Player[];
}

export function todayIso(): string {
  return isoDateLocal(new Date());
}

