# Project Memory State

## Current Context

- mi-chi is a Next.js 14 round-assembly prototype for early-stage VC portfolio fundraising.
- Public repo: katieluii/dealroom-api-hackathon. Branch: codex/initial-build-plan; base 8ff8985.
- User requested Renascor house style and minimal copy; applied white/ink/gold, Georgia main heading, Helvetica body, square panels.

## Completed

- 25 labelled fictional investors, 31 companies and 60 historical rounds; fixture check passed.
- Pure fit, lead, chemistry, conflict and syndicate engine; graph, cards, swaps, evidence dialogs, Markdown export.
- Eight-tool Claude route with session state and rollback on provider failure. Scripted demo commands work without a key.
- Dealroom OAuth adapter, response mapping, bounded queries and memory/JSON caching. Earlier Cloudflare 403 is no longer reproduced: Celestial AI loaded with 43 historical rounds.
- Browser verified explanation, competitor details, non-US lead change, live cached company search and downloaded Markdown content.
- 12 tests and TypeScript passed. Production build passed. Anti-AI Python scanner: two files, zero gate/advisory findings; TypeScript reviewed manually.
- Inline red-team: two fresh lenses plus independent high-severity verification. Seven findings fixed; regression tests cover locks, expired sessions, invalid swaps and export omissions. Details: docs/REVIEW.md.
- Remote fetched 2026-10-01; no upstream changes before publication.

## Known Issues

- No Anthropic key configured; real Claude tool-use execution remains unverified.
- Live candidate search samples 25 investors; hydration covers up to 12 investors and two portfolio companies each. Tested sample fills three slots; no strategic investor found. Fit can be unknown. Cold API requests can exceed ten seconds.
- Live company stage is latest disclosed VC round, not an independently chosen next round. Dates normalised to month.
- Responsive styles exist, but mobile viewport has not been browser-tested.
- No personal contact graph; co-investment is not proof of a warm introduction.
- Local .env.local points to the supplied credentials file, with MOCK_MODE=false. Credentials and live caches are ignored by Git. The prior HTML sketch in frontend/ is ignored and superseded.
- Pre-existing shared memory/skills drafts were not authored or published by this session.

## Exact Next Steps

1. Iterate the frontend at http://127.0.0.1:3000; use Load demo company for the complete four-slot flow.
2. Configure ANTHROPIC_API_KEY in .env.local and verify real tool-use explanations and swaps.
3. Improve live candidate coverage using verified type/portfolio filters, then verify a complete real four-slot round.
