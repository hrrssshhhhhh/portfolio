"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { sections, type SectionId } from "@/lib/sections";
import { CrystalIcon, Icon, RingIcon } from "@/components/icons";
import { bitColor } from "./Items";
import { useGameStore } from "./store";

// The finale panel (PLAN.md Step 24): it rises once the crystal has re-formed. Every section
// is here, server-rendered, one tab per data bit; the full page is one click away.
export default function Results({ sections: content }: { sections: Record<SectionId, ReactNode> }) {
  const status = useGameStore((s) => s.status);
  const rings = useGameStore((s) => s.rings);
  const time = useGameStore((s) => s.time);
  const best = useGameStore((s) => s.bestRings);
  const [tab, setTab] = useState<SectionId>("about");
  if (status !== "finished") return null;

  return (
    <div className="absolute inset-0 flex items-end justify-end p-3 sm:p-6 md:items-center">
      <section
        aria-labelledby="results-title"
        className="glass flex max-h-[58svh] w-full flex-col overflow-hidden rounded-3xl text-white animate-rise md:max-h-[86svh] md:w-[min(560px,48vw)]"
      >
        <header className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-white/15 px-5 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/70">5 / 5 data bits</p>
            <h2 id="results-title" className="font-display text-2xl soft-glow sm:text-4xl">
              Portfolio restored
            </h2>
          </div>
          <dl className="flex gap-4 font-mono text-sm">
            <div className="flex items-center gap-1.5">
              <RingIcon className="size-5" />
              <dt className="sr-only">Rings</dt>
              <dd className="tabular-nums">{rings}</dd>
            </div>
            <div>
              <dt className="sr-only">Time</dt>
              <dd className="tabular-nums">{time.toFixed(1)}s</dd>
            </div>
            <div className="text-white/60">
              <dt className="inline">best </dt>
              <dd className="inline tabular-nums">{best}</dd>
            </div>
          </dl>
        </header>

        <div role="tablist" aria-label="Sections" className="flex shrink-0 gap-1 overflow-x-auto px-4 py-2.5">
          {sections.map((s) => (
            <button
              key={s.id}
              role="tab"
              type="button"
              aria-selected={tab === s.id}
              aria-controls={`panel-${s.id}`}
              onClick={() => setTab(s.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${tab === s.id ? "bg-white text-dusk" : "hover:bg-white/15"}`}
            >
              <span style={{ color: bitColor(s.id) }}>
                <CrystalIcon className="size-4" />
              </span>
              {s.name}
            </button>
          ))}
        </div>

        {/* The section itself, scrollable. Its own styles assume the night background. */}
        <div id={`panel-${tab}`} role="tabpanel" className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-night/70 [&_section]:!py-8 [&>*]:!min-h-0">
          {content[tab]}
        </div>

        <footer className="flex shrink-0 flex-wrap gap-2 border-t border-white/15 p-3 sm:p-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-dusk transition-colors hover:bg-peach"
            onClick={() => useGameStore.getState().restart()}
          >
            <Icon name="replay" className="size-4" /> Play again
          </button>
          <Link href="/#portfolio" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition-colors hover:bg-white/15">
            Full portfolio
          </Link>
          <Link href="/blog" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition-colors hover:bg-white/15">
            Read the blog →
          </Link>
          <Link href="/" className="ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-semibold transition-colors hover:bg-white/15">
            <Icon name="home" className="size-4" /> Home
          </Link>
        </footer>
      </section>
    </div>
  );
}
