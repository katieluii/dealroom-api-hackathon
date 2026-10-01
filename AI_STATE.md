# Project Memory State

## Current Context

- Mi-Chi is now a strategic-investor relationship demo for early-stage deeptech VC portfolios. The previous round-builder is superseded (checkpoint ef422f3).
- Live: https://mi-chi-demo.katieluikakiu.workers.dev . Cloudflare Worker mi-chi-demo, D1 database 3390c21c-553e-4d00-9513-17911c912bdb, personal Cloudflare account 325cee91a2a8d96b12227b5370f01464.
- Main integration: PR #1 from codex/strategic-crm in katieluii/dealroom-api-hackathon. Merged feature branches deleted at user request; only main remains locally and remotely. PR: https://github.com/katieluii/dealroom-api-hackathon/pull/1 .
- User approved D1 and patched Next.js 15 (15.5.27). Workers Paid is active. User resumed the focused red-team/frontend-design readability pass; completed and deployed.

## Completed

- Deleted merged local branches codex/initial-build-plan (ef422f3) and codex/strategic-crm (57b1894), plus remote codex/strategic-crm. All tips verified as ancestors of main d0352d6; remote deletion guarded against concurrent updates. Ref recovery record: .git/branch-cleanup-2026-10-01.json.

- Main integration preflight: clean source branch, no upstream divergence, eight tests and TypeScript passed, conflict-free merge-tree check. No configured GitHub checks or main protection. Incoming history checked against known local secret values: zero matches. Integrated into main with a normal merge commit for PR #1; no force push or history rewrite. Application tree matches the tested feature branch; only this handoff record differs.

- Focused readability review: two fresh lenses, one pass, six medium/two low findings fixed. See docs/READABILITY_REVIEW.md. Team names lead, activity scores use /100, matching controls compare both organisations, evidence/source wording is accurate, own-contact drafts address contacts and clipboard errors stay in the dialog.
- Eight tests passed, TypeScript and Cloudflare build passed. Browser checked desktop layout, own and teammate draft recipients, copying, pending-match modal survival across refresh, identity comparison and live fictional-source labels.

- Added public /appendix and Appendix navigation tab: exact scoring formula, weights, label bands, team aggregation, limitations and four examples computed by scoreRelationship. Production build passed; deployed page visually checked, examples verified as 100 Strong / 53 Warm / 39 Cool / 12 Cold.

- Relationship cards now lead with the internal team member under “Relationship held by”, followed by the external contact and investor. Removed “How you know them”. Hosted Maya view verified with Alex and Jo routes for Luma; sharing remains enforced by the data layer. TypeScript and Cloudflare build passed for this update.

- Strict TypeScript Next.js App Router, Prisma schema with tenant IDs, local SQLite and Cloudflare D1 adapters.
- Fictional fixtures: 6 portfolio companies, 15 corporate investors, 60 contacts, 400 interactions, 4 partners. Real-user sharing defaults off; hosted fictional Alex/Sam/Jo configured as opted in via 0003_shared_demo_team.sql; expected groups 2 could use help / 4 well connected.
- Scoring, Dealroom-fixture fit evidence, route matching, tenant/partner visibility through lib/scope.ts. Five tests pass including firm separation, hidden contacts, sharing changes, match eligibility and deletion.
- Mock sign-in, three-step onboarding, sync, portfolio, company selection, scoring dialog, draft modal, matching controls and privacy UI. Latest cool-grey/Instrument Sans design supersedes Renascor.
- Local browser verified sign-in, connect/sync, portfolio groups and scoring dialog. Hosted browser verified sign-in, mock connect, sync (15 contacts / 100 events for Maya), portfolio groups and draft dialog.
- TypeScript and production OpenNext build passed. D1 migrations applied locally and remotely. Deployed version 0c84dee7-a4c1-424b-93f1-d88b8f10c2b8.
- Worker secrets contain fresh demo-only session/encryption keys; no real provider credentials uploaded. NEXTAUTH_URL set to the live origin. Preview URLs disabled.
- README has setup, deployment and demo walkthrough. .env.example has required provider slots. Git ignores generated builds, database files and secret files.

## Known Issues

- User purchased Workers Paid directly. Dashboard confirmed Paid is current; portfolio and scoring dialog passed live verification after the upgrade. Previous Free-plan CPU errors no longer reproduced in that check.

- Real HubSpot OAuth/sync and the NEW Dealroom corporate-investor adapter are not implemented; only mock data works. Google sign-in exists but lacks configured credentials and live verification. No real provider acceptance check is complete.
- UI/copy review is complete. Backend security review remains incomplete: invite-cookie consumption, GET mock-connect mutation and disconnect/sync races remain open. Mobile selection focus/scroll is implemented but was not tested in a resized browser. Do not claim production readiness.
- Public mock accounts share persistent fictional state. Visitors can change settings; no real CRM data should be loaded into this deployment.
- Email invitations are signed links plus a mailto draft, not automatic delivery. D1 native batches support atomic multi-step writes; Prisma interactive transactions are used only outside D1.
- Local .env.local retains a private Dealroom credential-file path but MOCK_MODE=true. No secrets were committed. Cloudflare secrets JSON and .dev.vars are ignored.
- Pre-existing shared memory/skills drafts were neither authored nor published by this session.

## Exact Next Steps

1. Iterate the live demo as directed. Workers Paid is active and the scoring appendix is deployed.
2. Collect feedback on the simpler live UI. No further readability work is pending from the completed focused pass.
3. Implement and verify real Dealroom corporate-investor enrichment and HubSpot OAuth/sync when requested; keep public demo fictional.
4. Resolve the remaining backend security findings before real-firm use, as directed.
