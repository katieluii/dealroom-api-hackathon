# Specifications

## Project brief

- Event: Dealroom London Hackathon.
- Product: relationship mapping for VCs and venture builders supporting PortCo fundraising.
- Target user, demo flow, and acceptance criteria: defined in the dated spec below.
- First technical gate: the official quickstart returns ten companies using the personal key.

## Feature contracts

See the initial fundraising relationship map contract below.

## Fundraising relationship map — initial spec (2026-10-01)

**Goal:** Help an investment or portfolio support colleague at a venture builder such as Zinc find suitable next-round investors and credible introduction routes for a portfolio company.

**Why:** Replace the repeated work of researching investor fit, asking colleagues and founders who knows whom, and preparing introduction requests.

**Build window:** 90 minutes. This is a prototype contract, ready for iteration; implementation has not started.

**Agreed direction:** The graph is the primary interface. The product works with a user-selected company rather than a single hard-coded PortCo. It combines the VC team, PortCo founders, and existing investors. Fit and access remain separate. A Dealroom connection is not confirmation of a warm personal relationship.

**Acceptance criteria (EARS):**

1. WHEN a user searches for and selects a company, the system shall use that company's stable Dealroom UUID as the focus of the workspace.
2. WHEN a user supplies category, round stage, and geography, the system shall produce candidate investors with the evidence used for each fit dimension.
3. IF an investor fit dimension has insufficient evidence, THEN the system shall label that dimension unknown.
4. WHEN results load, the system shall display a relationship graph containing the selected company, people, existing investors, and candidate investor organisations.
5. The system shall label each relationship by its actual meaning, including founder, team member, investment, co-investment, or user-recorded contact.
6. WHEN a user selects a target investor, the system shall highlight up to three introduction routes through the VC team, founders, or existing investors.
7. WHEN a user inspects a route, the system shall show the source, retrieval or recording date, and confirmation status for each relationship in that route.
8. IF no route exists in the loaded data, THEN the system shall report no route found in the loaded network.
9. WHEN a user confirms or adds a personal contact relationship, the system shall update the graph without changing the source facts from Dealroom.
10. WHEN a user saves a target, the system shall record the target investor, chosen route, person to ask, and next action in a local shortlist.
11. WHEN a user requests an introduction brief, the system shall generate a copyable brief using the selected company, investor fit evidence, and route.
12. IF the API request fails, THEN the system shall show the failure and offer an explicitly labelled illustrative example.
13. The system shall keep credentials and private relationship inputs on the server or local device as appropriate, outside the public repository.
14. WHILE the default graph is displayed, the system shall show at most five target investors and 35 nodes before user expansion.
15. WHEN the live demonstration is run, the system shall visibly retrieve fresh company and investor or transaction data from Dealroom.

**Out of scope for this 90-minute build:** Email, LinkedIn or CRM integrations; automatic outreach; background monitoring; full investment memos; custom model training; a separate graph database; exhaustive network crawling; production team permissions. Personal network inputs are manual and optional in the first prototype. No private Zinc data is required or published.

**Open questions:** Which official graph/relationship capability the judges specifically require; accessible relationship endpoint coverage under the supplied key; how the Dealroom Cloudflare block will be resolved; exact end time and demo submission format.

**Verification:** (1–3) one live company and investor search with filter evidence and an unknown-field case; (4–8,14) browser inspection of a connected route, shared intermediaries, duplicate entities, and a disconnected target; (9–11) add a contact, save a route, reload local shortlist, and copy its brief; (12) force an API failure and inspect the visible mode label; (13) inspect tracked files and server/client credential boundaries; (15) run the complete demo with API timestamps and source evidence. Compare the task of finding five suitable targets and routes against a manual baseline before claiming time savings.

## Roundtable superseding build contract — 2026-10-01

The user's supplied Roundtable spec supersedes the individual-investor Relay plan. Unit: one round with a lead, two followers, and one strategic. Required stack: Next.js 14 App Router, TypeScript, Tailwind, react-force-graph-2d, Anthropic SDK tool use, and in-memory state with JSON cache. Build checkpoints: fixtures, explainable pure engine and tests, graph/card UI, tool-use chat, real Dealroom adapter, export and polish. Model fallback is configurable `claude-sonnet-4-6`. Missing Anthropic key uses visibly scripted demo commands; this does not count as verified Claude tool use. Dealroom failures show explicit mock/cache mode. User authorised implementation and subsequently requested red-team and frontend-design reviews with fixes.

## mi-chi style and copy, 2026-10-01

Product name: mi-chi. Renascor visual style requested: white background, ink #101512, gold #C9A227, Georgia Regular main heading, Helvetica Neue body, square panels. Remove slogans, duplicate instructions and decorative glyphs. Preserve mock/live labels, evidence, conflicts and actionable errors. Run anti-ai-code, anti-ai-writing, frontend-design and an inline red-team review. Broader company sourcing and personal introduction mapping remain outside this round-assembly prototype.

## Strategic CRM routes, superseding round assembly (2026-10-01)

Goal: let an early-stage deeptech VC firm see its strongest permitted routes to corporate venture investors for each portfolio company.

1. All tenant data reads/writes shall pass through lib/scope.ts using the authenticated user's firm; cross-firm IDs shall not return data.
2. Users shall see their own relationships and only explicitly shared, non-hidden colleague relationships; sharing defaults off.
3. Tokens shall be encrypted with AES-256-GCM; contact bodies, notes and transcripts shall never be requested or stored.
4. Mock fixtures shall contain six companies, fifteen corporate investors, sixty contacts and four hundred interactions across four partners.
5. Scoring shall use twelve months of permitted metadata and return components, counts and dates; the initial demo shall show two companies needing help and four well connected.
6. Only confirmed or non-rejected domain matches to Dealroom corporate candidates with overlapping sectors shall count as routes.
7. Selecting a company shall update routes; scoring and copyable intro-draft modals shall work without sending messages.
8. Mock sign-in and three-step onboarding shall lead to the portfolio screen before live integration work starts.
9. Live Google and per-user HubSpot OAuth shall use server-side credentials and verified scopes, with visible errors and cache fallback.
10. Disconnect shall remove the user's CRM tokens, interactions, owned contacts/matches and hidden-contact records.
11. UI shall use Instrument Sans, #EEF1F5, minimum14px type and44px controls, visible focus, named labels and the required metadata privacy statement.

Out of scope: previous lead/follower/strategic round assembly, Gmail, Calendar, Slack, automatic intro sending, LLM chat.

Verification: pure score tests, real SQLite scope/sharing tests, browser sign-in/onboarding/selection/modals/copy/privacy flow, typecheck and production build; live OAuth tests require configured provider credentials. Checkpoints are confirmed by executable results rather than repeated permission questions, as requested.

Decisions: sectors are JSON string arrays for SQLite/Postgres parity. Firm's firmId equals its id. Invitation email uses a generated signed link and mailto draft until a delivery provider is configured (TODO); joining requires the invited verified Google email. Email direction provides an inbound/outbound response proxy, not proof that a specific message received a reply; evidence states counts directly. Portfolio scores are rankings expressed as percentages, not probabilities. Footer counts use the actual threshold rather than claiming all omitted routes are under35.

## 2026-10-01 — Cloudflare demo deployment

- User approved Cloudflare D1 for the demo and a patched Next.js 15 upgrade for adapter compatibility and security fixes.
- Deploy fictional data only on Workers with the D1 Prisma adapter. Keep secrets server-side in Worker secrets.
- Verify hosted sign-in, mock onboarding/sync, portfolio selection, scoring modal and draft copying.
- User paused red-team work; complete deployment first. Live provider integrations and the unfinished review remain open.
