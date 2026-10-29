"use client";

import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import type { SectionId } from "@/lib/sections";
import GameScene, { type Input } from "./GameScene";
import { freshArrival } from "./handoff";
import Hud from "./Hud";
import Results from "./Results";
import { useGameStore } from "./store";
import { useQualityDpr } from "@/components/three/quality";

const JUMP_KEYS = new Set([" ", "arrowup", "w"]);

export default function Game({ sections }: { sections: Record<SectionId, ReactNode> }) {
  const status = useGameStore((s) => s.status);
  const runId = useGameStore((s) => s.runId);
  const reduced = useReducedMotion() ?? false;
  const input = useRef<Input>({ pressed: false, held: false });
  const dpr = useQualityDpr();

  useEffect(() => {
    useGameStore.getState().boot(freshArrival());
  }, []);
  // Before boot runs the store still holds the last run, so read the hand-over directly.
  const arrivalImage = useGameStore((s) => s.arrival?.image) ?? freshArrival()?.image;

  // Keyboard: Space / Up / W jump (hold to glide), Esc / P pause.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (JUMP_KEYS.has(k)) {
        if (!e.repeat) input.current.pressed = true;
        input.current.held = true;
      } else if (k === "escape" || k === "p") useGameStore.getState().togglePause();
      else return;
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      if (JUMP_KEYS.has(e.key.toLowerCase())) input.current.held = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // A hidden tab stops the frame loop anyway; pausing means the player comes back to the pause menu, not mid-jump.
  useEffect(() => {
    const hide = () => document.hidden && useGameStore.getState().status === "running" && useGameStore.getState().togglePause();
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  const playing = status === "running" || status === "intro" || status === "finale";

  return (
    <div className="fixed inset-0 select-none bg-[#f2a7a0]">
      {/* Tap or click anywhere to jump; keep holding to glide. */}
      <div
        className="absolute inset-0 touch-none"
        onPointerDown={(e) => {
          if (!playing || e.button !== 0) return;
          input.current.pressed = true;
          input.current.held = true;
        }}
        onPointerUp={() => (input.current.held = false)}
        onPointerCancel={() => (input.current.held = false)}
        onPointerLeave={() => (input.current.held = false)}
      >
        <Canvas flat camera={{ fov: 40, near: 0.3, far: 2000 }} dpr={dpr} gl={{ antialias: false }} frameloop={status === "paused" ? "never" : "always"}>
          <fog attach="fog" args={["#f2a7a0", 50, 320]} />
          <Suspense fallback={null}>
            <GameScene key={runId} inputRef={input} reduced={reduced} />
          </Suspense>
        </Canvas>
      </div>
      {arrivalImage && <HeroFrame src={arrivalImage} hidden={status !== "loading"} />}
      <Hud veil={!arrivalImage} />
      <Results sections={sections} />
    </div>
  );
}

// The hero's last frame, held over the page swap and faded once the game has drawn the same view.
export function HeroFrame({ src, hidden = false }: { src: string; hidden?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a data URL snapshot of the hero canvas, nothing to optimize
    <img
      src={src}
      alt=""
      aria-hidden
      className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-300 ${hidden ? "opacity-0 delay-200" : "opacity-100"}`}
    />
  );
}
