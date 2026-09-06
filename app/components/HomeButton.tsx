"use client";

import { AppSocket } from "@/app/socket-provider";
import { CLIENT_EVENTS, Result } from "@/shared/events";
import { clearPlayerId, clearStoredSession } from "../lib/identity";
import { PublicGameState, PublicRoom } from "@/shared/types";

interface HomeButtonProps {
  socket: AppSocket;
  setRoomState?: (room: PublicRoom | null) => void;
  setGameState?: (state: PublicGameState | null) => void;
  variant?: "bar" | "icon";
}

function goHome(
  socket: AppSocket,
  setRoomState?: (room: PublicRoom | null) => void,
  setGameState?: (state: PublicGameState | null) => void,
): Promise<Result<void>> {
  return new Promise((resolve) => {
    clearStoredSession();
    clearPlayerId();
    setRoomState?.(null);
    setGameState?.(null);
    socket.emit(CLIENT_EVENTS.LEAVE_ROOM, resolve);
  });
}

export function HomeButton({
  socket,
  setRoomState,
  setGameState,
  variant = "bar",
}: HomeButtonProps) {
  const buttonClass =
    variant === "icon"
      ? "aspect-square w-16 frame-home-icon"
      : "w-64 rounded-xl px-4 py-3 text-lg frame-home-button";

  return (
    <div className="home-button-wrap flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => goHome(socket, setRoomState, setGameState)}
        aria-label="Leave room"
        className={`${buttonClass} cursor-pointer disabled:opacity-40`}
      ></button>
    </div>
  );
}
