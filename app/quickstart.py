"""Run the official Dealroom first request without printing credentials or tokens."""

import json
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


TOKEN_URL = "https://accounts.dealroom.co/oauth/token"
API_URL = "https://api.beta.dealroom.app/data/companies"


def read_env(path):
    values = {}
    for raw_line in Path(path).read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def get_json(request):
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 app/quickstart.py /absolute/path/to/credentials.env")
    env = read_env(sys.argv[1])
    client_id = env.get("DEALROOM_CLIENT_ID")
    client_secret = env.get("DEALROOM_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise SystemExit("Credentials file must contain DEALROOM_CLIENT_ID and DEALROOM_CLIENT_SECRET")

    token_request = Request(
        TOKEN_URL,
        data=json.dumps({
            "client_id": client_id,
            "client_secret": client_secret,
            "audience": "https://api.beta.dealroom.app",
            "grant_type": "client_credentials",
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    token = get_json(token_request)["access_token"]
    query = urlencode({
        "sort": "-latest_valuation",
        "limit": 10,
        "include_total": "true",
        "filter": "and(classification[in_any]:vc_backed,launch_date[gte]:2020)",
    })
    data = get_json(Request(
        API_URL + "?" + query,
        headers={
            "Authorization": "Bearer " + token,
            "X-Client-Id": client_id,
            "User-Agent": "dealroom-api-hackathon/0.1",
        },
    ))
    rows = data.get("data", [])
    print("| Company | HQ country | Latest valuation (USD) |")
    print("| --- | --- | ---: |")
    for company in rows:
        valuation = company.get("latest_valuation") or {}
        amount = valuation.get("value")
        amount_text = f"{amount:,.0f}" if isinstance(amount, (int, float)) else "—"
        name = str(company.get("name") or "—").replace("|", "\\|")
        country = str(company.get("hq_country") or "—").replace("|", "\\|")
        print(f"| {name} | {country} | {amount_text} |")
    if len(rows) != 10:
        raise SystemExit(f"Expected 10 companies; received {len(rows)}")


if __name__ == "__main__":
    try:
        main()
    except HTTPError as error:
        raise SystemExit(f"Dealroom HTTP {error.code}; check key, scope, and rate limit")
    except URLError as error:
        raise SystemExit(f"Dealroom connection failed: {error.reason}")
