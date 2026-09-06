"use client";

import type { AppSocket } from "@/app/socket-provider";
import type { PublicGameState, PublicRoom } from "@/shared/types";
import { GameOver } from "./GameOver";

const PREVIEW_AS_HOST = true;

const ROOM: PublicRoom = {
  code: "ABCDEF",
  hostId: "p1",
  players: [
    { id: "p1", nickname: "Ari", colour: "#9a6324", connected: true, ready: false, isSpectator: false },
    { id: "p2", nickname: "Jo", colour: "#5e875b", connected: true, ready: false, isSpectator: false },
    { id: "p3", nickname: "Kai", colour: "#5b92b9", connected: true, ready: false, isSpectator: false },
    { id: "p4", nickname: "Sam", colour: "#df6c4c", connected: true, ready: false, isSpectator: false },
  ],
};

const GAME_STATE = {
  phase: "GAME_OVER",
  roundNumber: 3,
  pass: 2,
  turnIndex: 0,
  turnOrder: [],
  strokes: [],
  accusedId: null,
  phaseEndsAt: null,
  scores: {
    groupRoundsWon: 2,
    imposterRoundsWon: 1,
    perPlayer: {
      p1: { roundsAsImposter: 1, roundsWonAsImposter: 1 },
      p3: { roundsAsImposter: 2, roundsWonAsImposter: 0 },
    },
  },
  votedPlayerIds: [],
  readyForNextIds: [],
  secret: { category: "an animal", word: "cat" },
  reveal: null,
} satisfies PublicGameState;

const noopSocket = { emit: () => {} } as unknown as AppSocket;

export default function GameOverMockup() {
  return (
    <GameOver
      room={ROOM}
      gameState={GAME_STATE}
      playerId={PREVIEW_AS_HOST ? "p1" : "p2"}
      socket={noopSocket}
      setRoomState={() => {}}
      setGameState={() => {}}
    />
  );
}
