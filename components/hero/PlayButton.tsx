"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { unlockAudio } from "@/components/game/audio";
import { handoff } from "@/components/game/handoff";
import { useHeroStore } from "./heroStore";

const HANDOFF_MS = 1500; // the fox runs down the path and the camera reaches the game's view (just after SWING in HeroScene)

export default function PlayButton({ className }: { className?: string }) {
  const router = useRouter();
  const hero = useHeroStore.getState;
  const ready = () => {
    router.prefetch("/play");
    void import("@/components/game/Game"); // the game chunk, so /play opens instantly
    hero().wake(true);
  };
  const settle = () => {
    if (!hero().playing) hero().wake(false);
  };

  return (
    <Link
      href="/play"
      className={className}
      onPointerEnter={ready}
      onPointerLeave={settle}
      onFocus={ready}
      onBlur={settle}
      onClick={(e) => {
        // Let new-tab clicks behave normally.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        unlockAudio();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        e.preventDefault();
        hero().play();
        setTimeout(() => {
          const { d, v } = handoff.run;
          handoff.arrival = { d, speed: v, image: handoff.capture?.() ?? "", at: performance.now() };
          router.push("/play");
        }, HANDOFF_MS);
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
        <path d="M6 4l14 8-14 8z" />
      </svg>
      Play
    </Link>
  );
}
