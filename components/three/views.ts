// Camera framings shared by the hero and the game, so Play can hand over without a visible cut.
// The fox sleeps at the start of the track (origin), facing +Z; the sun is low ahead (+X, +Z).

export type View = { position: [number, number, number]; target: [number, number, number]; fov: number };

export const HERO_VIEW: View = { position: [-6.6, 1.05, -4.9], target: [0.3, 1.55, -0.9], fov: 40 };
// On a phone the hero is portrait: step back and aim higher so the fox and the crystal fit.
// Further back on the same line, aimed low, so the fox and crystal sit above the text column.
export const HERO_VIEW_PORTRAIT: View = { position: [-8.6, 2.6, -5.6], target: [0.6, -1.05, 0.2], fov: 52 };
// Where the crystal floats above the sleeping fox.
export const CRYSTAL_SPOT: [number, number, number] = [0.9, 2.35, 2.1];
