"use client";

import { useSyncExternalStore } from "react";
import type { PublicGameState, PublicRoom } from "@/shared/types";
import { getPlayerId, subscribe } from "./lib/identity";
import type { AppSocket } from "./socket-provider";
import { VotingRoundScreen } from "./components/voting/VotingRoundScreen";
import { FinalGuessScreen } from "./components/final-guess/FinalGuessScreen";
import { HomeButton } from "./components/HomeButton";
import { ReplayButton } from "./components/game/ReplayButton";
import { SecretDisplay } from "./components/lobby/SecretDisplay";
import { RoundReveal } from "./components/game/RoundReveal";
import { DrawingRoundScreen } from "./components/drawing-round/DrawingRoundScreen";

interface GameProps {
  room: PublicRoom;
  gameState: PublicGameState;
  socket: AppSocket;
  setRoomState: (room: PublicRoom | null) => void;
  setGameState: (state: PublicGameState | null) => void;
}
export function Game({
  room,
  gameState,
  socket,
  setRoomState,
  setGameState,
}: GameProps) {
  const playerId = useSyncExternalStore(subscribe, getPlayerId, () => "");

  let content;

  // DRAWING gets its own screen (the hand-drawn frame, roster, and hint note)
  // rather than the plain h1 the other in-round phases still use — everything
  // else about this branch (Canvas, the socket, the strokes) is unchanged.
  if (gameState.phase === "DRAWING") {
    return (
      <DrawingRoundScreen
        room={room}
        gameState={gameState}
        playerId={playerId}
        socket={socket}
        setRoomState={setRoomState}
        setGameState={setGameState}
      />
    );
  }

  // VOTING gets its own hand-drawn screen (the accusing hand + roster) — the
  // same split DRAWING has. It early-returns rather than anticipating whether
  // the server will branch to FINAL_GUESS or ROUND_REVEAL next.
  if (gameState.phase === "VOTING") {
    return (
      <VotingRoundScreen
        room={room}
        gameState={gameState}
        playerId={playerId}
        socket={socket}
        setRoomState={setRoomState}
        setGameState={setGameState}
      />
    );
  }

  if (gameState.phase === "FINAL_GUESS") {
    return (
      <FinalGuessScreen
        room={room}
        gameState={gameState}
        playerId={playerId}
        socket={socket}
        setRoomState={setRoomState}
        setGameState={setGameState}
      />
    );
  }

  if (gameState.phase === "ROUND_REVEAL") {
    return (
      <RoundReveal
        key={gameState.roundNumber}
        room={room}
        gameState={gameState}
        playerId={playerId}
        socket={socket}
      />
    );
  }

  if (gameState.phase == "SCORING") {
    content = <h1>Scores!</h1>;
  } else if (gameState.phase == "GAME_OVER") {
    content = (
      <>
        <h1>Game Over!</h1>
        <div style={{ display: "inline-flex" }}>
          <HomeButton
            socket={socket}
            setRoomState={setRoomState}
            setGameState={setGameState}
          />
          <ReplayButton socket={socket} />
        </div>
      </>
    );
  }

  const showSecret =
    gameState.phase !== "SCORING" && gameState.phase !== "GAME_OVER";

  return (
    <>
      {showSecret && <SecretDisplay secret={gameState.secret} />}
      {content}
    </>
  );
}
