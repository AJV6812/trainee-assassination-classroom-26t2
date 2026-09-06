"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AvatarBlob } from "@/app/components/lobby/AvatarBlob";
import { FloatingSecretCard } from "@/app/components/game/FloatingSecretCard";
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
import type { PlayerId, PlayerSecret } from "@/shared/types";

const URGENT_MS = 5_000;
const GUESS_LENGTH_HINT = 64;

interface FinalGuessProps {
  isImposter: boolean;
  imposterId: PlayerId | null;
  imposterName: string;
  imposterColour: string;
  players: RosterPlayer[];
  secret: PlayerSecret;
  phaseEndsAt: number | null;
  submitted: boolean;
  errorMessage: string | null;
  onSubmit: (text: string) => void;
  board: ReactNode;
}

export default function FinalGuess({
  isImposter,
  imposterId,
  imposterName,
  imposterColour,
  players,
  secret,
  phaseEndsAt,
  submitted,
  errorMessage,
  onSubmit,
  board,
}: FinalGuessProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const boardOuterRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [value, setValue] = useState("");

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

  const remainingMs = useCountdown(phaseEndsAt);
  const hasDeadline = phaseEndsAt !== null;
  const seconds = hasDeadline ? Math.ceil(remainingMs / 1000) : null;
  const overHint = value.length > GUESS_LENGTH_HINT;

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

      <p aria-live="polite" className="sr-only">
        {isImposter
          ? "You were the imposter and you were caught. Make your final guess in the bar at the bottom of the screen."
          : `${imposterName} was the imposter and is making a final guess.`}
        {seconds !== null ? ` ${seconds} seconds left.` : ""}
      </p>

      <div
        ref={frameRef}
        className="frame-drawing-layout relative aspect-video w-[min(calc(100vw-2rem),1920px,calc((100vh-2rem)*16/9))] @container"
        style={{ "--avatar-size": `${avatarSize}cqw` } as CSSProperties}
      >
        {players.map((player, index) => {
          const centre = ROSTER.top + rowHeight * (index + 0.5);
          const isTheImposter = player.id === imposterId;
          return (
            <div
              key={player.id}
              className="absolute flex -translate-y-1/2 justify-center"
              style={{
                left: `${ROSTER.left}%`,
                top: `${centre}%`,
                width: `${ROSTER.width}%`,
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

        <FloatingSecretCard frameRef={frameRef} secret={secret} />

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
            {board}
          </div>
        </div>

        <p
          className="absolute left-0 top-[87%] w-full text-center font-bold tracking-wide"
          style={{ color: INK, fontSize: "1.1cqw" }}
        >
          {isImposter ? (
            "You were caught! Make your final guess below"
          ) : (
            <>
              <span style={{ color: imposterColour }}>{imposterName}</span> is
              making the final guess…
            </>
          )}
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-[#3f3730] bg-[#fdf6e3] px-4 py-3 shadow-[0_-4px_16px_rgba(63,55,48,0.15)]">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-1">
          {errorMessage && (
            <p role="status" className="text-sm font-bold text-red-600">
              {errorMessage}
            </p>
          )}
          <div className="flex w-full items-center gap-3">
            <span className="shrink-0 font-bold" style={{ color: INK }}>
              Final Guess:
            </span>
            {isImposter ? (
              submitted ? (
                <span
                  role="status"
                  className="flex-1 font-bold"
                  style={{ color: INK }}
                >
                  Submitted. Waiting for the reveal…
                </span>
              ) : (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit(value);
                  }}
                >
                  <input
                    type="text"
                    aria-label="Your final guess"
                    placeholder="enter here"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="min-w-0 flex-1 rounded-xl border-2 border-[#3f3730] bg-white px-3 py-1.5 font-bold text-black outline-none placeholder:font-normal placeholder:text-black/40"
                  />
                  {overHint && (
                    <span className="shrink-0 text-xs font-bold text-red-600 tabular-nums">
                      {value.length}/{GUESS_LENGTH_HINT}
                    </span>
                  )}
                  <button
                    type="submit"
                    className="shrink-0 cursor-pointer rounded-xl border-2 border-[#3f3730] bg-[#f2d64b] px-4 py-1.5 font-bold text-black transition-transform hover:-rotate-2"
                  >
                    Submit
                  </button>
                </form>
              )
            ) : (
              <span className="flex-1 font-bold" style={{ color: INK }}>
                waiting for{" "}
                <span style={{ color: imposterColour }}>{imposterName}</span>…
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
