// The game level as plain data: one side-view run through Sakura Hills (PLAN.md Step 19).
// Edit the level here; the game code only reads this file.
//
// The track is written as segments (straight, hill, loop) and turned into 3D points by
// `buildTrack`; the game smooths those points with a CatmullRomCurve3. The fox runs along +Z,
// the camera watches from the side. Everything on the track is placed by `at` (metres from
// the start) and, for rings, `h` (metres above the road).

import { sections, type SectionId } from "./sections";

export const RUN = { start: 14, max: 20, accel: 0.25 }; // m/s, and m/s gained per second
export const PHYSICS = {
  gravity: 30, // m/s²
  jump: 11, // take-off speed of a jump (~2 m high)
  flip: 8, // extra upward kick from a second jump in the air
  glide: 0.25, // share of gravity while gliding (holding jump on the way down)
  glideFall: 3, // fastest fall while gliding, m/s
};
export const BOOST = { time: 1.6, extra: 10 }; // seconds, m/s on top of run speed
export const RING_GAP = 3; // metres between rings in a line or arc

export type Vec3 = [number, number, number];

export type Segment =
  | { straight: number }
  | { turn: number; radius: number } // degrees, positive = left (unused by the side view, kept for the builder)
  | { hill: number; rise: number } // length, height change (negative = drop)
  | { loop: number }; // radius; drifts sideways so the track never meets itself

export type RingGroup =
  | { at: number; kind: "line"; count: number; h?: number }
  | { at: number; kind: "arc" } // traces a jump taken at `at`, or a spring's launch if one sits there
  | { at: number; kind: "loop" }; // all the way round a loop starting at `at`

export type BeatId = "meadow" | "torii" | "pond" | "branch" | "launch";

// A camera break: between `from` and `to` the side camera blends to another angle.
// `side` is distance from the track, `up` height, `lead` how far ahead it sits, `look` the
// height it aims at. `hold` pins the camera to one spot on the track instead of the fox
// (the loop: the camera stays put and the fox runs round in front of it).
export type CameraBreak = { from: number; to: number; side: number; up: number; lead: number; look: number; hold?: number };

export type Level = {
  track: Segment[];
  beats: { id: BeatId; from: number }[];
  rings: RingGroup[];
  springs: { at: number; power: number }[]; // power = launch height in metres
  boosts: { at: number }[];
  bits: { at: number; h: number; id: SectionId }[];
  torii: { from: number; to: number; gap: number };
  pond: { from: number; to: number };
  branch: { from: number; to: number }; // road becomes the giant tree's branch, fox grinds
  finale: number; // the treetop spring: past here the run hands over to the finale
  cameras: CameraBreak[];
};

export const SIDE_CAMERA = { side: 11.5, up: 1.6, lead: 3.5, look: 1.4 };

export const level: Level = {
  track: [
    // Meadow dash
    { straight: 26 },
    { hill: 28, rise: 3 },
    { hill: 28, rise: -3 },
    { straight: 28 },
    // Torii rush
    { straight: 80 },
    // Mirror pond loop
    { straight: 18 },
    { loop: 7 },
    { straight: 22 },
    // Branch grind, up the giant tree
    { hill: 70, rise: 20 },
    // Launch from the treetop
    { straight: 30 },
  ],
  beats: [
    { id: "meadow", from: 0 },
    { id: "torii", from: 110 },
    { id: "pond", from: 190 },
    { id: "branch", from: 274 },
    { id: "launch", from: 346 },
  ],
  rings: [
    { at: 10, kind: "line", count: 4 },
    { at: 26, kind: "arc" }, // over the first bump
    { at: 70, kind: "arc" },
    { at: 92, kind: "arc" }, // spring arc
    { at: 118, kind: "line", count: 22, h: 1.1 }, // through the torii row
    { at: 208, kind: "loop" },
    { at: 280, kind: "line", count: 18, h: 1 }, // up the branch
    { at: 354, kind: "arc" }, // up the launch
  ],
  springs: [
    { at: 92, power: 6 },
    { at: 354, power: 34 },
  ],
  boosts: [{ at: 112 }, { at: 200 }],
  bits: [
    { at: 56, h: 2.6, id: "about" },
    { at: 160, h: 1.2, id: "education" },
    { at: 230, h: 1.2, id: "skills" }, // top of the loop
    { at: 318, h: 1.4, id: "projects" },
    { at: 364, h: 22, id: "contact" }, // caught on the way up the launch
  ],
  torii: { from: 120, to: 186, gap: 7 },
  pond: { from: 186, to: 276 },
  branch: { from: 274, to: 346 },
  finale: 354,
  cameras: [
    // Torii rush: drop low and pull wide, looking along the row of gates.
    { from: 114, to: 186, side: 10, up: 1.2, lead: 9, look: 1.6 },
    // Pond loop: back off and down to the water so the loop and its reflection both fit.
    { from: 196, to: 262, side: 19, up: 1.1, lead: 0, look: 2.4, hold: 208 },
    // Branch grind: low, close, looking up the branch.
    { from: 280, to: 344, side: 10, up: 0.4, lead: 3, look: 2.2 },
  ],
};

// ---------------------------------------------------------------------------
// Speed and jump arcs. Boosts are ignored; springs lock the fox to this speed in the air.

export function speedAt(d: number) {
  return Math.min(RUN.max, Math.sqrt(RUN.start ** 2 + 2 * RUN.accel * Math.max(0, d))); // v² = v0² + 2as
}

// Rings tracing a jump taken at `at`: a spring's launch if one sits there, otherwise a normal jump.
// Heights put each ring on the fox's body path, so a jump at the first ring collects them all.
export function arcRings(at: number, lv: Level = level) {
  const spring = lv.springs.find((s) => Math.abs(s.at - at) < 1);
  const up = spring ? Math.sqrt(2 * PHYSICS.gravity * spring.power) : PHYSICS.jump;
  const speed = speedAt(at);
  const g = PHYSICS.gravity;
  const rings: { d: number; h: number }[] = [];
  if (spring && spring.power > 15) {
    // A launch is mostly vertical: a short, evenly spaced column on the way up, stopping well
    // below the top so the finale shot stays clear.
    for (let h = 3; h <= spring.power * 0.45; h += 3.5) {
      const t = (up - Math.sqrt(up * up - 2 * g * (h - 0.9))) / g;
      rings.push({ d: at + speed * t, h });
    }
    return rings;
  }
  const airtime = (2 * up) / g;
  for (let t = RING_GAP / speed; t < airtime; t += RING_GAP / speed) {
    rings.push({ d: at + speed * t, h: 0.9 + up * t - (g * t * t) / 2 });
  }
  return rings;
}

// ---------------------------------------------------------------------------
// Track builder: segments -> points every few metres, plus total length and loop ranges.

const STEP = 4; // metres between generated points
const LOOP_DRIFT = 7; // sideways shift across a loop so the exit clears the entry

export type BuiltTrack = { points: Vec3[]; length: number; loops: { from: number; to: number }[] };

export function buildTrack(segments: Segment[]): BuiltTrack {
  let x = 0;
  let y = 0;
  let z = 0;
  let yaw = 0; // 0 = facing +Z, the fox model's forward
  let length = 0;
  const points: Vec3[] = [[0, 0, 0]];
  const loops: BuiltTrack["loops"] = [];
  const smooth = (u: number) => u * u * (3 - 2 * u);

  for (const seg of segments) {
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const rx = -fz; // right-hand side, used by the loop's sideways drift
    const rz = fx;
    const start: Vec3 = [x, y, z];

    if ("straight" in seg || "hill" in seg) {
      const len = "straight" in seg ? seg.straight : seg.hill;
      const rise = "hill" in seg ? seg.rise : 0;
      const n = Math.max(1, Math.round(len / STEP));
      for (let i = 1; i <= n; i++) {
        const u = i / n;
        x = start[0] + fx * len * u;
        z = start[2] + fz * len * u;
        y = start[1] + rise * smooth(u);
        points.push([x, y, z]);
      }
      length += Math.hypot(len, rise);
    } else if ("turn" in seg) {
      const angle = (seg.turn * Math.PI) / 180;
      const arc = Math.abs(angle) * seg.radius;
      const n = Math.max(2, Math.round(arc / STEP));
      const yaw0 = yaw;
      const side = Math.sign(angle);
      const cx = start[0] + Math.cos(yaw0) * seg.radius * side;
      const cz = start[2] - Math.sin(yaw0) * seg.radius * side;
      for (let i = 1; i <= n; i++) {
        yaw = yaw0 + (angle * i) / n;
        x = cx - Math.cos(yaw) * seg.radius * side;
        z = cz + Math.sin(yaw) * seg.radius * side;
        points.push([x, y, z]);
      }
      length += arc;
    } else {
      const r = seg.loop;
      const n = Math.max(12, Math.round((2 * Math.PI * r) / STEP));
      const from = length;
      for (let i = 1; i <= n; i++) {
        const u = i / n;
        const t = 2 * Math.PI * u;
        const f = r * Math.sin(t);
        const s = LOOP_DRIFT * smooth(u);
        x = start[0] + fx * f + rx * s;
        z = start[2] + fz * f + rz * s;
        y = start[1] + r * (1 - Math.cos(t));
        points.push([x, y, z]);
      }
      length += 2 * Math.PI * r;
      loops.push({ from, to: length });
    }
  }
  return { points, length, loops };
}

// ---------------------------------------------------------------------------
// Self-check: throws on broken level data so mistakes show up the moment the game loads.

// Seconds of running from the start to `d`, at `speedAt` plus the boost pads.
export function runTime(d: number, lv: Level = level) {
  let t = 0;
  let boost = 0;
  for (let x = 0; x < d; x += 0.5) {
    if (lv.boosts.some((b) => Math.abs(b.at - x) < 0.25)) boost = BOOST.time;
    const v = speedAt(x) + (boost > 0 ? BOOST.extra : 0);
    t += 0.5 / v;
    boost = Math.max(0, boost - 0.5 / v);
  }
  return t;
}

export function checkLevel(lv: Level = level): string[] {
  const errors: string[] = [];
  const { length, loops } = buildTrack(lv.track);
  const inLoop = (d: number) => loops.some((l) => d > l.from - 2 && d < l.to + 2);
  const onTrack = (what: string, d: number) => {
    if (d < 0 || d > length) errors.push(`${what} at ${d} is off the track (0–${length.toFixed(0)})`);
  };
  lv.springs.forEach((s) => (onTrack("spring", s.at), inLoop(s.at) && errors.push(`spring at ${s.at} is inside a loop`)));
  lv.boosts.forEach((b) => (onTrack("boost", b.at), inLoop(b.at) && errors.push(`boost at ${b.at} is inside a loop`)));
  lv.bits.forEach((b) => onTrack(`bit ${b.id}`, b.at));
  const ids = lv.bits.map((b) => b.id);
  for (const s of sections) if (!ids.includes(s.id)) errors.push(`no data bit for ${s.id}`);
  if (!lv.springs.some((s) => s.at === lv.finale)) errors.push(`no spring at the finale (${lv.finale})`);
  for (const r of lv.rings) if (r.kind === "loop" && !loops.some((l) => Math.abs(l.from - r.at) < 1)) errors.push(`loop rings at ${r.at} don't start a loop`);
  // The whole visit: ~2 s wake-up + running + ~5 s finale must stay within 30 s.
  const t = runTime(lv.finale, lv);
  if (t < 19 || t > 23) errors.push(`running time to the finale is ${t.toFixed(1)} s, want 19–23 s`);
  return errors;
}
