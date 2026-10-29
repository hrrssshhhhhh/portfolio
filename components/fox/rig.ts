import * as THREE from "three";
import { duskMaterial } from "@/components/three/dusk";

// The mascot fox, built from simple shapes: an upright chibi kitsune in midnight violet and
// gold (PLAN.md Step 17). Units are metres; it stands ~1.3 m tall (ears to ~1.6), faces +Z,
// feet on y = 0. Every joint is a Group so poses are just rotations.

export const FOX_COLORS = {
  fur: "#4a3790",
  light: "#d9ccff", // muzzle, chest, paws, cheek tufts
  gold: "#ffd166",
  boot: "#251a4a",
  nose: "#1b1033",
  sclera: "#fff7ef",
  iris: "#ffc23d",
  irisDeep: "#d97a10",
  pupil: "#1b1033",
};

export const INK_WIDTH = 0.012; // outline width in metres

const OUTLINE_VERTEX = /* glsl */ `
uniform float uWidth;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * uWidth, 1.0);
}`;
const OUTLINE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
void main() {
  gl_FragColor = vec4(uColor, 1.0);
  #include <colorspace_fragment>
}`;

export type Eye = { ball: THREE.Group; lash: THREE.Mesh; lid: THREE.Mesh };

export type Rig = {
  root: THREE.Group; // whole-body pitch/roll/lift
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  neck: THREE.Group; // scarf and collar anchor
  ears: [THREE.Group, THREE.Group]; // left (+X), right
  shoulders: [THREE.Group, THREE.Group];
  elbows: [THREE.Group, THREE.Group];
  thighs: [THREE.Group, THREE.Group];
  knees: [THREE.Group, THREE.Group];
  tail: THREE.Group[];
  eyes: [Eye, Eye];
  outline: THREE.ShaderMaterial;
  dispose: () => void;
};

export function buildFox(): Rig {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const geo = <T extends THREE.BufferGeometry>(g: T) => (geometries.push(g), g);
  const mat = <T extends THREE.Material>(m: T) => (materials.push(m), m);

  const outline = mat(
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color("#7a3d5c") }, uWidth: { value: INK_WIDTH } },
      vertexShader: OUTLINE_VERTEX,
      fragmentShader: OUTLINE_FRAGMENT,
      side: THREE.BackSide,
    }),
  );
  const C = FOX_COLORS;
  const fur = mat(duskMaterial(C.fur, { rim: 1.5 }));
  const light = mat(duskMaterial(C.light, { rim: 1.2 }));
  const gold = mat(duskMaterial(C.gold, { rim: 1, emissive: C.gold, emissiveIntensity: 0.25 }));
  const boot = mat(duskMaterial(C.boot, { rim: 1.2 }));
  const flat = (c: string) => mat(new THREE.MeshBasicMaterial({ color: c }));
  const nose = flat(C.nose);
  const sclera = flat(C.sclera);
  const iris = flat(C.iris);
  const irisDeep = flat(C.irisDeep);
  const pupil = flat(C.pupil);
  const shine = mat(new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffffff").multiplyScalar(1.3), toneMapped: false }));
  const crystal = mat(new THREE.MeshBasicMaterial({ color: new THREE.Color(C.gold).multiplyScalar(1.8), toneMapped: false }));

  const ellipsoid = (rx: number, ry: number, rz: number, seg = 24) => geo(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75)).scale(rx, ry, rz));
  const capsule = (r: number, len: number) => geo(new THREE.CapsuleGeometry(r, len, 6, 14));
  const cone = (r: number, h: number, seg = 14) => geo(new THREE.ConeGeometry(r, h, seg));

  const group = (parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };
  // A visible part, optionally with an ink outline shell sharing its geometry.
  const part = (
    parent: THREE.Object3D,
    g: THREE.BufferGeometry,
    m: THREE.Material,
    [x, y, z]: [number, number, number] = [0, 0, 0],
    [rx, ry, rz]: [number, number, number] = [0, 0, 0],
    inked = true,
  ) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    if (inked) mesh.add(new THREE.Mesh(g, outline));
    parent.add(mesh);
    return mesh;
  };

  const root = new THREE.Group();
  const hips = group(root, 0, 0.45, 0);
  part(hips, ellipsoid(0.15, 0.11, 0.13), fur, [0, 0.02, 0]);

  // Torso and chest.
  const torso = group(hips);
  part(torso, ellipsoid(0.17, 0.2, 0.15), fur, [0, 0.16, 0]);
  part(torso, ellipsoid(0.11, 0.14, 0.06), light, [0, 0.16, 0.105], [0, 0, 0], false);
  const neck = group(torso, 0, 0.33, 0);

  // Head: big skull, cheek tufts, muzzle, nose, bangs, crystal mark.
  const head = group(torso, 0, 0.34, 0);
  part(head, ellipsoid(0.3, 0.27, 0.28, 32), fur, [0, 0.26, 0]);
  // Fluffy cheek ruffs sweeping out and down: the fox's face shape.
  for (const s of [1, -1]) {
    part(head, ellipsoid(0.15, 0.05, 0.075), light, [s * 0.22, 0.11, 0.06], [0, s * 0.3, s * -0.62]);
  }
  // A pointed snout: the single biggest "fox, not cat" cue.
  part(head, ellipsoid(0.09, 0.07, 0.19), light, [0, 0.125, 0.21], [0.1, 0, 0]);
  part(head, ellipsoid(0.038, 0.028, 0.03), nose, [0, 0.148, 0.385], [0, 0, 0], false);
  part(head, geo(new THREE.TorusGeometry(0.03, 0.007, 6, 12, Math.PI).rotateZ(Math.PI)), nose, [0, 0.09, 0.35], [-0.35, 0, 0], false);
  // One soft forelock instead of spikes.
  part(head, ellipsoid(0.1, 0.035, 0.12), fur, [0.03, 0.47, 0.15], [-0.85, 0, -0.3]);
  part(head, geo(new THREE.OctahedronGeometry(1, 0).scale(0.03, 0.055, 0.012)), crystal, [0, 0.4, 0.262], [-0.45, 0, 0], false);

  // Ears: violet cones with gold insides, pivoting at the base.
  const ears = [1, -1].map((s) => {
    const ear = group(head, s * 0.15, 0.45, -0.03);
    ear.rotation.z = s * -0.32;
    part(ear, cone(0.11, 0.34), fur, [0, 0.16, 0]);
    part(ear, cone(0.065, 0.24), gold, [0, 0.12, 0.04], [0.12, 0, 0], false);
    return ear;
  }) as [THREE.Group, THREE.Group];

  // Anime eyes: sclera, two-tone iris, pupil, two highlights; a lash arc (open / happy ^)
  // and a lower lid arc (asleep ‿) drawn when the eye is shut.
  const lashGeo = geo(new THREE.TorusGeometry(0.075, 0.011, 6, 20, Math.PI).scale(1, 1.25, 1));
  const eyes = [1, -1].map((s) => {
    const eye = group(head, s * 0.115, 0.27, 0.232);
    eye.rotation.set(0, s * 0.42, s * -0.06);
    const ball = group(eye);
    part(ball, ellipsoid(0.07, 0.095, 0.03, 20), sclera, [0, 0, 0], [0, 0, 0], false);
    part(ball, ellipsoid(0.052, 0.077, 0.02, 20), irisDeep, [0, -0.004, 0.017], [0, 0, 0], false);
    part(ball, ellipsoid(0.044, 0.06, 0.02, 20), iris, [0, -0.014, 0.021], [0, 0, 0], false);
    part(ball, ellipsoid(0.026, 0.045, 0.012, 16), pupil, [0, 0.004, 0.032], [0, 0, 0], false);
    part(ball, ellipsoid(0.018, 0.024, 0.006, 12), shine, [-s * 0.016, 0.03, 0.04], [0, 0, 0], false);
    part(ball, ellipsoid(0.009, 0.011, 0.006, 10), shine, [s * 0.018, -0.03, 0.04], [0, 0, 0], false);
    const lash = part(eye, lashGeo, pupil, [0, 0, 0.012], [0, 0, 0], false);
    const lid = part(eye, lashGeo, pupil, [0, -0.02, 0.016], [0, 0, Math.PI], false);
    lid.scale.set(0.8, 0.45, 1);
    return { ball, lash, lid };
  }) as [Eye, Eye];

  // Arms: shoulder -> upper arm -> elbow -> forearm -> paw. Hanging along -Y.
  const shoulders: THREE.Group[] = [];
  const elbows: THREE.Group[] = [];
  for (const s of [1, -1]) {
    const shoulder = group(torso, s * 0.17, 0.27, 0);
    part(shoulder, capsule(0.055, 0.09), fur, [0, -0.08, 0]);
    const elbow = group(shoulder, 0, -0.16, 0);
    part(elbow, capsule(0.05, 0.08), fur, [0, -0.07, 0]);
    part(elbow, ellipsoid(0.065, 0.06, 0.065), light, [0, -0.16, 0]);
    shoulders.push(shoulder);
    elbows.push(elbow);
  }

  // Legs: hip -> thigh -> knee -> shin -> paw-boot with a gold band.
  const thighs: THREE.Group[] = [];
  const knees: THREE.Group[] = [];
  const band = geo(new THREE.TorusGeometry(0.064, 0.018, 8, 20).rotateX(Math.PI / 2));
  for (const s of [1, -1]) {
    const thigh = group(hips, s * 0.09, 0, 0);
    part(thigh, capsule(0.075, 0.1), fur, [0, -0.09, 0]);
    const knee = group(thigh, 0, -0.19, 0);
    part(knee, capsule(0.06, 0.09), fur, [0, -0.08, 0]);
    part(knee, ellipsoid(0.09, 0.075, 0.15), boot, [0, -0.205, 0.045]);
    part(knee, band, gold, [0, -0.165, 0], [0, 0, 0], false);
    thighs.push(thigh);
    knees.push(knee);
  }

  // Tail: one big fluffy brush. Four joints, each carrying a long overlapping puff so it reads
  // as a single shape that bends; the last puff is the gold tip, tucked into the one before.
  const tail: THREE.Group[] = [];
  let parent: THREE.Object3D = group(hips, 0, 0.04, -0.1);
  const puffs = [
    { r: 0.08, len: 0.14 },
    { r: 0.13, len: 0.17 },
    { r: 0.155, len: 0.18 },
    { r: 0.12, len: 0.15 },
  ];
  puffs.forEach(({ r, len }, i) => {
    const seg = group(parent, 0, 0, i === 0 ? 0 : -0.11);
    const tip = i === puffs.length - 1;
    part(seg, ellipsoid(r, r * 0.92, len, 28), tip ? gold : fur, [0, 0, tip ? -0.1 : -0.06]);
    tail.push(seg);
    parent = seg;
  });

  return {
    root,
    hips,
    torso,
    head,
    neck,
    ears,
    shoulders: shoulders as [THREE.Group, THREE.Group],
    elbows: elbows as [THREE.Group, THREE.Group],
    thighs: thighs as [THREE.Group, THREE.Group],
    knees: knees as [THREE.Group, THREE.Group],
    tail,
    eyes,
    outline,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
