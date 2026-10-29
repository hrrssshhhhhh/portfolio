"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { looks } from "@/lib/look";
import { sections } from "@/lib/sections";
import Fox, { type FoxDriver } from "@/components/fox/Fox";
import { BACKFLIP } from "@/components/fox/poses";
import { applyLook, useLookStore } from "@/components/three/dusk";
import Post from "@/components/three/Post";
import { QualityMonitor, useQualityDpr } from "@/components/three/quality";
import { Crystal } from "@/components/three/scenery";
import Sky from "@/components/three/Sky";
import { CRYSTAL_SPOT, HERO_VIEW, HERO_VIEW_PORTRAIT } from "@/components/three/views";
import { landSound, ringNote, unlockAudio } from "@/components/game/audio";
import { bitColor, Bits, makeWorld, Rings } from "@/components/game/Items";
import { makeRunTrack, ringSpots } from "@/components/game/track";
import World from "@/components/game/World";
import { sideCamera } from "@/components/game/GameScene";
import { handoff } from "@/components/game/handoff";
import { RUN } from "@/lib/level";
import { useHeroStore } from "./heroStore";

// The hero is the level's opening frame (PLAN.md Step 18): the same world as the game, the fox
// asleep at the start of the track, the portfolio crystal floating above it. Everything here
// reacts to the visitor: the camera drifts with the pointer, the fox wakes when the pointer
// comes near or Play is hovered, the crystal chimes when clicked, and Play bursts it into the
// five data bits that fly off down the path.

const damp = THREE.MathUtils.damp;
const BURST_TIME = 0.9;

function useHeroView() {
  const aspect = useThree((s) => s.viewport.aspect);
  return aspect < 0.9 ? HERO_VIEW_PORTRAIT : HERO_VIEW;
}

// Play: the fox wakes, turns and runs down the path. Seconds: turn and start at RUN_FROM, the
// camera swings into the game's side view during SWING; PlayButton changes page right after.
export const RUN_FROM = 0.3;
const SWING: [number, number] = [0.35, 1.35];
const smooth = THREE.MathUtils.smoothstep;

function CameraRig({ reduced, cameraRef, track }: { reduced: boolean; cameraRef: RefObject<THREE.Object3D | null>; track: ReturnType<typeof makeRunTrack> }) {
  const view = useHeroView();
  const look = useMemo(() => new THREE.Vector3(), []);
  const side = useMemo(() => ({ cam: new THREE.Vector3(), look: new THREE.Vector3() }), []);
  const placed = useRef(false);
  useFrame(({ camera, pointer }, delta) => {
    if (useHeroStore.getState().playing && camera instanceof THREE.PerspectiveCamera) {
      // Swing from wherever the camera is into the exact pose the game starts on.
      const k = smooth(handoff.run.t, SWING[0], SWING[1]);
      sideCamera(track, handoff.run.d, camera.aspect, side.cam, side.look);
      camera.position.lerp(side.cam, k >= 1 ? 1 : 1 - Math.exp(-9 * k * delta));
      look.lerp(side.look, k >= 1 ? 1 : 1 - Math.exp(-9 * k * delta));
      camera.lookAt(look);
      camera.fov = THREE.MathUtils.lerp(view.fov, 50, k);
      camera.updateProjectionMatrix();
      return;
    }
    cameraRef.current = camera;
    const [x, y, z] = view.position;
    const [tx, ty, tz] = view.target;
    // A gentle drift with the pointer: the scene feels deep without moving on its own.
    const px = reduced ? 0 : pointer.x;
    const py = reduced ? 0 : pointer.y;
    const k = placed.current ? 1 - Math.exp(-3 * delta) : 1;
    camera.position.lerp(new THREE.Vector3(x - py * 0.15, y + py * 0.25, z + px * 0.45), k);
    look.lerp(new THREE.Vector3(tx, ty, tz), k);
    camera.lookAt(look);
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== view.fov) {
      camera.fov = view.fov;
      camera.updateProjectionMatrix();
    }
    placed.current = true;
  });
  return null;
}

// The crystal: chimes and sends a ring of light out when clicked; bursts on Play.
function HeroCrystal({ reduced }: { reduced: boolean }) {
  const spin = useRef(0);
  const group = useRef<THREE.Group>(null);
  const ripple = useRef<THREE.Mesh>(null);
  const rippleAge = useRef(9);
  const burstAge = useRef(-1);
  const bits = useRef<THREE.Group>(null);
  const chime = useHeroStore((s) => s.chime);
  const notes = useRef(0);

  useEffect(() => {
    if (!chime) return;
    rippleAge.current = 0;
    spin.current += 6;
    ringNote(notes.current++ % 10);
  }, [chime]);

  const rippleMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd9ec").multiplyScalar(2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }),
    [],
  );
  useEffect(() => () => rippleMaterial.dispose(), [rippleMaterial]);

  useFrame((state, delta) => {
    if (!group.current || !ripple.current || !bits.current) return;
    const playing = useHeroStore.getState().playing;
    spin.current = damp(spin.current, 0, 2, delta);
    group.current.rotation.y += delta * (reduced ? 0 : 0.25 + spin.current);
    if (!reduced) group.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.08; // bob around the spot

    rippleAge.current += delta;
    const a = rippleAge.current;
    ripple.current.visible = a < 1.2;
    ripple.current.scale.setScalar(0.5 + a * 9);
    (ripple.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - a / 1.2);
    ripple.current.quaternion.copy(state.camera.quaternion);

    // Play: the crystal swells, then breaks into the five bits that fly off down the path.
    if (playing && burstAge.current < 0) burstAge.current = 0;
    if (!playing) burstAge.current = -1;
    const b = burstAge.current;
    if (b >= 0) burstAge.current += delta;
    const gem = group.current.children[0];
    gem.visible = b < 0.18;
    gem.scale.setScalar(b < 0 ? 1 : 1 + Math.min(1, b / 0.18) * 0.4);
    bits.current.visible = b >= 0.18;
    bits.current.children.forEach((c, i) => {
      const t = Math.max(0, b - 0.18) / BURST_TIME;
      const e = 1 - (1 - Math.min(1, t)) ** 3;
      const ang = (i / 5) * Math.PI * 2;
      c.position.set(Math.cos(ang) * 0.6 * (1 - e) + e * 1.5, Math.sin(ang) * 0.6 * (1 - e) + e * (1 + i * 0.4), e * (12 + i * 5));
      c.rotation.y = t * 8;
    });
  });

  return (
    <group position={CRYSTAL_SPOT}>
      <group ref={group}>
        <group
          onClick={(e) => {
            e.stopPropagation();
            useHeroStore.getState().ring();
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "")}
        >
          <Crystal scale={0.55} spin={false} />
        </group>
      </group>
      <mesh ref={ripple} material={rippleMaterial} visible={false}>
        <ringGeometry args={[0.92, 1, 64]} />
      </mesh>
      <group ref={bits} visible={false}>
        {sections.map((s) => (
          <mesh key={s.id} scale={[0.18, 0.3, 0.18]}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={new THREE.Color(bitColor(s.id)).multiplyScalar(2.4)} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// The fox: asleep until the pointer comes near or Play is hovered, then up and ready.
const FOX_MIDDLE = 0.6; // flip pivot height: the body's centre, not the feet
const FLIP_HEIGHT = 1;

function HeroFox({ reduced }: { reduced: boolean }) {
  const driver = useRef<FoxDriver>({ pose: "sleep", t: 0, wind: 0.1 });
  const group = useRef<THREE.Group>(null);
  const flip = useRef<THREE.Group>(null);
  const flipT = useRef(-1); // seconds into a backflip, -1 when not flipping
  useFrame((_, delta) => {
    const { awake } = useHeroStore.getState();
    const d = driver.current;
    const { playing } = useHeroStore.getState();
    const run = handoff.run;
    if (playing && !handoff.arrival) {
      // Advances until the hand-over is captured, then holds still so /play starts on that exact frame.
      run.t += delta;
      run.v = RUN.start * smooth(run.t, RUN_FROM, RUN_FROM + 0.5); // ease up to the game's start speed
      run.d += run.v * delta;
    } else if (!playing) run.t = run.d = run.v = 0;
    if (group.current) {
      group.current.position.z = run.d; // the start of the track runs straight along +Z
      group.current.rotation.y = -1.25 * (1 - smooth(run.t, 0, RUN_FROM + 0.2)); // turn to face down the path
    }
    const { crouch, air, land } = BACKFLIP;
    const before = flipT.current;
    if (flipT.current >= 0) flipT.current = playing || flipT.current > crouch + air + land ? -1 : flipT.current + delta;
    if (before < crouch + air && flipT.current >= crouch + air) landSound();
    const u = THREE.MathUtils.clamp((flipT.current - crouch) / air, 0, 1);
    if (flip.current) {
      flip.current.position.y = FOX_MIDDLE + 4 * FLIP_HEIGHT * u * (1 - u); // parabola peaking mid-air
      flip.current.rotation.x = flipT.current < 0 ? 0 : -Math.PI * 2 * smooth(u, 0, 1); // backward: negative pitch
    }
    const next = flipT.current >= 0 ? "backflip" : playing && run.t > RUN_FROM ? "run" : awake ? "idle" : "sleep";
    if (d.pose !== next) d.t = 0;
    d.pose = next;
    d.t += delta;
  }, -2); // moves the fox before its pose (-1) and scarf (0) read it
  return (
    <group
      ref={group}
      onPointerOver={() => {
        useHeroStore.getState().wake(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (!useHeroStore.getState().playing) useHeroStore.getState().wake(false);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        // Tap a woken fox for a backflip (a tap on touch also wakes it, so it flips straight away).
        e.stopPropagation();
        const { playing } = useHeroStore.getState();
        if (reduced || playing || flipT.current >= 0) return;
        unlockAudio(); // the tap is the gesture browsers need; silent unless sound is on
        flipT.current = 0;
      }}
    >
      {/* Turned toward the camera while dozing, so the face reads; turns down the path on Play. */}
      <group ref={flip} position-y={FOX_MIDDLE}>
        <Fox driver={driver} position-y={-FOX_MIDDLE} />
      </group>
      {/* A larger invisible target so the fox is easy to wake. */}
      <mesh position={[0, 0.6, 0]} visible={false}>
        <sphereGeometry args={[1.1, 8, 6]} />
      </mesh>
    </group>
  );
}

// Tells the page the scene is on screen (a few frames in, once shaders have compiled), so the
// poster image over it can fade out.
function FirstFrames() {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 3) useHeroStore.getState().setReady();
  });
  return null;
}

export function HeroWorld({ reduced }: { reduced: boolean }) {
  const track = useMemo(() => makeRunTrack(), []);
  const world = useRef(makeWorld(track, ringSpots(track)));
  const foxD = useRef(0);
  const cameraRef = useRef<THREE.Object3D | null>(null);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const setLook = useLookStore((s) => s.setLook);
  useEffect(() => {
    applyLook(looks.dusk, scene);
    setLook(looks.dusk);
  }, [scene, setLook]);
  useEffect(() => {
    handoff.capture = () => gl.domElement.toDataURL("image/jpeg", 0.9);
    return () => {
      handoff.capture = null;
    };
  }, [gl]);
  return (
    <>
      <CameraRig reduced={reduced} cameraRef={cameraRef} track={track} />
      <Sky />
      <World track={track} foxD={foxD} camera={cameraRef} />
      <Rings world={world} />
      <Bits world={world} />
      <HeroFox reduced={reduced} />
      <HeroCrystal reduced={reduced} />
      <Post />
      <QualityMonitor />
      <FirstFrames />
    </>
  );
}

export default function HeroScene({ eventSource, reduced }: { eventSource: RefObject<HTMLElement | null>; reduced: boolean }) {
  const dpr = useQualityDpr();
  return (
    <Canvas
      flat
      dpr={dpr}
      camera={{ position: HERO_VIEW.position, fov: HERO_VIEW.fov, near: 0.3, far: 2000 }}
      gl={{ antialias: false, preserveDrawingBuffer: true }} // the last frame is captured for the hand-over to /play
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      frameloop={reduced ? "demand" : "always"}
    >
      <fog attach="fog" args={[looks.dusk.fog, looks.dusk.fogNear, looks.dusk.fogFar]} />
      <HeroWorld reduced={reduced} />
    </Canvas>
  );
}
