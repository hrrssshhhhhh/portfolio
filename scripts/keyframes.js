// Screenshots the key frames into docs/keyframes/shots/, at desktop and phone size:
//   /lab stages (K1 hero, fox review) and the real game at each beat (K2–K5).
// Run with the dev server up:  playwright-cli open && playwright-cli run-code --filename=scripts/keyframes.js
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- playwright-cli run-code takes a bare function
async (page) => {
  const base = "http://localhost:3000";
  const lab = ["K1", "K1P", "FOX", "FOXSIDE", "FOXFACE"];
  // Seconds after /play loads, for a hands-off run: meadow, torii, pond loop, branch.
  const beats = { K2: 4, "K2-torii": 9, K3: 15.5, K4: 20.5 };
  const sizes = { desktop: [1440, 900], phone: [390, 844] };
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [label, [width, height]] of Object.entries(sizes)) {
    await page.setViewportSize({ width, height });
    for (const k of lab) {
      await page.goto(`${base}/lab?clean&k=${k}`);
      await page.waitForTimeout(4500); // models, reflections and bloom settle
      await page.screenshot({ path: `docs/keyframes/shots/${k}-${label}.png` });
    }
    await page.goto(`${base}/play`);
    const t0 = Date.now();
    for (const [k, at] of Object.entries(beats)) {
      await page.waitForTimeout(Math.max(0, at * 1000 - (Date.now() - t0)));
      await page.screenshot({ path: `docs/keyframes/shots/${k}-${label}.png` });
    }
    await page.locator("#results-title").waitFor({ timeout: 30000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `docs/keyframes/shots/K5-${label}.png` });
  }
  return errors.length ? errors : "ok";
}
