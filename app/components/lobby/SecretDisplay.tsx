"use client";

import { useRef } from "react";
import { useFitFontSize } from "@/app/lib/useFitFontSize";
import type { PlayerSecret } from "@/shared/types";

interface SecretDisplayProps {
  secret: PlayerSecret;
  // Overrides the default fixed-px sizing below — FloatingSecretCard passes
  // one computed off the drawing frame's width so the card scales with the
  // rest of that responsive layout instead of staying a constant pixel size.
  scale?: number;
}

const IMPOSTER_TEXT_MAX_PX = 14;
const WORD_TEXT_MAX_PX = 20;
const TEXT_MIN_PX = 6;
const TEXT_STEP_PX = 0.25;
const DEFAULT_IMPOSTER_SCALE = 1.2;
const DEFAULT_WORD_SCALE = 1.6;
export const SECRET_DISPLAY_BASE_WIDTH = 320;
export const SECRET_DISPLAY_BASE_HEIGHT = 140;

export function SecretDisplay({
  secret,
  scale: scaleProp,
}: SecretDisplayProps) {
  const isImposter = "isImposter" in secret;
  const textRef = useRef<HTMLParagraphElement>(null);
  const text = isImposter
    ? `Hint: ${secret.category}`
    : `The Word: ${secret.word}`;
  const fontSize = useFitFontSize(textRef, text, {
    min: TEXT_MIN_PX,
    max: isImposter ? IMPOSTER_TEXT_MAX_PX : WORD_TEXT_MAX_PX,
    step: TEXT_STEP_PX,
  });

  const card = isImposter ? (
    <>
      <div
        className="frame-imposter-chameleon-reveal absolute top-0 left-0 w-35 h-80"
        style={{
          transform: "rotate(-90deg) translateX(-100%)",
          transformOrigin: "top left",
        }}
        aria-hidden
      />
      <div className="absolute left-29 right-4 top-2 bottom-12 flex flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-bold text-red-600">YOU ARE AN IMPOSTER!</p>
        <p
          ref={textRef}
          className="flex h-14 w-full items-center justify-center overflow-hidden px-1 text-center leading-tight font-bold text-black"
          style={{ fontSize: `${fontSize}px` }}
        >
          {text}
        </p>
      </div>
    </>
  ) : (
    <>
      <div
        className="frame-non-imposter-card absolute top-0 left-0 w-80 h-35"
        aria-hidden
      />

      <div className="absolute left-5 right-5 top-7 bottom-4 flex flex-col items-center justify-center gap-1 text-center">
        <p
          ref={textRef}
          className="flex h-8 w-full items-center justify-center overflow-hidden px-1 text-center leading-tight font-bold text-black"
          style={{ fontSize: `${fontSize}px` }}
        >
          {text}
        </p>
      </div>
    </>
  );

  const scale =
    scaleProp ?? (isImposter ? DEFAULT_IMPOSTER_SCALE : DEFAULT_WORD_SCALE);

  return (
    <div
      style={{
        width: SECRET_DISPLAY_BASE_WIDTH * scale,
        height: SECRET_DISPLAY_BASE_HEIGHT * scale,
      }}
    >
      <div
        className="relative h-35 w-[320px] overflow-hidden"
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {card}
      </div>
    </div>
  );
}
