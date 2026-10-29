"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { button, folder, Leva, useControls } from "leva";
import { looks, type Look, type StretchId } from "@/lib/look";
import { applyLook, useLookStore } from "@/components/three/dusk";
import Post, { type ToneMap } from "@/components/three/Post";
import Sky from "@/components/three/Sky";
import { StageCamera, STAGES } from "./stages";

// Look development (PLAN.md Step 16). /lab?k=K3 opens a key frame; ?clean hides the panel for
// screenshots. Tune the sliders until the frame matches its board in docs/keyframes/, then
// "Copy look" and paste it over the stretch in lib/look.ts.

// The copy button's callback is created once by leva; it reads the latest values from here.
const latest = { values: {} as Flat };

const n = (value: number, min: number, max: number, step = 0.01) => ({ value, min, max, step });

// Leva schema for one stretch's look, flattened (grade fields become their own folder).
function schema(look: Look) {
  return {
    Sky: folder({
      skyTop: look.skyTop,
      skyHorizon: look.skyHorizon,
      stars: n(look.stars, 0, 1),
    }),
    Light: folder({
      sun: look.sun,
      sunDir: { value: look.sunDir, step: 0.05 },
      sunSize: n(look.sunSize, 0, 0.2, 0.005),
      shade: look.shade,
      rim: look.rim,
      rimStrength: n(look.rimStrength, 0, 3),
    }),
    Air: folder({
      fog: look.fog,
      fogNear: n(look.fogNear, 0, 400, 1),
      fogFar: n(look.fogFar, 10, 1200, 1),
    }),
    Color: folder({
      accent: look.accent,
      accent2: look.accent2,
      ink: look.ink,
      bloom: n(look.bloom, 0, 3),
      lift: look.grade.lift,
      gain: look.grade.gain,
      gamma: n(look.grade.gamma, 0.5, 2),
      saturation: n(look.grade.saturation, 0, 2),
    }),
  };
}

type Flat = Omit<Look, "grade"> & Look["grade"];
const unflatten = ({ lift, gain, gamma, saturation, ...rest }: Flat): Look => ({
  ...rest,
  grade: { lift, gain, gamma, saturation },
});

function LookDriver({ look }: { look: Look }) {
  const scene = useThree((s) => s.scene);
  const setLook = useLookStore((s) => s.setLook);
  useEffect(() => {
    applyLook(look, scene);
    setLook(look);
  }, [look, scene, setLook]);
  return null;
}

export default function Lab() {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const clean = params.has("clean");

  const { stage, orbit } = useControls({
    stage: { value: params.get("k") ?? "K1", options: Object.keys(STAGES) },
    orbit: false,
  });
  const current = STAGES[stage];
  const stretch: StretchId = current.look;

  // Keyed by stretch: switching to a stage of another stretch loads that stretch's values.
  const values = useControls(stretch, () => schema(looks[stretch]), [stretch])[0] as unknown as Flat;
  const look = useMemo(() => unflatten(values), [values]);

  const post = useControls("Post", {
    toneMap: { value: "neutral" as ToneMap, options: ["neutral", "agx", "aces"] },
    grain: n(0.035, 0, 0.3, 0.005),
    vignette: n(0.45, 0, 1),
    dof: true,
    "Copy look": button(() => {
      const text = JSON.stringify(unflatten(latest.values), null, 2);
      void navigator.clipboard.writeText(text);
      console.info(`${stretch}:`, text);
    }),
  });
  useEffect(() => {
    latest.values = values;
  }, [values]);

  const fog = looks[stretch];

  return (
    <div className="relative h-svh w-full bg-night">
      <Leva hidden={clean} collapsed={false} titleBar={{ title: `Lab · ${stage} ${current.name}` }} />
      <Canvas flat dpr={[1, 1.75]} gl={{ antialias: false }} camera={{ fov: current.camera.fov }}>
        <fog attach="fog" args={[fog.fog, fog.fogNear, fog.fogFar]} />
        <LookDriver look={look} />
        <StageCamera {...current.camera} />
        {orbit && <OrbitControls target={current.camera.target} makeDefault />}
        <Sky />
        <Suspense fallback={null}>
          <current.Scene key={stage} />
        </Suspense>
        <Post toneMap={post.toneMap as ToneMap} grain={post.grain} vignette={post.vignette} focus={post.dof ? current.focus : undefined} />
      </Canvas>
    </div>
  );
}
