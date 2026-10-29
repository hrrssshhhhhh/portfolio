import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { create } from "zustand";
import { looks, type Look } from "@/lib/look";

// The painted-dusk look shared by hero, game and /lab (PLAN.md "Art direction").
// Every dusk material, the sky and the color grade read the same uniform objects, so
// changing the look is one `applyLook` call: no re-render, no shader recompile.

const color = () => new THREE.Uniform(new THREE.Color());

export const lookUniforms = {
  uSkyTop: color(),
  uSkyHorizon: color(),
  uSunColor: color(),
  uSunDir: new THREE.Uniform(new THREE.Vector3(0, 1, 0)),
  uSunSize: new THREE.Uniform(0),
  uShade: color(),
  uRimColor: color(),
  uRimStrength: new THREE.Uniform(1),
  uStars: new THREE.Uniform(0),
  uLift: color(),
  uGain: color(),
  uGamma: new THREE.Uniform(1),
  uSaturation: new THREE.Uniform(1),
};

// React-facing copy of the current look, for the few things that are props, not uniforms
// (outline color, bloom intensity). Changes rarely: on slider moves or stretch changes.
export const useLookStore = create<{ look: Look; setLook: (look: Look) => void }>((set) => ({
  look: looks.dusk,
  setLook: (look) => set({ look }),
}));

export function applyLook(look: Look, scene?: THREE.Scene) {
  const u = lookUniforms;
  u.uSkyTop.value.set(look.skyTop);
  u.uSkyHorizon.value.set(look.skyHorizon);
  u.uSunColor.value.set(look.sun);
  u.uSunDir.value.set(...look.sunDir).normalize();
  u.uSunSize.value = look.sunSize;
  u.uShade.value.set(look.shade);
  u.uRimColor.value.set(look.rim);
  u.uRimStrength.value = look.rimStrength;
  u.uStars.value = look.stars;
  u.uLift.value.set(look.grade.lift);
  u.uGain.value.set(look.grade.gain);
  u.uGamma.value = look.grade.gamma;
  u.uSaturation.value = look.grade.saturation;
  if (scene?.fog instanceof THREE.Fog) {
    scene.fog.color.set(look.fog);
    scene.fog.near = look.fogNear;
    scene.fog.far = look.fogFar;
  }
}
applyLook(looks.dusk);

// Soft cel shading on top of MeshToonMaterial (which keeps skinning, instancing and fog):
// 4 tones from the shade tint to the sun color with soft steps, plus a rim of light on the
// edges that face the sun. Scene lights are ignored; the look's sun is the only light.
const DECLARE = /* glsl */ `
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform vec3 uShade;
uniform vec3 uRimColor;
uniform float uRimStrength;
uniform float uRim;
`;

const SHADE = /* glsl */ `
{
  vec3 n = normalize(normal);
  vec3 sunV = normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz);
  float ndl = dot(n, sunV);
  float x = (ndl * 0.5 + 0.5) * 3.0;
  float tone = (floor(x) + smoothstep(0.4, 0.6, fract(x))) / 3.0;
  vec3 V = normalize(vViewPosition);
  float fres = 1.0 - clamp(dot(n, V), 0.0, 1.0);
  float rim = smoothstep(0.55, 0.75, fres) * clamp(ndl + 0.7, 0.0, 1.0);
  outgoingLight = diffuseColor.rgb * mix(uShade, uSunColor, tone)
    + uRimColor * rim * uRim * uRimStrength
    + totalEmissiveRadiance;
}
`;

export function duskMaterial(
  base: THREE.ColorRepresentation,
  {
    rim = 1,
    flat = false,
    side = THREE.FrontSide as THREE.Side,
    opacity = 1,
    emissive = "#000000" as THREE.ColorRepresentation,
    emissiveIntensity = 1,
  } = {},
) {
  const m = new THREE.MeshToonMaterial({ color: base, side, emissive, emissiveIntensity });
  Object.assign(m, { flatShading: flat }); // honoured by the shader, just missing from the toon type
  if (opacity < 1) Object.assign(m, { transparent: true, opacity });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lookUniforms, { uRim: { value: rim } });
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${DECLARE}`)
      .replace("#include <opaque_fragment>", `${SHADE}\n#include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => "dusk";
  return m;
}

// One material per (color, options), disposed with the component.
export function useDusk(base: THREE.ColorRepresentation, opts?: Parameters<typeof duskMaterial>[1]) {
  const key = JSON.stringify(opts ?? {});
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands in for the options object
  const m = useMemo(() => duskMaterial(base, opts), [base, key]);
  useEffect(() => () => m.dispose(), [m]);
  return m;
}

// Glow: unlit, pushed above 1 so bloom picks it up (bloom threshold is 1).
export function useGlow(base: THREE.ColorRepresentation, strength = 2, opts: THREE.MeshBasicMaterialParameters = {}) {
  const m = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(base).multiplyScalar(strength),
        toneMapped: false,
        ...opts,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options are fixed per call site
    [base, strength],
  );
  useEffect(() => () => m.dispose(), [m]);
  return m;
}

// drei <Outlines> has the flag inverted: `screenspace` true offsets in world units, so lines
// thin out with distance like ink in a painting. Thickness is then in the mesh's local units
// (scaled by the object and instance scale), not pixels.
export const INK_WORLD = { screenspace: true, toneMapped: false } as const;
