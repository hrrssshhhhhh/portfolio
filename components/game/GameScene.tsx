"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BOOST, level, PHYSICS, RUN, SIDE_CAMERA, speedAt, type CameraBreak } from "@/lib/level";
import { looks, mixLook } from "@/lib/look";
import { sections } from "@/lib/sections";
import Fox, { type FoxDriver } from "@/components/fox/Fox";
import { applyLook, useLookStore } from "@/components/three/dusk";
import Post from "@/components/three/Post";
import { QualityMonitor } from "@/components/three/quality";
import { Crystal, Trail } from "@/components/three/scenery";
import Sky from "@/components/three/Sky";
import { HERO_VIEW } from "@/components/three/views";
import { bitChord, duckMusic, playMelody, ringNote, whoosh } from "./audio";
import { bitColor, Bits, Boosts, burst, Bursts, makeWorld, Rings, Springs, type RunWorld } from "./Items";
import { useGameStore } from "./store";
import { makeRunTrack, newFrame, ringSpots } from "./track";
import World from "./World";

export type Input = { pressed: boolean; held: boolean };

const FOX_CENTER = 0.65; // body height above the feet
const INTRO = 1.8; // seconds: hero framing -> side view
const SLOW = { time: 0.6, scale: 0.3 }; // data-bit slow motion
const MAGNET = 9; // metres: bits fly to the fox inside this range
const BREAK_BLEND = 12; // metres to blend into and out of a camera break
const FINALE = { hoverAt: 6, nightfall: 2.5, gather: 1.4, done: 4.6 }; // vh to hover at, then seconds

const damp = THREE.MathUtils.damp;
const smooth = THREE.MathUtils.smoothstep;

// Per-run values that change every frame live here, not in React state.
type Runner = {
  d: number;
  h: number;
  vh: number;
  air: boolean;
  jumps: number;
  boost: number;
  launch: number; // > 0 while flying off a spring: fixed speed so the fox follows the ring arc
  slow: number;
  time: number;
  speed: number;
  intro: number;
  hover: number; // seconds since the finale hover began (-1 before)
  gliding: boolean;
};

// The side camera's offsets at distance `d`, blended with any camera break nearby.
function cameraAt(d: number) {
  const c = { ...SIDE_CAMERA, hold: d, holdWeight: 0 };
  for (const b of level.cameras) {
    const w = Math.min(smooth(d, b.from - BREAK_BLEND, b.from), 1 - smooth(d, b.to, b.to + BREAK_BLEND));
    if (w <= 0) continue;
    for (const k of ["side", "up", "lead", "look"] as const satisfies readonly (keyof CameraBreak)[]) c[k] += (b[k] - c[k]) * w;
    if (b.hold !== undefined) {
      c.hold = b.hold;
      c.holdWeight = w;
    }
  }
  return c;
}

// The plain side view at distance `d` (no camera breaks, start speed): the hero's run ends on
// exactly this pose so the game can take over without a cut. Keep in step with the camera below.
export function sideCamera(track: ReturnType<typeof makeRunTrack>, d: number, aspect: number, cam: THREE.Vector3, look: THREE.Vector3) {
  const portrait = Math.min(2.2, Math.max(1, 1.2 / aspect));
  const c = SIDE_CAMERA;
  const base = track.place(d, 0, 0, look);
  cam.set(base.x - c.side * portrait, base.y + c.up, base.z + c.lead * portrait);
  look.set(base.x, base.y + c.look, base.z + 4);
}

export default function GameScene({ inputRef, reduced }: { inputRef: RefObject<Input>; reduced: boolean }) {
  const track = useMemo(() => makeRunTrack(), []);
  const spots = useMemo(() => ringSpots(track), [track]);
  const world = useRef<RunWorld>(null!);
  if (world.current === null) world.current = makeWorld(track, spots); // the scene remounts per run
  const fox = useRef<THREE.Group>(null);
  const driver = useRef<FoxDriver>({ pose: useGameStore.getState().arrival ? "run" : "idle", t: 0, wind: 1 });
  // Arriving from the hero: already running, intro done, at the hero's distance and speed.
  const arrival = useGameStore.getState().arrival;
  const run = useRef<Runner>({ d: arrival?.d ?? 0, h: 0, vh: 0, air: false, jumps: 0, boost: 0, launch: 0, slow: 0, time: 0, speed: Math.max(RUN.start, arrival?.speed ?? 0), intro: arrival ? INTRO : 0, hover: -1, gliding: false });
  const foxD = useRef(0);
  const cameraRef = useRef<THREE.Object3D | null>(null);
  const scene = useThree((s) => s.scene);
  const setLook = useLookStore((s) => s.setLook);
  const [trail, setTrail] = useState<THREE.Vector3[] | null>(null);
  const history = useRef<THREE.Vector3[]>([]);
  const crystal = useRef<THREE.Group>(null);
  const gathered = useRef<THREE.Group>(null);

  // Fresh dusk look for every run (the finale leaves it at night).
  useEffect(() => {
    applyLook(looks.dusk, scene);
    setLook(looks.dusk);
  }, [scene, setLook]);

  // Test hook: in dev, or with ?debug in the URL, browser tests can read and move the runner.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || new URLSearchParams(location.search).has("debug"))
      Object.assign(window, { __run: run.current, __input: inputRef.current });
  }, [inputRef]);

  const tmp = useMemo(
    () => ({ f: newFrame(), left: new THREE.Vector3(), basis: new THREE.Matrix4(), center: new THREE.Vector3(), cam: new THREE.Vector3(), look: new THREE.Vector3(), lookNow: new THREE.Vector3(), hero: new THREE.Vector3(), heroLook: new THREE.Vector3(), hoverPos: new THREE.Vector3() }),
    [],
  );
  const placed = useRef(false);

  const frames = useRef(0);

  useFrame(({ camera, gl }, delta) => {
    cameraRef.current = camera;
    // The first frames compile shaders and fill the instanced scenery (a visible hitch), so the
    // run only starts, and the hero snapshot or veil only lifts, once a few frames are on screen.
    // Compiling the whole level up front also stops hitches later, when new scenery comes into view.
    if (++frames.current === 2) gl.compile(scene, camera);
    if (frames.current === 4) useGameStore.getState().ready();
    const w = world.current;
    if (!fox.current) return;
    const real = Math.min(delta, 1 / 20); // a dropped frame shouldn't teleport the fox
    const g = useGameStore.getState();
    const r = run.current;
    const { f } = tmp;
    r.slow = Math.max(0, r.slow - real);
    const dt = real * (r.slow > 0 ? SLOW.scale : 1);
    const pose = driver.current;
    pose.t += dt;
    const setPose = (p: FoxDriver["pose"], restart = false) => {
      if (pose.pose !== p || restart) pose.t = 0;
      pose.pose = p;
    };

    if (g.status === "intro") {
      r.intro += real;
      setPose(r.intro < 0.5 ? "idle" : "run");
      if (r.intro > 0.5) r.d += (r.intro >= INTRO ? r.speed : RUN.start * 0.5 * smooth(r.intro, 0.5, INTRO)) * real;
      if (r.intro >= INTRO) {
        g.start();
      }
    }

    const live = g.status === "running" || g.status === "finale";
    if (live && r.hover < 0) {
      r.time += dt;
      r.speed = Math.min(RUN.max, r.speed + RUN.accel * dt);
      r.boost = Math.max(0, r.boost - dt);
      const inLoop = !!track.loopAt(r.d);
      r.d = Math.min(track.length, r.d + (r.launch || r.speed + (r.boost > 0 ? BOOST.extra : 0)) * dt);

      // Jump, then a flip in the air; holding on the way down glides.
      const pressed = inputRef.current.pressed;
      inputRef.current.pressed = false;
      if (pressed && !inLoop && g.status === "running") {
        if (!r.air) {
          r.air = true;
          r.vh = PHYSICS.jump;
          r.jumps = 1;
          setPose("jump", true);
        } else if (r.jumps < 2 && !r.launch) {
          r.vh = Math.max(r.vh, 0) + PHYSICS.flip;
          r.jumps = 2;
          setPose("jump", true);
        }
      }
      r.gliding = r.air && inputRef.current.held && r.vh < 0 && !r.launch;
      if (r.air) {
        r.vh -= PHYSICS.gravity * (r.gliding ? PHYSICS.glide : 1) * dt;
        if (r.gliding) r.vh = Math.max(r.vh, -PHYSICS.glideFall);
        r.h += r.vh * dt;
        if (r.h <= 0 && r.vh <= 0 && g.status === "running") {
          r.h = 0;
          r.vh = 0;
          r.air = false;
          r.jumps = 0;
          r.launch = 0;
        }
      }
      if (inLoop) {
        r.h = 0;
        r.air = false;
      }

      track.place(r.d, 0, r.h + FOX_CENTER, tmp.center);

      // Rings: each one is the next note.
      for (let i = 0; i < spots.length; i++) {
        if (w.taken[i] || Math.abs(spots[i].d - r.d) > 2) continue;
        if (w.ringPos[i].distanceTo(tmp.center) < 1.35) {
          w.taken[i] = 1;
          burst(w, w.ringPos[i], "#ffd166");
          ringNote(g.rings);
          g.collectRing({ i: g.rings, t: r.time });
        }
      }

      level.springs.forEach((s, i) => {
        if (w.springFired.has(i)) return;
        // The treetop spring always catches the fox, even mid-air, so the run can't end on a
        // dead end; ordinary springs need the fox on the ground.
        const finale = s.at === level.finale;
        if (finale ? r.d < s.at - 1.2 : Math.abs(s.at - r.d) > 1.2 || r.h > 0.8) return;
        w.springFired.add(i);
        r.air = true;
        r.jumps = 2;
        r.vh = Math.sqrt(2 * PHYSICS.gravity * s.power);
        r.launch = speedAt(s.at);
        setPose("jump", true);
        whoosh(finale ? 1.4 : 0.8);
        if (finale) {
          g.launch();
          w.clear = true;
        }
      });

      level.boosts.forEach((b, i) => {
        if (w.boostFired.has(i) || Math.abs(b.at - r.d) > 1.5 || r.h > 1) return;
        w.boostFired.add(i);
        r.boost = BOOST.time;
        whoosh(0.7);
      });

      // Data bits fly to the fox once it is close: nobody can miss part of the portfolio.
      level.bits.forEach((b, n) => {
        if (w.bitsTaken.has(b.id)) return;
        const p = w.bitPos[b.id];
        const dist = p.distanceTo(tmp.center);
        if (dist > MAGNET) return;
        p.lerp(tmp.center, 1 - Math.exp(-7 * real));
        if (dist > 1.2) return;
        w.bitsTaken.add(b.id);
        burst(w, p, bitColor(b.id));
        bitChord(n);
        g.collectBit(b.id);
        if (!reduced) r.slow = SLOW.time;
      });

      const beat = [...level.beats].reverse().find((b) => r.d >= b.from);
      if (beat) g.setBeat(beat.id);

      // Finale: near the top of the launch the fox hangs in the sky.
      if (g.status === "finale" && r.vh < FINALE.hoverAt) {
        r.hover = 0;
        tmp.hoverPos.copy(tmp.center);
        // The trail stops just behind the fox so its bright tip doesn't swallow the fox.
        const pts = history.current.filter((p) => p.distanceTo(tmp.center) > 2.5);
        setTrail(pts.filter((_, i) => i % 3 === 0 || i === pts.length - 1));
      }
    }

    // Pose for this frame.
    if (r.hover >= 0) setPose("glide"); // standing on nothing looked wrong: it flies to the crystal
    else if (live) {
      if (r.air) setPose(r.gliding ? "glide" : "jump");
      else setPose(r.d > level.branch.from && r.d < level.branch.to ? "grind" : "run");
    }

    // The homecoming: night falls, the bits gather and the crystal re-forms, the melody plays.
    if (r.hover >= 0) {
      const before = r.hover;
      r.hover += real;
      const k = smooth(r.hover, 0, FINALE.nightfall);
      applyLook(mixLook(looks.dusk, looks.night, k), scene);
      if (before < 1.2 && r.hover >= 1.2) setLook(looks.night);
      if (before < FINALE.gather && r.hover >= FINALE.gather) {
        duckMusic(5); // the melody is about four seconds, plus its closing chord
        playMelody(g.notes);
      }
      if (crystal.current) {
        const grow = smooth(r.hover, FINALE.gather, FINALE.gather + 0.8);
        crystal.current.scale.setScalar(Math.max(0.001, grow * 2.2));
      }
      if (gathered.current) {
        gathered.current.children.forEach((c, i) => {
          const a = (i / 5) * Math.PI * 2 + r.hover * 1.5;
          const rad = THREE.MathUtils.lerp(2.8, 0, smooth(r.hover, 0.4, FINALE.gather + 0.4));
          c.position.set(Math.cos(a) * rad, Math.sin(a) * rad, 0);
        });
      }
      if (r.hover >= FINALE.done) g.finish(r.time);
    }

    // Place the fox on the track: forward = track tangent, up = track up (upside down in loops).
    track.frameAt(r.d, f);
    if (r.hover >= 0) fox.current.position.copy(tmp.hoverPos).addScaledVector(f.up, -FOX_CENTER + Math.sin(r.hover * 2.2) * 0.12);
    else fox.current.position.copy(f.pos).addScaledVector(f.up, r.h);
    tmp.left.crossVectors(f.up, f.tan);
    fox.current.quaternion.setFromRotationMatrix(tmp.basis.makeBasis(tmp.left, f.up, f.tan));
    // Gliding in the sky: nose up toward the crystal (ahead, above), turned a little to the camera.
    if (r.hover >= 0) fox.current.rotation.set(-0.35, -0.4, 0, "YXZ");
    foxD.current = r.d;
    const last = history.current[history.current.length - 1];
    if (live && r.hover < 0 && (!last || last.distanceTo(fox.current.position) > 2)) history.current.push(fox.current.position.clone().setY(fox.current.position.y + FOX_CENTER));

    // Camera: a side view that leads the fox, with breaks at the torii, pond and branch.
    const c = cameraAt(r.d);
    // Portrait screens see little ahead from the side: step back and lead further.
    const portrait = camera instanceof THREE.PerspectiveCamera ? Math.min(2.2, Math.max(1, 1.2 / camera.aspect)) : 1;
    // Held shots (the loop) must fit whole: those step back the full portrait amount.
    c.side = Math.max(c.side * (1 + (portrait - 1) * c.holdWeight), SIDE_CAMERA.side * portrait);
    c.lead *= portrait;
    const widen = (r.speed - RUN.start) * 0.35 + (r.boost > 0 ? 3 : 0);
    const base = track.place(r.d, 0, 0, tmp.look);
    // Jumps barely move the camera; the launch (finale) is followed all the way up.
    const followY = THREE.MathUtils.lerp(base.y, fox.current.position.y, g.status === "finale" ? 1 : 0.35);
    // Held breaks (the loop) keep the camera's z on one spot instead of following the fox.
    const z = THREE.MathUtils.lerp(base.z, track.place(c.hold, 0, 0, tmp.hero).z, c.holdWeight);
    const y = THREE.MathUtils.lerp(followY, base.y, c.holdWeight);
    tmp.cam.set(base.x - c.side - widen, y + c.up, z + c.lead);
    tmp.look.set(base.x, y + c.look, z + 4 * (1 - c.holdWeight));
    if (r.hover >= 0) {
      // Pull back and down: the fox and the re-forming crystal sit left of the results panel,
      // the trail streams in from behind them across the sky.
      const pull = smooth(r.hover, 0, 2.2);
      // Landscape: the panel is on the right, so the fox and crystal sit left. Portrait: the
      // panel is at the bottom, so step back and aim low to lift them into the top of the screen.
      const tall = portrait > 1;
      tmp.cam.lerp(new THREE.Vector3(tmp.hoverPos.x - (tall ? 24 : 15), tmp.hoverPos.y - 2.5, tmp.hoverPos.z - 5), reduced ? 0 : pull);
      tmp.look.lerp(new THREE.Vector3(tmp.hoverPos.x, tmp.hoverPos.y + (tall ? -3.5 : 2.2), tmp.hoverPos.z + (tall ? 3 : 6.5)), reduced ? 0 : pull);
    }
    if (g.status === "intro" || g.status === "loading") {
      // Start exactly at the hero framing, then swing round to the side view.
      const k = reduced ? 1 : smooth(r.intro, 0.3, INTRO);
      tmp.hero.set(...HERO_VIEW.position);
      tmp.heroLook.set(...HERO_VIEW.target);
      tmp.cam.lerpVectors(tmp.hero, tmp.cam, k);
      tmp.look.lerpVectors(tmp.heroLook, tmp.look, k);
    }
    const intro = g.status === "intro" || g.status === "loading";
    if (!placed.current || intro) {
      camera.position.copy(tmp.cam);
      tmp.lookNow.copy(tmp.look);
      placed.current = true;
    }
    const lag = r.hover >= 0 ? 3 : g.status === "finale" ? 9 : 5;
    camera.position.x = damp(camera.position.x, tmp.cam.x, lag, real);
    camera.position.y = damp(camera.position.y, tmp.cam.y, lag * 0.7, real);
    camera.position.z = damp(camera.position.z, tmp.cam.z, lag * 1.6, real);
    tmp.lookNow.lerp(tmp.look, 1 - Math.exp(-6 * real));
    camera.lookAt(tmp.lookNow);
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = intro ? THREE.MathUtils.lerp(HERO_VIEW.fov, 50, smooth(r.intro, 0.3, INTRO)) : 50 + (reduced ? 0 : Math.min(8, widen));
      camera.fov = damp(camera.fov, fov, intro ? 50 : 3, real);
      camera.updateProjectionMatrix();
    }

  }, -2); // moves the fox before its pose (-1) and scarf (0) read it

  const hoverAnchor = tmp.hoverPos;
  return (
    <>
      <Sky />
      <World track={track} foxD={foxD} camera={cameraRef} />
      <Rings world={world} />
      <Bursts world={world} />
      <Springs track={track} />
      <Boosts track={track} />
      <Bits world={world} />
      <group ref={fox}>
        <Fox driver={driver} aura="#ffd27a" />
      </group>
      {trail && (
        <>
          <Trail points={trail} color="#ffc2dc" radius={0.35} strength={2.4} />
          <group position={[hoverAnchor.x, hoverAnchor.y + 5, hoverAnchor.z + 7]}>
            <group ref={crystal} scale={0.001}>
              <Crystal />
            </group>
            <group ref={gathered}>
              {sections.map((s) => (
                <mesh key={s.id}>
                  <octahedronGeometry args={[0.35, 0]} />
                  <meshBasicMaterial color={new THREE.Color(bitColor(s.id)).multiplyScalar(2.4)} toneMapped={false} />
                </mesh>
              ))}
            </group>
          </group>
        </>
      )}
      <Post />
      <QualityMonitor />
    </>
  );
}
