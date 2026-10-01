# Mi-Chi readability review

2026-10-01. Two fresh red-team lenses: UI/UX and copy/evidence. One lightweight pass; stopped after fixes and verification because no high or critical findings required escalation. This is not a production security audit.

## Findings and fixes

| Severity | Finding | Fix location |
|---|---|---|
| Medium | Own-contact drafts asked the viewer to introduce themselves | `lib/matching.ts`, `components/RelationshipDialog.tsx`: own-contact drafts address the external contact directly |
| Medium | Clipboard errors were hidden behind the dialog | `components/RelationshipDialog.tsx`: dialog-local alert and manual-copy instruction |
| Medium | Pending-match scoring dialog disappeared on refresh | `components/PortfolioApp.tsx`: scoring dialogs reconcile against eligible and pending routes |
| Medium | Mock state asserted a real HubSpot connection | `components/Topbar.tsx`, portfolio footer: explicit fictional-demo and disconnected-provider labels |
| Medium | Fit evidence attributed investments to the company's first sector even when a different sector matched | `lib/matching.ts`: evidence says matching sectors and names the actual investments |
| Medium | A CRM note was described as actual contact | `lib/scoring.ts`: latest logged activity wording; appendix aligned |
| Low | Repeated buttons were indistinguishable in a screen-reader action list | `components/RelationshipCard.tsx`: accessible action names include teammate and contact |
| Low | Percentages implied measured relationship certainty | Cards and portfolio now show labelled activity scores out of 100; formula unchanged |

## Frontend changes

- Kept Instrument Sans and the existing cool-grey, white and blue palette.
- Teammate name leads, then external contact and investor. Scores are secondary.
- Replaced nested route boxes with separated entries; kept one blue rule for the highest-ranked entry.
- Summarized activity counts; full evidence remains in the scoring dialog.
- Removed repeated source notes. One footer explains provenance.
- Collapsed identity checks and pending matches. Checks compare CRM organisation/domain against investor name/domain.
- Replaced raw JSON parsing errors with readable service errors.
- Added narrow-screen selection focus/scroll and a restore action for rejected company matches.
- Background refresh no longer flashes loading states or repeatedly announces the whole panel.

## Verification

- Eight tests pass, including new regressions for mixed-sector evidence, note wording and own/colleague draft recipients.
- Browser verified desktop layout, own-contact and colleague draft recipients, copying, pending-match dialog survival through refresh, and identity comparison. Live team names, activity scores and fictional-data labels verified after deployment.
- Production build and live checks recorded in AI_STATE.md.

## Boundaries

No live HubSpot or Dealroom integration was added. Backend privacy/security findings from the earlier paused review remain outside this focused UI pass, including disconnect/sync races and invite-cookie handling. Do not use the public demo for real CRM data.
