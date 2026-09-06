"use client";

import { useState, useSyncExternalStore } from "react";
import FinalGuess from "./FinalGuess";

const PREVIEW_AS_IMPOSTER: boolean = true;

const PLAYERS = [
  { id: "p1", nickname: "Ari", colour: "#5b92b9" },
  { id: "p2", nickname: "Jo", colour: "#5e875b" },
  { id: "p3", nickname: "Kai", colour: "#9a6324" },
];

const IMPOSTER_ID = "p1";

const PHASE_MS = 20_000;

const neverChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

const PREVIEW_DEADLINE = Date.now() + PHASE_MS;

export default function FinalGuessMockup() {
  const mounted = useSyncExternalStore(neverChanges, onClient, onServer);
  const [submitted, setSubmitted] = useState(false);

  return (
    <FinalGuess
      isImposter={PREVIEW_AS_IMPOSTER}
      imposterId={IMPOSTER_ID}
      imposterName="Ari"
      imposterColour="#5b92b9"
      players={PLAYERS}
      secret={
        PREVIEW_AS_IMPOSTER
          ? { isImposter: true, category: "a piece of technology" }
          : { category: "a piece of technology", word: "constellation" }
      }
      phaseEndsAt={mounted ? PREVIEW_DEADLINE : null}
      submitted={submitted}
      errorMessage={null}
      onSubmit={() => setSubmitted(true)}
      board={<div className="h-full w-full" />}
    />
  );
}
