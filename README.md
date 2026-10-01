# Mi-Chi

Find the people your team knows at potential strategic investors for your portfolio.

## Demo

[Open Mi-Chi](https://mi-chi-demo.katieluikakiu.workers.dev)

The hosted demo uses Cloudflare Workers and D1. All companies, investors, contacts and activity are fictional. Choose one of four partners, connect the simulated HubSpot account, sync, then open the portfolio.

The dataset has 6 portfolio companies, 15 corporate investors, 60 contacts and 400 interactions. New users default to sharing off. In the hosted fictional scenario, Alex, Sam and Jo have sharing enabled so the team view is visible. Demo accounts share persistent state, so another visitor can change their settings.

### 60-second walkthrough

1. Continue as Maya Chen; connect demo HubSpot, start sync, open portfolio.
2. Select Luma Photonics. Read the investor fit and interaction evidence.
3. Click “Activity score” to see the four components. The Appendix tab gives the full formula, thresholds, worked examples and limitations.
4. Open “Draft intro request”, copy the draft, close it. Nothing is sent.
5. Compare Helio Fusion under “Could use help”.
6. Open Privacy to change sharing or hide a contact. Sign out and choose another partner to see the changed visibility.

## Local setup

Requires Node 22 and npm.

```sh
npm install
cp .env.example .env.local
# Fill NEXTAUTH_SECRET and ENCRYPTION_KEY with random values; keep MOCK_MODE=true.
# DATABASE_URL=file:./dev.db and NEXTAUTH_URL=http://127.0.0.1:3000
npm run db:setup
npm run seed
npm run dev
```

Generate secrets with `openssl rand -hex 32` (run once per key). `ENCRYPTION_KEY` must be 64 hex characters. Never commit `.env.local`.

```sh
npm test
npm run typecheck
npm run check:mock
npm run build
```

The canonical Prisma schema uses Postgres. `scripts/database.mjs` derives a SQLite schema for a `file:` DATABASE_URL. Cloudflare uses Prisma's D1 adapter; multi-statement imports/deletions use D1 batches because D1 does not support Prisma interactive transactions.

## Cloudflare

Next.js was upgraded to **15.5.27** with approval to use a patched release and the current OpenNext adapter. D1 was explicitly approved for the demo.

```sh
npx wrangler login --scopes account:read user:read workers_scripts:write d1:write
npx wrangler d1 migrations apply mi-chi-demo --remote
npm run cf:build
npm run cf:deploy
```

Set `NEXTAUTH_SECRET` and `ENCRYPTION_KEY` using Wrangler secrets. Set `NEXTAUTH_URL` in `wrangler.jsonc` to the deployed HTTPS origin. For local Workers preview, put fresh secrets and `NEXTAUTH_URL=http://127.0.0.1:8787` in ignored `.dev.vars`, run D1 migrations with `--local`, then `npm run cf:preview`.

The deployed Worker uses `MOCK_MODE=true`. No live HubSpot, Google or Dealroom credentials are uploaded. `prisma/d1-migrations/0002_mock.sql` contains fictional fixtures only; do not apply it to a live customer database.

## Current boundaries

- Working mock sign-in, onboarding, portfolio, matching controls, scoring modal, draft copying and privacy controls.
- Database reads go through `lib/scope.ts`; tests cover firm separation, sharing off, hidden contacts, match eligibility and deletion.
- Google sign-in code exists but has not been tested with configured credentials. Microsoft is a TODO.
- Real HubSpot OAuth/sync and the new Dealroom strategic-investor adapter are not yet implemented. Their live acceptance checks remain incomplete. Real sync currently returns an explicit setup error.
- Invitations create a signed link and open an email draft. Automatic email delivery is not configured.
- The score out of 100 ranks recorded activity; it is not a likelihood of securing an introduction. Email directions provide a two-way activity proxy, not proof of individual replies.
- A focused UI/copy red-team pass was completed; see docs/READABILITY_REVIEW.md. This demo has not passed a completed production security review.
- TODO: confirm Dealroom commercial redistribution terms before using real investor data in a customer product.

Required future provider slots are in `.env.example`: Google OAuth, HubSpot OAuth client/secret/redirect, Dealroom key/base URL. Exact live HubSpot scopes and API behavior must be verified when implementing the connector; this demo does not request HubSpot access.
