"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useHeroStore } from "./heroStore";

// WebGL only runs in the browser; a CSS sky in the same colors shows until it loads.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

export default function HeroStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const playing = useHeroStore((s) => s.playing);
  const reset = useHeroStore((s) => s.reset);
  const ready = useHeroStore((s) => s.ready);

  // Coming back to the page (e.g. browser Back) shows the whole crystal and a sleeping fox again.
  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <section
      ref={ref}
      data-playing={playing || undefined}
      className="group hero-dusk relative isolate min-h-svh overflow-hidden text-white"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <HeroScene eventSource={ref} reduced={reduced} />
        {/* A still of this exact scene, so the first paint already looks finished on a slow
            connection; fades once the live scene has drawn. Portrait below the camera's 0.9 cut-off. */}
        <picture className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}>
          <source media="(max-aspect-ratio: 9/10)" srcSet="/hero-poster-portrait.jpg" />
          <img src="/hero-poster.jpg" alt="" fetchPriority="high" className="size-full object-cover" />
        </picture>
      </div>
      {/* Soft shade behind the text column so it reads over a bright sunset. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-violet/75 via-violet/25 to-transparent md:via-violet/10" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-violet/60 to-transparent" />
      {children}
    </section>
  );
}
