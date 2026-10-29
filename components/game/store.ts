import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { BeatId } from "@/lib/level";
import type { SectionId } from "@/lib/sections";

// One place that knows where the player is. The 3D scene reads it every frame with
// `useGameStore.getState()` (no re-render); the HUD subscribes to the few fields it shows.
//
// loading → intro (camera swings from the hero framing to the side view) → running →
// finale (launch, crystal re-forms) → finished (results panel). paused can interrupt running.

export type Status = "loading" | "intro" | "running" | "paused" | "finale" | "finished";
export type Note = { i: number; t: number }; // ring index in the scale, seconds into the run
export type Arrival = { d: number; speed: number; image: string }; // a run handed over from the hero

type GameState = {
  runId: number; // bumps on every new run, so the 3D scene rebuilds from the start
  status: Status;
  beat: BeatId;
  rings: number;
  notes: Note[];
  collected: SectionId[]; // data bits picked up this run
  lastBit: { id: SectionId; at: number } | null; // drives the name bloom
  time: number; // seconds of play this run (finale panel)
  arrival: Arrival | null; // set when the hero's fox ran straight into this run
  // Saved between visits:
  unlocked: SectionId[];
  bestRings: number;
  finishedOnce: boolean;
  sound: boolean;

  boot: (arrival?: Arrival | null) => void;
  ready: () => void;
  start: () => void;
  togglePause: () => void;
  setBeat: (beat: BeatId) => void;
  collectRing: (note: Note) => void;
  collectBit: (id: SectionId) => void;
  launch: () => void;
  finish: (time: number) => void;
  restart: () => void;
  toggleSound: () => void;
};

const fresh = {
  status: "intro" as Status,
  beat: "meadow" as BeatId,
  rings: 0,
  notes: [] as Note[],
  collected: [] as SectionId[],
  lastBit: null,
  time: 0,
  arrival: null as Arrival | null,
};

// localStorage can throw (private mode, blocked storage, full quota); the game must not.
export const safeStorage: StateStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Progress just won't be saved this time.
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...fresh,
      runId: 0,
      status: "loading",
      unlocked: [],
      bestRings: 0,
      finishedOnce: false,
      sound: false,

      boot: (arrival = null) => set((s) => ({ ...fresh, arrival, status: "loading", runId: s.runId + 1 })),
      ready: () => {
        if (get().status === "loading") set({ status: "intro" });
      },
      start: () => {
        if (get().status === "intro") set({ status: "running" });
      },
      togglePause: () => {
        const { status } = get();
        if (status === "running") set({ status: "paused" });
        else if (status === "paused") set({ status: "running" });
      },
      setBeat: (beat) => {
        if (get().beat !== beat) set({ beat });
      },
      collectRing: (note) => set((s) => ({ rings: s.rings + 1, notes: [...s.notes, note] })),
      collectBit: (id) =>
        set((s) => ({
          lastBit: { id, at: performance.now() },
          collected: s.collected.includes(id) ? s.collected : [...s.collected, id],
          unlocked: s.unlocked.includes(id) ? s.unlocked : [...s.unlocked, id],
        })),
      launch: () => {
        if (get().status === "running") set({ status: "finale" });
      },
      finish: (time) => {
        if (get().status !== "finale") return;
        set((s) => ({ status: "finished", time, finishedOnce: true, bestRings: Math.max(s.bestRings, s.rings) }));
      },
      restart: () => set((s) => ({ ...fresh, runId: s.runId + 1 })),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
    }),
    {
      name: "fox-run",
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ unlocked: s.unlocked, bestRings: s.bestRings, finishedOnce: s.finishedOnce, sound: s.sound }),
      migrate: () => ({ unlocked: [], bestRings: 0, finishedOnce: false, sound: false }) as unknown as GameState,
    },
  ),
);
