"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sections } from "@/lib/sections";
import { CrystalIcon, Icon, RingIcon } from "@/components/icons";
import { unlockAudio } from "./audio";
import { bitColor } from "./Items";
import { useGameStore } from "./store";

// The game overlay (PLAN.md Step 26): small and quiet so the scenery stays the show.

const chip = "glass flex items-center gap-2 rounded-full px-2.5 py-2 text-white sm:px-3";
const button =
  "glass grid size-10 place-items-center rounded-full text-white transition-colors sm:size-11 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function Hud({ veil = true }: { veil?: boolean }) {
  const status = useGameStore((s) => s.status);
  const rings = useGameStore((s) => s.rings);
  const collected = useGameStore((s) => s.collected);
  const lastBit = useGameStore((s) => s.lastBit);
  const sound = useGameStore((s) => s.sound);
  const hidden = status === "finished";

  return (
    <>
      {/* Covers the route change from the hero; lifts once the scene has loaded, during the camera swing. */}
      {veil && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-[#f2a7a0] transition-opacity duration-700 ease-out ${status === "loading" ? "opacity-100" : "opacity-0"}`}
        />
      )}

      <div className={`pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3 sm:gap-3 sm:p-4 transition-opacity duration-500 ${hidden ? "opacity-0" : ""}`}>
        <div className={`${chip} hud-text`} aria-label={`${rings} rings`}>
          <RingIcon className="size-6" />
          <span className="min-w-[2ch] font-mono text-lg font-bold tabular-nums">{rings}</span>
        </div>

        <ol className={`${chip} order-last mx-auto gap-1.5 sm:order-none sm:mx-0`} aria-label="Data bits">
          {sections.map((s) => {
            const got = collected.includes(s.id);
            return (
              <li
                key={s.id}
                title={s.name}
                className="transition-[transform,color] duration-300"
                style={{ transform: got ? "scale(1.15)" : "scale(1)", color: got ? bitColor(s.id) : "rgb(255 255 255 / 0.18)" }}
              >
                <CrystalIcon className="size-5" />
                <span className="sr-only">
                  {s.name} {got ? "collected" : "not yet"}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            className={button}
            aria-pressed={sound}
            aria-label={sound ? "Sound on" : "Sound off"}
            onClick={() => {
              unlockAudio();
              useGameStore.getState().toggleSound(); // <Music> in the root layout follows this
            }}
          >
            <Icon name={sound ? "sound" : "mute"} />
          </button>
          <button type="button" className={button} aria-label="Pause" onClick={() => useGameStore.getState().togglePause()}>
            <Icon name="pause" />
          </button>
          <Link href="/#portfolio" className={`${chip} pointer-events-auto font-semibold hover:bg-white/20`}>
            <span className="hidden sm:inline">Skip</span>
            <span className="sr-only sm:hidden">Skip</span>
            <Icon name="skip" className="size-4" />
          </Link>
        </div>
      </div>

      <Hint show={status === "intro" || status === "running"} />
      <BitBloom bit={lastBit} />
      {status === "paused" && <Pause />}

      <p aria-live="polite" className="sr-only">
        {lastBit ? `${sections.find((s) => s.id === lastBit.id)?.name} unlocked` : ""}
      </p>
    </>
  );
}

// One line of controls for the first seconds, then gone.
function Hint({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);
  return (
    <p
      className={`glass pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full px-5 py-2.5 text-center text-sm text-white transition-opacity duration-700 ${show && visible ? "opacity-100" : "opacity-0"}`}
    >
      <b>Tap</b> or <b>Space</b> to jump · tap again to flip · <b>hold</b> to glide
    </p>
  );
}

// A collected bit's name blooms in the middle of the screen and drifts away.
function BitBloom({ bit }: { bit: { id: string; at: number } | null }) {
  if (!bit) return null;
  const s = sections.find((x) => x.id === bit.id)!;
  const color = bitColor(s.id);
  return (
    <div key={bit.at} aria-hidden className="pointer-events-none absolute inset-x-0 top-[22%] flex animate-bloom flex-col items-center gap-1">
      <span className="font-mono text-xs uppercase tracking-[0.35em] text-white/85 soft-glow">Data bit {String(sections.indexOf(s) + 1).padStart(2, "0")}</span>
      <span className="font-display text-5xl text-white sm:text-6xl" style={{ textShadow: `0 0 28px ${color}, 0 0 8px ${color}, 0 3px 12px rgb(42 20 80 / 0.6)` }}>
        {s.name}
      </span>
    </div>
  );
}

function Pause() {
  const g = useGameStore.getState();
  return (
    <div className="absolute inset-0 grid place-items-center bg-dusk/40 backdrop-blur-sm">
      <div role="dialog" aria-label="Paused" className="glass flex w-72 flex-col gap-2 rounded-3xl p-6 text-white animate-rise">
        <p className="mb-2 text-center font-display text-3xl soft-glow">Paused</p>
        <button type="button" autoFocus className="rounded-full bg-white py-3 font-semibold text-dusk hover:bg-peach" onClick={() => g.togglePause()}>
          Resume
        </button>
        <button type="button" className="rounded-full py-3 font-semibold hover:bg-white/15" onClick={() => g.restart()}>
          Restart
        </button>
        <Link href="/" className="rounded-full py-3 text-center font-semibold hover:bg-white/15">
          Back to home
        </Link>
      </div>
    </div>
  );
}
