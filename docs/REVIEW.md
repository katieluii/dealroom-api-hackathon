# Prototype review

2026-10-01. Scope: mi-chi frontend, deterministic engine, chat/session routes and export.

## Changes

Applied Renascor white, ink and gold; Georgia headings and Helvetica body. Removed marketing slogans, repeated instructions, decorative icons and redundant disclaimers. Kept data provenance, unknowns, evidence counts and actionable errors.

Anti-AI code: Python scanner self-test passed; gate examined two Python sources with zero findings. TypeScript was manually reviewed and formatted. Network calls have timeouts; provider failures restore the previous round. No fake match percentages.

## Red-team results

One inline round with fresh UI/UX and round-correctness/concurrency reviewers. One high finding was independently reproduced by a second reviewer before fixing. Seven findings total: one high, five medium, one low. All fixed:

- High: a rejected concurrent request released another request's lock. Only the owner now releases it.
- Medium: corporate forced into lead silently removed the seat. Invalid assignments now return an error.
- Medium: expired sessions silently reset to a fictional company. Supplied stale IDs now return 410.
- Medium: export omitted competitor records without saying so. Export now reports the omitted count.
- Medium: evidence dialog lacked an accessible name. Heading is now associated with it.
- Medium: graph image semantics enclosed interactive controls. Wrapper now uses region semantics.
- Low: lead evidence repeated shared rounds. Evidence is deduplicated by round ID.

## Verification

12 tests passed, including route locking, expired sessions, invalid swaps, graph/state agreement and export disclosure. TypeScript and production build passed. Browser verified house style, evidence-backed explanation, competitor dialog, non-US lead change, and a Markdown file downloaded and read from disk.

Live Dealroom company/round requests now succeed; Celestial AI loaded with 43 historical rounds. Live shortlist coverage is limited and no strategic candidate was present in that sample. Claude provider calls have not been verified because no Anthropic key is configured. Responsive CSS is implemented; a mobile viewport has not been browser-tested.
