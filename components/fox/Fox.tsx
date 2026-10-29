"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDusk, useLookStore } from "@/components/three/dusk";
import { Halo } from "@/components/three/scenery";
import { buildFox } from "./rig";
import { poseAt, type FoxPose, type Targets } from "./poses";
import Scarf from "./Scarf";

export type { FoxPose };

const damp = THREE.MathUtils.damp;
const SCARF = "#ff8fbf";

export type FoxDriver = { pose: FoxPose; t: number; wind: number };

// The mascot fox (PLAN.md Step 17). `pose` blends smoothly when it changes. Pass `time` to
// freeze it at one moment (lab screenshots, the hero poster). The game passes `driver`
// instead: a ref it rewrites every frame (pose + seconds into that pose), so nothing re-renders.
export default function Fox({
  pose = "idle",
  time,
  speed = 1,
  driver,
  aura,
  ...props
}: { pose?: FoxPose; time?: number; speed?: number; driver?: React.RefObject<FoxDriver>; aura?: string } & React.ComponentProps<"group">) {
  const rig = useMemo(() => buildFox(), []);
  useEffect(() => () => rig.dispose(), [rig]);

  const ink = useLookStore((s) => s.look.ink);
  useEffect(() => {
    rig.outline.uniforms.uColor.value.set(ink);
  }, [rig, ink]);

  const collar = useDusk(SCARF, { rim: 1.2 });
  const clock = useRef(0);
  const wind = driver ? 1 : poseAt(pose, 0, speed).wind;

  useFrame((_, delta) => {
    clock.current += delta;
    const d = driver?.current;
    const t = d ? d.t : (time ?? clock.current);
    const frozen = time !== undefined && !d;
    const target = poseAt(d ? d.pose : pose, t, speed);
    // Frozen poses snap; live ones ease, so pose changes blend instead of popping.
    const k = frozen ? Infinity : 14;
    const dt = Math.min(delta, 1 / 20);
    const ease = (cur: number, to: number) => (frozen ? to : damp(cur, to, k, dt));
    apply(rig, target, ease);
  }, -1); // after whatever moves the fox (-2), before the scarf reads the neck (0)

  return (
    <group {...props}>
      <primitive object={rig.root} />
      {createPortal(
        <mesh material={collar} rotation-x={Math.PI / 2 - 0.15}>
          <torusGeometry args={[0.13, 0.035, 8, 24]} />
        </mesh>,
        rig.neck,
      )}
      <Scarf neck={rig.neck} body={rig.root} wind={wind} lift={0.02} color={SCARF} />
      {/* A soft glow on the torso: it follows every flip, and the body in front hides the part
          of it facing the camera, so it reads as a glow behind the fox. */}
      {aura && createPortal(<Halo color={aura} size={3.2} strength={0.65} position-y={0.18} />, rig.torso)}
    </group>
  );
}

function apply(r: ReturnType<typeof buildFox>, p: Targets, ease: (cur: number, to: number) => number) {
  r.root.rotation.x = p.pitch === 0 ? ease(r.root.rotation.x % (Math.PI * 2), 0) : p.pitch;
  r.root.rotation.y = ease(r.root.rotation.y, p.yaw);
  r.hips.position.y = ease(r.hips.position.y, 0.45 + p.lift);
  r.torso.rotation.x = ease(r.torso.rotation.x, p.torso);
  r.torso.scale.setScalar(1 + p.breathe);
  r.head.rotation.x = ease(r.head.rotation.x, p.headX);
  r.head.rotation.y = ease(r.head.rotation.y, p.headY);
  r.head.rotation.z = ease(r.head.rotation.z, p.headZ);
  r.ears.forEach((ear, i) => {
    const s = i === 0 ? 1 : -1;
    ear.rotation.x = ease(ear.rotation.x, p.earX);
    ear.rotation.z = ease(ear.rotation.z, s * -(0.32 + p.earZ[i]));
  });
  for (let i = 0; i < 2; i++) {
    r.shoulders[i].rotation.x = ease(r.shoulders[i].rotation.x, p.shX[i]);
    r.shoulders[i].rotation.z = ease(r.shoulders[i].rotation.z, p.shZ[i]);
    r.elbows[i].rotation.x = ease(r.elbows[i].rotation.x, p.elX[i]);
    r.thighs[i].rotation.x = ease(r.thighs[i].rotation.x, p.thX[i]);
    r.knees[i].rotation.x = ease(r.knees[i].rotation.x, p.knX[i]);
  }
  r.tail.forEach((seg, i) => {
    seg.rotation.x = ease(seg.rotation.x, p.tailX[i]);
    seg.rotation.y = ease(seg.rotation.y, p.tailY[i]);
  });
  // Eyes: the ball squashes shut; shut eyes show a lid curve (asleep) or the lash curve (happy).
  for (const eye of r.eyes) {
    eye.ball.scale.y = Math.max(0.02, ease(eye.ball.scale.y, p.eyes));
    const shut = eye.ball.scale.y < 0.3;
    eye.ball.visible = !shut;
    eye.lash.visible = !shut || p.happy;
    eye.lid.visible = shut && !p.happy;
  }
}
