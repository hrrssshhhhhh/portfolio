"use client";

import { useEffect, useRef, useState } from "react";
import { CrystalIcon } from "@/components/icons";

// A section's "Data bit 03 / Skills" line. Labels still below the screen when the page loads
// start locked (dim crystal, faint text); the first time one scrolls into view its crystal pops
// and lights and the label types in. Once per visit, scroll-driven only. Anything already on
// screen, reduced motion, or no JavaScript: it just shows as normal.
export default function BitLabel({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [state, setState] = useState<"static" | "locked" | "unlocked">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < innerHeight) return; // already visible: no replay on load
    setState("locked");
    const observer = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setState("unlocked");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <p ref={ref} data-bit={state} className="bit-label flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-haze">
      <CrystalIcon className="bit-crystal size-5 text-(--bit) drop-shadow-[0_0_6px_var(--bit)]" />
      <span className="bit-text" style={{ "--chars": text.length } as React.CSSProperties}>
        {text}
      </span>
    </p>
  );
}
