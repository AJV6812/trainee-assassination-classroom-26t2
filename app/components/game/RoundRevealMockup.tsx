"use client";

import { useSyncExternalStore } from "react";
import type { AppSocket } from "@/app/socket-provider";
import type {
  Player,
  PublicGameState,
  PublicRoom,
  Stroke,
} from "@/shared/types";
import { RoundReveal } from "./RoundReveal";

const PREVIEW_CAUGHT: boolean = false;

const PLAYERS: Player[] = [
  { id: "p1", nickname: "Host", colour: "#9a6324" },
  { id: "p2", nickname: "Ari", colour: "#772322" },
  { id: "p3", nickname: "Bo", colour: "#5e875b" },
  { id: "p4", nickname: "Cleo", colour: "#5b92b9" },
  { id: "p5", nickname: "Dev", colour: "#df6c4c" },
].map((p) => ({ ...p, connected: true, ready: false, isSpectator: false }));

const ME = PLAYERS[3];
const IMPOSTER = PLAYERS[2];

const STROKES: Stroke[] = [
  {
    id: "s1",
    playerId: "p1",
    colour: PLAYERS[0].colour,
    points: [
      { x: 0.14, y: 0.22 },
      { x: 0.38, y: 0.26 },
      { x: 0.5, y: 0.48 },
    ],
  },
  {
    id: "s2",
    playerId: "p2",
    colour: PLAYERS[1].colour,
    points: [
      { x: 0.62, y: 0.3 },
      { x: 0.72, y: 0.54 },
      { x: 0.56, y: 0.7 },
    ],
  },
  {
    id: "s3",
    playerId: IMPOSTER.id,
    colour: IMPOSTER.colour,
    points: [
      { x: 0.3, y: 0.62 },
      { x: 0.46, y: 0.76 },
      { x: 0.66, y: 0.8 },
    ],
  },
  {
    id: "s4",
    playerId: "p5",
    colour: PLAYERS[4].colour,
    points: [
      { x: 0.2, y: 0.4 },
      { x: 0.26, y: 0.52 },
    ],
  },
];

const ROOM: PublicRoom = { code: "DRAW", hostId: "p1", players: PLAYERS };
const socket = { emit: () => {} } as unknown as AppSocket;

const PHASE_MS = 30_000;
const PREVIEW_DEADLINE = Date.now() + PHASE_MS;

const neverChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

export default function RoundRevealMockup() {
  const mounted = useSyncExternalStore(neverChanges, onClient, onServer);

  const accusedId = PREVIEW_CAUGHT ? IMPOSTER.id : "p2";

  const gameState: PublicGameState = {
    phase: "ROUND_REVEAL",
    roundNumber: 2,
    pass: 2,
    turnIndex: 0,
    turnOrder: PLAYERS.map((p) => p.id),
    strokes: STROKES,
    accusedId,
    phaseEndsAt: mounted ? PREVIEW_DEADLINE : null,
    scores: { groupRoundsWon: 1, imposterRoundsWon: 0, perPlayer: {} },
    votedPlayerIds: ["p1", "p2", "p4", "p5"],
    readyForNextIds: ["p1"],
    secret: { category: "a piece of technology", word: "constellation" },
    reveal: {
      imposterId: IMPOSTER.id,
      word: "constellation",
      votes: [
        { voterId: "p1", targetId: "p2" },
        { voterId: "p2", targetId: "p3" },
        { voterId: "p4", targetId: "p2" },
        { voterId: "p5", targetId: IMPOSTER.id },
      ],
      finalGuess: PREVIEW_CAUGHT ? { text: "galaxy", submittedAt: 0 } : null,
      winner: PREVIEW_CAUGHT ? "GROUP" : "IMPOSTER",
    },
  };

  return (
    <RoundReveal
      room={ROOM}
      gameState={gameState}
      playerId={ME.id}
      socket={socket}
    />
  );
}
