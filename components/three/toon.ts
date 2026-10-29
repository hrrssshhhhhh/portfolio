import { useMemo } from "react";
import * as THREE from "three";

// Shared cel-shading look for every 3D scene (hero, fox, game).
export const INK = "#0b0820"; // outline color; drei <Outlines> thickness is in pixels
export const SAKURA = "#ff6fae";
export const SKY = "#5ce1ff";
export const SUN = "#ffd166";

// Three hard tones = cel-shaded anime look.
export function useToonGradient() {
  return useMemo(() => {
    const tex = new THREE.DataTexture(new Uint8Array([70, 160, 255]), 3, 1, THREE.RedFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
  }, []);
}
