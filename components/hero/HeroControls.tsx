"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { unlockAudio } from "@/components/game/audio";
import { useGameStore } from "@/components/game/store";

// The saved game state lives in localStorage, so read it only after hydration.
const subscribe = (cb: () => void) => useGameStore.persist.onFinishHydration(cb);
const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => useGameStore.persist.hasHydrated(),
    () => false,
  );

// "Play with sound": remembered for the game; the click itself unlocks audio.
export function SoundToggle({ className = "" }: { className?: string }) {
  const sound = useGameStore((s) => s.sound);
  const on = useHydrated() && sound;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        unlockAudio();
        useGameStore.getState().toggleSound();
      }}
      className={`glass inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-colors hover:bg-white/15 ${className}`}
    >
      <Icon name={on ? "sound" : "mute"} className="size-4" />
      {on ? "Sound on" : "Play with sound"}
    </button>
  );
}

// Returning players who finished a run see the crystal they restored.
export function RestoredBadge() {
  const done = useGameStore((s) => s.finishedOnce);
  const best = useGameStore((s) => s.bestRings);
  if (!useHydrated() || !done) return null;
  return (
    <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm text-white">
      <span className="size-2 rounded-full bg-sun shadow-[0_0_10px_var(--color-sun)]" aria-hidden />
      5/5 restored · best {best} rings
    </p>
  );
}
