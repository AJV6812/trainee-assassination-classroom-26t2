// T09: the phase loop. When a phase runs its full duration the timer fires and
// this drives the state machine forward along that phase's natural "time's up"
// edge.

import type { Result } from "@/shared/events";
import type { GameState, Room, RoomCode } from "@/shared/types";
import {
  advanceTurn,
  endGame,
  beginDrawing,
  endRoundReveal,
  isGameOver,
  settleVoting,
  toRoundRevealFromFinalGuess,
} from "./state";
import { armPhaseTimer, clearRoomTimer } from "./timers";

// How long a DRAWING turn's clock is held off after the turn actually starts,
// so the drawer's own client (public/images/drawing-round/your-turn.png) has
// time to show and fade before any real time is spent against them.
export const YOUR_TURN_DELAY_MS = 2_000;

// Tracks the "arm the real clock" callback scheduled for each room's current
// turn, so a transition that supersedes it (an early stroke, a disconnect, a
// timeout from some other phase entirely) can cancel it before it fires.
const pendingTurnStarts = new Map<RoomCode, ReturnType<typeof setTimeout>>();

function cancelPendingTurnStart(code: RoomCode): void {
  const handle = pendingTurnStarts.get(code);
  if (handle) {
    clearTimeout(handle);
    pendingTurnStarts.delete(code);
  }
}

export interface PhaseLoopDeps {
  getRoom: (code: RoomCode) => Room | null;
  broadcast: (room: Room) => void;
  startNextRound: (room: Room) => void;
}

export interface PhaseLoop {
  enterPhase: (room: Room, next: GameState) => void;
  onPhaseExpired: (roomCode: RoomCode) => void;
  settleRoundReveal: (room: Room) => void;
}

// The transition to run when a phase has used up its whole timer. Returns null
// for phases that never arm one (LOBBY, ROUND_STARTING, SCORING, GAME_OVER).
function timeoutTransition(state: GameState): Result<GameState> | null {
  switch (state.phase) {
    case "ROUND_STARTING":
      return beginDrawing(state);
    case "DRAWING":
      return advanceTurn(state); // advanceTurn is what ends the phase, once the last player of pass 2 runs out of time.
    case "VOTING":
      return settleVoting(state);
    case "FINAL_GUESS":
      return toRoundRevealFromFinalGuess(state);
    case "ROUND_REVEAL":
      return endRoundReveal(state);
    default:
      return null;
  }
}

export function createPhaseLoop({
  getRoom,
  broadcast,
  startNextRound,
}: PhaseLoopDeps): PhaseLoop {
  function enterPhase(room: Room, next: GameState): void {
    // Any previously pending turn-start is stale the moment we're entering a
    // new phase at all, DRAWING or not — never let an old one arm a clock
    // for a turn that isn't current anymore.
    cancelPendingTurnStart(room.code);

    if (next.phase === "DRAWING") {
      // Broadcast the new turn right away, but with no clock yet: the
      // drawer's client shows "Your Turn" while this state holds, and only
      // the delayed arm below starts real time running.
      clearRoomTimer(room.code);
      room.state = { ...next, phaseEndsAt: null };
      broadcast(room);

      const handle = setTimeout(() => {
        pendingTurnStarts.delete(room.code);
        const current = getRoom(room.code);
        if (!current) {
          return;
        }
        const endsAt = armPhaseTimer(room.code, "DRAWING", () =>
          onPhaseExpired(room.code),
        );
        current.state = { ...current.state, phaseEndsAt: endsAt };
        broadcast(current);
      }, YOUR_TURN_DELAY_MS);
      handle.unref?.();
      pendingTurnStarts.set(room.code, handle);
      return;
    }

    const endsAt = armPhaseTimer(room.code, next.phase, () =>
      onPhaseExpired(room.code),
    );
    room.state = { ...next, phaseEndsAt: endsAt };
    broadcast(room);
  }

  function onPhaseExpired(roomCode: RoomCode): void {
    const room = getRoom(roomCode);
    if (!room) {
      return;
    }

    const next = timeoutTransition(room.state);
    if (next === null) {
      return;
    }
    if (!next.ok) {
      console.warn(
        `[room ${roomCode}] phase timeout from ${room.state.phase} rejected: ${next.message}`,
      );
      return;
    }
    enterPhase(room, next.data);
    followThroughScoring(room);
  }

  function followThroughScoring(room: Room): void {
    if (room.state.phase !== "SCORING") {
      return;
    }
    if (isGameOver(room.state)) {
      const over = endGame(room.state);
      if (over.ok) {
        enterPhase(room, over.data);
      }
    } else {
      startNextRound(room);
    }
  }

  function settleRoundReveal(room: Room): void {
    const ended = endRoundReveal(room.state);
    if (!ended.ok) {
      console.warn(
        `[room ${room.code}] end_round_reveal rejected on early exit: ${ended.message}`,
      );
      return;
    }
    enterPhase(room, ended.data);
    followThroughScoring(room);
  }

  return { enterPhase, onPhaseExpired, settleRoundReveal };
}
