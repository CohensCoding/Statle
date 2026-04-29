"use client";

import type { HistogramKey, StoredState } from "@/lib/types";

const STORAGE_KEY = "statle:v1";

export function defaultStoredState(): StoredState {
  return {
    lastPlayedIssue: 0,
    todaysGuesses: [],
    todaysOutcome: null,
    streak: 0,
    bestStreak: 0,
    totalSolved: 0,
    histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, X: 0 },
  };
}

export function loadStoredState(): StoredState {
  if (typeof window === "undefined") return defaultStoredState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStoredState();
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      ...defaultStoredState(),
      ...parsed,
      histogram: { ...defaultStoredState().histogram, ...(parsed.histogram ?? {}) },
      todaysGuesses: Array.isArray(parsed.todaysGuesses) ? parsed.todaysGuesses : [],
    };
  } catch {
    return defaultStoredState();
  }
}

export function saveStoredState(state: StoredState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore (private mode / quota)
  }
}

export function bumpHistogram(hist: StoredState["histogram"], key: HistogramKey): StoredState["histogram"] {
  return { ...hist, [key]: (hist[key] ?? 0) + 1 };
}

