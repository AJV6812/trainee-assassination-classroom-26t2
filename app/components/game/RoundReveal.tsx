"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AvatarBlob } from "@/app/components/lobby/AvatarBlob";
import {
  BOARD,
  CLOCK,
  CLOCK_FACE,
  HEIGHT_TO_WIDTH,
  INK,
  ROSTER,
  TEAMMATE_CANVAS_HEIGHT,
  TEAMMATE_CANVAS_WIDTH,
  type RosterPlayer,
} from "@/app/components/drawing-round/geometry";
import { useCountdown } from "@/app/lib/clock";
import { isLastRound, revealLines } from "@/app/lib/reveal";
import { AppSocket } from "@/app/socket-provider";
import { CLIENT_EVENTS } from "@/shared/events";
import type { PlayerId, PublicGameState, PublicRoom } from "@/shared/types";
import { Canvas } from "./Canvas";
import { HomeButton } from "@/app/components/HomeButton";
import { TypewriterLines } from "./reveal/TypewriterLines";

const URGENT_MS = 5_000;

interface RoundRevealProps {
  room: PublicRoom;
  gameState: PublicGameState;
  playerId: PlayerId;
  socket: AppSocket;
}

export function RoundReveal({
  room,
  gameState,
  playerId,
  socket,
}: RoundRevealProps) {
  const { reveal } = gameState;

  const frameRef = useRef<HTMLDivElement>(null);
  const boardOuterRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [typingDone, setTypingDone] = useState(false);
  const [hasClickedReady, setHasClickedReady] = useState(false);

  useEffect(() => {
    const el = boardOuterRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setScale({
        x: el.clientWidth / TEAMMATE_CANVAS_WIDTH,
        y: el.clientHeight / TEAMMATE_CANVAS_HEIGHT,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const remainingMs = useCountdown(gameState.phaseEndsAt);
  const hasDeadline = gameState.phaseEndsAt !== null;
  const seconds = hasDeadline ? Math.ceil(remainingMs / 1000) : null;

  if (reveal === null) {
    return null;
  }

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

  const lines = revealLines(reveal, gameState.accusedId, room.players);

  const connectedCount = room.players.filter((p) => p.connected).length;
  const readyCount = gameState.readyForNextIds.length;

  const rowHeight = ROSTER.height / Math.max(1, players.length);
  const avatarSize = Math.min(8.7, rowHeight * HEIGHT_TO_WIDTH * 0.78);

  return (
    <div className="relative flex h-screen max-h-screen w-full flex-col items-center justify-center overflow-hidden font-sans">
      <div
        className="absolute inset-0 -z-10 animate-diagonal-scroll bg-repeat"
        style={{
          backgroundImage: "url('/images/landing-page/landing-page-bg.jpg')",
          backgroundSize: "720px 512px",
          transform: "scale(1.75)",
        }}
      />

      <div
        ref={frameRef}
        className="frame-drawing-layout relative aspect-video w-[min(calc(100vw-2rem),1920px,calc((100vh-2rem)*16/9))] @container"
        style={{ "--avatar-size": `${avatarSize}cqw` } as CSSProperties}
      >
        {players.map((player, index) => {
          const centre = ROSTER.top + rowHeight * (index + 0.5);
          const isTheImposter = typingDone && player.id === reveal.imposterId;
          return (
            <div
              key={player.id}
              className="absolute flex -translate-y-1/2 justify-center transition-opacity duration-200"
              style={{
                left: `${ROSTER.left}%`,
                top: `${centre}%`,
                width: `${ROSTER.width}%`,
                opacity: typingDone && !isTheImposter ? 0.4 : 1,
              }}
            >
              <div className="relative">
                <AvatarBlob
                  colour={player.colour}
                  initial={player.nickname.charAt(0).toUpperCase() || "?"}
                  className="avatar-fluid"
                />
                {isTheImposter && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-[-8%] rounded-full ring-4 ring-red-500"
                  />
                )}
                <span className="sr-only">
                  {player.nickname}
                  {isTheImposter ? " (the imposter)" : ""}
                </span>
              </div>
            </div>
          );
        })}

        <div
          className={`art-clock absolute ${
            hasDeadline && remainingMs <= URGENT_MS ? "art-clock-urgent" : ""
          }`}
          style={{
            right: `${CLOCK.right}%`,
            top: `${CLOCK.top}%`,
            width: `${CLOCK.width}cqw`,
          }}
        >
          <span
            className="absolute flex items-center justify-center font-bold tabular-nums"
            style={{
              left: `${CLOCK_FACE.left}%`,
              top: `${CLOCK_FACE.top}%`,
              width: `${CLOCK_FACE.width}%`,
              height: `${CLOCK_FACE.height}%`,
              color: INK,
              fontSize: "1.5cqw",
            }}
          >
            {seconds ?? "–"}
          </span>
        </div>

        <div
          ref={boardOuterRef}
          className="absolute overflow-hidden"
          style={{
            left: `${BOARD.left}%`,
            top: `${BOARD.top}%`,
            width: `${BOARD.width}%`,
            height: `${BOARD.height}%`,
          }}
        >
          <div
            style={{
              width: `${TEAMMATE_CANVAS_WIDTH}px`,
              height: `${TEAMMATE_CANVAS_HEIGHT}px`,
              transform: `scale(${scale.x}, ${scale.y})`,
              transformOrigin: "top left",
            }}
          >
            <Canvas
              room={room}
              playerId={playerId}
              socket={socket}
              myTurn={false}
              strokes={gameState.strokes}
              highlightPlayerId={typingDone ? reveal.imposterId : null}
            />
          </div>
        </div>

        <div className="absolute left-0 top-[87%] flex w-full justify-center px-[6%]">
          <TypewriterLines
            lines={lines}
            onDone={() => setTypingDone(true)}
            className="text-center font-bold tracking-wide"
            style={{ color: INK, fontSize: "1.35cqw" }}
          />
        </div>
      </div>

      <div className="fixed left-4 top-4 z-10">
        <HomeButton variant={"icon"} socket={socket} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center border-t-2 border-[#3f3730] bg-[#fdf6e3] px-4 py-3 shadow-[0_-4px_16px_rgba(63,55,48,0.15)]">
        <button
          type="button"
          disabled={!typingDone || hasClickedReady}
          onClick={() => {
            setHasClickedReady(true);
            socket.emit(CLIENT_EVENTS.REVEAL_READY);
          }}
          className="cursor-pointer rounded-xl border-2 border-[#3f3730] bg-[#f2d64b] px-5 py-1.5 font-bold text-black transition-transform hover:-rotate-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:rotate-0"
        >
          {isLastRound(gameState.roundNumber)
            ? "Ready for results"
            : "Ready for next round"}{" "}
          ({readyCount}/{connectedCount})
        </button>
      </div>
    </div>
  );
}
