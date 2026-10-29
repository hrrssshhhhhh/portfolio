"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import type { SectionId } from "@/lib/sections";
import { freshArrival } from "./handoff";

// WebGL only runs in the browser. While the game chunk mounts, keep showing the hero's last frame.
const Game = dynamic(() => import("./Game"), {
  ssr: false,
  loading: () => {
    const a = freshArrival();
    // eslint-disable-next-line @next/next/no-img-element -- data URL snapshot, nothing to optimize
    return a?.image ? <img src={a.image} alt="" aria-hidden className="fixed inset-0 size-full object-cover" /> : null;
  },
});

export default function GameLoader({ sections }: { sections: Record<SectionId, ReactNode> }) {
  return <Game sections={sections} />;
}
