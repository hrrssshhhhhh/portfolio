// The 5 data bits, in order. The home page, section headers, HUD, and level all read this list.
// Where each bit sits in the run is in lib/level.ts.

export const sections = [
  { id: "about", name: "About", color: "sakura" },
  { id: "education", name: "Education", color: "sun" },
  { id: "skills", name: "Skills", color: "sky" },
  { id: "projects", name: "Projects", color: "sakura" },
  { id: "contact", name: "Contact", color: "sun" },
] as const;

export type SectionId = (typeof sections)[number]["id"];
