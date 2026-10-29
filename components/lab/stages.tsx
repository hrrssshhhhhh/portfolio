"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { StretchId } from "@/lib/look";
import Fox, { type FoxPose } from "@/components/fox/Fox";
import { FarHills, Ground, Crystal, Island, PathRibbon, SakuraTree } from "@/components/three/scenery";
import { CRYSTAL_SPOT, HERO_VIEW, HERO_VIEW_PORTRAIT, type View } from "@/components/three/views";
import { makeRunTrack } from "@/components/game/track";
import World from "@/components/game/World";

// Still stages for look development (PLAN.md Step 16). K1 is the hero's opening frame; the
// in-run key frames (K2–K5) are shot from the real game with ?debug (scripts/keyframes.js).

export type Stage = {
  name: string;
  look: StretchId;
  camera: View;
  focus?: [number, number, number];
  Scene: () => React.ReactNode;
};

// Places the default camera. Re-runs when the stage (and so the values) change.
export function StageCamera({ position, target, fov }: View) {
  const get = useThree((s) => s.get);
  useLayoutEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera;
    camera.position.set(...position);
    camera.fov = fov;
    camera.near = 0.3;
    camera.far = 2000;
    camera.updateProjectionMatrix();
    camera.lookAt(...target);
  }, [get, position, target, fov]);
  return null;
}

// ---------------------------------------------------------------------------- K1 hero

function K1() {
  const track = useMemo(() => makeRunTrack(), []);
  const foxD = useRef(0);
  const cameraRef = useRef<THREE.Object3D | null>(null);
  useFrame(({ camera }) => {
    cameraRef.current = camera;
  });
  return (
    <>
      <World track={track} foxD={foxD} camera={cameraRef} />
      <Fox pose="sleep" />
      <Crystal position={CRYSTAL_SPOT} scale={0.55} />
    </>
  );
}

// ---------------------------------------------------------------------------- fox review

const LINEUP: { pose: FoxPose; time: number }[] = [
  { pose: "idle", time: 0.4 },
  { pose: "run", time: 0.06 },
  { pose: "jump", time: 0.12 },
  { pose: "glide", time: 0.3 },
  { pose: "grind", time: 0.2 },
  { pose: "sleep", time: 0.5 },
  { pose: "celebrate", time: 0.28 },
];
const GAP = 1.9;

function lineup(facing: number) {
  return function FoxLineup() {
    return (
      <>
        <Ground color="#b5c48e" />
        <FarHills color="#b07fa6" radius={200} rotation-y={-Math.PI / 2} />
        {LINEUP.map(({ pose, time }, i) => (
          <Fox key={pose} pose={pose} time={time} position={[0, pose === "jump" || pose === "glide" ? 0.6 : 0, i * GAP]} rotation-y={facing} />
        ))}
      </>
    );
  };
}

function FoxFace() {
  return (
    <>
      <Ground color="#b5c48e" />
      <FarHills color="#b07fa6" radius={200} rotation-y={-Math.PI / 2} />
      <Fox pose="idle" rotation-y={-Math.PI / 2 + 0.35} />
    </>
  );
}

// ---------------------------------------------------------------------------- 404

// "You fell off the map": the fox at the edge of a floating island where the path just stops,
// a broken chunk drifting down, the next island out of reach. Shot once into public/lost-fox.png.
function Lost() {
  return (
    <>
      <FarHills color="#b07fa6" radius={420} position-y={-60} rotation-y={-Math.PI / 2} />
      <Island radius={4.2} seed={4} grass="#a9c48a" rock="#6e4b7e" />
      <PathRibbon points={[[-0.5, -3.6], [0.2, -1.5], [0.4, 0.6], [0.5, 3.9]]} width={1.5} position-y={0.26} />
      <SakuraTree seed={3} scale={0.9} position={[-2.2, 0.25, -1.6]} />
      <Fox pose="idle" position={[0.5, 0.25, 3.2]} rotation-y={0.25} />
      {/* The missing piece of path, tumbling away. */}
      <Island radius={0.9} seed={9} grass="#f4d9c2" rock="#6e4b7e" position={[0.9, -2.6, 6.2]} rotation={[0.5, 0.3, 0.35]} />
      <Island radius={2.6} seed={7} grass="#a9c48a" rock="#6e4b7e" position={[6, -0.8, 13.5]} />
      <SakuraTree seed={5} scale={0.7} position={[6.6, -0.55, 14]} />
    </>
  );
}

// The lineup runs along +Z with the camera on -X, the same side view as the game.
const MID = ((LINEUP.length - 1) * GAP) / 2;

export const STAGES: Record<string, Stage> = {
  K1: { name: "Hero", look: "dusk", camera: HERO_VIEW, Scene: K1 },
  K1P: { name: "Hero, portrait", look: "dusk", camera: HERO_VIEW_PORTRAIT, Scene: K1 },
  FOX: { name: "Fox poses, 3/4", look: "dusk", camera: { position: [-8.5, 1.4, MID - 1.5], target: [0, 0.75, MID], fov: 50 }, Scene: lineup(-0.55) },
  FOXSIDE: { name: "Fox poses, side", look: "dusk", camera: { position: [-9, 1.1, MID], target: [0, 0.75, MID], fov: 50 }, Scene: lineup(0) },
  LOST: { name: "404, lost", look: "dusk", camera: { position: [-16, 4.5, 8.5], target: [1, -0.6, 7.5], fov: 40 }, Scene: Lost },
  FOXFACE: { name: "Fox face", look: "dusk", camera: { position: [-2.2, 1.15, 0.25], target: [0, 0.95, 0], fov: 35 }, Scene: FoxFace },
};
