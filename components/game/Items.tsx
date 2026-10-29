"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { level } from "@/lib/level";
import { sections, type SectionId } from "@/lib/sections";
import { INK_WORLD, useDusk, useGlow, useLookStore } from "@/components/three/dusk";
import { Halo } from "@/components/three/scenery";
import type { RunTrack } from "./track";

// Things on the track. The scene's frame loop decides what gets collected; these components
// only draw, reading the shared `RunWorld` every frame.

export type Burst = { p: THREE.Vector3; age: number; color: THREE.Color; live: boolean };
export type RunWorld = {
  taken: Uint8Array; // per ring
  ringPos: THREE.Vector3[];
  bitPos: Record<SectionId, THREE.Vector3>; // animated: bits fly to the fox once in range
  bitsTaken: Set<SectionId>;
  springFired: Set<number>;
  boostFired: Set<number>;
  bursts: Burst[];
  clear: boolean; // finale: every ring left on the track fades away
};

export const BIT_COLORS: Record<(typeof sections)[number]["color"], string> = { sakura: "#ff8fbf", sun: "#ffd166", sky: "#8fd3ff" };
export const bitColor = (id: SectionId) => BIT_COLORS[sections.find((s) => s.id === id)!.color];
const BURSTS = 16;
const BURST_LIFE = 0.5;

export function makeWorld(track: RunTrack, spots: { d: number; h: number }[]): RunWorld {
  const bitPos = {} as Record<SectionId, THREE.Vector3>;
  for (const b of level.bits) bitPos[b.id] = track.place(b.at, 0, b.h, new THREE.Vector3());
  return {
    taken: new Uint8Array(spots.length),
    ringPos: spots.map((s) => track.place(s.d, 0, s.h, new THREE.Vector3())),
    bitPos,
    bitsTaken: new Set(),
    springFired: new Set(),
    boostFired: new Set(),
    bursts: Array.from({ length: BURSTS }, () => ({ p: new THREE.Vector3(), age: 0, color: new THREE.Color(), live: false })),
    clear: false,
  };
}

export function burst(w: RunWorld, at: THREE.Vector3, color: THREE.ColorRepresentation) {
  const b = w.bursts.find((x) => !x.live) ?? w.bursts[0];
  b.p.copy(at);
  b.age = 0;
  b.color.set(color);
  b.live = true;
}

// Gold rings, one instanced mesh, spinning, facing the side camera. Taken rings shrink away.
export function Rings({ world }: { world: RefObject<RunWorld> }) {
  const glow = useGlow("#ffd166", 1.35);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = world.current.ringPos.length;
  const shrink = useMemo(() => new Float32Array(count).fill(1), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const w = world.current;
    const t = state.clock.elapsedTime;
    w.ringPos.forEach((p, i) => {
      if (w.taken[i] || w.clear) shrink[i] = Math.max(0, shrink[i] - delta * (w.taken[i] ? 8 : 2.5));
      dummy.position.copy(p);
      dummy.rotation.set(0, Math.PI / 2 + Math.sin(t * 2 + i * 0.4) * 0.6, 0);
      dummy.scale.setScalar(shrink[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, glow, count]} frustumCulled={false}>
      <torusGeometry args={[0.45, 0.075, 8, 32]} />
    </instancedMesh>
  );
}

// Sparkle bursts: a flat ring of light that grows and fades where something was collected.
export function Bursts({ world }: { world: RefObject<RunWorld> }) {
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  useFrame(({ camera }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    world.current.bursts.forEach((b, i) => {
      if (b.live) b.age += delta;
      if (b.age > BURST_LIFE) b.live = false;
      const k = b.age / BURST_LIFE;
      dummy.position.copy(b.p);
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.setScalar(b.live ? 0.4 + k * 1.8 : 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.copy(b.color).multiplyScalar(2.2 * (1 - k)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, material, BURSTS]} frustumCulled={false}>
      <ringGeometry args={[0.7, 0.85, 32]} />
    </instancedMesh>
  );
}

function onTrack(track: RunTrack, d: number) {
  const f = track.frameAt(d, { pos: new THREE.Vector3(), tan: new THREE.Vector3(), up: new THREE.Vector3(), right: new THREE.Vector3() });
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(f.up, f.tan), f.up, f.tan);
  return { position: f.pos, quaternion: new THREE.Quaternion().setFromRotationMatrix(m) };
}

// Springs: a squat gold base, a pink coil and a bright pad on top.
export function Springs({ track }: { track: RunTrack }) {
  const base = useDusk("#ffd166", { rim: 1 });
  const coil = useDusk("#ff8fbf", { rim: 1 });
  const pad = useGlow("#fff1c1", 1.6);
  const ink = useLookStore((s) => s.look.ink);
  const poses = useMemo(() => level.springs.map((s) => onTrack(track, s.at)), [track]);
  return poses.map((p, i) => (
    <group key={i} position={p.position} quaternion={p.quaternion}>
      <mesh material={base} position-y={0.12}>
        <cylinderGeometry args={[0.65, 0.75, 0.24, 20]} />
        <Outlines thickness={0.03} color={ink} {...INK_WORLD} />
      </mesh>
      <mesh material={coil} position-y={0.42}>
        <cylinderGeometry args={[0.38, 0.38, 0.4, 16]} />
        <Outlines thickness={0.03} color={ink} {...INK_WORLD} />
      </mesh>
      <mesh material={pad} position-y={0.66}>
        <cylinderGeometry args={[0.6, 0.6, 0.08, 20]} />
      </mesh>
    </group>
  ));
}

// Boost pads: glowing chevrons flat on the road, pointing forward.
export function Boosts({ track }: { track: RunTrack }) {
  const glow = useGlow("#ff8fbf", 1.8, { side: THREE.DoubleSide });
  const chevron = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.9, 0);
    s.lineTo(0, 0.7);
    s.lineTo(0.9, 0);
    s.lineTo(0.9, 0.35);
    s.lineTo(0, 1.05);
    s.lineTo(-0.9, 0.35);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  useEffect(() => () => chevron.dispose(), [chevron]);
  const poses = useMemo(() => level.boosts.flatMap((b) => [0, 1.3, 2.6].map((k) => onTrack(track, b.at + k))), [track]);
  return poses.map((p, i) => (
    <group key={i} position={p.position} quaternion={p.quaternion}>
      <mesh geometry={chevron} material={glow} position-y={0.05} rotation-x={-Math.PI / 2} />
    </group>
  ));
}

// Data bits: glowing crystal shards in their section's color, with a halo and a light beam,
// spinning gently. Collected bits are hidden (the scene flies them to the fox first).
export function Bits({ world }: { world: RefObject<RunWorld> }) {
  return level.bits.map((b) => <Bit key={b.id} id={b.id} world={world} />);
}

function Bit({ id, world }: { id: SectionId; world: RefObject<RunWorld> }) {
  const color = bitColor(id);
  const glow = useGlow(color, 2.4);
  const beam = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(0.5), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    [color],
  );
  useEffect(() => () => beam.dispose(), [beam]);
  const group = useRef<THREE.Group>(null);
  const gem = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const w = world.current;
    if (!group.current || !gem.current) return;
    group.current.position.copy(w.bitPos[id]);
    group.current.visible = !w.bitsTaken.has(id);
    gem.current.rotation.y = state.clock.elapsedTime * 1.6;
    gem.current.position.y = Math.sin(state.clock.elapsedTime * 2.2) * 0.12;
  });
  return (
    <group ref={group}>
      <mesh ref={gem} material={glow} scale={[0.32, 0.55, 0.32]}>
        <octahedronGeometry args={[1, 0]} />
      </mesh>
      <Halo color={color} size={2.6} strength={0.8} />
      <mesh material={beam} position-y={14}>
        <cylinderGeometry args={[0.12, 0.3, 28, 10, 1, true]} />
      </mesh>
    </group>
  );
}
