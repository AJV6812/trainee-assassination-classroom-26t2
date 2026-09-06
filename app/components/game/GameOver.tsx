"use client";

import Image from "next/image";
import gameOverLogo from "@/public/images/game-over/game-over.png";
import { AvatarBlob } from "@/app/components/lobby/AvatarBlob";
import { HomeButton } from "@/app/components/HomeButton";
import { ReplayButton } from "@/app/components/game/ReplayButton";
import { AppSocket } from "@/app/socket-provider";
import type { PlayerId, PublicGameState, PublicRoom } from "@/shared/types";

interface GameOverProps {
  room: PublicRoom;
  gameState: PublicGameState;
  playerId: PlayerId;
  socket: AppSocket;
  setRoomState: (room: PublicRoom | null) => void;
  setGameState: (state: PublicGameState | null) => void;
}

export function GameOver({
  room,
  gameState,
  playerId,
  socket,
  setRoomState,
  setGameState,
}: GameOverProps) {
  const { scores } = gameState;
  const isHost = room.hostId === playerId;

  const groupWon = scores.groupRoundsWon;
  const imposterWon = scores.imposterRoundsWon;
  const headline =
    groupWon > imposterWon
      ? "The group held the line."
      : imposterWon > groupWon
        ? "The imposters ran the table."
        : "A dead heat.";

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 overflow-x-hidden px-6 py-8 font-sans">
      <div
        className="fixed inset-0 -z-10 animate-diagonal-scroll bg-repeat"
        style={{
          backgroundImage: "url('/images/landing-page/landing-page-bg.jpg')",
          backgroundSize: "720px 512px",
          transform: "scale(1.75)",
        }}
      />

      <h1 className="sr-only">Game over</h1>

      <Image
        src={gameOverLogo}
        alt="Game over"
        className="h-auto w-full max-w-68 animate-pulse-scale sm:max-w-xs md:max-w-sm [--logo-scale:1.08] sm:[--logo-scale:1.15] md:[--logo-scale:1.2]"
        priority
      />

      <section className="w-full max-w-md rounded-2xl border border-black/10 bg-white/85 p-8 text-black shadow-sm backdrop-blur-sm">
        <p className="text-center text-lg font-bold">{headline}</p>

        <div className="mt-3 flex items-stretch justify-center gap-3 text-center">
          <div className="flex-1 rounded-xl bg-[#5e875b]/15 py-3">
            <div className="text-2xl font-bold text-[#4a6f48]">{groupWon}</div>
            <div className="text-xs font-medium uppercase tracking-wide">
              Group
            </div>
          </div>
          <div className="flex-1 rounded-xl bg-[#772322]/15 py-3">
            <div className="text-2xl font-bold text-[#772322]">
              {imposterWon}
            </div>
            <div className="text-xs font-medium uppercase tracking-wide">
              Imposters
            </div>
          </div>
        </div>

        <h2 className="mt-5 text-xs font-semibold uppercase tracking-wide text-black/50">
          Imposter record
        </h2>
        <ul className="mt-2 space-y-1.5">
          {room.players.map((player) => {
            const record = scores.perPlayer[player.id] ?? {
              roundsAsImposter: 0,
              roundsWonAsImposter: 0,
            };
            return (
              <li key={player.id} className="flex items-center gap-2.5">
                <AvatarBlob
                  colour={player.colour}
                  initial={player.nickname.charAt(0).toUpperCase() || "?"}
                  className="h-7 w-7 text-xs"
                />
                <span className="flex-1 truncate font-medium">
                  {player.nickname}
                  {player.id === playerId && (
                    <span className="text-black/40"> (you)</span>
                  )}
                </span>
                <span className="text-sm text-black/60">
                  {record.roundsAsImposter === 0
                    ? "never imposter"
                    : `${record.roundsWonAsImposter}/${record.roundsAsImposter} as imposter`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {isHost && <ReplayButton socket={socket} />}
        <HomeButton
          socket={socket}
          setRoomState={setRoomState}
          setGameState={setGameState}
        />
      </div>

      {!isHost && (
        <p className="text-sm text-black/60">
          Waiting for the host to start a rematch…
        </p>
      )}
    </div>
  );
}
