"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { level } from "@/lib/level";
import { INK_WORLD, useDusk, useGlow, useLookStore } from "@/components/three/dusk";
import { FarHills, Lanterns, LightShafts, mulberry32, Petals, Torii } from "@/components/three/scenery";
import { useQuality } from "@/components/three/quality";
import { ribbon, type RunTrack } from "./track";

// Sakura Hills, built in depth layers for the side view (PLAN.md Step 21): foreground grass,
// the track (meadow, torii row, mirror pond, the giant tree's branch and crown), sakura groves
// behind it, far hills in the fog, clouds and the low sun. The camera sits on -X looking +X.

const GRASS = "#a9c48a";
const HALF = 3.2; // half-width of the grassy track top
const v = () => new THREE.Vector3();

// ---------------------------------------------------------------------------- terrain

// The hill's face toward the camera: from the track's near edge straight down to the ground.
function skirt(track: RunTrack, from: number, to: number, bottom: number) {
  const verts: number[] = [];
  const idx: number[] = [];
  const p = v();
  for (let i = Math.floor(from), k = 0; i <= Math.min(track.count - 1, Math.ceil(to)); i++, k++) {
    track.place(i, HALF, 0, p);
    verts.push(p.x, p.y, p.z, p.x, bottom, p.z);
    if (k > 0) idx.push((k - 1) * 2, (k - 1) * 2 + 1, k * 2, k * 2, (k - 1) * 2 + 1, k * 2 + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function Terrain({ track }: { track: RunTrack }) {
  const { pond, branch } = level;
  const grass = useDusk(GRASS, { rim: 0.3, side: THREE.DoubleSide });
  const path = useDusk("#f2dcc8", { rim: 0.2, side: THREE.DoubleSide });
  const cliff = useDusk("#8f9f6a", { rim: 0.4, side: THREE.DoubleSide });
  const glass = useDusk("#e6dcf7", { rim: 0.6, side: THREE.DoubleSide, opacity: 0.88 });
  const bark = useDusk("#b98a92", { rim: 1.2, side: THREE.DoubleSide });
  const crown = useDusk("#ffb3cf", { rim: 1, side: THREE.DoubleSide });
  const edge = useGlow("#ff8fbf", 1.4, { side: THREE.DoubleSide });
  const ink = useLookStore((s) => s.look.ink);

  const g = useMemo(() => {
    const meadowEnd = pond.from;
    return {
      grass: ribbon(track, -HALF, HALF, 0, 0, meadowEnd),
      path: ribbon(track, -1.2, 1.2, 0.03, 0, meadowEnd),
      cliff: skirt(track, 0, meadowEnd, -0.05),
      bridge: ribbon(track, -1.6, 1.6, 0, meadowEnd, branch.from),
      bridgeEdges: [ribbon(track, -1.75, -1.6, 0.02, meadowEnd, branch.from), ribbon(track, 1.6, 1.75, 0.02, meadowEnd, branch.from)],
      branch: ribbon(track, -1.1, 1.1, 0, branch.from, branch.to + 2),
      crown: ribbon(track, -2.6, 2.6, 0, branch.to, track.length),
      // The branch's round underside: a tube a little below the road.
      underside: (() => {
        const pts: THREE.Vector3[] = [];
        for (let d = branch.from; d <= branch.to + 2; d += 4) pts.push(track.place(d, 0, -0.45, v()));
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.5, 10, false);
      })(),
    };
  }, [track, pond.from, branch.from, branch.to]);
  useEffect(() => () => Object.values(g).flat().forEach((x) => x.dispose()), [g]);

  return (
    <group>
      <mesh geometry={g.grass} material={grass} />
      <mesh geometry={g.path} material={path} />
      <mesh geometry={g.cliff} material={cliff} />
      <mesh geometry={g.bridge} material={glass} />
      {g.bridgeEdges.map((e, i) => (
        <mesh key={i} geometry={e} material={edge} />
      ))}
      <mesh geometry={g.branch} material={bark} />
      <mesh geometry={g.underside} material={bark}>
        <Outlines thickness={0.03} color={ink} {...INK_WORLD} />
      </mesh>
      <mesh geometry={g.crown} material={crown} />
    </group>
  );
}

// ---------------------------------------------------------------------------- the mirror pond

// A real planar reflection (the fox and the loop move, so mirroring the scene by hand won't
// do), tinted by a see-through layer on top. Only rendered while the pond is on screen.
function Pond({ track, foxD }: { track: RunTrack; foxD: React.RefObject<number> }) {
  const { pond } = level;
  const centre = useMemo(() => track.place((pond.from + pond.to) / 2 - 20, 0, 0, v()), [track, pond.from, pond.to]);
  const length = 110;
  const mirror = useMemo(() => {
    const r = new Reflector(new THREE.PlaneGeometry(160, length), {
      textureWidth: 1024,
      textureHeight: 1024,
      color: new THREE.Color("#a99bd6"),
    });
    r.rotation.x = -Math.PI / 2;
    return r;
  }, []);
  useEffect(
    () => () => {
      mirror.geometry.dispose();
      (mirror.material as THREE.Material).dispose();
      mirror.getRenderTarget().dispose();
    },
    [mirror],
  );
  // Quality tier 3 and below: no reflection pass, just opaque dusk-mauve water. Unfogged, as
  // fog turned it into a flat pink slab; a gradient was tried but the camera sees too thin a slice.
  const mirrored = useQuality((s) => s.tier) > 3;
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = foxD.current > pond.from - 60 && foxD.current < pond.to + 40;
  });

  return (
    <group ref={group} position={[centre.x + 20, -0.02, centre.z]}>
      <primitive object={mirror} visible={mirrored} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.01}>
        <planeGeometry args={[160, length]} />
        {mirrored ? (
          <meshBasicMaterial color="#5a4c96" transparent opacity={0.35} depthWrite={false} />
        ) : (
          <meshBasicMaterial key="flat" color="#a97fa8" fog={false} />
        )}
      </mesh>
      <Lanterns color="#ffb259" count={46} area={[90, length - 10]} position={[10, 0, 0]} seed={21} />
    </group>
  );
}

// ---------------------------------------------------------------------------- sakura groves

type TreeSpot = { p: THREE.Vector3; s: number; seed: number };

// Many sakura trees as three instanced meshes (trunks, two canopy tints), with ink outlines.
function Groves({ spots }: { spots: TreeSpot[] }) {
  const trunk = useDusk("#6e4b5e", { rim: 0.6 });
  const pink = useDusk("#ff9ec6", { rim: 1.2, flat: true });
  const blush = useDusk("#ffc2dc", { rim: 1.2, flat: true });
  const ink = useLookStore((s) => s.look.ink);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const blobsA = useRef<THREE.InstancedMesh>(null);
  const blobsB = useRef<THREE.InstancedMesh>(null);
  const PER = 4; // canopy blobs per tree, split between the two tints

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = v();
    const p = v();
    let a = 0;
    let b = 0;
    spots.forEach((t, i) => {
      m.compose(p.copy(t.p).add(s.set(0, 1.2 * t.s, 0)), q, s.set(t.s, t.s, t.s));
      trunks.current!.setMatrixAt(i, m);
      const rand = mulberry32(t.seed);
      for (let k = 0; k < PER; k++) {
        const r = (0.85 + rand() * 0.6) * t.s;
        p.set(t.p.x + (rand() - 0.5) * 2 * t.s, t.p.y + (2.5 + rand() * 1.2) * t.s, t.p.z + (rand() - 0.5) * 2 * t.s);
        m.compose(p, q, s.setScalar(r));
        if (k % 2 === 0) blobsA.current!.setMatrixAt(a++, m);
        else blobsB.current!.setMatrixAt(b++, m);
      }
    });
    for (const mesh of [trunks.current!, blobsA.current!, blobsB.current!]) mesh.instanceMatrix.needsUpdate = true;
  }, [spots]);

  const n = spots.length;
  const half = (n * PER) / 2;
  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, trunk, n]} frustumCulled={false}>
        <cylinderGeometry args={[0.1, 0.2, 2.4, 7]} />
        <Outlines thickness={0.03} color={ink} {...INK_WORLD} />
      </instancedMesh>
      <instancedMesh ref={blobsA} args={[undefined, pink, half]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <Outlines thickness={0.035} color={ink} {...INK_WORLD} />
      </instancedMesh>
      <instancedMesh ref={blobsB} args={[undefined, blush, half]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <Outlines thickness={0.035} color={ink} {...INK_WORLD} />
      </instancedMesh>
    </group>
  );
}

// Low grass tufts and flowers between the camera and the track: the nearest layer.
function Foreground({ track }: { track: RunTrack }) {
  const grass = useDusk("#b6d394", { rim: 0.8, flat: true });
  const flower = useGlow("#ffd1e3", 1.05);
  const shrub = useDusk("#ffa9cb", { rim: 1.2, flat: true });
  const ink = useLookStore((s) => s.look.ink);
  const tufts = useRef<THREE.InstancedMesh>(null);
  const flowers = useRef<THREE.InstancedMesh>(null);
  const shrubs = useRef<THREE.InstancedMesh>(null);
  const COUNT = 420;
  const SHRUBS = 46;
  useEffect(() => {
    const rand = mulberry32(5);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = v();
    const p = v();
    const base = v();
    for (let i = 0; i < COUNT; i++) {
      const d = rand() * level.pond.from;
      track.place(d, 0, 0, base);
      p.set(base.x - 3.6 - rand() * 4, -0.05, base.z + (rand() - 0.5) * 2);
      m.compose(p, q.setFromEuler(e.set((rand() - 0.5) * 0.5, rand() * 6, (rand() - 0.5) * 0.5)), s.set(0.4 + rand() * 0.4, 0.35 + rand() * 0.5, 0.4 + rand() * 0.4));
      tufts.current!.setMatrixAt(i, m);
      p.set(p.x + (rand() - 0.5) * 0.6, 0.06, p.z + (rand() - 0.5) * 0.6);
      m.compose(p, q, s.setScalar(rand() < 0.5 ? 0 : 0.06 + rand() * 0.04));
      flowers.current!.setMatrixAt(i, m);
    }
    // Low blossom shrubs near the lens: they frame the bottom edge and give the side view depth.
    for (let i = 0; i < SHRUBS; i++) {
      track.place(14 + (i / SHRUBS) * (level.pond.from - 14) + rand() * 3, 0, 0, base); // none by the hero camera
      p.set(base.x - 4.6 - rand() * 1.4, 0.05, base.z);
      m.compose(p, q.setFromEuler(e.set(0, rand() * 6, 0)), s.set(0.45 + rand() * 0.35, 0.3 + rand() * 0.2, 0.45 + rand() * 0.35));
      shrubs.current!.setMatrixAt(i, m);
    }
    tufts.current!.instanceMatrix.needsUpdate = true;
    flowers.current!.instanceMatrix.needsUpdate = true;
    shrubs.current!.instanceMatrix.needsUpdate = true;
  }, [track]);
  return (
    <group>
      <instancedMesh ref={tufts} args={[undefined, grass, COUNT]} frustumCulled={false}>
        <coneGeometry args={[0.24, 0.34, 5]} />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[undefined, flower, COUNT]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
      </instancedMesh>
      <instancedMesh ref={shrubs} args={[undefined, shrub, SHRUBS]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <Outlines thickness={0.03} color={ink} {...INK_WORLD} />
      </instancedMesh>
    </group>
  );
}

// The giant sakura: the branch the fox grinds up grows out of it, and its crown is the launch pad.
function GiantTree({ track }: { track: RunTrack }) {
  const { branch } = level;
  // Blossom clusters along the branch, behind and below the road so the fox stays clear.
  const twigs = useMemo(() => {
    const rand = mulberry32(31);
    const out: { p: [number, number, number]; r: number; light: boolean }[] = [];
    for (let d = branch.from + 8; d < branch.to; d += 5 + rand() * 4) {
      const p = track.place(d, 0, 0, v());
      out.push({ p: [p.x + 1.8 + rand() * 2, p.y - 0.8 - rand() * 1.2, p.z + (rand() - 0.5) * 2], r: 0.9 + rand() * 0.8, light: rand() < 0.5 });
    }
    return out;
  }, [track, branch.from, branch.to]);
  const bark = useDusk("#6e4b5e", { rim: 0.8 });
  const pink = useDusk("#ff9ec6", { rim: 1.2, flat: true });
  const blush = useDusk("#ffc2dc", { rim: 1.2, flat: true });
  const ink = useLookStore((s) => s.look.ink);
  const { trunk, blobs } = useMemo(() => {
    const top = track.place(branch.to + 8, 0, 0, v());
    const rand = mulberry32(77);
    const blobs = Array.from({ length: 16 }, (_, i) => ({
      p: [top.x + 3 + rand() * 12, top.y - 3 + rand() * 9, top.z - 22 + rand() * 46] as [number, number, number],
      r: 4 + rand() * 4,
      light: i % 2 === 0,
    }));
    return { trunk: new THREE.Vector3(top.x + 8, 0, top.z - 4), blobs };
  }, [track, branch.to]);
  const height = 26;
  return (
    <group>
      <mesh material={bark} position={[trunk.x, height / 2, trunk.z]}>
        <cylinderGeometry args={[2.4, 4, height, 14]} />
        <Outlines thickness={0.06} color={ink} {...INK_WORLD} />
      </mesh>
      {[...blobs, ...twigs].map((b, i) => (
        <mesh key={i} material={b.light ? blush : pink} position={b.p} scale={b.r}>
          <icosahedronGeometry args={[1, 1]} />
          <Outlines thickness={0.02} color={ink} {...INK_WORLD} />
        </mesh>
      ))}
    </group>
  );
}

// Soft dusk clouds far behind the hills.
function Clouds({ track }: { track: RunTrack }) {
  const material = useDusk("#ffd3dc", { rim: 0.8 });
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 30;
  useEffect(() => {
    const rand = mulberry32(9);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = v();
    const p = v();
    for (let i = 0; i < COUNT; i++) {
      const c = Math.floor(i / 3); // long streaks of three overlapping puffs
      const cr = mulberry32(c + 100);
      const z = -80 + (c / (COUNT / 3)) * (track.length + 200) + (rand() - 0.5) * 30;
      p.set(260 + cr() * 120, 45 + cr() * 50 + (rand() - 0.5) * 3, z);
      m.compose(p, q, s.set(14 + rand() * 6, 2.2 + rand() * 1.2, 26 + rand() * 18));
      meshRef.current!.setMatrixAt(i, m);
    }
    meshRef.current!.instanceMatrix.needsUpdate = true;
  }, [track]);
  return (
    <instancedMesh ref={meshRef} args={[undefined, material, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 16, 10]} />
    </instancedMesh>
  );
}

export default function World({ track, foxD, camera }: { track: RunTrack; foxD: React.RefObject<number>; camera: React.RefObject<THREE.Object3D | null> }) {
  const ground = useDusk(GRASS, { rim: 0 });
  const sun = useLookStore((s) => s.look.sun);

  const { trees, torii, hills } = useMemo(() => {
    const rand = mulberry32(42);
    const trees: TreeSpot[] = [];
    const base = v();
    // Behind the track along the meadow and torii row, and far behind the pond.
    for (let d = -20; d < track.length + 30; d += 3 + rand() * 4) {
      const onPond = d > level.pond.from - 4 && d < level.branch.from + 4;
      const near = onPond ? 48 : 8;
      track.place(Math.max(0, Math.min(track.length, d)), 0, 0, base);
      if (d > level.branch.to - 10) continue; // the giant tree's crown takes over here
      const x = base.x + near + rand() * (onPond ? 30 : 34);
      trees.push({ p: new THREE.Vector3(x, -0.05, base.z + (rand() - 0.5) * 3), s: 0.9 + rand() * 0.9, seed: trees.length + 3 });
    }
    const torii: { p: THREE.Vector3 }[] = [];
    for (let d = level.torii.from; d <= level.torii.to; d += level.torii.gap) torii.push({ p: track.place(d, 0, 0, v()) });
    const hills = [0, 160, 320].map((d) => track.place(Math.min(d, track.length), 0, 0, v()));
    return { trees, torii, hills };
  }, [track]);

  const petalsRef = useRef<THREE.Group>(null);
  const petals = useQuality((s) => s.tier) > 0;
  useFrame(() => {
    if (petalsRef.current && camera.current) petalsRef.current.position.copy(camera.current.position);
  });

  return (
    <group>
      <mesh material={ground} rotation-x={-Math.PI / 2} position={[0, -0.06, track.length / 2]}>
        <circleGeometry args={[900, 48]} />
      </mesh>
      {hills.map((h, i) => (
        <FarHills key={i} color="#b07fa6" radius={230} count={8} seed={i + 3} position={[h.x, 0, h.z]} rotation-y={-Math.PI / 2} />
      ))}
      <Clouds track={track} />
      <Terrain track={track} />
      <Pond track={track} foxD={foxD} />
      <Groves spots={trees} />
      <Foreground track={track} />
      {torii.map((t, i) => (
        <Torii key={i} position={t.p} width={7.5} height={5.2} />
      ))}
      <GiantTree track={track} />
      <LightShafts color={sun} position={[60, 14, 120]} rotation-y={-Math.PI / 2} rotation-z={0.5} length={70} spread={60} count={6} />
      <group ref={petalsRef} visible={petals}>
        {/* Turned so the breeze blows along -Z: the fox runs into the petals. */}
        <Petals position={[19, -5, 0]} rotation-y={Math.PI / 2} box={[46, 12, 24]} count={60} wind={1.4} />
      </group>
    </group>
  );
}
