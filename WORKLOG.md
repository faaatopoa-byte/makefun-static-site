# Work log — static-site-faster (make.fun: site-generator-speed-01)

Honest session log of the agent that built this entry. Times UTC,
2026-11-23.

- 00:31 — Read the kit: RULES.txt and competition.yaml (deadline
  2026-11-24T20:00:00Z; $100 over 10 places; repo ≤ 4 MiB; sandbox
  1 CPU / 1024 MB / 10 s wall; CPU-time scoring vs the makefun-site
  1.0.0 house baseline at 95% confidence; transcripts not required),
  the baseline driver main.ts (kept unchanged; it sets
  --no-incremental-marking before importing solve.js), and all of the
  vendored reference: index.js (the 8-plugin pipeline), frontmatter.js,
  markdown.js, template.js, text.js.
- 00:32 — Wrote check.mjs (mine vs live baseline vs stored expected,
  code-unit exact, plus a CPU/wall bench mode) and validated the
  checker with a placeholder solve.js re-exporting the baseline:
  identical, baseline ≈ 200–255 ms per practice case.
- 00:33–00:34 — Wrote solve.js: a faithful port of the reference with
  memoised slugify/longDate/template parses/link resolutions, an ASCII
  fast path in slugify, bulk-escaped inline runs, first-character
  lexer dispatch, and array-accumulator template rendering.
- 00:34 — First check: all outputs identical EXCEPT build-report.txt —
  the broken-link lines differed. Root cause: my link cache was keyed
  by (directory, target), but a broken link is reported per source
  path, so a second source in the same directory linking the same
  broken target lost its report line. Fixed the key to (source,
  target); re-check: identical on all 3 practice cases, 1.85× CPU.
- 00:35 — CPU profile (--cpu-prof): markdown/inline/escape ≈ 33%,
  wordsOf + its \S+ regex ≈ 11%, trimLine regex ≈ 3%. Optimised:
  escapeHtml tests before replacing; wordsOf rewritten as a scanner
  over JavaScript's \s class with a per-source memo; trimLine manual.
  Re-check: identical everywhere; CPU medians (9 reps, all 3 cases)
  baseline 637 ms → mine 258 ms = 2.47×.
- 00:35–00:36 — Drew two extra case sets with the kit generator
  (program/generator/draw.ts) from fresh seeds
  (0123456789abcdef… and fedcba9876543210…) and ran check-drawn.mjs:
  all 6 cases identical to the baseline and the drawn expected
  answers. Ran the harness driver end-to-end (node main.ts) on one
  drawn set: answers equal expected for every case; 1.9 s wall total.
- 00:37 — Docs written (README, ENTRY-NOTES, this log), LICENSE (MIT)
  added, repo size measured (~48 KB), folder committed to git.
