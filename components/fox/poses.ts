// Procedural poses for the mascot fox. Each pose maps a time (seconds) to joint targets;
// the component eases toward them, so switching poses blends on its own.
//
// Sign guide (fox faces +Z, its left is +X): rotation.x > 0 swings a limb backward and
// leans the torso forward; rotation.z > 0 lifts the left arm outward; tail rotation.x > 0
// curls the tail upward.

export type FoxPose = "idle" | "run" | "jump" | "glide" | "grind" | "sleep" | "celebrate" | "backflip";

// Backflip timing (s): crouch, then airborne, then land. The arc and spin live with the caller
// (HeroFox), which turns the fox round its middle; the root here pivots at the feet.
export const BACKFLIP = { crouch: 0.18, air: 0.6, land: 0.22 };

type LR = [number, number];
export type Targets = {
  lift: number; // hips height above default (m)
  pitch: number; // whole-body forward rotation (flips)
  yaw: number; // whole-body turn (grind stance)
  torso: number;
  headX: number;
  headY: number;
  headZ: number;
  earX: number;
  earZ: LR; // extra outward splay
  shX: LR;
  shZ: LR;
  elX: LR;
  thX: LR;
  knX: LR;
  tailX: number[];
  tailY: number[];
  eyes: number; // 1 open, 0 shut
  happy: boolean; // shut eyes as ^ ^ instead of ‿ ‿
  breathe: number; // torso scale pulse
  wind: number; // scarf
};

const rest = (): Targets => ({
  lift: 0,
  pitch: 0,
  yaw: 0,
  torso: 0.05,
  headX: 0,
  headY: 0,
  headZ: 0,
  earX: 0,
  earZ: [0, 0],
  shX: [0.05, 0.05],
  shZ: [0.18, -0.18],
  elX: [-0.35, -0.35],
  thX: [0, 0],
  knX: [0, 0],
  tailX: [0.45, 0.25, 0.2, 0.2],
  tailY: [0, 0, 0, 0],
  eyes: 1,
  happy: false,
  breathe: 0,
  wind: 0.25,
});

// Quick natural blink: shut for ~0.12 s every few seconds.
function blink(t: number) {
  const k = (t % 3.7) / 3.7;
  return k > 0.965 ? 0.05 : 1;
}

const TAU = Math.PI * 2;

export function poseAt(pose: FoxPose, t: number, speed = 1): Targets {
  const p = rest();
  switch (pose) {
    case "idle": {
      p.breathe = Math.sin(t * 2.2) * 0.02;
      p.headX = Math.sin(t * 0.6) * 0.04;
      p.headZ = Math.sin(t * 0.45) * 0.05;
      p.earZ = [Math.max(0, Math.sin(t * 1.3) - 0.92) * 3, 0];
      p.tailX = p.tailX.map((v, i) => v + Math.sin(t * 1.6 - i * 0.6) * 0.08);
      p.tailY = p.tailY.map((_, i) => Math.sin(t * 1.1 - i * 0.5) * 0.12);
      p.eyes = blink(t);
      return p;
    }
    case "run": {
      const ph = t * TAU * 2.4 * speed;
      const s = Math.sin(ph);
      p.lift = Math.abs(Math.cos(ph)) * 0.05 - 0.02;
      p.torso = 0.38;
      p.headX = -0.28;
      p.earX = -0.55;
      p.thX = [-s * 1.05 - 0.15, s * 1.05 - 0.15];
      p.knX = [0.35 + Math.max(0, Math.sin(ph + 1.2)) * 1.3, 0.35 + Math.max(0, Math.sin(ph + 1.2 + Math.PI)) * 1.3];
      p.shX = [s * 1.15, -s * 1.15];
      p.shZ = [0.18, -0.18];
      p.elX = [-1.5, -1.5];
      p.tailX = [0.25, 0.08, 0.05, 0.05].map((v, i) => v + Math.sin(ph * 0.5 - i * 0.8) * 0.1);
      p.tailY = p.tailY.map((_, i) => Math.sin(ph * 0.5 - i * 0.7) * 0.18);
      p.eyes = blink(t);
      p.wind = 1;
      return p;
    }
    case "jump": {
      // A tucked front flip: one full turn in 0.55 s, then hold the tuck.
      p.pitch = Math.min(1, t / 0.55) * TAU;
      p.torso = 0.6;
      p.headX = 0.3;
      p.thX = [-1.35, -1.35];
      p.knX = [2.0, 2.0];
      p.shX = [-0.9, -0.9];
      p.elX = [-1.6, -1.6];
      p.tailX = [0.6, 0.5, 0.45, 0.4];
      p.earX = -0.7;
      p.wind = 1;
      return p;
    }
    case "glide": {
      p.torso = 0.85;
      p.headX = -0.75;
      p.earX = -0.25;
      p.earZ = [0.55, 0.55];
      p.shX = [-0.2, -0.2];
      p.shZ = [1.35, -1.35];
      p.elX = [-0.1, -0.1];
      p.thX = [0.55, 0.75];
      p.knX = [0.5, 0.7];
      p.tailX = [-0.15, -0.05, 0, 0.05].map((v, i) => v + Math.sin(t * 3 - i) * 0.05);
      p.wind = 1;
      p.eyes = blink(t);
      return p;
    }
    case "grind": {
      p.lift = -0.1;
      p.yaw = 0.85;
      p.torso = 0.3;
      p.headY = -0.75;
      p.headX = -0.15;
      p.earX = -0.5;
      p.thX = [-0.85, -0.2];
      p.knX = [1.3, 0.9];
      p.shZ = [1.15, -1.15];
      p.shX = [-0.3, 0.3];
      p.elX = [-0.25, -0.25];
      p.tailX = [0.2, 0.15, 0.15, 0.1].map((v, i) => v + Math.sin(t * 4 - i) * 0.06);
      p.wind = 1;
      p.eyes = blink(t);
      return p;
    }
    case "sleep": {
      // Sitting and dozing: legs out in front, head nodding to one side, paws in the lap,
      // tail wrapped round the feet, slow breathing.
      p.lift = -0.3;
      p.torso = -0.05;
      p.headX = 0.32 + Math.sin(t * 1.3) * 0.03;
      p.headZ = 0.32;
      p.earX = -0.2;
      p.earZ = [0.35, 0.15];
      p.thX = [-1.45, -1.45];
      p.knX = [0.25, 0.25];
      p.shX = [-0.5, -0.5];
      p.shZ = [0.2, -0.2];
      p.elX = [-0.9, -0.9];
      p.tailX = [-0.25, -0.1, 0, 0.05];
      p.tailY = [0.9, 0.75, 0.7, 0.6];
      p.breathe = Math.sin(t * 1.3) * 0.03;
      p.eyes = 0;
      p.wind = 0.05;
      return p;
    }
    case "backflip": {
      const { crouch, air } = BACKFLIP;
      if (t < crouch || t > crouch + air) {
        // Wind-up and landing: knees bent, arms swung back, ears flat; the landing eases out.
        const k = t < crouch ? t / crouch : Math.max(0, 1 - (t - crouch - air) / BACKFLIP.land);
        p.lift = -0.14 * k;
        p.torso = 0.35 * k;
        p.thX = [-0.9 * k, -0.9 * k];
        p.knX = [1.5 * k, 1.5 * k];
        p.shX = [0.9 * k, 0.9 * k];
        p.earX = -0.5 * k;
        p.eyes = blink(t);
        return p;
      }
      // Tucked in the air, arms thrown up, tail streaming, eyes squeezed happy.
      p.torso = 0.55;
      p.headX = 0.25;
      p.thX = [-1.5, -1.5];
      p.knX = [2.1, 2.1];
      p.shX = [-2.6, -2.6];
      p.shZ = [0.45, -0.45];
      p.elX = [-0.3, -0.3];
      p.tailX = [-0.4, -0.3, -0.2, -0.1];
      p.earX = -0.7;
      p.eyes = 0;
      p.happy = true;
      p.wind = 1;
      return p;
    }
    case "celebrate": {
      const hop = Math.max(0, Math.sin(t * TAU * 0.9));
      p.lift = hop * 0.35;
      p.torso = -0.08;
      p.headX = -0.3;
      p.earX = 0.15;
      p.shX = [0.1, -2.75];
      p.shZ = [0.55, -0.15];
      p.elX = [-0.4, -0.25];
      p.thX = [-0.5 * hop, -0.2 * hop];
      p.knX = [0.9 * hop, 0.5 * hop];
      p.tailX = [0.6, 0.55, 0.5, 0.45].map((v, i) => v + Math.sin(t * 6 - i) * 0.12);
      p.eyes = 0;
      p.happy = true;
      p.wind = 0.5;
      return p;
    }
  }
}
