// Differential check on a freshly drawn case set (from the kit generator):
// mine vs baseline vs the drawn expected.json. Usage: node check-drawn.mjs <setDir>
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const KIT = process.env.KIT_DIR;
const dir = process.argv[2];
const baseline = await import(pathToFileURL(`${KIT}/baselines/makefun-site/vendor/makefun-site/index.js`).href);
const mine = await import(new URL('./solve.js', import.meta.url).href);
const cases = JSON.parse(readFileSync(`${dir}/input/cases.json`, 'utf8'));
const expected = JSON.parse(readFileSync(`${dir}/reference/expected.json`, 'utf8'));
const expById = new Map(expected.cases.map((c) => [c.id, c.output]));
function diff(name, a, b) {
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return `${name}: key count ${ka.length} vs ${kb.length}`;
  for (const k of ka) {
    if (!Object.hasOwn(b, k)) return `${name}: missing key ${JSON.stringify(k)}`;
    if (a[k] !== b[k]) {
      const x = a[k], y = b[k];
      let i = 0; while (i < Math.min(x.length, y.length) && x[i] === y[i]) i++;
      return `${name}: differs at ${JSON.stringify(k)} char ${i}: A …${JSON.stringify(x.slice(Math.max(0, i - 40), i + 40))} B …${JSON.stringify(y.slice(Math.max(0, i - 40), i + 40))}`;
    }
  }
  return null;
}
let fail = 0;
for (const c of cases) {
  const ref = baseline.build(c.input);
  const got = mine.run(c.input);
  const d1 = diff(`${c.id} mine-vs-baseline`, got, ref);
  const d2 = diff(`${c.id} mine-vs-expected`, got, expById.get(c.id));
  for (const d of [d1, d2]) if (d) { console.log('DIFF', d); fail = 1; }
  console.log(`${c.id}: ${Object.keys(ref).length} outputs ${d1 || d2 ? 'FAIL' : 'IDENTICAL'}`);
}
process.exit(fail);
