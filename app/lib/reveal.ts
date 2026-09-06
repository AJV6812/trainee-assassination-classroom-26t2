import { ROUNDS_PER_GAME } from "@/shared/types";
import type {
  Player,
  PlayerId,
  RoundReveal,
  RoundWinner,
  Vote,
} from "@/shared/types";

export interface VoteTally {
  player: Player;
  count: number;
}

export function tallyVotesForDisplay(
  votes: Vote[],
  players: Player[],
): VoteTally[] {
  const counts = new Map<PlayerId, number>();
  for (const vote of votes) {
    counts.set(vote.targetId, (counts.get(vote.targetId) ?? 0) + 1);
  }

  return players
    .filter((player) => counts.has(player.id))
    .map((player) => ({ player, count: counts.get(player.id)! }))
    .sort((a, b) => b.count - a.count);
}

export function resultCopy(winner: RoundWinner, isCaught: boolean): string {
  if (!isCaught) {
    return "The imposter got away...";
  }
  return winner === "IMPOSTER"
    ? "Caught red-handed, and they guessed the word anyway!! The imposter wins the round."
    : "Caught red-handed, and they guessed wrong. The group wins the round.";
}

export function isLastRound(roundNumber: number): boolean {
  return roundNumber >= ROUNDS_PER_GAME;
}

/**
 * The round result, one line at a time. RoundReveal types these out below the
 * board with each line replacing the last, so the array order is the order the
 * room reads them in. The last line is the one that stays on screen.
 */
export function revealLines(
  reveal: RoundReveal,
  accusedId: PlayerId | null,
  players: Player[],
): string[] {
  const nameOf = (id: PlayerId | null): string =>
    players.find((player) => player.id === id)?.nickname ?? "someone";

  const imposterName = nameOf(reveal.imposterId);
  const wordLine = `The word was "${reveal.word}"`;
  const caught = accusedId !== null && accusedId === reveal.imposterId;

  if (caught) {
    const guess = reveal.finalGuess?.text.trim();
    return [
      `${imposterName} was caught red-handed!`,
      guess ? `Their guess: "${guess}"` : "They never made a guess.",
      wordLine,
      resultCopy(reveal.winner, true),
    ];
  }

  return [
    accusedId !== null
      ? `The room accused ${nameOf(accusedId)}.`
      : "The room couldn't agree on anyone.",
    `The imposter was ${imposterName}.`,
    wordLine,
    resultCopy(reveal.winner, false),
  ];
}
