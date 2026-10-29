import { useGameStore, type Note } from "./store";

// Soft synthesized sound (PLAN.md Step 23): every ring is the next note of a pentatonic scale,
// so any run sounds good; data bits add a chord; the finale replays the run as a melody;
// an original lounge groove plays under the whole site.
// Everything goes through one reverb so it sounds like one place. Silent unless the visitor
// turned sound on (the toggle click is the gesture that unlocks audio).

let ctx: AudioContext | null = null;
let out: GainNode | null = null;

const SCALE = [0, 2, 4, 7, 9]; // major pentatonic
const ROOT = 62; // D4 (MIDI)
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const on = () => useGameStore.getState().sound;

function audio() {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  out = ctx.createGain();
  out.gain.value = 0.32;
  // Reverb from a generated impulse: two seconds of decaying noise.
  const verb = ctx.createConvolver();
  const len = ctx.sampleRate * 2.2;
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  verb.buffer = ir;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  out.connect(ctx.destination);
  out.connect(verb).connect(wet).connect(ctx.destination);
  return ctx;
}

// Call from a click/tap so browsers allow sound.
export function unlockAudio() {
  const c = audio();
  if (c?.state === "suspended") void c.resume();
}

// A kalimba-like pluck: a sine with a quiet bright partial and a fast soft decay.
function pluck(freq: number, when = 0, vol = 0.5, length = 1.4) {
  const c = audio();
  if (!c || !out) return;
  const t = c.currentTime + when;
  const env = c.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(vol, t + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0008, t + length);
  env.connect(out);
  for (const [ratio, level] of [
    [1, 1],
    [3.01, 0.12],
    [5.4, 0.04],
  ]) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = freq * ratio;
    g.gain.value = level;
    o.connect(g).connect(env);
    o.start(t);
    o.stop(t + length + 0.05);
  }
}

const noteHz = (i: number) => {
  const step = i % 15; // climbs three octaves of the scale, then starts again
  return hz(ROOT + 12 * Math.floor(step / 5) + SCALE[step % 5]);
};

export function ringNote(i: number) {
  if (on()) pluck(noteHz(i), 0, 0.42);
}

export function bitChord(n: number) {
  if (!on()) return;
  const base = ROOT - 12 + SCALE[n % 5];
  [0, 4, 7, 12].forEach((k, j) => pluck(hz(base + k), j * 0.045, 0.3, 2.4));
}

// Air rushing: filtered noise sweeping up (springs, boosts).
export function whoosh(strength = 1) {
  const c = audio();
  if (!on() || !c || !out) return;
  const t = c.currentTime;
  const buf = c.createBuffer(1, c.sampleRate * 0.7, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(400, t);
  f.frequency.exponentialRampToValueAtTime(2400, t + 0.5);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.18 * strength, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
  src.connect(f).connect(g).connect(out);
  src.start(t);
}

// The hero fox's backflip landing: a paw thump with a grass scuff. The flip itself is silent;
// swishes on takeoff sounded busy.
export function landSound() {
  if (!on()) return;
  thump(0, 0.55);
  noiseBurst(0.005, 0.09, "lowpass", 900, 900, 0.22);
}

// A soft body thump: a sine dropping in pitch, very short.
function thump(when: number, vol: number) {
  const c = audio();
  if (!c || !out) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.22);
}

// Filtered noise with a swell-and-fade envelope and a frequency sweep: swishes and scuffs.
function noiseBurst(when: number, length: number, type: BiquadFilterType, from: number, to: number, vol: number) {
  const c = audio();
  if (!c || !out) return;
  const t = c.currentTime + when;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * length), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + length);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + length * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  src.connect(f).connect(g).connect(out);
  src.start(t);
}

// ---------------------------------------------------------------------------- background music

// An original late-night lounge groove for the whole site and the game, looping 4 bars at
// 100 BPM in B minor: the relative minor of the rings' D major pentatonic, so every ring
// note sits in key. Electric piano comping, a syncopated bass line, soft kick, rim and shaker.
const BEAT = 60 / 100;
const BAR = BEAT * 4;
// Bm9 → Gmaj9 → Em9 → F#m11, as [bass, ...piano voicing] in MIDI.
const CHORDS = [
  [35, 62, 66, 69, 73],
  [31, 59, 62, 66, 69],
  [28, 55, 59, 62, 66],
  [30, 57, 61, 64, 71],
];
// Piano hits per bar as [beat, length in beats]; two patterns alternate so it breathes.
const COMP = [
  [
    [0, 1.4],
    [2.5, 0.9],
  ],
  [
    [0, 0.7],
    [1.5, 0.9],
    [3.5, 0.6],
  ],
];
// Bass as [beat, semitones above the root, length in beats]; the last note leads into the next chord.
const BASS = [
  [0, 0, 0.9],
  [1.5, 0, 0.4],
  [2, 7, 0.8],
  [3, 12, 0.3],
  [3.5, 10, 0.4],
];
const MUSIC_LEVEL = 0.85;

let music: { bus: GainNode; timer: number; next: number; bar: number } | null = null;

export function startMusic() {
  const c = audio();
  if (!on() || !c || !out || music) return;
  const bus = c.createGain();
  const mellow = c.createBiquadFilter();
  mellow.type = "lowpass";
  mellow.frequency.value = 2600;
  bus.gain.setValueAtTime(0, c.currentTime);
  bus.gain.linearRampToValueAtTime(MUSIC_LEVEL, c.currentTime + 2.5);
  bus.connect(mellow).connect(out);
  const m = { bus, timer: 0, next: c.currentTime + 0.1, bar: 0 };
  // Schedule half a second ahead of the audio clock, so timer jitter never makes the groove stumble.
  const tick = () => {
    for (; m.next < c.currentTime + 0.5; m.next += BAR) playBar(c, bus, m.bar++, m.next);
  };
  tick();
  m.timer = window.setInterval(tick, 150);
  music = m;
}

export function stopMusic() {
  if (!music || !ctx) return;
  const { bus, timer } = music;
  const t = ctx.currentTime;
  clearInterval(timer);
  bus.gain.cancelScheduledValues(t);
  bus.gain.setValueAtTime(bus.gain.value, t);
  bus.gain.linearRampToValueAtTime(0, t + 1);
  setTimeout(() => bus.disconnect(), 1500);
  music = null;
}

// Sink the music under something that should be heard on its own (the finale melody).
export function duckMusic(seconds: number) {
  if (!music || !ctx) return;
  const g = music.bus.gain;
  const t = ctx.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(0.15, t + 0.4);
  g.setValueAtTime(0.15, t + seconds);
  g.linearRampToValueAtTime(MUSIC_LEVEL, t + seconds + 2);
}

// Hidden tab: freeze all sound. The music clock stops with it, so it picks up where it left off.
export function pauseAudio(paused: boolean) {
  if (!ctx) return;
  void (paused ? ctx.suspend() : ctx.resume());
}

function playBar(c: AudioContext, bus: GainNode, bar: number, t: number) {
  const [root, ...voicing] = CHORDS[bar % 4];
  for (const [beat, len] of COMP[bar % 2]) voicing.forEach((m, k) => keys(c, bus, hz(m), t + beat * BEAT + k * 0.012, len * BEAT));
  for (const [beat, step, len] of BASS) bassNote(c, bus, hz(root + step), t + beat * BEAT, len * BEAT);
  if (bar < 2) return; // the drums come in on bar 3
  for (const beat of [0, 2.5]) drum(c, bus, t + beat * BEAT, "kick");
  for (const beat of [1, 3]) drum(c, bus, t + beat * BEAT, "rim");
  for (let e = 0; e < 8; e++) drum(c, bus, t + (Math.floor(e / 2) + (e % 2 ? 0.6 : 0)) * BEAT, e % 2 ? "shaker" : "shakerSoft"); // swung 8ths
}

// Electric piano: a warm sine with a quiet bell partial that fades fast, and a slow tremolo.
function keys(c: AudioContext, bus: GainNode, f: number, t: number, len: number) {
  const env = c.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.07, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.035, t + 0.5);
  env.gain.setValueAtTime(0.035, t + len);
  env.gain.exponentialRampToValueAtTime(0.0005, t + len + 0.4);
  env.connect(bus);
  const trem = c.createOscillator();
  const depth = c.createGain();
  trem.frequency.value = 4.5;
  depth.gain.value = 0.012;
  trem.connect(depth).connect(env.gain);
  const body = c.createOscillator();
  body.frequency.value = f;
  body.connect(env);
  const bell = c.createOscillator();
  const bellGain = c.createGain();
  bell.frequency.value = f * 4;
  bellGain.gain.setValueAtTime(0.25, t);
  bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  bell.connect(bellGain).connect(env);
  for (const o of [trem, body, bell]) {
    o.start(t);
    o.stop(t + len + 0.45);
  }
}

// Round bass: a triangle through a low filter, plucked.
function bassNote(c: AudioContext, bus: GainNode, f: number, t: number, len: number) {
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.value = f;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.32, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.14, t + len * 0.6);
  g.gain.exponentialRampToValueAtTime(0.001, t + len + 0.08);
  o.connect(lp).connect(g).connect(bus);
  o.start(t);
  o.stop(t + len + 0.1);
}

let hiss: AudioBuffer | null = null;

function drum(c: AudioContext, bus: GainNode, t: number, kind: "kick" | "rim" | "shaker" | "shakerSoft") {
  const g = c.createGain();
  g.connect(bus);
  if (kind === "kick") {
    const o = c.createOscillator();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.1);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.26);
    return;
  }
  if (!hiss) {
    hiss = c.createBuffer(1, c.sampleRate * 0.2, c.sampleRate);
    const d = hiss.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = hiss;
  const f = c.createBiquadFilter();
  const rim = kind === "rim";
  f.type = rim ? "bandpass" : "highpass";
  f.frequency.value = rim ? 1700 : 7000;
  f.Q.value = rim ? 2 : 0.7;
  const len = rim ? 0.07 : 0.04;
  g.gain.setValueAtTime(rim ? 0.16 : kind === "shaker" ? 0.07 : 0.035, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  src.connect(f).connect(g);
  src.start(t);
  src.stop(t + len + 0.01);
}

// The run's rings played back, squeezed into about four seconds, ending on a chord.
export function playMelody(notes: Note[]) {
  if (!on() || !notes.length) return;
  const span = Math.max(0.001, notes[notes.length - 1].t - notes[0].t);
  const k = Math.min(1, 3.6 / span);
  notes.forEach((n) => pluck(noteHz(n.i), (n.t - notes[0].t) * k, 0.36));
  const end = span * k + 0.3;
  [0, 4, 7, 12, 16].forEach((s, j) => pluck(hz(ROOT + s), end + j * 0.06, 0.28, 3));
}
