> Historical plan. The mi-chi round-assembly spec in SPECS.md supersedes this introduction-routing sketch. See README.md for the implemented app.

# Initial build plan — 2026-10-01

## Product and audience

A graph-led fundraising workspace for venture builders and very early-stage investors supporting their portfolio companies. Reference user: a Zinc investment or portfolio support colleague. The job is to identify next-round investors, determine thesis/category fit, and find a credible person to ask for an introduction.

User flow: select company → set raise criteria → inspect target investor and route → confirm the connection → save target and copy an introduction brief.

## Proposed improvement on Harmonic

Harmonic already provides investor search by activity, stage, sector and network; its documentation also describes co-investment filters and warm paths. Warm introductions alone are not a new capability.

This prototype concentrates on the fundraising handoff for a PortCo: combine the supporting VC team's network, the founders' network and existing investors' network in one map; compare alternative routes; expose the evidence and missing link for each route; turn the selected route into an introduction task. This is a proposed focus, not a claim that Harmonic lacks these capabilities or that this prototype outperforms it.

Sources checked 2026-10-01: [Investor Search](https://support.harmonic.ai/en/articles/12111281-investor-search), [Harmonic About](https://harmonic.ai/about), [Dealroom OpenAPI](https://developers.beta.dealroom.co/openapi.yaml), [Dealroom Quickstart](https://developers.beta.dealroom.co/getting-started/quickstart).

## The first screen

- Compact company search and raise criteria above the map.
- Large graph canvas with the company in the centre, people and existing investors around it, and five target investor organisations toward the outside.
- Colour distinguishes entity type; line style and labels distinguish Dealroom facts, user-confirmed relationships, and suggested introduction routes.
- Selecting a target isolates its routes and opens an evidence panel with category/stage/geography fit, connector, connection basis, and next action.
- A small shortlist drawer preserves selected targets and introduction tasks.
- Zoom, pan, reset, readable labels, and a simple network-source filter support exploration. Avoid rendering every available company or person at once.

## 90-minute sequence

| Time | Build | Completion check |
| --- | --- | --- |
| 0–10 min | Verify live Dealroom access; inspect one company, its founders and backing, and one target investor's relationships. Confirm what the judges mean by using the graph. | One documented live relationship chain, or an explicit unresolved access gate. |
| 10–30 min | Build the polished graph interface with a small illustrative network. Include target selection, path highlighting, source/fit panel, and empty-route state. | The full interaction is usable and visibly marked illustrative. |
| 30–55 min | Connect bounded company/investor queries and available relationship sub-resources. Build nodes and edges from stable IDs; attach source evidence. | Selecting a company visibly changes the graph from live data. |
| 55–70 min | Add raise criteria, transparent fit evidence, manual relationship confirmation, target shortlist, and copyable introduction brief. | A user can go from a target to a named next action. |
| 70–82 min | Verify graph integrity and the browser flow; fix broken routes, missing fields, error states, and unreadable layouts. | Every displayed route follows real loaded edges and every unsupported fit claim is unknown. |
| 82–90 min | Rehearse a two-minute live demo and make the required demo URL or local run ready. | Company → fit → route → evidence → introduction brief completes without code edits. |

These are timeboxes, not promises of endpoint coverage. If live access stays blocked, continue the illustrative UI work but keep the live-data judging gate visibly incomplete. Public hosting is optional until the submission requirements are known; personal keys stay server-side.

## Technical choices

Use one interactive build session, with no agent fan-out. A short plan and project files provide sufficient state; a separate knowledge graph service would cost more setup time than this prototype needs.

Proposed stack: React + TypeScript + Vite for the UI, Cytoscape.js for the graph, and a small Node.js API server. Keep credentials server-side. Use an in-memory adjacency map for route traversal, and browser local storage for the prototype shortlist and user-entered relationships. Use synthetic personal contacts in a public demo. No LLM is required for the first route finder or brief; templates can produce the action text from known facts.

Graph contract:

- Nodes: company, person, investor organisation; stable provider IDs, deduplicated across paths. Specific investment vehicles can be added after their relationship coverage is verified.
- Edges: typed relationships, direction where meaningful, source reference, observed date, and confirmation status. Co-investment edges preserve the shared transaction as their evidence.
- Introduction routes: at most three intermediaries; label institutional connections as potential routes. An investment relationship does not establish that one named person knows another.
- Ranking: filter explicit incompatible raise criteria, then show evidence coverage and confirmed access separately. Historical sector/stage activity is evidence of fit, not a published future investment mandate. Total round size is not an investor's ticket size.
- Loading: fetch only the selected company and a bounded candidate set, pace below the supplied key's five requests/second limit, respect Retry-After, cache tokens, and label incomplete pages. No exhaustive export or crawl.

## Live-data gate

On 2026-10-01 OAuth authentication returned HTTP 200. Company requests from the official Python, Node.js and curl patterns all returned HTTP 403 with a Cloudflare HTML page headed `Attention Required!`. This rules out a Python-only failure; it does not establish an invalid key or insufficient scope. Ask the event API support team about the blocked API request if the documented path continues to fail; do not silently call fixtures live.

The official schema lists company team relationships, investor portfolio relationships, people/founder entities and transaction investors. Their schemas establish plausible inputs for the map, but actual key coverage and completeness still require live verification. There is no verified personal address book available through this setup.

## Demo and iteration

The demo starts from company search, not a hard-coded PortCo. Prepare one known example for rehearsal and optionally show a second company to demonstrate that the graph changes.

Narrative: “A company in our portfolio is raising. These investors have relevant activity. We can inspect routes through our team, founders and existing investors. This route has a confirmed connector; this other one needs checking. I save the target and copy the introduction brief.”

After the first usable screen, iterate on whether a viewer can identify an appropriate target and who to ask in under 30 seconds. After live integration, iterate on how convincing the fit and route evidence is. Measure actual time spent on finding five suitable targets and introduction routes before stating a time-saving figure.

The next iteration can add CRM/contact import and a portfolio view after the live company-to-introduction flow works. Decisions about those features stay outside the initial build.
