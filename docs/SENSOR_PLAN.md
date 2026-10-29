# Sensor, Station Cost, and Partnership Plan

This document records the field-data requirements, indicative station costs, and the
integration strategy for existing hydrometeorological posts. It complements the software
in `backend/` and `frontend/`.

## 1. Minimum sensor set

| Parameter | Priority | Why | Example sensor | Target |
|---|---|---|---|---|
| Water level (stage) | Required | Primary flood indicator | Submersible pressure, ultrasonic, radar | ±1–3 cm |
| UTC timestamp | Required | Rate of rise needs accurate time | NTP / RTC / GPS | ±1 min |
| Station ID + coordinates | Required | Map and provenance | Config / GPS | Static |
| Battery, signal, sensor status | Required | Detect blind stations | Controller / modem | Every publish |
| Rate of rise | Derived | Leading indicator | Level + time | cm/h |
| Rainfall | High | Runoff driver | Tipping bucket | 0.2 mm |
| Soil moisture | High (rural) | Catchment saturation | Capacitive probe at 10/30/60 cm | ±3% |
| Water temperature | Medium | Ice and sensor compensation | Pt100 / DS18B20 | ±0.5 °C |
| Air temperature / humidity | Medium | Snowmelt | DHT22 / industrial | ±0.5 °C |
| Snow depth / SWE | High (north KZ) | Spring flood volume | Ultrasonic snow sensor / manual | ±1 cm |
| Camera image | High | Operator visual confirmation | ESP32-CAM / 4G camera | 1 image / 10–30 min |
| Velocity / discharge | Medium | Flow and hydraulic models | Doppler radar / impeller | ±5% |
| Tilt / vibration | Optional | Dam/levee integrity | Accelerometer | Event |
| Tamper / door | Optional | Theft detection | Reed switch | Event |

Outside the sensor, the ML model also needs upstream reservoir releases, rainfall forecasts,
historical level/flow series, official station datum, and historical flood labels.

## 2. Sampling and data quality

- Sample water level every 30–60 s; publish a 1-minute median every 5 minutes.
- Switch to 1-minute publishing when rise > 5 cm/h or the warning threshold is crossed.
- Store 1-minute raw data for 90 days and 5-minute aggregates for years.
- Use UTC and NTP/RTC time. Keep a `quality` flag (`ok`, `out_of_range`, `echo_timeout`,
  `low_battery`, `ice_suspected`, `calibration_drift`).
- Calibrate against a staff gauge and record the official station datum. Without the datum,
  centimetres cannot be compared with Kazhydromet thresholds.

## 3. MQTT payload

```json
{
  "station_id": 3,
  "water_level": 812.4,
  "rate_of_rise": 3.1,
  "rainfall": 0.0,
  "temperature": 12.5,
  "soil_moisture": 68.0,
  "battery_v": 12.4,
  "rssi_dbm": -71,
  "quality": "ok",
  "firmware": "1.0.0",
  "raw_distance_cm": 187.6
}
```

Topics: `floodwatch/telemetry/{station_id}`. The backend also accepts `station_id` inside the
payload and validates level (0–5000 cm), rainfall, soil moisture, and finite numbers.

## 4. Indicative station costs

Assumption: 1 USD ≈ 540 KZT, 2026, excluding VAT, customs, and permits. Obtain local quotes.

| Tier | Hardware | Installed | Use |
|---|---:|---:|---|
| Demo (Arduino R3 + JSN-SR04T + DHT22 + Ethernet) | $60–150 | same | Hackathon / demo only |
| Pilot (ESP32/RTU, industrial sensor, solar, 4G, IP66) | $450–1,100 | $650–1,500 | Real urban/river pilot |
| Reference (radar/pressure, dual comms, camera, certified) | $2,000–5,500 | $2,500–6,500 | Official-grade comparison |
| Retrofit of an existing post | $250–700 | $350–1,000 | Best value |

Typical annual operating cost: **$250–700 per station** (SIM, maintenance, calibration, spares,
cloud share). First-year permits, certification, customs, and winter access can add 30–100%.

### Petropavlovsk pilot budget

- 3 retrofits of existing posts: $1,500–3,000
- 4–6 new urban sensors: $3,000–7,000
- 1 reference station: $2,500–4,000
- Backend/cloud, integration, training: $2,000–5,000
- Contingency 15%: $1,500–3,000

**Year 1: ≈$12,000–22,000 (6.5–12M KZT). 5-year TCO: ≈$30,000–50,000.**

Local price references:

- OWEN PD100I submersible pressure sensor: 157,990–193,004 KZT
  (<https://aketo.kz/owen/pd100i-dg-167>).
- DFRobot 0–5 m IP68 pressure sensor: $43.90
  (<https://www.dfrobot.com/product-1863.html>).
- HOBO cellular water-level station: from $850
  (<https://www.onsetcomp.com/products/data-loggers/rx2100-wl>).
- Integrated solar hydrological station: $1,550–5,300
  (<https://www.instrumenthive.com/products/osen-bljs-36-integrated-hydrological-monitoring-station-river-urban-rainfall-water-level-surveillance/>).

## 5. Partnership with existing stations

Kazhydromet operates **442 hydrological posts** (394 river, 38 lake, 10 sea), but routine
observations are only twice per day
(<https://www.kazhydromet.kz/en/gidrologiya/o-gidrologii>). In 2025 it added 31 level posts on
dangerous sections and plans 42 more under the 2024–2030 water management concept
(<https://ortcom.kz/en/novosti/1740142575>). The gap is real-time telemetry, not station count.

| Partner | What they provide | What we provide |
|---|---|---|
| Kazhydromet (central + SKO branch) | History, datum, calibration, co-location permission | Real-time telemetry, dashboard/API, validation report |
| DChS / MChS | Operator workflow, alert confirmation, 112 dissemination, flood labels | Pending-alert queue, operator console, audit log |
| Akimat of SKO / Petropavlovsk | Funding, permits, installation access, shelters | City flood dashboard, district warnings |
| Kazvodkhoz / reservoir operators | Release schedules, dam data | Downstream impact visualization |
| Universities (NKU, NU, KBTU, Satbayev) | Calibration, field teams, ML validation | Real datasets, thesis topics |
| Telecoms (Beeline, Kcell) | NB-IoT/M2M SIMs | Pilot reference |
| World Bank, UNDP, ADB, USAID, WMO, SAPPHIRE | Grants, standards, credibility | Measured pilot results |

### Recommended models (cheapest first)

1. **Data exchange only** — use their history and twice-daily data for ML; publish a
   supplementary real-time layer.
2. **Retrofit/co-location** — add telemetry to 2–4 existing posts. Costs $350–1,000 per post
   instead of building a new station.
3. **Joint pilot with akimat funding** — akimat funds hardware; we provide integration and
   dashboard.
4. **Sponsored stations** — a company or akimat sponsors a station for $500–1,500/year.

### What to ask for

- Station registry: coordinates, official datum, thresholds, sensor types, data format.
- Historical level/flow/ice data (ideally 10+ years).
- Permission to co-locate a telemetry box at 2–3 posts.
- Calibration and quality-control procedure.
- Alert dissemination protocol and contact person.
- A short MOU / data-sharing agreement for the pilot.

### What to offer

- Free real-time dashboard and API during the pilot.
- 2–3 retrofitted stations at our cost.
- A 3-month parallel-run validation report: uptime, accuracy vs. manual readings, false alarms.
- Operator training and documentation.
- Open data, no vendor lock-in.
- Clear positioning: decision support, not a replacement for official Kazhydromet/MChS warnings.

## 6. Suggested sequence

1. **Weeks 1–2:** letter of interest to Kazhydromet SKO, DChS SKO, and Petropavlovsk akimat.
2. **Weeks 3–6:** select 2 existing posts (bridge, Zarechny or Pokrovka) + 2 urban sensors;
   sign a simple pilot/data-sharing agreement.
3. **Months 2–4:** parallel run against manual observations; measure uptime and drift.
4. **Month 5:** publish the validation report; propose 10–15 stations.
5. **Months 6–12:** apply for akimat budget or a donor grant; integrate into the DChS workflow.

## 7. Caveats

- Prices are indicative 2026 estimates, not quotes.
- Official measurements may require metrological certification; plan time and budget for it.
- Official warning authority remains with Kazhydromet and MChS.
- The demo MQTT configuration allows anonymous access. Production must add TLS, credentials,
  and signed firmware.
