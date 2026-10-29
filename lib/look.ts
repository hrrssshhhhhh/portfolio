// Art direction as data (PLAN.md "Art direction"). Tune values in /lab against the key frames,
// then copy them back here.

export type Rgb = [number, number, number];

export type Look = {
  skyTop: string;
  skyHorizon: string;
  sun: string; // key light and sun disc
  sunDir: Rgb; // direction the light comes from (world space, need not be normalized)
  sunSize: number; // sun disc radius in radians; 0 hides it (moonlit stretches)
  shade: string; // shadow-side tint: shadows lean toward the sky, never grey
  rim: string; // fresnel edge light on the fox, crystal and props
  rimStrength: number;
  fog: string;
  fogNear: number;
  fogFar: number;
  accent: string; // main glow (rings excepted, they stay gold)
  accent2: string;
  ink: string; // outline color
  stars: number; // 0..1 starfield and Milky Way
  bloom: number;
  grade: { lift: string; gain: string; gamma: number; saturation: number };
};

export type StretchId = "dusk" | "night";

// The whole level is `dusk` (also the hero). Only the finale blends toward `night`.
// The fox runs along +Z and the camera watches from -X, so the sun sits behind the
// track (+X), a little ahead, low on the horizon.
export const looks: Record<StretchId, Look> = {
  dusk: {
    skyTop: "#6b5fa8",
    skyHorizon: "#ffb38a",
    sun: "#fff1c1",
    sunDir: [1, 0.13, 0.55],
    sunSize: 0.06,
    shade: "#c9a3cf",
    rim: "#ffd2b0",
    rimStrength: 0.9,
    fog: "#f2a7a0",
    fogNear: 50,
    fogFar: 320,
    accent: "#ff8fbf",
    accent2: "#ffd166",
    ink: "#7a3d5c",
    stars: 0,
    bloom: 0.8,
    grade: { lift: "#24143a", gain: "#fff4e8", gamma: 1, saturation: 1.15 },
  },
  night: {
    skyTop: "#0d0b26",
    skyHorizon: "#3a2a6e",
    sun: "#c9d8ff",
    sunDir: [1, -0.05, 0.55],
    sunSize: 0,
    shade: "#4a4590",
    rim: "#8fd3ff",
    rimStrength: 1.2,
    fog: "#2a2160",
    fogNear: 80,
    fogFar: 420,
    accent: "#c9b8ff",
    accent2: "#ffd166",
    ink: "#2a2466",
    stars: 1,
    bloom: 1.1,
    grade: { lift: "#0a0820", gain: "#eae8ff", gamma: 1, saturation: 1.1 },
  },
};

// Blend two looks: dusk to night during the finale.
export function mixLook(a: Look, b: Look, t: number): Look {
  const n = (x: number, y: number) => x + (y - x) * t;
  const c = (x: string, y: string) => mixHex(x, y, t);
  return {
    skyTop: c(a.skyTop, b.skyTop),
    skyHorizon: c(a.skyHorizon, b.skyHorizon),
    sun: c(a.sun, b.sun),
    sunDir: [n(a.sunDir[0], b.sunDir[0]), n(a.sunDir[1], b.sunDir[1]), n(a.sunDir[2], b.sunDir[2])],
    sunSize: n(a.sunSize, b.sunSize),
    shade: c(a.shade, b.shade),
    rim: c(a.rim, b.rim),
    rimStrength: n(a.rimStrength, b.rimStrength),
    fog: c(a.fog, b.fog),
    fogNear: n(a.fogNear, b.fogNear),
    fogFar: n(a.fogFar, b.fogFar),
    accent: c(a.accent, b.accent),
    accent2: c(a.accent2, b.accent2),
    ink: c(a.ink, b.ink),
    stars: n(a.stars, b.stars),
    bloom: n(a.bloom, b.bloom),
    grade: {
      lift: c(a.grade.lift, b.grade.lift),
      gain: c(a.grade.gain, b.grade.gain),
      gamma: n(a.grade.gamma, b.grade.gamma),
      saturation: n(a.grade.saturation, b.grade.saturation),
    },
  };
}

function mixHex(a: string, b: string, t: number) {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((x >> s) & 255) + (((y >> s) & 255) - ((x >> s) & 255)) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}
