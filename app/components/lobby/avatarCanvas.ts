import type { AvatarStroke } from "@/shared/types";

// Shared between the live editor and the small read-only display everywhere
// else, so both draw the same stroke data the same way. Points are 0..1,
// same convention the game's own canvas uses, so this scales cleanly to
// whatever pixel size the caller's canvas actually is.
export function paintAvatarStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: AvatarStroke[],
  colour: string,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(2, width * 0.025);

  for (const stroke of strokes) {
    const [first, ...rest] = stroke.points;
    if (!first) {
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(first.x * width, first.y * height);
    for (const point of rest) {
      ctx.lineTo(point.x * width, point.y * height);
    }
    // A tap with no drag still leaves a dot, thanks to the round line cap.
    if (rest.length === 0) {
      ctx.lineTo(first.x * width, first.y * height);
    }
    ctx.stroke();
  }
}
