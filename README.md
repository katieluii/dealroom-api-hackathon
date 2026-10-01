# mi-chi

Build a funding round for a portfolio company: one lead, two followers, one strategic investor. Compare sector fit, shared investments and portfolio conflicts on a graph.

## Run

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. `MOCK_MODE=true` works without credentials using fictional companies, 25 investors and 60 rounds.

For Dealroom, set `MOCK_MODE=false`, `DEALROOM_BASE_URL` and `DEALROOM_ENV_FILE` to the absolute path of the supplied OAuth credentials file. Alternatively provide `DEALROOM_API_KEY` and `DEALROOM_CLIENT_ID`. All API calls and response mapping live in `lib/dealroom.ts`. Responses are cached for 15 minutes in memory and `data/cache/`, which is excluded from Git. API failures show a notice and the fictional demo company.

Set `ANTHROPIC_API_KEY` for Claude tool use. `ANTHROPIC_MODEL` defaults to `claude-sonnet-4-6`. Without the key, the three suggested prompts use labelled scripted commands. Open-ended Claude chat remains unverified until a key is supplied.

## Demo

1. Click **Load demo company**.
2. Click **Why this lead?** for named co-investments and inferred lead counts.
3. Open an **Overlap to check** badge to inspect the portfolio company.
4. Click **Find a non-US lead**, then inspect the updated graph.
5. Use **Replace with** to swap an investor.
6. Click **Export round plan** to download Markdown.

## Checks and limits

```bash
npm run check:mock
npm test
npm run typecheck
npm run build
```

Next.js 14, React, strict TypeScript, Tailwind, react-force-graph-2d and Anthropic SDK. No database or authentication; run locally. Sessions expire after an hour and reset when the server restarts.

Live mapping was checked against Dealroom records for Celestial AI. The current query samples 25 investors and loads up to two portfolio companies per shortlisted investor. It may leave slots empty, including the strategic slot. It is not an exhaustive investor search or conflict clearance. Industry and sub-industry tags drive live category fit; generic sector tags are excluded. Company stage is its latest disclosed VC round. Round dates are normalised to the first day of the recorded month. Cold requests may take longer than ten seconds; cached company loads are fast.

Co-investment does not confirm a warm introduction. Lead attribution may be inferred from cheque size or listing order and is labelled. Scores support screening, not investment decisions.

Visual style follows the requested Renascor palette and typography: white, ink, gold, Georgia headings and Helvetica body. The product identity remains mi-chi. Review results are in `docs/REVIEW.md`.

Stretch ideas: verified introduction paths from founder and VC networks, wider paginated investor coverage, target round stage selection.
