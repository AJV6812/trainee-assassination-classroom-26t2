"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@/app/components/game/Canvas";
import { HomeButton } from "@/app/components/HomeButton";
import {
  INK,
  type RosterPlayer,
} from "@/app/components/drawing-round/geometry";
import { SERVER_EVENTS, CLIENT_EVENTS } from "@/shared/events";
import type { SocketError } from "@/shared/events";
import type { PlayerId, PublicGameState, PublicRoom } from "@/shared/types";
import type { AppSocket } from "@/app/socket-provider";
import FinalGuess from "./FinalGuess";

interface FinalGuessScreenProps {
  room: PublicRoom;
  gameState: PublicGameState;
  playerId: PlayerId;
  socket: AppSocket;
  setRoomState: (room: PublicRoom | null) => void;
  setGameState: (state: PublicGameState | null) => void;
}

const SHOWN_ERROR_CODES = new Set<string>(["INVALID_PAYLOAD", "NOT_IMPOSTER"]);
const ERROR_VISIBLE_MS = 4_000;

export function FinalGuessScreen({
  room,
  gameState,
  playerId,
  socket,
  setRoomState,
  setGameState,
}: FinalGuessScreenProps) {
  const imposter =
    room.players.find((player) => player.id === gameState.accusedId) ?? null;
  const isImposter = "isImposter" in gameState.secret;

  const byId = new Map(room.players.map((player) => [player.id, player]));
  const ordered = gameState.turnOrder
    .map((id) => byId.get(id))
    .filter((player) => player !== undefined);
  const players: RosterPlayer[] = (
    ordered.length > 0 ? ordered : room.players
  ).map((player) => ({
    id: player.id,
    nickname: player.nickname,
    colour: player.colour,
  }));

  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const onError = (error: SocketError) => {
      if (!SHOWN_ERROR_CODES.has(error.code)) {
        return;
      }
      setErrorMessage(error.message);
      submittedRef.current = false;
      setSubmitted(false);
    };
    socket.on(SERVER_EVENTS.ERROR, onError);
    return () => {
      socket.off(SERVER_EVENTS.ERROR, onError);
    };
  }, [socket]);

  useEffect(() => {
    if (errorMessage === null) {
      return;
    }
    const id = setTimeout(() => setErrorMessage(null), ERROR_VISIBLE_MS);
    return () => clearTimeout(id);
  }, [errorMessage]);

  function handleSubmit(text: string) {
    if (submittedRef.current) {
      return;
    }
    submittedRef.current = true;
    setSubmitted(true);
    setErrorMessage(null);
    socket.emit(CLIENT_EVENTS.SUBMIT_GUESS, { text });
  }

  return (
    <div className="relative w-full">
      <FinalGuess
        isImposter={isImposter}
        imposterId={gameState.accusedId}
        imposterName={imposter?.nickname ?? "The imposter"}
        imposterColour={imposter?.colour ?? INK}
        players={players}
        secret={gameState.secret}
        phaseEndsAt={gameState.phaseEndsAt}
        submitted={submitted}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        board={
          <Canvas
            room={room}
            playerId={playerId}
            socket={socket}
            myTurn={false}
            strokes={gameState.strokes}
            highlightPlayerId={gameState.accusedId}
          />
        }
      />
      <div className="fixed left-4 top-4 z-10">
        <HomeButton
          socket={socket}
          setRoomState={setRoomState}
          setGameState={setGameState}
        />
      </div>
    </div>
  );
}
