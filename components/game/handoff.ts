// Hands the run from the hero to /play. The hero's fox starts running in the hero's own canvas;
// on navigation the game picks up at the same distance and speed, and the hero's last frame
// (`image`) covers the page swap until the game has drawn the same picture underneath.
export const handoff = {
  run: { t: 0, d: 0, v: 0 }, // the hero fox's run, written every frame while playing
  capture: null as null | (() => string), // the hero canvas as an image
  arrival: null as null | { d: number; speed: number; image: string; at: number }, // waiting for /play
};

// The hand-over, if the hero's fox ran into /play just now. Not cleared on read (dev StrictMode
// boots twice); it simply expires, so a later visit to /play starts normally.
export const freshArrival = () => (handoff.arrival && performance.now() - handoff.arrival.at < 4000 ? handoff.arrival : null);
