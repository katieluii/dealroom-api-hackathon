# Project Memory State

## Current Context

- New Dealroom London Hackathon project scaffold, modelled on the FEM-ME repository layout.
- Product concept and demo scope are not defined yet.

## Completed

- Created Python standard-library quickstart and public-repo-safe project structure.
- `python3 -m py_compile app/quickstart.py` passed on 2026-10-01.

## Known Issues

- Live API smoke test failed with `Dealroom connection failed: [Errno 8] nodename nor servname provided, or not known` because the host could not be resolved in this environment.
- GitHub CLI reports an invalid local token; browser GitHub session is signed in.
- Shared memory sync check failed to verify the remotes (GitHub DNS and `.git/FETCH_HEAD` access).

## Exact Next Steps

1. Create and publish the public `katieluii/dealroom-api-hackathon` repository from this scaffold.
2. Re-run `app/quickstart.py` with the local Dealroom credentials file when network access works.
3. Define the product problem, target user, demo flow, and success criterion in `SPECS.md`.
