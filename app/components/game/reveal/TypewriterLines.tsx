"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

interface TypewriterLinesProps {
  lines: string[];
  onDone?: () => void;
  className?: string;
  style?: CSSProperties;
  typeMs?: number;
  holdMs?: number;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

interface Segment {
  text: string;
  startMs: number;
  typeDurMs: number;
}

function buildSegments(
  lines: string[],
  typeMs: number,
  holdMs: number,
): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  lines.forEach((text, index) => {
    const typeDurMs = text.length * typeMs;
    segments.push({ text, startMs: cursor, typeDurMs });
    cursor += typeDurMs + (index < lines.length - 1 ? holdMs : 0);
  });
  return segments;
}

const TICK_MS = 1000 / 30;

export function TypewriterLines({
  lines,
  onDone,
  className,
  style,
  typeMs = 40,
  holdMs = 1000,
}: TypewriterLinesProps) {
  const reducedMotion = usePrefersReducedMotion();
  const perChar = reducedMotion ? 0 : typeMs;

  const linesKey = lines.join("\n");
  const segments = buildSegments(lines, perChar, holdMs);
  const last = segments[segments.length - 1];
  const totalMs = last ? last.startMs + last.typeDurMs : 0;

  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (totalMs <= 0) {
      return;
    }
    const start = performance.now();
    const id = setInterval(() => {
      const next = performance.now() - start;
      setElapsedMs(next >= totalMs ? totalMs : next);
      if (next >= totalMs) {
        clearInterval(id);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [linesKey, totalMs]);

  // Ref'd so an inline-arrow onDone doesn't re-fire the effect every render.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const firedDoneRef = useRef(false);
  useEffect(() => {
    firedDoneRef.current = false;
  }, [linesKey]);
  useEffect(() => {
    if (!firedDoneRef.current && totalMs > 0 && elapsedMs >= totalMs) {
      firedDoneRef.current = true;
      onDoneRef.current?.();
    }
  }, [elapsedMs, totalMs]);

  if (segments.length === 0) {
    return null;
  }

  let activeIndex = 0;
  for (let i = 0; i < segments.length; i++) {
    if (elapsedMs >= segments[i].startMs) {
      activeIndex = i;
    }
  }
  const active = segments[activeIndex];
  const shownChars =
    perChar <= 0
      ? active.text.length
      : Math.min(
          active.text.length,
          Math.floor((elapsedMs - active.startMs) / perChar),
        );
  const lineDone = shownChars >= active.text.length;

  return (
    <p className={className} style={style}>
      <span aria-hidden>{active.text.slice(0, Math.max(0, shownChars))}</span>
      {/* Screen readers get each finished line once, not every keystroke. */}
      <span className="sr-only" aria-live="polite">
        {lineDone ? active.text : ""}
      </span>
      <span aria-hidden className="ml-0.5 inline-block animate-pulse">
        ▍
      </span>
    </p>
  );
}
