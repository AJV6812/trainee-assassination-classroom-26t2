"use client";

import { useEffect, useState, type RefObject } from "react";
import {
  SECRET_DISPLAY_BASE_HEIGHT,
  SECRET_DISPLAY_BASE_WIDTH,
  SecretDisplay,
} from "@/app/components/lobby/SecretDisplay";
import {
  ROSTER,
  SECRET_CARD_GAP,
} from "@/app/components/drawing-round/geometry";
import type { PlayerSecret } from "@/shared/types";

interface FloatingSecretCardProps {
  // The 16:9 stage the card measures itself against.
  frameRef: RefObject<HTMLDivElement | null>;
  secret: PlayerSecret;
}

const CARD_WIDTH_PCT = ROSTER.width;

export function FloatingSecretCard({
  frameRef,
  secret,
}: FloatingSecretCardProps) {
  const [pos, setPos] = useState<{
    left: number;
    top: number;
    scale: number;
  } | null>(null);

  useEffect(() => {
    const maybeFrame = frameRef.current;
    if (!maybeFrame) {
      return;
    }
    const frame = maybeFrame;

    function recompute() {
      const rect = frame.getBoundingClientRect();
      const scale =
        (rect.width * (CARD_WIDTH_PCT / 100)) / SECRET_DISPLAY_BASE_WIDTH;
      const rosterCentre =
        rect.left + ((ROSTER.left + ROSTER.width / 2) / 100) * rect.width;
      const height = SECRET_DISPLAY_BASE_HEIGHT * scale;
      const top = Math.max(
        SECRET_CARD_GAP,
        rect.top - height - SECRET_CARD_GAP,
      );
      setPos({ left: rosterCentre, top, scale });
    }

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(frame);
    window.addEventListener("resize", recompute);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [frameRef]);

  if (!pos) {
    return null;
  }

  return (
    <div
      className="fixed z-20"
      style={{
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        transform: "translateX(-50%)",
      }}
    >
      <SecretDisplay secret={secret} scale={pos.scale} />
    </div>
  );
}
