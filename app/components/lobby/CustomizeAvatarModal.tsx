"use client";

import { useRef, useState } from "react";
import type { AppSocket } from "@/app/socket-provider";
import { CLIENT_EVENTS } from "@/shared/events";
import type { AvatarStroke, Player } from "@/shared/types";
import {
  AvatarCanvasEditor,
  type AvatarCanvasEditorHandle,
} from "./AvatarCanvasEditor";

interface CustomizeAvatarModalProps {
  onClose: () => void;
  player: Player;
  socket: AppSocket;
}

// Percentages measured off the source art (public/images/avatar/avatar-card.png,
// a 613x591 crop) so the circle and buttons land exactly where the artist drew
// them, regardless of how large the card renders.
const CIRCLE = { left: 17.14, top: 13.63, width: 66.94, height: 69.6 };
const UNDO_BUTTON = { left: 7.27, top: 86.03, width: 17.06, height: 10.5 };
const CANCEL_BUTTON = { left: 26.53, top: 85.18, width: 28.24, height: 11.6 };
const SAVE_BUTTON = { left: 61.55, top: 83.99, width: 30.69, height: 10.84 };

function pct(box: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return {
    left: `${box.left}%`,
    top: `${box.top}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  };
}

export function CustomizeAvatarModal({
  onClose,
  player,
  socket,
}: CustomizeAvatarModalProps) {
  const editorRef = useRef<AvatarCanvasEditorHandle>(null);
  // Tracked here (not read from the editor on demand) so Save always has the
  // latest strokes and Undo can be disabled once there is nothing left.
  const [strokes, setStrokes] = useState<AvatarStroke[]>(
    player.avatarDrawing ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setSaving(true);
    setError(null);
    socket.emit(CLIENT_EVENTS.SAVE_AVATAR_DRAWING, { strokes }, (result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onClose();
    });
  }

  return (
    <div
      className="customize-avatar-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Customize your avatar"
    >
      <div
        className="relative w-full max-w-sm"
        style={{ aspectRatio: "613 / 591" }}
      >
        <div
          aria-hidden
          className="art-avatar-card absolute inset-0 h-full w-full"
        />

        <div
          className="absolute overflow-hidden rounded-full"
          style={pct(CIRCLE)}
        >
          <AvatarCanvasEditor
            ref={editorRef}
            colour={player.colour}
            initialStrokes={player.avatarDrawing ?? []}
            onChange={setStrokes}
          />
          <div
            aria-hidden
            className="art-avatar-circle-ring pointer-events-none absolute inset-0 h-full w-full"
          />
        </div>

        <button
          type="button"
          onClick={() => editorRef.current?.undo()}
          disabled={strokes.length === 0}
          aria-label="Undo last stroke"
          className="absolute transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          style={pct(UNDO_BUTTON)}
        >
          <span
            aria-hidden
            className="art-avatar-undo-button block h-full w-full"
          />
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel"
          className="absolute transition-transform hover:scale-105 active:scale-95"
          style={pct(CANCEL_BUTTON)}
        >
          <span
            aria-hidden
            className="art-avatar-cancel-button block h-full w-full"
          />
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          aria-label="Save"
          className="absolute transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
          style={pct(SAVE_BUTTON)}
        >
          <span
            aria-hidden
            className="art-avatar-save-button block h-full w-full"
          />
        </button>

        {error && (
          <p className="absolute inset-x-0 top-full mt-2 text-center text-sm font-semibold text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
