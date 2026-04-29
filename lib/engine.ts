import type { GuessResult, Player } from "@/lib/types";

// Direct port of v2 compare logic with one fix:
// winning requires BOTH all categories hit AND correct player name.
export function compareGuess(guess: Player, target: Player): GuessResult[] {
  const cats = ["team", "conference", "division", "position", "draft"] as const;

  return cats.map((cat) => {
    if (cat === "draft") {
      const exact = guess.draft === target.draft;
      const dir =
        guess.draft < target.draft
          ? "down"
          : guess.draft > target.draft
            ? "up"
            : undefined;
      return {
        cat,
        label: "DRAFT",
        value: String(guess.draft),
        status: exact ? "hit" : "miss",
        dir: exact ? undefined : dir,
      };
    }

    if (cat === "position") {
      const exact = guess.position === target.position;
      return { cat, label: "POS", value: guess.position, status: exact ? "hit" : "miss" };
    }

    const labelMap = { team: "TEAM", conference: "CONF", division: "DIV" } as const;
    const exact = guess[cat] === target[cat];
    return {
      cat,
      label: labelMap[cat],
      value: String(guess[cat]),
      status: exact ? "hit" : "miss",
    };
  });
}

export function isWinningGuess(guess: Player, target: Player): boolean {
  if (guess.name !== target.name) return false;
  return compareGuess(guess, target).every((r) => r.status === "hit");
}

