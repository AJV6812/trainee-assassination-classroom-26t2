"use client";

import { useEffect, useRef } from "react";
import type { AvatarStroke } from "@/shared/types";
import { paintAvatarStrokes } from "./avatarCanvas";

interface AvatarBlobProps {
  colour: string;
  initial: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  // Undefined (or empty) falls back to the colour-and-initial blob below —
  // the same component either way, so every place that already renders an
  // AvatarBlob picks up a saved drawing for free.
  avatarDrawing?: AvatarStroke[];
}

function dimensionClassFor(size: "sm" | "md" | "lg") {
  return size === "sm"
    ? "h-10 w-10 text-sm"
    : size === "lg"
      ? "h-20 w-20 text-2xl"
      : "h-16 w-16 text-xl";
}

// Placeholder avatar: a colour blob with an initial.
export function AvatarBlob({
  colour,
  initial,
  size = "md",
  className,
  avatarDrawing,
}: AvatarBlobProps) {
  const dimensionClass = className ?? dimensionClassFor(size);

  if (avatarDrawing && avatarDrawing.length > 0) {
    return (
      <DrawnAvatar
        colour={colour}
        strokes={avatarDrawing}
        dimensionClass={dimensionClass}
      />
    );
  }

  return (
    <div
      className={`avatar-blob flex items-center justify-center rounded-full font-bold text-white ${dimensionClass}`}
      style={{ backgroundColor: colour }}
    >
      {initial}
    </div>
  );
}

// A white backing behind the canvas's own transparent pixels, so the sketch
// still reads clearly regardless of what sits behind the avatar — a lobby
// card or the drawing round's own patterned background.
function DrawnAvatar({
  colour,
  strokes,
  dimensionClass,
}: {
  colour: string;
  strokes: AvatarStroke[];
  dimensionClass: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    paintAvatarStrokes(ctx, strokes, colour, canvas.width, canvas.height);
  }, [colour, strokes]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`avatar-blob rounded-full bg-white ${dimensionClass}`}
    />
  );
}
