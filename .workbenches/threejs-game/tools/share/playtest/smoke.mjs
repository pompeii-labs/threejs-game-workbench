// A section: one file per behavior area. Replace this with the game's own
// checks and add more files (controls.mjs, fail-restart.mjs, mobile.mjs...).
// Drive the game with real input (page.keyboard, page.mouse, page.touchscreen)
// and read results from diagnostics. Use hooks only to set up state, and to
// force outcomes of random systems (drops, spawns, crits).
export const name = 'smoke';

export default async function ({ check, state, until }) {
    const before = await state((d) => d.frame);
    await until((start) => window.__THREE_GAME_DIAGNOSTICS__.frame > start + 30, 15000, before);
    const after = await state((d) => d.frame);
    check('the game loop advances', after > before, `frame ${before} -> ${after}`);
}
