import * as THREE from "three";
import { arcRings, buildTrack, level, RING_GAP, type Level, type Segment } from "@/lib/level";

// The level's track, sampled once per metre with a full frame (forward, up, right) at every sample.
// Everything in the game is placed with `place(distance, sideways, height)`.

export type Frame = { pos: THREE.Vector3; tan: THREE.Vector3; up: THREE.Vector3; right: THREE.Vector3 };

export type RunTrack = {
  length: number;
  count: number; // samples
  pos: Float32Array;
  tan: Float32Array;
  up: Float32Array;
  right: Float32Array;
  loops: { from: number; to: number; radius: number }[];
  frameAt: (d: number, out: Frame) => Frame;
  place: (d: number, side: number, height: number, out: THREE.Vector3) => THREE.Vector3;
  loopAt: (d: number) => { from: number; to: number; radius: number } | undefined;
};

export const newFrame = (): Frame => ({
  pos: new THREE.Vector3(),
  tan: new THREE.Vector3(),
  up: new THREE.Vector3(),
  right: new THREE.Vector3(),
});

export function makeRunTrack(segments: Segment[] = level.track): RunTrack {
  const built = buildTrack(segments);
  const curve = new THREE.CatmullRomCurve3(
    built.points.map((p) => new THREE.Vector3(...p)),
    false,
    "centripetal", // no overshoot or kinks at tight spots like loops
  );
  const length = built.length; // `at` values in lib/level.ts are measured against this
  const count = Math.ceil(length) + 1;
  const pos = new Float32Array(count * 3);
  const tan = new Float32Array(count * 3);
  const up = new Float32Array(count * 3);
  const right = new Float32Array(count * 3);

  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const s = Math.min(1, i / (count - 1));
    curve.getPointAt(s, p).toArray(pos, i * 3);
    curve.getTangentAt(s, t).normalize().toArray(tan, i * 3);
  }

  // "Up" is world-up tilted to the slope everywhere (hills tilt it, flat turns don't)...
  const u = new THREE.Vector3();
  const WORLD_UP = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    t.fromArray(tan, i * 3);
    u.copy(WORLD_UP).addScaledVector(t, -WORLD_UP.dot(t)).normalize().toArray(up, i * 3);
  }

  // ...except in loops, where world-up breaks down (the track points straight up). There, carry
  // "up" around with the track (rotation-minimising), so it points inward and the fox runs upside
  // down at the top. Because the loop also drifts sideways, that leaves a twist at the exit; spread
  // the correction across the loop so the fox comes out level instead of on a 44° bank.
  const q = new THREE.Quaternion();
  const prevT = new THREE.Vector3();
  const exitUp = new THREE.Vector3();
  for (const l of built.loops) {
    const a = Math.max(0, Math.floor((l.from / length) * (count - 1)) - 1);
    const b = Math.min(count - 1, Math.ceil((l.to / length) * (count - 1)) + 1);
    const carried: THREE.Vector3[] = [];
    u.fromArray(up, a * 3);
    prevT.fromArray(tan, a * 3);
    for (let i = a; i <= b; i++) {
      t.fromArray(tan, i * 3);
      u.applyQuaternion(q.setFromUnitVectors(prevT, t)).normalize();
      carried.push(u.clone());
      prevT.copy(t);
    }
    exitUp.fromArray(up, b * 3);
    t.fromArray(tan, b * 3);
    const last = carried[carried.length - 1];
    const twist = Math.atan2(t.dot(new THREE.Vector3().crossVectors(last, exitUp)), last.dot(exitUp));
    carried.forEach((v, k) => {
      t.fromArray(tan, (a + k) * 3);
      v.applyAxisAngle(t, (twist * k) / (carried.length - 1)).normalize().toArray(up, (a + k) * 3);
    });
  }

  const r = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    r.crossVectors(t.fromArray(tan, i * 3), u.fromArray(up, i * 3)).normalize().toArray(right, i * 3); // forward × up = right
  }

  const tmp = new THREE.Vector3();
  const lerpInto = (arr: Float32Array, i0: number, i1: number, f: number, out: THREE.Vector3) =>
    out.fromArray(arr, i0 * 3).lerp(tmp.fromArray(arr, i1 * 3), f);

  const frameAt = (d: number, out: Frame) => {
    const x = (Math.max(0, Math.min(length, d)) / length) * (count - 1);
    const i0 = Math.floor(x);
    const i1 = Math.min(count - 1, i0 + 1);
    const f = x - i0;
    lerpInto(pos, i0, i1, f, out.pos);
    lerpInto(tan, i0, i1, f, out.tan).normalize();
    lerpInto(up, i0, i1, f, out.up).normalize();
    lerpInto(right, i0, i1, f, out.right).normalize();
    return out;
  };

  const scratch = newFrame();
  const place = (d: number, side: number, height: number, out: THREE.Vector3) => {
    frameAt(d, scratch);
    return out.copy(scratch.pos).addScaledVector(scratch.right, side).addScaledVector(scratch.up, height);
  };

  const loops = built.loops.map((l) => ({ ...l, radius: (l.to - l.from) / (2 * Math.PI) }));
  const loopAt = (d: number) => loops.find((l) => d >= l.from && d <= l.to);

  return { length, count, pos, tan, up, right, loops, frameAt, place, loopAt };
}

// Every ring in the level as a point on the track: distance and height above the road.
export function ringSpots(track: RunTrack, lv: Level = level) {
  const spots: { d: number; h: number }[] = [];
  for (const g of lv.rings) {
    if (g.kind === "line") for (let i = 0; i < g.count; i++) spots.push({ d: g.at + i * RING_GAP, h: g.h ?? 1 });
    else if (g.kind === "arc") spots.push(...arcRings(g.at, lv));
    else {
      const loop = track.loops.find((l) => Math.abs(l.from - g.at) < 1);
      if (loop) for (let d = loop.from + 2; d < loop.to - 1; d += RING_GAP) spots.push({ d, h: 1 });
    }
  }
  return spots;
}

// A strip along the track between two sideways offsets, lifted slightly off the road.
// `from`/`to` limit it to part of the track (metres).
export function ribbon(track: RunTrack, left: number, right: number, lift: number, from = 0, to = track.length) {
  const verts: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const r = new THREE.Vector3();
  const u = new THREE.Vector3();
  const i0 = Math.max(0, Math.floor(from));
  const i1 = Math.min(track.count - 1, Math.ceil(to));
  for (let i = i0; i <= i1; i++) {
    p.fromArray(track.pos, i * 3);
    r.fromArray(track.right, i * 3);
    u.fromArray(track.up, i * 3);
    p.addScaledVector(u, lift);
    verts.push(p.x + r.x * left, p.y + r.y * left, p.z + r.z * left, p.x + r.x * right, p.y + r.y * right, p.z + r.z * right);
    if (i > i0) {
      const a = (i - 1 - i0) * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
