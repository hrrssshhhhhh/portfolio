// Blog posts. Adding one is a new entry here; both blog pages and the home "Latest posts" row
// read through allPosts() / getPost(), so a later move to Markdown files only changes those two.
//
// Body: one string per block. A block starting with "## " is a heading; anything else a paragraph.

export type Post = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  summary: string;
  tags: string[];
  body: string[];
};

const posts: Post[] = [
  {
    slug: "a-portfolio-you-can-play",
    title: "A portfolio you can play",
    date: "2026-10-28",
    summary: "Why my portfolio opens on a sleeping fox and a 30-second speed run, and how it stays fast on a phone.",
    tags: ["Next.js", "Three.js", "Game dev"],
    body: [
      "Most portfolios are a list. I wanted mine to be a place: a violet-and-gold fox asleep on a sakura hill at sunset, next to a crystal that holds everything about my work.",
      "## Two ways in",
      "You can skip straight to the full portfolio, or press Play for a 30-second run through one level, Sakura Hills. The crystal breaks into five data bits, the fox chases them through rings, torii gates, a loop over a mirror-still pond and a grind up a giant sakura tree, and at the end the bits fly home and the portfolio unfolds. Both paths show the same content; the game is a short way to get there, never a wall in front of it.",
      "## Built in code",
      "The fox is built from shapes in code, not a model file, so every pose (sleeping, running, gliding, a backflip when you tap it) is ours to tune. Every ring plays the next note of a pentatonic scale, so each run becomes a small song, and the background music is synthesized in the browser too.",
      "## Fast enough on a phone",
      "A performance monitor watches the frame rate and drops quality one step at a time when a device struggles: first the pond's reflection, then bloom detail, then pixel ratio, then the falling petals. One lesson from that: its default thresholds on a 60 Hz screen could never step back up, so a single hitch lowered quality for good.",
    ],
  },
  {
    slug: "neuroseg-ich-class-imbalance",
    title: "NeuroSeg-ICH: fighting class imbalance in brain CT",
    date: "2026-06-15",
    summary: "What it took to get a ResUNet to see small hemorrhages when almost every pixel is background.",
    tags: ["PyTorch", "Medical Imaging", "Deep Learning"],
    body: [
      "NeuroSeg-ICH segments intracranial hemorrhage in brain CT scans. It was my major project, built on the PhysioNet CT-ICH dataset with a residual U-Net I wrote from scratch in PyTorch.",
      "## The problem: almost everything is background",
      "Hemorrhage covers a tiny fraction of each slice, so a model can score well by predicting \"no bleed\" everywhere. Plain binary cross-entropy rewards exactly that.",
      "## What helped",
      "Combining BCE with Dice loss, and weighting the positive class (pos_weight 20), pushed the model to care about the few pixels that matter. Residual skip connections kept gradients flowing through the deeper network, and ReduceLROnPlateau slowed learning when validation stopped improving.",
      "## Where it landed",
      "Best validation Dice was 0.63, with precision around 0.74 and recall around 0.44: when it marks a bleed it is usually right, but it still misses some. An adaptive threshold search, plus overlays, contours and error maps on the CT slices, made those misses easy to see and study.",
    ],
  },
  {
    slug: "leasegen-per-user-data",
    title: "LeaseGen: keeping every user's data their own",
    date: "2026-04-10",
    summary: "A small rule in a lease agreement app: every API call checks who is asking.",
    tags: ["Flask", "React", "Security"],
    body: [
      "LeaseGen is a full-stack app for creating, managing and exporting residential lease agreements, with a live preview, one-click PDF export and a reusable clause library.",
      "## One rule on every request",
      "Leases hold personal details, so isolation between users came first. Every API call checks the JWT, and a request for another user's data gets a 403, not a filtered empty list. The check lives on the server, so the React client never has to be trusted.",
      "## The rest of the stack",
      "A Flask REST API on SQLite, a dashboard with tenant and address search, a rent-range filter, date sorting and bulk actions, and PDF rendering on the server so the exported lease looks the same everywhere.",
    ],
  },
];

// Self-check: a duplicate slug would make one post unreachable.
if (new Set(posts.map((p) => p.slug)).size !== posts.length) throw new Error("lib/posts.ts: duplicate post slug");

export const allPosts = () => [...posts].sort((a, b) => b.date.localeCompare(a.date));

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

export const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
