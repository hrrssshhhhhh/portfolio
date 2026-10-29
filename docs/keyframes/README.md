# Key frames

The frames that define how the site looks (PLAN.md "Art direction"). K1 and the fox review stages live in `/lab` (dev only: `/lab?k=K1`, add `&clean` to hide the slider panel). K2–K5 are shot from the real game during a hands-off run.

**Shoot them all:** with `npm run dev` running, `playwright-cli open` then `playwright-cli run-code --filename=scripts/keyframes.js`. Screenshots land in `shots/` as `<frame>-desktop.png` (1440×900) and `<frame>-phone.png` (390×844).

**Tune colors:** move sliders in `/lab`, press **Copy look**, paste over the look in `lib/look.ts`.

| # | Frame | Must read as | Status (Oct 2026) |
|---|---|---|---|
| K1 | Hero: fox dozing on the path, crystal floating beside it, sakura groves, low sun | a painting you'd screenshot without touching anything | Works on desktop and phone (portrait camera lifts fox and crystal above the text). To do: pre-rendered poster for first paint |
| K2 | Meadow dash, side view | fast, warm, alive | Works: fox in profile, ring arcs, groves, hills, flat cloud streaks, shrubs in front |
| K2-torii | Torii rush | anime | Works: low camera along the gate row, the pond mirroring it ahead |
| K3 | Mirror pond loop | the "how is this a website" moment | Works: camera holds on the loop, full double circle with the sun, on both sizes |
| K4 | Branch grind up the giant sakura | pure anime | Works; could use more blossom density and the giant trunk in frame |
| K5 | Homecoming at nightfall | the shareable shot | Works: trail across the night sky into the re-formed crystal, results panel beside it |
| FOX / FOXSIDE / FOXFACE | The mascot's poses | a confident original anime fox | First pass; waiting on owner feedback |

**Squint test** for every frame: blur the screenshot; the fox, the goal and the path must still read as three clear shapes.
