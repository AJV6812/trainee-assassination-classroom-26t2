"use client";

import { useSyncExternalStore } from "react";
import type { PublicGameState, PublicRoom } from "@/shared/types";
import { getPlayerId, subscribe } from "./lib/identity";
import { useSocket } from "./socket-provider";
import { VotingRoundScreen } from "./components/voting/VotingRoundScreen";
import { FinalGuessScreen } from "./components/final-guess/FinalGuessScreen";
import { HomeButton } from "./components/game/HomeButton";
import { SecretDisplay } from "./components/lobby/SecretDisplay";
import { RoundReveal } from "./components/game/RoundReveal";
import { DrawingRoundScreen } from "./components/drawing-round/DrawingRoundScreen";

interface GameProps {
  room: PublicRoom;
  gameState: PublicGameState;
}
export function Game({ room, gameState }: GameProps) {
  const socket = useSocket();
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
      />
    );
  }

  if (gameState.phase == "ROUND_REVEAL") {
    content = (
      <>
        <RoundReveal
          key={gameState.roundNumber}
          room={room}
          gameState={gameState}
          playerId={playerId}
          socket={socket}
        />
        <HomeButton socket={socket} />
      </>
    );
  } else if (gameState.phase == "SCORING") {
    content = <h1>Scores!</h1>;
  } else if (gameState.phase == "GAME_OVER") {
    content = (
      <>
        <h1>Game Over!</h1>
        <HomeButton socket={socket} />
      </>
    );
  }

  const showSecret =
    gameState.phase !== "ROUND_REVEAL" &&
    gameState.phase !== "SCORING" &&
    gameState.phase !== "GAME_OVER";

  return (
    <>
      {showSecret && <SecretDisplay secret={gameState.secret} />}
      {content}
    </>
  );
}
