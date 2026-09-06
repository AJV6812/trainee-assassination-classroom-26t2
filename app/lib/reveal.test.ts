import { describe, expect, it } from "vitest";
import type { Player, RoundReveal } from "@/shared/types";
import {
  isLastRound,
  resultCopy,
  revealLines,
  tallyVotesForDisplay,
} from "./reveal";

const PLAYERS: Player[] = ["alice", "bob", "carol", "dave"].map((id) => ({
  id,
  nickname: id,
  colour: "#000",
  connected: true,
  ready: true,
  isSpectator: false,
}));

describe("tallyVotesForDisplay", () => {
  it("groups by target and sorts by count descending", () => {
    const tally = tallyVotesForDisplay(
      [
        { voterId: "alice", targetId: "bob" },
        { voterId: "carol", targetId: "bob" },
        { voterId: "dave", targetId: "alice" },
      ],
      PLAYERS,
    );
    expect(tally).toEqual([
      { player: PLAYERS[1], count: 2 },
      { player: PLAYERS[0], count: 1 },
    ]);
  });

  it("omits players who received zero votes", () => {
    const tally = tallyVotesForDisplay(
      [{ voterId: "alice", targetId: "bob" }],
      PLAYERS,
    );
    expect(tally.map((t) => t.player.id)).toEqual(["bob"]);
  });

  it("keeps a tie in stable room-list order", () => {
    const tally = tallyVotesForDisplay(
      [
        { voterId: "alice", targetId: "carol" },
        { voterId: "bob", targetId: "dave" },
      ],
      PLAYERS,
    );
    expect(tally.map((t) => t.player.id)).toEqual(["carol", "dave"]);
  });

  it("still resolves a vote for a player who has since disconnected", () => {
    const disconnected = { ...PLAYERS[1], connected: false };
    const tally = tallyVotesForDisplay(
      [{ voterId: "alice", targetId: "bob" }],
      [PLAYERS[0], disconnected, PLAYERS[2], PLAYERS[3]],
    );
    expect(tally).toEqual([{ player: disconnected, count: 1 }]);
  });

  it("returns an empty list when nobody voted", () => {
    expect(tallyVotesForDisplay([], PLAYERS)).toEqual([]);
  });
});

describe("resultCopy", () => {
  it("survival branch: imposter got away regardless of the winner field", () => {
    expect(resultCopy("IMPOSTER", false)).toBe("The imposter got away...");
  });

  it("caught branch, imposter guessed right: imposter still wins", () => {
    expect(resultCopy("IMPOSTER", true)).toBe(
      "Caught red-handed, and they guessed the word anyway!! The imposter wins the round.",
    );
  });

  it("caught branch, imposter guessed wrong: group wins", () => {
    expect(resultCopy("GROUP", true)).toBe(
      "Caught red-handed, and they guessed wrong. The group wins the round.",
    );
  });
});

describe("isLastRound", () => {
  it("is false before the final round", () => {
    expect(isLastRound(1)).toBe(false);
    expect(isLastRound(2)).toBe(false);
  });

  it("is true on and after the final round", () => {
    expect(isLastRound(3)).toBe(true);
    expect(isLastRound(4)).toBe(true);
  });
});

describe("revealLines", () => {
  const base: RoundReveal = {
    imposterId: "carol",
    word: "constellation",
    votes: [],
    finalGuess: null,
    winner: "IMPOSTER",
  };

  it("survival branch: accused, imposter, word, then got-away", () => {
    expect(revealLines({ ...base }, "bob", PLAYERS)).toEqual([
      "The room accused bob.",
      "The imposter was carol.",
      'The word was "constellation"',
      "The imposter got away...",
    ]);
  });

  it("survival branch: names the tie when nobody was accused", () => {
    expect(revealLines({ ...base }, null, PLAYERS)[0]).toBe(
      "The room couldn't agree on anyone.",
    );
  });

  it("caught branch: the accused is the imposter, with their guess quoted", () => {
    const reveal: RoundReveal = {
      ...base,
      winner: "GROUP",
      finalGuess: { text: "  galaxy  ", submittedAt: 0 },
    };
    expect(revealLines(reveal, "carol", PLAYERS)).toEqual([
      "carol was caught red-handed!",
      'Their guess: "galaxy"',
      'The word was "constellation"',
      "Caught red-handed, and they guessed wrong. The group wins the round.",
    ]);
  });

  it("caught branch: says so when the imposter never guessed", () => {
    expect(revealLines({ ...base }, "carol", PLAYERS)[1]).toBe(
      "They never made a guess.",
    );
  });

  it("falls back to 'someone' when a player id is not in the room", () => {
    const reveal: RoundReveal = { ...base, imposterId: "ghost" };
    expect(revealLines(reveal, null, PLAYERS)[1]).toBe(
      "The imposter was someone.",
    );
  });
});
