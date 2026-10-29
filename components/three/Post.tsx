"use client";

import { useMemo } from "react";
import { Bloom, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, Effect, ToneMappingMode } from "postprocessing";
import type * as THREE from "three";
import { lookUniforms, useLookStore } from "./dusk";
import { useQuality } from "./quality";

// The finishing stack from PLAN.md "Art direction", in order: bloom on emissive things only,
// neutral tone mapping (AgX greyed the pastels), the per-stretch color grade, a soft vignette and film grain.

const GRADE = /* glsl */ `
uniform vec3 uLift;
uniform vec3 uGain;
uniform float uGamma;
uniform float uSaturation;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = uGain * (inputColor.rgb + uLift * (1.0 - inputColor.rgb));
  c = pow(max(c, 0.0), vec3(1.0 / uGamma));
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  outputColor = vec4(mix(vec3(l), c, uSaturation), inputColor.a);
}
`;

class GradeEffect extends Effect {
  constructor() {
    const u = lookUniforms;
    super("GradeEffect", GRADE, {
      uniforms: new Map<string, THREE.Uniform>([
        ["uLift", u.uLift],
        ["uGain", u.uGain],
        ["uGamma", u.uGamma],
        ["uSaturation", u.uSaturation],
      ]),
    });
  }
}

export type ToneMap = keyof typeof TONE;
const TONE = {
  agx: ToneMappingMode.AGX,
  neutral: ToneMappingMode.NEUTRAL,
  aces: ToneMappingMode.ACES_FILMIC,
};

export default function Post({
  toneMap = "neutral",
  grain = 0.035,
  vignette = 0.45,
  focus,
}: {
  toneMap?: ToneMap;
  grain?: number;
  vignette?: number;
  focus?: [number, number, number]; // depth of field on this point (finale and hero only)
}) {
  const bloom = useLookStore((s) => s.look.bloom);
  const grade = useMemo(() => new GradeEffect(), []);
  const low = useQuality((s) => s.tier) < 2;

  return (
    <EffectComposer multisampling={low ? 0 : 4}>
      {/* levels is read once, so the key remounts bloom when it changes */}
      <Bloom key={low ? "low" : "full"} levels={low ? 4 : 8} mipmapBlur luminanceThreshold={1} intensity={bloom} radius={0.8} />
      {focus ? <DepthOfField target={focus} focalLength={0.25} bokehScale={2.5} /> : <></>}
      <ToneMapping mode={TONE[toneMap]} />
      <primitive object={grade} />
      <Vignette offset={0.3} darkness={vignette} />
      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={grain} />
    </EffectComposer>
  );
}
