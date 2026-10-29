"use client";

import { useEffect, useState } from "react";
import { CrystalIcon } from "@/components/icons";
import { sections, type SectionId } from "@/lib/sections";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky";

// Side HUD: lights each data bit once its section has been scrolled to. Wide screens only, so it never covers content.
export default function BitRail() {
  const [current, setCurrent] = useState<SectionId | null>(null);
  const [found, setFound] = useState<ReadonlySet<SectionId>>(new Set());

  useEffect(() => {
    // A section counts as current while it crosses the middle of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id as SectionId;
          if (e.isIntersecting) {
            setCurrent(id);
            setFound((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
          } else {
            setCurrent((c) => (c === id ? null : c));
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Data bits"
      className={`fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-1 transition-opacity duration-300 xl:flex ${current ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-haze">
        {found.size}/{sections.length}
      </p>
      {sections.map((s, i) => {
        const isCurrent = current === s.id;
        const isFound = found.has(s.id);
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={isCurrent ? "location" : undefined}
            className={`group flex min-h-11 items-center gap-3 ${focusRing}`}
          >
            <span
              className={`rounded-sm bg-night-2 px-2 py-1 font-mono text-xs uppercase tracking-widest transition-opacity duration-200 text-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100`}
            >
              {String(i + 1).padStart(2, "0")} {s.name}
            </span>
            <span
              className={`transition-[color,filter] duration-200 ${isFound ? "" : "text-line"} ${isCurrent ? "drop-shadow-[0_0_8px_currentColor]" : ""}`}
              style={isFound ? { color: `var(--color-${s.color})` } : undefined}
            >
              <CrystalIcon className={`transition-[width,height] duration-200 ${isCurrent ? "size-7" : "size-5"}`} />
            </span>
          </a>
        );
      })}
    </nav>
  );
}
