"use client";

import { useEffect } from "react";
import { pauseAudio, startMusic, stopMusic, unlockAudio } from "@/components/game/audio";
import { useGameStore } from "@/components/game/store";

// The background groove, site-wide: it lives in the root layout, so it keeps playing from the
// home page into /play. Follows the one sound toggle (hero "Play with sound", game HUD).
export default function Music() {
  const sound = useGameStore((s) => s.sound);
  useEffect(() => {
    if (!sound) return;
    startMusic();
    // Sound saved on from a past visit: browsers hold audio until the first tap or key press.
    const unlock = () => unlockAudio();
    const hide = () => pauseAudio(document.hidden);
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", hide);
      stopMusic();
    };
  }, [sound]);
  return null;
}
