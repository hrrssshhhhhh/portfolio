import { create } from "zustand";

// Shared between the hero's DOM (Play button) and its 3D scene (separate chunk).
// awake: the fox is up (pointer near it, or Play hovered). playing: Play was pressed, the
// crystal bursts and the page moves to /play. chime: bumps on every crystal click.
// ready: the 3D scene has drawn, so the poster over it can fade.
export const useHeroStore = create<{
  awake: boolean;
  playing: boolean;
  chime: number;
  ready: boolean;
  wake: (awake: boolean) => void;
  play: () => void;
  ring: () => void;
  reset: () => void;
  setReady: () => void;
}>((set) => ({
  awake: false,
  playing: false,
  chime: 0,
  ready: false,
  wake: (awake) => set({ awake }),
  play: () => set({ playing: true, awake: true }),
  ring: () => set((s) => ({ chime: s.chime + 1 })),
  reset: () => set({ playing: false, awake: false, ready: false }),
  setReady: () => set({ ready: true }),
}));
