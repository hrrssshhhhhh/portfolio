"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { lookUniforms } from "./dusk";

// Painted sky at infinity: horizon-to-top gradient, sun disc with a warm haze, and (at night)
// a starfield with a Milky Way band. Everything comes from the shared look uniforms.

const VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  // Rotation only: the sky stays put however far the camera travels, drawn at the far plane.
  gl_Position = projectionMatrix * vec4((viewMatrix * vec4(position, 0.0)).xyz, 1.0);
  gl_Position.z = gl_Position.w;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform float uSunSize;
uniform float uStars;
varying vec3 vDir;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uSkyHorizon, uSkyTop, smoothstep(0.0, 1.0, pow(clamp(h, 0.0, 1.0), 0.5)));
  col = mix(col, uSkyHorizon * 0.8, smoothstep(0.0, -0.35, h)); // below the horizon (seen in reflections)

  vec3 s = normalize(uSunDir);
  float cs = dot(d, s);
  float hasSun = step(0.001, uSunSize);
  // Wide warm haze, hugging the horizon, then a tighter glow around the disc.
  float haze = pow(max(cs, 0.0), 4.0) * (1.0 - smoothstep(0.0, 0.5, abs(h - s.y)));
  col += uSunColor * (haze * 0.35 + pow(max(cs, 0.0), 48.0) * 0.6) * hasSun;
  float disc = 1.0 - smoothstep(uSunSize * 0.9, uSunSize, acos(clamp(cs, -1.0, 1.0)));
  col = mix(col, uSunColor * 2.0, disc * hasSun);

  if (uStars > 0.0) {
    float up = smoothstep(0.0, 0.25, h);
    vec3 bandN = normalize(vec3(0.55, 0.35, 0.75));
    float band = exp(-pow(dot(d, bandN), 2.0) * 16.0);
    vec3 g = d * 300.0;
    vec3 cell = floor(g);
    float r = hash(cell);
    float star = step(mix(0.9965, 0.982, band), r) * smoothstep(0.22, 0.0, length(fract(g) - 0.5));
    col += vec3(0.85, 0.88, 1.0) * star * (0.5 + 1.8 * hash(cell + 3.7)) * uStars * up;
    float cloud = noise(d * 7.0) * 0.6 + noise(d * 17.0) * 0.4;
    col += mix(vec3(0.35, 0.25, 0.7), vec3(1.0, 0.75, 0.9), cloud) * band * cloud * 0.3 * uStars * up;
  }

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export default function Sky() {
  const material = useMemo(() => {
    const u = lookUniforms;
    return new THREE.ShaderMaterial({
      uniforms: {
        uSkyTop: u.uSkyTop,
        uSkyHorizon: u.uSkyHorizon,
        uSunColor: u.uSunColor,
        uSunDir: u.uSunDir,
        uSunSize: u.uSunSize,
        uStars: u.uStars,
      },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[1, 64, 32]} />
    </mesh>
  );
}
