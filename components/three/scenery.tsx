"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Outlines } from "@react-three/drei";
import * as THREE from "three";
import { INK_WORLD, useDusk, useGlow, useLookStore } from "./dusk";

// Scenery pieces for the dream run and the hero, all in the dusk look. Units are metres;
// the fox is 1.6 long. Shared by /lab now, by the hero and the game world later.

type GroupProps = React.ComponentProps<"group">;

export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const useInk = () => useLookStore((s) => s.look.ink);

// ---------------------------------------------------------------------------- glow helpers

let radial: THREE.Texture | null = null;
// Soft round falloff, made once and shared by every halo.
function radialTexture() {
  if (radial) return radial;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  radial = new THREE.CanvasTexture(c);
  return radial;
}

// A soft glow that always faces the camera.
export function Halo({ color, size = 2, strength = 1, ...props }: { color: string; size?: number; strength?: number } & GroupProps) {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: radialTexture(),
        color: new THREE.Color(color).multiplyScalar(strength),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        fog: false,
      }),
    [color, strength],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group {...props}>
      <Billboard>
        <mesh material={material} scale={size}>
          <planeGeometry />
        </mesh>
      </Billboard>
    </group>
  );
}

// Long additive beams falling from the sun: cheap fake god rays.
export function LightShafts({ color, count = 5, length = 40, spread = 14, seed = 7, ...props }: { color: string; count?: number; length?: number; spread?: number; seed?: number } & GroupProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; varying vec2 vUv;
          void main() {
            float a = pow(vUv.y, 1.6) * sin(vUv.x * 3.14159) * 0.16;
            gl_FragColor = vec4(uColor * a, 1.0);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [color],
  );
  useEffect(() => () => material.dispose(), [material]);
  const beams = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => ({
      x: (rand() - 0.5) * spread,
      w: 1.5 + rand() * 3.5,
      tilt: (rand() - 0.5) * 0.12,
    }));
  }, [count, spread, seed]);
  return (
    <group {...props}>
      {beams.map((b, i) => (
        <mesh key={i} material={material} position={[b.x, 0, 0]} rotation-z={b.tilt}>
          <planeGeometry args={[b.w, length]} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------- land

export function Hill({ radius = 6, height = 1.6, color = "#a9c48a", ...props }: { radius?: number; height?: number; color?: string } & GroupProps) {
  const material = useDusk(color, { rim: 0.5 });
  const ink = useInk();
  return (
    <group {...props}>
      <mesh material={material} scale={[radius, height, radius]}>
        <sphereGeometry args={[1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Outlines thickness={0.012} color={ink} {...INK_WORLD} />
      </mesh>
    </group>
  );
}

export function Ground({ color = "#a9c48a", size = 1200, ...props }: { color?: string; size?: number } & GroupProps) {
  const material = useDusk(color, { rim: 0 });
  return (
    <group {...props}>
      <mesh material={material} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[size / 2, 64]} />
      </mesh>
    </group>
  );
}

// Far silhouettes: flattened domes that the fog paints lighter with distance.
export function FarHills({ color, count = 9, radius = 160, seed = 3, ...props }: { color: string; count?: number; radius?: number; seed?: number } & GroupProps) {
  const material = useDusk(color, { rim: 0.6 });
  const hills = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => {
      const a = -Math.PI * 0.85 + (i / (count - 1)) * Math.PI * 0.7 + (rand() - 0.5) * 0.15;
      const r = radius * (0.8 + rand() * 0.5);
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, w: 30 + rand() * 50, h: 12 + rand() * 26 };
    });
  }, [count, radius, seed]);
  return (
    <group {...props}>
      {hills.map((h, i) => (
        <mesh key={i} material={material} position={[h.x, 0, h.z]} scale={[h.w, h.h, h.w * 0.7]}>
          <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
    </group>
  );
}

// A flat ribbon through 2D points (x, z), lying on y = 0: footpaths and the hero's road.
export function PathRibbon({ points, width = 1.6, color = "#f4d9c2", ...props }: { points: [number, number][]; width?: number; color?: string } & GroupProps) {
  const material = useDusk(color, { rim: 0, side: THREE.DoubleSide });
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal");
    const n = 160;
    const verts: number[] = [];
    const idx: number[] = [];
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      curve.getPointAt(u, p);
      curve.getTangentAt(u, t);
      // Narrows with distance so it reads as perspective even from low cameras.
      const w = (width / 2) * (1 - u * 0.55);
      verts.push(p.x - t.z * w, 0, p.z + t.x * w, p.x + t.z * w, 0, p.z - t.x * w);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [points, width]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

// Still water: the scene drawn again upside down under a tinted, see-through surface.
// Exact and cheap for flat water (one extra draw of the reflected things, no render target).
export function StillWater({ color, opacity = 0.62, size = 800, children }: { color: string; opacity?: number; size?: number; children: React.ReactNode }) {
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
    [color, opacity],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <>
      {children}
      <group scale-y={-1}>{children}</group>
      <mesh material={material} rotation-x={-Math.PI / 2} renderOrder={1}>
        <circleGeometry args={[size / 2, 64]} />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------------- props

export function SakuraTree({ seed = 1, scale = 1, ...props }: { seed?: number; scale?: number } & GroupProps) {
  const trunk = useDusk("#6e4b5e", { rim: 0.6 });
  const bloom = useDusk("#ff9ec6", { rim: 1.2, flat: true });
  const bloomLight = useDusk("#ffc2dc", { rim: 1.2, flat: true });
  const ink = useInk();
  const blobs = useMemo(() => {
    const rand = mulberry32(seed * 977);
    return Array.from({ length: 5 }, (_, i) => ({
      p: [(rand() - 0.5) * 1.8, 2.5 + rand() * 1.1, (rand() - 0.5) * 1.8] as const,
      r: 0.8 + rand() * 0.55,
      light: i % 2 === 0,
    }));
  }, [seed]);
  return (
    <group scale={scale} {...props}>
      <mesh material={trunk} position-y={1.2}>
        <cylinderGeometry args={[0.1, 0.2, 2.4, 7]} />
        <Outlines thickness={0.03} color={ink} {...INK_WORLD} />
      </mesh>
      {blobs.map((b, i) => (
        <mesh key={i} material={b.light ? bloomLight : bloom} position={b.p} scale={b.r}>
          <icosahedronGeometry args={[1, 1]} />
          <Outlines thickness={0.035} color={ink} {...INK_WORLD} />
        </mesh>
      ))}
    </group>
  );
}

export function Torii({ width = 9, height = 5.5, ...props }: { width?: number; height?: number } & GroupProps) {
  const red = useDusk("#e0574e", { rim: 1 });
  const dark = useDusk("#3d2a3f", { rim: 0.5 });
  const ink = useInk();
  const post = (x: number) => (
    <mesh material={red} position={[x, height / 2, 0]}>
      <cylinderGeometry args={[0.22, 0.26, height, 10]} />
      <Outlines thickness={0.04} color={ink} {...INK_WORLD} />
    </mesh>
  );
  return (
    <group {...props}>
      {post(-width / 2 + 0.8)}
      {post(width / 2 - 0.8)}
      <mesh material={dark} position={[0, height + 0.2, 0]}>
        <boxGeometry args={[width + 1.2, 0.36, 0.55]} />
        <Outlines thickness={0.04} color={ink} {...INK_WORLD} />
      </mesh>
      <mesh material={red} position={[0, height - 0.75, 0]}>
        <boxGeometry args={[width - 0.6, 0.24, 0.32]} />
        <Outlines thickness={0.04} color={ink} {...INK_WORLD} />
      </mesh>
    </group>
  );
}

// The portfolio crystal: a faceted gem lit like everything else, glowing from inside,
// circled by a thin gold ring, with a soft halo.
export function Crystal({ spin = true, ...props }: { spin?: boolean } & GroupProps) {
  const accent = useLookStore((s) => s.look.accent);
  const ink = useInk();
  const gem = useDusk("#ffc4dc", { rim: 1.6, flat: true, emissive: accent, emissiveIntensity: 0.7 });
  const ring = useGlow("#ffd166", 1.5);
  const gemRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!spin) return;
    if (gemRef.current) gemRef.current.rotation.y += delta * 0.3;
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.2;
  });
  return (
    <group {...props}>
      <Halo color={accent} size={4.5} strength={1.1} />
      <mesh ref={gemRef} material={gem} scale={[1, 1.55, 1]}>
        <octahedronGeometry args={[1, 0]} />
        <Outlines thickness={0.03} color={ink} {...INK_WORLD} />
      </mesh>
      <mesh ref={ringRef} material={ring} rotation={[Math.PI / 2.3, 0.35, 0]}>
        <torusGeometry args={[1.75, 0.025, 8, 160]} />
      </mesh>
    </group>
  );
}

// Floating paper lanterns: unlit warm glow (bloom does the halo), scattered over water.
export function Lanterns({ color, count = 40, area = [60, 60] as [number, number], seed = 11, ...props }: { color: string; count?: number; area?: [number, number]; seed?: number } & GroupProps) {
  const glow = useGlow(color, 2.4);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const rand = mulberry32(seed);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      p.set((rand() - 0.5) * area[0], 0.15 + rand() * 0.25, (rand() - 0.5) * area[1]);
      s.setScalar(0.6 + rand() * 0.6);
      m.compose(p, q, s);
      meshRef.current!.setMatrixAt(i, m);
    }
    meshRef.current!.instanceMatrix.needsUpdate = true;
  }, [count, area, seed]);
  return (
    <group {...props}>
      <instancedMesh ref={meshRef} args={[undefined, glow, count]}>
        <cylinderGeometry args={[0.22, 0.28, 0.42, 8]} />
      </instancedMesh>
    </group>
  );
}

// A floating island: rocky cone underneath, grassy top, edges lit by the rim light.
export function Island({ radius = 4, seed = 1, grass = "#4b5ca6", rock = "#2e2865", ...props }: { radius?: number; seed?: number; grass?: string; rock?: string } & GroupProps) {
  const top = useDusk(grass, { rim: 0.8 });
  const under = useDusk(rock, { rim: 1.1, flat: true });
  const ink = useInk();
  const depth = useMemo(() => 1.2 + mulberry32(seed)() * 1.2, [seed]);
  return (
    <group {...props}>
      <mesh material={top} scale={[radius, 0.5, radius]}>
        <cylinderGeometry args={[1, 0.96, 1, 12]} />
        <Outlines thickness={0.02} color={ink} {...INK_WORLD} />
      </mesh>
      <mesh material={under} position-y={-0.25 - (radius * depth) / 2} rotation-x={Math.PI} scale={[radius * 0.96, radius * depth, radius * 0.96]}>
        <coneGeometry args={[1, 1, 7, 2]} />
        <Outlines thickness={0.015} color={ink} {...INK_WORLD} />
      </mesh>
    </group>
  );
}

// Glowing stepping stones in Star Steps.
export function Step({ color, size = 2.4, ...props }: { color: string; size?: number } & GroupProps) {
  const glow = useGlow(color, 1.1);
  const body = useDusk("#2d2a5e", { rim: 1.5, flat: true });
  return (
    <group {...props}>
      <mesh material={body} scale={[size, 0.35, size]}>
        <cylinderGeometry args={[1, 0.7, 1, 6]} />
      </mesh>
      <mesh material={glow} position-y={0.18} scale={[size * 0.92, 1, size * 0.92]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.82, 1, 6]} />
      </mesh>
    </group>
  );
}

// Gold rings, one instanced mesh.
export function RingSet({ points, ...props }: { points: THREE.Vector3[] } & GroupProps) {
  const glow = useGlow("#ffd166", 1.35);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = new THREE.Matrix4();
    points.forEach((p, i) => meshRef.current!.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
    meshRef.current!.instanceMatrix.needsUpdate = true;
  }, [points]);
  return (
    <group {...props}>
      <instancedMesh ref={meshRef} args={[undefined, glow, points.length]}>
        <torusGeometry args={[0.45, 0.07, 8, 32]} />
      </instancedMesh>
    </group>
  );
}

// The fox's light trail: a tube that fades toward its tail.
export function Trail({ points, color, radius = 0.12, strength = 2.2, ...props }: { points: THREE.Vector3[]; color: string; radius?: number; strength?: number } & GroupProps) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    return new THREE.TubeGeometry(curve, Math.max(64, points.length * 24), radius, 8, false);
  }, [points, radius]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color).multiplyScalar(strength) } },
        vertexShader: /* glsl */ `varying float vT; void main() { vT = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `uniform vec3 uColor; varying float vT; void main() { gl_FragColor = vec4(uColor * pow(vT, 1.8), 1.0); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color, strength],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

// ---------------------------------------------------------------------------- particles

const petalGeometry = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.09, 0.06, 0.11, 0.17, 0.03, 0.25);
  s.lineTo(0, 0.22);
  s.lineTo(-0.03, 0.25);
  s.bezierCurveTo(-0.11, 0.17, -0.09, 0.06, 0, 0);
  return new THREE.ShapeGeometry(s);
})();

// Sakura petals carried by one steady breeze: they drift sideways and sink slowly, rocking
// gently like real petals instead of tumbling, and shrink away near the edges of their box
// instead of popping in and out when they wrap round.
export function Petals({ count = 70, box = [30, 12, 30] as [number, number, number], wind = 0.9, still = false, seed = 1303, ...props }: { count?: number; box?: [number, number, number]; wind?: number; still?: boolean; seed?: number } & GroupProps) {
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffc6dc").multiplyScalar(1.02), side: THREE.DoubleSide, toneMapped: false }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => ({
      x: rand(),
      y: rand(),
      z: rand(),
      drift: 0.75 + rand() * 0.5, // share of the wind this petal catches
      sink: 0.18 + rand() * 0.2, // m/s
      rock: 1.2 + rand() * 1.2, // rocking speed
      phase: rand() * Math.PI * 2,
      yaw: rand() * Math.PI * 2,
      scale: 0.7 + rand() * 0.6,
    }));
  }, [count, seed]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const wrap = (v: number) => ((v % 1) + 1) % 1;
  const edge = (u: number) => Math.min(1, u / 0.12, (1 - u) / 0.12); // 0 at the box edges

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = still ? 0 : state.clock.elapsedTime;
    const [w, h, d] = box;
    seeds.forEach((p, i) => {
      const u = wrap(p.x + (t * wind * p.drift) / w);
      const v = wrap(p.y - (t * p.sink) / h);
      const rock = Math.sin(t * p.rock + p.phase);
      dummy.position.set((u - 0.5) * w, v * h + rock * 0.08, (p.z - 0.5) * d);
      // Lying mostly flat, rocking side to side, turning slowly.
      dummy.rotation.set(-1.1 + rock * 0.45, p.yaw + t * 0.25 * p.drift, rock * 0.3);
      dummy.scale.setScalar(p.scale * Math.max(0, Math.min(edge(u), edge(v))));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group {...props}>
      <instancedMesh ref={meshRef} args={[petalGeometry, material, count]} frustumCulled={false} />
    </group>
  );
}
