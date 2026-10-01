# Project Memory State

## Current Context

- Mi-Chi is now a strategic-investor relationship demo for early-stage deeptech VC portfolios. The previous round-builder is superseded (checkpoint ef422f3).
- Live: https://mi-chi-demo.katieluikakiu.workers.dev . Cloudflare Worker mi-chi-demo, D1 database 3390c21c-553e-4d00-9513-17911c912bdb, personal Cloudflare account 325cee91a2a8d96b12227b5370f01464.
- Branch codex/strategic-crm; public repo katieluii/dealroom-api-hackathon. Remote main remains 8ff8985 (fetched 2026-10-01).
- User approved D1 and patched Next.js 15 (15.5.27), then explicitly paused red-team work to prioritize deployment. Do not resume that review without further direction.

## Completed

- Relationship cards now lead with the internal team member under “Relationship held by”, followed by the external contact and investor. Removed “How you know them”. Hosted Maya view verified with Alex and Jo routes for Luma; sharing remains enforced by the data layer. TypeScript and Cloudflare build passed for this update.

- Strict TypeScript Next.js App Router, Prisma schema with tenant IDs, local SQLite and Cloudflare D1 adapters.
- Fictional fixtures: 6 portfolio companies, 15 corporate investors, 60 contacts, 400 interactions, 4 partners. Real-user sharing defaults off; hosted fictional Alex/Sam/Jo configured as opted in via 0003_shared_demo_team.sql; expected groups 2 could use help / 4 well connected.
- Scoring, Dealroom-fixture fit evidence, route matching, tenant/partner visibility through lib/scope.ts. Five tests pass including firm separation, hidden contacts, sharing changes, match eligibility and deletion.
- Mock sign-in, three-step onboarding, sync, portfolio, company selection, scoring dialog, draft modal, matching controls and privacy UI. Latest cool-grey/Instrument Sans design supersedes Renascor.
- Local browser verified sign-in, connect/sync, portfolio groups and scoring dialog. Hosted browser verified sign-in, mock connect, sync (15 contacts / 100 events for Maya), portfolio groups and draft dialog.
- TypeScript and production OpenNext build passed. D1 migrations applied locally and remotely. Deployed version 2c7e9f24-3c48-4c70-a0dc-5338d79415a2.
- Worker secrets contain fresh demo-only session/encryption keys; no real provider credentials uploaded. NEXTAUTH_URL set to the live origin. Preview URLs disabled.
- README has setup, deployment and demo walkthrough. .env.example has required provider slots. Git ignores generated builds, database files and secret files.

## Known Issues

- Real HubSpot OAuth/sync and the NEW Dealroom corporate-investor adapter are not implemented; only mock data works. Google sign-in exists but lacks configured credentials and live verification. No real provider acceptance check is complete.
- Red-team review is unfinished and paused by user. Early static observations remain open: mixed-sector fit wording, pending-match modal refresh, rejected-company recovery, self-addressed introduction drafts, clipboard error placement, invite-cookie consumption, GET mock-connect mutation, and disconnect/sync races. Do not claim production readiness.
- Public mock accounts share persistent fictional state. Visitors can change settings; no real CRM data should be loaded into this deployment.
- Email invitations are signed links plus a mailto draft, not automatic delivery. D1 native batches support atomic multi-step writes; Prisma interactive transactions are used only outside D1.
- Local .env.local retains a private Dealroom credential-file path but MOCK_MODE=true. No secrets were committed. Cloudflare secrets JSON and .dev.vars are ignored.
- Pre-existing shared memory/skills drafts were neither authored nor published by this session.

## Exact Next Steps

1. Iterate the hosted demo based on user feedback. Choose a fictional partner; Maya has completed onboarding during verification.
2. Implement and verify real Dealroom corporate-investor enrichment and HubSpot OAuth/sync when requested; keep public demo fictional.
3. Resume the paused review only when requested, resolving recorded findings before real-firm use.
