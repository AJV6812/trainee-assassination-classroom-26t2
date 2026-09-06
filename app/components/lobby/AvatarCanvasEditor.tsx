"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { AvatarStroke, Point } from "@/shared/types";
import { paintAvatarStrokes } from "./avatarCanvas";

export interface AvatarCanvasEditorHandle {
  clear: () => void;
  undo: () => void;
}

interface AvatarCanvasEditorProps {
  // Locked to the player's own assigned colour rather than a free picker —
  // every other identity cue in this app (roster highlight, arrows, strokes
  // in the real game) already runs on this one fixed colour per player.
  colour: string;
  initialStrokes: AvatarStroke[];
  // Called after every commit (a finished stroke, an undo, or a clear) with
  // the full current list, so the parent modal always has what Save should
  // send without needing to ask this component for it separately.
  onChange: (strokes: AvatarStroke[]) => void;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Unlike the main game's canvas, there is no one-stroke-per-turn limit here:
// this is a private, low-stakes surface, so drawing freely and undoing
// mistakes is the right feel, not a constraint worth enforcing.
export const AvatarCanvasEditor = forwardRef<
  AvatarCanvasEditorHandle,
  AvatarCanvasEditorProps
>(function AvatarCanvasEditor({ colour, initialStrokes, onChange }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Committed strokes live in a ref, not state: every stroke, undo, and clear
  // repaints immediately via redraw(), so there is nothing for React's own
  // render to drive here — this only re-renders for reasons outside this
  // component's control (a resize), same shape as the game canvas's own
  // useRef-for-strokes pattern.
  const strokesRef = useRef<AvatarStroke[]>(initialStrokes);
  const liveStrokeRef = useRef<Point[] | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }
    const live = liveStrokeRef.current;
    const strokes = live
      ? [...strokesRef.current, { points: live }]
      : strokesRef.current;
    paintAvatarStrokes(ctx, strokes, colour, canvas.width, canvas.height);
  }, [colour]);

  // The circle is sized by its container (the modal decides how big), so the
  // backing store has to be rebuilt — and strokes replayed — whenever that
  // fraction changes, same reasoning as the drawing round's own board canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const observer = new ResizeObserver(() => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      redraw();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useImperativeHandle(
    ref,
    () => ({
      clear() {
        strokesRef.current = [];
        liveStrokeRef.current = null;
        redraw();
        onChange([]);
      },
      undo() {
        strokesRef.current = strokesRef.current.slice(0, -1);
        redraw();
        onChange(strokesRef.current);
      },
    }),
    [redraw, onChange],
  );

  function pointFrom(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height),
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    liveStrokeRef.current = [pointFrom(event)];
    redraw();
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!liveStrokeRef.current) {
      return;
    }
    liveStrokeRef.current.push(pointFrom(event));
    redraw();
  }

  // pointerup and pointercancel both land here: cancelling mid-stroke commits
  // whatever exists rather than losing it, same as the game canvas does.
  function endStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    const points = liveStrokeRef.current;
    liveStrokeRef.current = null;
    if (!points || points.length === 0) {
      return;
    }
    points.push(pointFrom(event));
    strokesRef.current = [...strokesRef.current, { points }];
    redraw();
    onChange(strokesRef.current);
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label="Draw your avatar"
      className="h-full w-full cursor-crosshair touch-none rounded-full bg-white"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
    />
  );
});
