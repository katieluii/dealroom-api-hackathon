# Dealroom API Hackathon

Goal: build a working, honest hackathon demo using the Dealroom API.

## Rules

- Never commit credentials, access tokens, raw Dealroom exports, or the downloaded setup bundle. The personal key is for this hackathon only.
- Read the official API quickstart before changing authentication or request handling.
- Before a count, chart, or ranking, use the Dealroom analyst note supplied with the key. State filters, geography and attribution, tag family, as-of date, and whether pagination is complete.
- VC funding: venture rounds, exclude Mature and Outside Tech, attribute by HQ. Valuation and unicorn views: exclude Mature and Outside Tech, require founding year 1990 or later; use HQ or founding attribution. Do not apply either pack to plain company counts.
- A 200 response is not analytical validation. Check empty slices, locked/redacted rows, partial current-year data, and overlapping geographies.
- Keep demo claims distinguishable from scaffolds or sample data.

## How to run

`npm install`, `cp .env.example .env.local`, `npm run dev`. Verify with `npm test`, `npm run typecheck`, `npm run build`. Keep mock fixtures labelled. Latest CRM specification supersedes the older Renascor treatment: cool grey #EEF1F5, Instrument Sans, minimum 14px text. Product name: Mi-Chi.

## Handoff

Read `AI_STATE.md` before work, then `SPECS.md` for defined features.

@.Codex/memory/MEMORY.md
