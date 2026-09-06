import type { Result } from "@/shared/events";
import type { AvatarStroke, PlayerId, Point, RoomCode } from "@/shared/types";

const NICKNAME_MAX_LENGTH = 16;
const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;

// Generous for a face doodle, bounded against a hostile payload: a real
// drawing session produces nowhere near this many strokes or points.
const AVATAR_MAX_STROKES = 150;
const AVATAR_MAX_POINTS_PER_STROKE = 400;

export interface Identity {
  playerId: PlayerId;
  nickname: string;
}

function sanitiseNickname(raw: string): string {
  return raw.replace(CONTROL_CHARS, "").trim().slice(0, NICKNAME_MAX_LENGTH);
}

function fields(payload: unknown): Record<string, unknown> | null {
  return typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : null;
}

export function parseIdentity(payload: unknown): Result<Identity> {
  const data = fields(payload);
  if (!data) {
    return {
      ok: false,
      code: "INVALID_PAYLOAD",
      message: "Expected a payload object.",
    };
  }

  const { playerId, nickname } = data;
  if (typeof playerId !== "string" || playerId.length === 0) {
    return {
      ok: false,
      code: "INVALID_PAYLOAD",
      message: "playerId must be a non-empty string.",
    };
  }
  if (typeof nickname !== "string") {
    return {
      ok: false,
      code: "INVALID_NICKNAME",
      message: "Nickname must be text.",
    };
  }

  const sanitised = sanitiseNickname(nickname);
  if (sanitised.length === 0) {
    return {
      ok: false,
      code: "INVALID_NICKNAME",
      message: `Nickname must be 1-${NICKNAME_MAX_LENGTH} characters.`,
    };
  }

  return { ok: true, data: { playerId, nickname: sanitised } };
}

export function parseRoomCode(payload: unknown): Result<RoomCode> {
  const data = fields(payload);
  const code = data?.code;
  if (typeof code !== "string" || code.trim().length === 0) {
    return {
      ok: false,
      code: "INVALID_PAYLOAD",
      message: "code must be a non-empty string.",
    };
  }
  return { ok: true, data: code };
}

function isValidPoint(value: unknown): value is Point {
  const data = fields(value);
  if (!data) {
    return false;
  }
  const { x, y } = data;
  return (
    typeof x === "number" &&
    typeof y === "number" &&
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    x <= 1 &&
    y >= 0 &&
    y <= 1
  );
}

function isValidAvatarStroke(value: unknown): value is AvatarStroke {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const points = (value as { points?: unknown }).points;
  return (
    Array.isArray(points) &&
    points.length > 0 &&
    points.length <= AVATAR_MAX_POINTS_PER_STROKE &&
    points.every(isValidPoint)
  );
}

export function parseAvatarDrawing(payload: unknown): Result<AvatarStroke[]> {
  const data = fields(payload);
  const strokes = data?.strokes;
  if (!Array.isArray(strokes)) {
    return {
      ok: false,
      code: "INVALID_PAYLOAD",
      message: "strokes must be an array.",
    };
  }
  if (strokes.length > AVATAR_MAX_STROKES) {
    return {
      ok: false,
      code: "INVALID_PAYLOAD",
      message: `strokes must be at most ${AVATAR_MAX_STROKES}.`,
    };
  }
  if (!strokes.every(isValidAvatarStroke)) {
    return {
      ok: false,
      code: "INVALID_PAYLOAD",
      message: "Every stroke needs 1-" +
        `${AVATAR_MAX_POINTS_PER_STROKE} points, each with x and y in 0..1.`,
    };
  }
  return { ok: true, data: strokes as AvatarStroke[] };
}

export function safeAck<T>(ack: unknown): (result: Result<T>) => void {
  return typeof ack === "function"
    ? (ack as (result: Result<T>) => void)
    : () => {};
}
