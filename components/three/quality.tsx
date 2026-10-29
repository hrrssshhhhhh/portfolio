"use client";

import { useEffect } from "react";
import { PerformanceMonitor } from "@react-three/drei";
import { create } from "zustand";

// Quality tiers from PLAN.md Step 27, dropped one at a time when the frame rate sags:
// 4 everything → 3 no pond mirror → 2 shorter bloom (fewer mip levels), no MSAA → 1 pixel ratio 1 → 0 no petals.
// Module-level store, so a slow device stays stepped down from the hero into the game.
export const TOP_TIER = 4;
export const useQuality = create<{ tier: number; step: (by: number) => void }>((set) => ({
  tier: TOP_TIER,
  step: (by) => set((s) => ({ tier: Math.min(TOP_TIER, Math.max(0, s.tier + by)) })),
}));

// For the <Canvas dpr> prop: the Canvas re-applies its prop on every render, so setDpr() wouldn't stick.
export const useQualityDpr = (): number | [number, number] => (useQuality((s) => s.tier) >= 2 ? [1, 1.75] : 1);

const BOUNDS = (refresh: number): [number, number] => [40, Math.min(90, refresh * 0.9)];

// Drop inside a <Canvas>: watches fps and moves the tier.
export function QualityMonitor() {
  // Test hook (dev, or ?debug): pin a tier with __quality.setState({ tier, step: () => {} }).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || new URLSearchParams(location.search).has("debug")) Object.assign(window, { __quality: useQuality });
  }, []);
  const { step } = useQuality.getState();
  // drei's default bounds on a 60 Hz screen are [50, 60]: fps can never beat 60, so one hitch
  // (a hover, a flip) stepped quality down for good. Drop only when clearly struggling; climb back near refresh.
  return <PerformanceMonitor bounds={BOUNDS} flipflops={3} onDecline={() => step(-1)} onIncline={() => step(1)} />;
}
