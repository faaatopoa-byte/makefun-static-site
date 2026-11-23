// Dev checker (not part of the scored entry path): compares solve.js's run()
// against the kit baseline's build() and the kit's stored expected.json,
// code-unit exact, then benchmarks both on the practice set.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const KIT = process.env.KIT_DIR;
if (!KIT) { console.error('set KIT_DIR'); process.exit(2); }
const baseline = await import(pathToFileURL(`${KIT}/baselines/makefun-site/vendor/makefun-site/index.js`).href);
const mine = await import(new URL('./solve.js', import.meta.url).href);

const cases = JSON.parse(readFileSync(`${KIT}/practice/input/cases.json`, 'utf8'));
const expected = JSON.parse(readFileSync(`${KIT}/practice/reference/expected.json`, 'utf8'));
const expById = new Map(expected.cases.map((c) => [c.id, c.output]));

function diff(name, a, b) {
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return `${name}: key count ${ka.length} vs ${kb.length}`;
  for (const k of ka) {
    if (!Object.hasOwn(b, k)) return `${name}: missing key ${JSON.stringify(k)}`;
    if (a[k] !== b[k]) {
      const x = a[k], y = b[k];
      let i = 0; while (i < Math.min(x.length, y.length) && x[i] === y[i]) i++;
      return `${name}: value differs at ${JSON.stringify(k)} char ${i}:\n  A …${JSON.stringify(x.slice(Math.max(0, i - 40), i + 40))}\n  B …${JSON.stringify(y.slice(Math.max(0, i - 40), i + 40))}`;
    }
  }
  return null;
}

let fail = 0;
for (const c of cases) {
  const t0 = Date.now();
  const ref = baseline.build(c.input);
  const t1 = Date.now();
  const got = mine.run(c.input);
  const t2 = Date.now();
  const d1 = diff(`${c.id} mine-vs-baseline`, got, ref);
  const d2 = diff(`${c.id} mine-vs-expected`, got, expById.get(c.id));
  const d3 = diff(`${c.id} baseline-vs-expected`, ref, expById.get(c.id));
  for (const d of [d1, d2, d3]) if (d) { console.log('DIFF', d); fail = 1; }
  console.log(`${c.id}: ${Object.keys(ref).length} outputs, baseline ${t1 - t0}ms, mine ${t2 - t1}ms ${d1 || d2 ? 'FAIL' : 'IDENTICAL'}`);
}
if (fail) process.exit(1);

if (process.argv.includes('--bench')) {
  const REPS = Number(process.env.REPS ?? 5);
  for (const [name, fn] of [['baseline', baseline.build], ['mine', mine.run]]) {
    fn(cases[0].input); // warm-up
    const walls = [], cpus = [];
    for (let r = 0; r < REPS; r++) {
      const c0 = process.cpuUsage(), w0 = performance.now();
      for (const c of cases) fn(c.input);
      const cd = process.cpuUsage(c0);
      walls.push(performance.now() - w0); cpus.push((cd.user + cd.system) / 1000);
    }
    const med = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
    console.log(`${name}: wall median ${med(walls).toFixed(1)}ms, cpu median ${med(cpus).toFixed(1)}ms over ${REPS} reps (all 3 cases)`);
  }
}
