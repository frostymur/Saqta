#!/usr/bin/env python3
"""End-to-end smoke test for the Saqta.kz dashboard backend.

Usage:
    .venv/bin/python scripts/smoke_test.py
    .venv/bin/python scripts/smoke_test.py --base http://localhost:8000 --approve

By default the test is read-only. --approve publishes the newest pending alert
and verifies it appears in the public feed.
"""

import argparse
import sys

import httpx


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:8000")
    parser.add_argument("--approve", action="store_true")
    args = parser.parse_args()

    base = args.base.rstrip("/")
    client = httpx.Client(base_url=base, timeout=15.0)
    failures: list[str] = []

    def check(name: str, condition: bool, detail: str = "") -> None:
        mark = "PASS" if condition else "FAIL"
        print(f"[{mark}] {name}{f': {detail}' if detail else ''}")
        if not condition:
            failures.append(name)

    try:
        health = client.get("/api/health")
        check("health", health.status_code == 200, str(health.status_code))

        login = client.post(
            "/api/auth/login",
            json={"email": "operator@saqta.kz", "password": "oper123"},
        )
        check("operator login", login.status_code == 200, str(login.status_code))
        if login.status_code != 200:
            return 1
        token = login.json()["access_token"]
        auth = {"Authorization": f"Bearer {token}"}

        me = client.get("/api/auth/me", headers=auth)
        check("auth/me operator", me.status_code == 200 and me.json()["role"] == "operator")

        stations = client.get("/api/stations", params={"region": "Петропавловск (СКО)"})
        check("stations region filter", stations.status_code == 200 and len(stations.json()) > 0)
        station_list = stations.json()
        if not station_list:
            return 1
        station = station_list[0]
        station_id = station["id"]
        check(
            "stations health field",
            all(
                item.get("health") in {"online", "stale", "offline", "error"}
                for item in station_list
            ),
        )
        check(
            "stations device code field",
            all("code" in item for item in station_list),
        )

        unknown_code = client.post(
            "/api/telemetry",
            json={"station_code": "missing-device-code", "water_level": 900.0},
        )
        check(
            "telemetry rejects unknown device code",
            unknown_code.status_code == 404,
            str(unknown_code.status_code),
        )

        bad_station = {
            "name": "Smoke test station",
            "region": station["region"],
            "lat": 51.16,
            "lng": 71.43,
            "hazard_type": "flood",
            "status": "active",
            "thresholds": {
                "warn_level": 900,
                "crit_level": 980,
                "max_rate_of_rise": 10,
            },
        }
        denied = client.post("/api/stations", json=bad_station)
        check("station create requires auth", denied.status_code == 401)
        wrong_region = client.post("/api/stations", json=bad_station, headers=auth)
        check(
            "station create validates region",
            wrong_region.status_code == 422,
            str(wrong_region.status_code),
        )

        for range_name in ("24h", "7d", "30d"):
            series = client.get(
                f"/api/telemetry/{station_id}/series", params={"range": range_name}
            )
            ok = series.status_code == 200 and len(series.json().get("points", [])) > 0
            check(f"telemetry series {range_name}", ok, str(series.status_code))

        outlook = client.get(f"/api/outlook/{station_id}")
        check(
            "outlook 48h",
            outlook.status_code == 200 and outlook.json().get("horizon_hours") == 48,
            str(outlook.status_code),
        )

        prediction = client.get(f"/api/ml/predict/{station_id}")
        check(
            "ml prediction",
            prediction.status_code == 200
            and prediction.json().get("risk_level") in {"low", "medium", "high"},
        )

        pending = client.get("/api/alerts", params={"status": "pending"}, headers=auth)
        check("operator pending alerts", pending.status_code == 200)
        pending_alerts = pending.json() if pending.status_code == 200 else []

        public = client.get("/api/alerts/public")
        check("public alerts", public.status_code == 200)
        public_alerts = public.json() if public.status_code == 200 else []
        check(
            "public feed only published",
            all(a.get("status") == "published" for a in public_alerts),
        )

        raw_telemetry = client.get(f"/api/telemetry/{station_id}", params={"hours": 720})
        check(
            "station journal raw telemetry",
            raw_telemetry.status_code == 200 and len(raw_telemetry.json()) > 0,
            str(raw_telemetry.status_code),
        )

        station_events = client.get(
            "/api/alerts", params={"station_id": station_id, "limit": 20}, headers=auth
        )
        check("station journal events", station_events.status_code == 200)

        telemetry_log = client.get(
            "/api/telemetry/log", params={"hours": 24, "limit": 5, "station_id": station_id}
        )
        log_rows = telemetry_log.json() if telemetry_log.status_code == 200 else []
        check(
            "sensor log station filter",
            telemetry_log.status_code == 200
            and len(log_rows) > 0
            and all(row.get("station_id") == station_id for row in log_rows)
            and all(row.get("station_name") for row in log_rows),
            str(telemetry_log.status_code),
        )

        region_log = client.get(
            "/api/telemetry/log",
            params={"hours": 24, "limit": 1000, "region": station["region"]},
        )
        region_rows = region_log.json() if region_log.status_code == 200 else []
        check(
            "sensor log region filter",
            region_log.status_code == 200
            and len(region_rows) > 0
            and all(row.get("station_region") == station["region"] for row in region_rows),
            str(region_log.status_code),
        )

        geo = client.get("/api/geo/validate")
        check(
            "geo validation 13/13",
            geo.status_code == 200 and geo.json().get("mismatch_count") == 0,
            str(geo.status_code),
        )

        bulletin = client.get("/api/reports/dchs-bulletin")
        national_ok = bulletin.status_code == 200 and bulletin.json().get("region") is None
        check("national bulletin", national_ok, str(bulletin.status_code))

        regional = client.get(
            "/api/reports/dchs-bulletin", params={"region": "Петропавловск (СКО)"}
        )
        regional_stations = regional.json().get("stations", []) if regional.status_code == 200 else []
        check(
            "regional bulletin filtered",
            regional.status_code == 200
            and regional_stations
            and all(s["region"] == "Петропавловск (СКО)" for s in regional_stations),
            str(regional.status_code),
        )

        stats = client.get("/api/alerts/stats", headers=auth)
        check("operator stats", stats.status_code == 200 and "pending" in stats.json())

        log = client.get("/api/alerts/log", headers=auth)
        check("operator decision log", log.status_code == 200)

        if args.approve and pending_alerts:
            target = max(pending_alerts, key=lambda a: (a["risk_score"], a["id"]))
            decision = client.patch(
                f"/api/alerts/{target['id']}/decision",
                json={"action": "approve", "processed_by": "smoke-test"},
                headers=auth,
            )
            check("approve pending alert", decision.status_code == 200, str(decision.status_code))
            after = client.get("/api/alerts/public").json()
            check(
                "approved alert is public",
                any(a["id"] == target["id"] for a in after),
            )
        elif args.approve:
            print("[SKIP] no pending alerts to approve")

        for path in ("/api/alerts?status=pending", "/api/alerts/stats", "/api/alerts/log"):
            unauth_list = client.get(path)
            check(f"operator endpoint requires auth: {path}", unauth_list.status_code in {401, 403}, str(unauth_list.status_code))

        unauth = client.patch(
            "/api/alerts/1/decision", json={"action": "approve"}
        )
        check("decision requires auth", unauth.status_code in {401, 403}, str(unauth.status_code))

    except httpx.HTTPError as exc:
        print(f"[FAIL] request error: {exc}")
        return 1
    finally:
        client.close()

    if failures:
        print(f"\n{len(failures)} check(s) failed: {', '.join(failures)}")
        return 1
    print("\nAll smoke checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
