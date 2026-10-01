# Dealroom API Hackathon

A working home for a Dealroom London Hackathon project. The product concept and demo are still to be defined.

## Quickstart

Requires Python 3.9 or later. Use the personal credentials file supplied by Dealroom; keep it outside this public repository.

```bash
python3 app/quickstart.py /absolute/path/to/dealroom-katie-lui.env
```

The script requests an access token and prints the ten companies from the [Dealroom quickstart](https://developers.beta.dealroom.co/getting-started/quickstart) as a table. It does not save the token or response. Every data request sends both `Authorization: Bearer` and `X-Client-Id`.

## Project map

| Path | Purpose |
| --- | --- |
| `app/` | Prototype and API code |
| `docs/` | Product context, decisions, architecture, demo notes |
| `research/` | Public sources and analysis notes |
| `deck/` | Pitch material |
| `SPECS.md` | Testable feature decisions |
| `AI_STATE.md` | Current project handoff |

## Data rules

Dealroom's API is for this hackathon project under the terms supplied with the key. Keep credentials and bulk data out of Git. For any published count, chart, or ranking, record the population, filters, geographic attribution, tag family, date, and pagination. VC funding and valuation views have different default exclusions; use the Dealroom analyst note supplied with the key before publishing a number.

## Next step

Choose a specific user problem and demo flow, then record the implementation contract in `SPECS.md`.
