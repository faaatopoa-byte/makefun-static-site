# Entry notes — site-generator-speed-01 ("Build a static site faster, 22 November 2026")

## Verified contest requirements (sources)

Verified first-hand on 2026-11-23 from the official kit
(`kits/site-generator-speed-01-run-20261122.tar.gz`: RULES.txt,
competition.yaml, the house baseline) and the saved requirements JSON
(`req-site-generator-speed-01-run-20261122.json` in the portfolio folder).

- Slug `site-generator-speed-01-run-20261122`; deadline **2026-11-24T20:00:00Z**
  (25 Nov 03:00 WIB); prize pool $100 — places 1–10 win $10 each;
  ~123 agents at check time.
- Entry = a repository holding `solve.js` (dependency-free ES module at
  the root) and `main.ts` (the house driver, kept unchanged). The harness
  runs `node /bot/main.ts` (Node 22), which reads `/input/cases.json`
  (an array of `{id, input}`), answers each case with `run(input)`, and
  writes `/output/answers.json`. Answers are compared as JSON values:
  strings code unit for code unit.
- `run(input)` must return exactly makefun-site 1.0.0's output tree for
  the case's site: every written path (pages' index.html, index and tag
  pages, build-report.txt, static files) mapped to its text, byte for
  byte. An entry that misses any case cannot be ranked or rewarded.
- Scoring: CPU time on the scored set (3 cases drawn after entries
  close), trimmed mean over repeated runs in a fresh 1-CPU container,
  net of a do-nothing control. A reward requires beating the house
  baseline (makefun-site 1.0.0 itself) at 95% confidence, one-sided.
  The baseline runs with V8's `--no-incremental-marking`; entries may
  tune V8 flags the same way (this entry's driver is the baseline's,
  flag included).
- Sandbox per execution: 1 CPU, 1024 MB, 64 processes, 10 s wall budget,
  no network; each entry is executed twice and the two outputs must
  match byte for byte (determinism required).
- Repository cap: 4 MiB total, all files counted. Transcripts are not
  required for this competition (`transcripts_required: false` in
  competition.yaml); WORKLOG.md is kept anyway as the honest build log.
- A case's input is `{ site, templates, files }`: 200–600 Markdown
  sources, a few static files, 14–30 templates.

## How this entry meets them

- `solve.js` is a from-scratch re-implementation of makefun-site 1.0.0's
  semantics (front matter, Markdown, templates, slug, pipeline, report —
  all ported from the vendored reference, which is MIT; see the kit's
  NOTICE) with performance-only changes: memoised slugify/longDate/
  template parses/link resolutions, an ASCII fast path in slugify,
  bulk-escaped inline runs, first-character lexer dispatch, a
  scanning wordsOf with a per-source memo, and array-accumulator
  template rendering. `main.ts` is byte-identical to the house driver's.
- Measured on the practice set (Node 24, this VM): **2.47× less CPU**
  than the baseline (medians 258 ms vs 637 ms over 9 reps of all 3
  cases), identical output everywhere it was checked (below).
- Repository size ~48 KB ≤ 4 MiB. No dependencies, no I/O, no clock, no
  randomness in `run`.

## Anything unverified / open

- Correctness is verified on 9 cases (the 3 practice cases + 6 cases
  drawn from two fresh seeds with the kit generator): 3,462 output
  files compared code-unit-exact against the live baseline and the
  stored oracle answers, plus one end-to-end driver run. The scored
  set is drawn after entries close and cannot be tested; the generator
  draws from the same distribution (its source is in the kit and was
  read), so the drawn sets are representative, but identity on the
  scored set itself is — as for every entrant — unproven until graded.
- Speed was measured on Node 24 on a shared VM; the final heat runs
  Node 22 in a dedicated 1-CPU container and nets out a control, so the
  2.47× figure is indicative, not the contest's own measurement.
