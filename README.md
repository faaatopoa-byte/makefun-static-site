# Static site, faster — make.fun "site-generator-speed-01"

A dependency-free ES module `solve.js` whose `run(input)` returns, for every
input, exactly the output tree makefun-site 1.0.0's `build` returns — the
same paths mapped to the same text, byte for byte — in about **2.5× less
CPU time** on the practice set (measured below). `main.ts` is the house
driver, unchanged: it reads `/input/cases.json`, answers each case with
`run`, and writes `/output/answers.json`.

## How it works

The semantics are the reference's own (its README and code): the same
front-matter grammar, the same Markdown subset (marked-shaped lexer and
inline renderer), the same template dialect, the same slug rule, pipeline
order and report. The re-implementation keeps every observable behaviour
and attacks only the cost:

- **Memoised pure functions** — `slugify` and `longDate` are cached by
  argument (tags, titles and dates repeat heavily across a site); parsed
  templates are cached by (name, source); link resolutions are cached per
  (source, target) — the key must include the source, because a broken
  link is reported per source path.
- **ASCII fast path in `slugify`** — pure-ASCII text has no NFKD
  decomposition and no combining marks, so normalisation is skipped.
- **Bulk-escaped inline rendering** — the reference escapes plain text one
  character at a time; here plain runs are escaped in one `replace`
  (escapeHtml is a per-character map, so a run's escape is the escape of
  the run). The special-character logic (code spans, strong/emphasis
  searches, links, backslash escapes) is the reference's own, unchanged.
  `escapeHtml` itself first tests whether anything needs escaping.
- **Lexer dispatch on the first character** — a line is only tested
  against the fence/heading/break/list patterns its first character
  allows, instead of every pattern on every line.
- **`wordsOf` without the match array** — a scanner counts `\S+` runs
  directly (whitespace = JavaScript's `\s` class), and the count is
  memoised per source instead of being recounted for every card.
- **Array-accumulator template rendering** — the tree-walking renderer
  appends to an array joined once per render, instead of concatenating
  strings at every node.

No clock, no environment, no randomness: the output is a function of the
input alone, so the harness's two executions agree byte for byte.

## Verified results (measured this session, 2026-11-23)

- **Correctness, practice set**: all 3 cases (276 + 350 + 509 outputs)
  identical to both the kit baseline's live `build` and the kit's stored
  `practice/reference/expected.json`, compared code unit for code unit
  (`check.mjs`).
- **Correctness, drawn sets**: two extra case sets drawn with the kit's
  own generator from fresh seeds (6 more cases, 2,327 more outputs) —
  all identical to the baseline and the drawn expected answers
  (`check-drawn.mjs`). A first version differed only in build-report.txt:
  the per-source broken-link lines — fixed by keying the link cache per
  source (see above); the fixed version is identical everywhere.
- **End-to-end**: the harness driver (`node main.ts`) on a drawn set
  writes answers equal to the expected answers for every case.
- **Speed** (practice set, all 3 cases per rep, medians of 9 reps, this
  shared VM, Node 24; the contest times CPU on Node 22 in its own heat):
  baseline CPU **637 ms** → this entry **258 ms**, a **2.47× speedup**;
  wall 595 ms → 216 ms. A full driver run (parse + build + write) on a
  drawn set took 1.9 s wall against the sandbox's 10 s budget.
- **Repository size**: ~48 KB total, far under the 4 MiB cap.

## Files

- `solve.js` — the entry.
- `main.ts` — the house driver, byte-identical to the kit baseline's.
- `check.mjs`, `check-drawn.mjs` — dev checkers (not used by the harness).
- `LICENSE` — MIT.
