// Called by tgcheck after the playtest step: node ledger.mjs <started-ms> <run-id>
// Enforces the runner contract (the tgplaytest runner wrote fresh metrics and
// the game has setTimeScale/setRenderScale), then records each section's
// result in artifacts/playtest-ledger.json against a fingerprint of the game
// source and the section file. A section's pass counts until either changes,
// so the full playtest can be proven across several short --only gates.
// Exit 0: contract kept and every section passed on this build. Exit 3:
// contract kept, sections still missing. Exit 1: contract broken.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const [started, runId] = [Number(process.argv[2]), process.argv[3] ?? ''];
const METRICS = 'artifacts/playtest-metrics.json';
const LEDGER = 'artifacts/playtest-ledger.json';
const DIR = 'scripts/playtest';

const fail = (msg) => {
    console.log(`FAIL playtest contract: ${msg}`);
    process.exit(1);
};

if (!fs.existsSync(METRICS) || fs.statSync(METRICS).mtimeMs < started) {
    fail(`${METRICS} was not written by this gate. Use the tgplaytest runner: run \`tgplaytest init\`.`);
}
const metrics = JSON.parse(fs.readFileSync(METRICS, 'utf8'));
if (metrics.runner !== 'tgplaytest@1') {
    fail('scripts/playtest.mjs is not the tgplaytest runner. Run `tgplaytest init`; it moves a hand-written playtest aside for porting.');
}
const missing = Object.entries(metrics.hooks ?? {}).filter(([, ok]) => ok === false).map(([k]) => k);
if (missing.length) {
    fail(`the test hooks lack ${missing.join(' and ')}. Add them (test builds only) so playtests run at ${metrics.timeScale}x game speed and ${metrics.renderScale} resolution. No other hook substitutes.`);
}

const hash = (h, file) => h.update(file).update('\0').update(fs.readFileSync(file));
const walk = (p) =>
    !fs.existsSync(p) ? [] : fs.statSync(p).isDirectory() ? fs.readdirSync(p).sort().flatMap((f) => (f === 'node_modules' ? [] : walk(path.join(p, f)))) : [p];
const sourceFiles = [
    ...['src', 'public', 'index.html', 'package.json', 'scripts/playtest.mjs'].flatMap(walk),
    ...fs.readdirSync('.').filter((f) => /^(vite\.config\.|tsconfig.*\.json$)/.test(f)),
    ...walk(DIR).filter((f) => path.basename(f).startsWith('_')),
];
const game = sourceFiles.reduce(hash, crypto.createHash('sha256')).digest('hex').slice(0, 16);
const fileHash = (f) => hash(crypto.createHash('sha256'), path.join(DIR, f)).digest('hex').slice(0, 16);

let ledger = { game, sections: {} };
try {
    const old = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
    if (old.game === game) ledger = old;
} catch {}
for (const [name, s] of Object.entries(metrics.sections ?? {})) {
    if (!s.file || !fs.existsSync(path.join(DIR, s.file))) continue;
    ledger.sections[name] = { file: s.file, hash: fileHash(s.file), ok: s.fail === 0 && s.pass > 0, seconds: s.seconds, at: runId };
}
fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n');

const files = walk(DIR).map((f) => path.basename(f)).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));
const proven = (f) => Object.values(ledger.sections).some((e) => e.file === f && e.ok && e.hash === fileHash(f));
const todo = files.filter((f) => !proven(f)).map((f) => f.replace(/\.mjs$/, ''));
const seconds = files.reduce((n, f) => n + (Object.values(ledger.sections).find((e) => e.file === f)?.seconds ?? 0), 0);
const legacy = fs.existsSync('scripts/playtest-legacy.mjs');
console.log(`playtest on this build: ${files.length - todo.length}/${files.length} sections passed (${seconds}s of section time)`);
if (todo.length) console.log(`  not yet passed on this build: ${todo.join(',')}`);
if (legacy) console.log('  scripts/playtest-legacy.mjs still exists: port its checks into sections, then delete it');
process.exit(todo.length || legacy ? 3 : 0);
