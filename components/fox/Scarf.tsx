"use client";

import { useMemo, useRef } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { INK_WORLD, useDusk, useLookStore } from "@/components/three/dusk";

const INK_METRES = 0.018;

const LINKS = 9;
const LINK_LEN = 0.1;
const WIDTH = 0.07; // half-width
// Two triangles per link, joining the left/right vertex pairs down the ribbon.
const INDEX = new Uint16Array(
  Array.from({ length: LINKS - 1 }, (_, i) => [i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2]).flat(),
);

const UP = new THREE.Vector3(0, 1, 0);

type Sim = {
  p: THREE.Vector3[];
  prev: THREE.Vector3[];
  anchor: THREE.Vector3;
  last: THREE.Vector3;
  back: THREE.Vector3;
  side: THREE.Vector3;
  spread: THREE.Vector3;
  d: THREE.Vector3;
  q: THREE.Quaternion;
};

// Sakura scarf: a short verlet rope pinned to the neck bone, drawn as a flat ribbon in world space.
// `lift` raises the knot above the neck point so the tails trail over the back, not through it.
export default function Scarf({ neck, body, wind, lift = 0.1, color = "#ff8fbf" }: { neck: THREE.Object3D; body: THREE.Object3D; wind: number; lift?: number; color?: string }) {
  const scene = useThree((s) => s.scene);
  const ink = useLookStore((s) => s.look.ink);
  const ribbon = useDusk(color, { rim: 1.2, side: THREE.DoubleSide });
  const knotMaterial = useDusk(color, { rim: 1.2 });
  const mesh = useRef<THREE.Mesh>(null);
  const knot = useRef<THREE.Mesh>(null);
  const sim = useRef<Sim | null>(null);
  const positions = useMemo(() => new Float32Array(LINKS * 2 * 3), []);

  useFrame((_, delta) => {
    if (!mesh.current || !knot.current) return;
    const dt = Math.min(delta, 1 / 30);
    const first = !sim.current;
    const s = (sim.current ??= {
      p: Array.from({ length: LINKS }, () => new THREE.Vector3()),
      prev: Array.from({ length: LINKS }, () => new THREE.Vector3()),
      anchor: new THREE.Vector3(),
      last: new THREE.Vector3(),
      back: new THREE.Vector3(),
      side: new THREE.Vector3(),
      spread: new THREE.Vector3(),
      d: new THREE.Vector3(),
      q: new THREE.Quaternion(),
    });
    const { p, prev } = s;

    neck.getWorldPosition(s.anchor);
    s.anchor.y += lift;
    knot.current.position.copy(s.anchor);
    body.getWorldQuaternion(s.q);
    // The fox faces +Z in model space; the scarf blows toward its tail.
    s.back.set(0, 0, -1).applyQuaternion(s.q).setY(0).normalize();
    s.side.set(1, 0, 0).applyQuaternion(s.q).setY(0).normalize();
    // Ribbon tilted between flat and upright, so it reads from the side and from the chase camera.
    s.spread.copy(s.side).multiplyScalar(0.5).add(UP).normalize();

    if (first) {
      p.forEach((v, i) => v.copy(s.anchor).addScaledVector(s.back, i * LINK_LEN));
      prev.forEach((v, i) => v.copy(p[i]));
    } else {
      // Carry the whole scarf with the fox, so only wind and sway shape it. Simulated purely in
      // world space, running at 15–20 m/s flung it forward past the fox's face.
      s.d.subVectors(s.anchor, s.last);
      for (let i = 0; i < LINKS; i++) {
        p[i].add(s.d);
        prev[i].add(s.d);
      }
    }
    s.last.copy(s.anchor);

    // Integrate: inertia + gravity + wind pushing back from the run.
    for (let i = 1; i < LINKS; i++) {
      s.d.subVectors(p[i], prev[i]).multiplyScalar(0.92);
      prev[i].copy(p[i]);
      p[i].add(s.d);
      p[i].y -= 1.5 * dt * dt; // light gravity: running air keeps the ends up
      p[i].addScaledVector(s.back, wind * 14 * dt * dt * (1 + 0.4 * Math.sin(performance.now() / 90 + i)));
    }
    p[0].copy(s.anchor);
    // Keep link lengths fixed.
    for (let k = 0; k < 4; k++) {
      for (let i = 1; i < LINKS; i++) {
        s.d.subVectors(p[i], p[i - 1]);
        p[i].copy(p[i - 1]).addScaledVector(s.d, LINK_LEN / (s.d.length() || 1e-6));
      }
    }

    const geometry = mesh.current.geometry;
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < LINKS; i++) {
      const w = WIDTH * (1 - (i / LINKS) * 0.4); // tapers toward the tail
      pos.setXYZ(i * 2, p[i].x + s.spread.x * w, p[i].y + s.spread.y * w, p[i].z + s.spread.z * w);
      pos.setXYZ(i * 2 + 1, p[i].x - s.spread.x * w, p[i].y - s.spread.y * w, p[i].z - s.spread.z * w);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return createPortal(
    <mesh ref={mesh} frustumCulled={false} material={ribbon}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="index" args={[INDEX, 1]} />
      </bufferGeometry>
      <mesh ref={knot} material={knotMaterial}>
        <icosahedronGeometry args={[0.075, 0]} />
        <Outlines thickness={INK_METRES} color={ink} {...INK_WORLD} />
      </mesh>
    </mesh>,
    scene,
  );
}
