#!/usr/bin/env python3
"""Reset the deployed demo database through the admin-only API.

Examples:
    python scripts/demo_reset_remote.py --base https://saqta.onrender.com --scope all
    python scripts/demo_reset_remote.py --base https://saqta.onrender.com \
        --scope station --station-code arduino-bridge-01 --level 930
"""
import argparse
import sys

import httpx


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="https://saqta.onrender.com")
    parser.add_argument("--email", default="admin@saqta.kz")
    parser.add_argument("--password", default="admin123")
    parser.add_argument("--scope", choices=["all", "station"], default="all")
    parser.add_argument("--station-id", type=int)
    parser.add_argument("--station-code")
    parser.add_argument("--level", type=float, default=930.0)
    args = parser.parse_args()

    with httpx.Client(base_url=args.base.rstrip("/"), timeout=120.0) as client:
        login = client.post(
            "/api/auth/login",
            json={"email": args.email, "password": args.password},
        )
        if login.status_code != 200:
            print(f"Login failed: {login.status_code} {login.text[:200]}")
            return 1
        token = login.json()["access_token"]
        response = client.post(
            "/api/demo/reset",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "scope": args.scope,
                "station_id": args.station_id,
                "station_code": args.station_code,
                "level": args.level,
            },
        )
        print(response.status_code, response.text[:1000])
        return 0 if response.status_code == 200 else 1


if __name__ == "__main__":
    raise SystemExit(main())
