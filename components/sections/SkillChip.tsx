"use client";

import { ringNote } from "@/components/game/audio";

// One counter for every chip, so running the pointer along a row climbs the scale like rings do.
let note = 0;

// A skill "power-up" chip that plays the next ring note when the mouse enters it or it's tapped.
// Silent unless sound is on (ringNote checks); purely decorative, so no keyboard trigger.
export default function SkillChip({ label }: { label: string }) {
  return (
    <li
      onPointerEnter={(e) => e.pointerType === "mouse" && ringNote(note++)}
      onPointerDown={(e) => e.pointerType !== "mouse" && ringNote(note++)}
      className="-skew-x-6 cursor-default border-2 border-(--bit) bg-night px-3 py-1 text-sm font-semibold shadow-[0_0_10px_var(--bit)] transition-colors duration-150 hover:bg-(--bit) hover:text-night"
    >
      <span className="inline-block skew-x-6">{label}</span>
    </li>
  );
}
