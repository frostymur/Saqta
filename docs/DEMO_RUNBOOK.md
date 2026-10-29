# Saqta.kz demo runbook

End-to-end demo: real Arduino cup sensor → public MQTT → backend → ML alert →
operator queue → map / logs / bulletin → network disconnect → offline state.

## 1. What the demo proves

1. A field device is paired with a station **by device code**, not by a
   hardcoded database id.
2. Raw telemetry arrives every few seconds and is visible in «Логи датчиков».
3. ML/rule engine turns the rise into a pending alert with explanation and
   +1/+2/+3 h forecast.
4. The operator approves it; the public feed, district statuses, map zones and
   bulletin update.
5. Pulling the cable/power publishes an MQTT Last Will; the station becomes
   «Нет связи» within ~8–15 seconds.

## 2. Hardware

| Item | Connection |
| :--- | :--- |
| Arduino Uno R3 + Ethernet W5100 | stacked |
| HC-SR04 | VCC 5V, GND, TRIG D6, ECHO D7 |
| DHT11/22 | VCC 5V, GND, DATA D2 + 10k pull-up |
| Status LED | D5 → 330 Ω → GND |

Arduino: the button adds a virtual **+60 cm** over 20 s, holds 90 s, then
resets. LMS-ESP32 v2: the same surge starts automatically 30 s after boot, no
button needed. It is marked as `demo_surge` in the payload.

### Alternative: LMS-ESP32 v2 (MicroPython)

If you use the LMS-ESP32 v2 instead of the Arduino Uno, the ready firmware is in
[`lms-esp32/`](../lms-esp32/). It uses the same station code, topics,
automatic 30-second surge and Last Will, but Wi-Fi instead of Ethernet and
3.3 V GPIO. **HC-SR04
ECHO must go through a 1k/2k divider** — see
[`lms-esp32/README.md`](../lms-esp32/README.md).

## 3. Broker and backend

The demo uses the public broker **`broker.hivemq.com:1883`**. No local broker
or Docker is required.

```bash
cd /home/timur/projects/saqta

export MQTT_ENABLED=true
export MQTT_HOST=broker.hivemq.com
export MQTT_PORT=1883
export MQTT_TOPIC='saqta/floodwatch/sko-demo/telemetry/#'
export MQTT_STATUS_TOPIC='saqta/floodwatch/sko-demo/status/#'

PYTHONPATH=. .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

For a deployed/Capacitor build, use the same env on the server and point the
app at the public API:

```bash
cd frontend
VITE_API_BASE=https://api.example.kz/api \
VITE_WS_URL=wss://api.example.kz/ws \
npm run cap:build
npx cap open android      # iOS platform requires macOS + Xcode
```

The web build keeps relative `/api` and `/ws` (Nginx proxy). Capacitor must
use full URLs because the app runs from `capacitor://localhost`.

## 4. Add the Arduino as a station

1. Open **Гидропосты → Добавить гидропост** as operator/admin.
2. Name: e.g. `Arduino — Гидропост Мост`.
3. **Код устройства**: `arduino-bridge-01` — must equal `STATION_CODE` in the
   sketch.
4. Region: `Петропавловск (СКО)`.
5. Pick the point on the map (or type coordinates). The backend checks that
   the point belongs to the selected region.
6. Thresholds: warning `940`, critical `980`, max rise `10`.
7. Save. The station appears immediately with «Нет связи / Нет данных».

Then flash/start the Arduino with:

```cpp
#define STATION_CODE "arduino-bridge-01"
#define MQTT_TOPIC_PREFIX "saqta/floodwatch/sko-demo"
```

The first telemetry message flips it to «В сети» and fills the card/chart.

## 5. Cup calibration

1. Sensor face-down above the cup. `H` = distance to cup bottom.
2. Set `SENSOR_MOUNT_HEIGHT_CM = H`.
3. Initial water depth `d`; `D_start = H - d`.
4. `STATION_DATUM_OFFSET_CM = 930 - H + D_start`.
5. Confirm the serial/API shows about `930 cm` (green, below warning).
6. Arduino: press the button. LMS: wait 30 s. Level ramps to about `990 cm` → high risk.

## 6. Scene script (≈6 minutes)

| Time | Action |
| :--- | :--- |
| 0:00 | Problem + architecture: device → public MQTT → backend → ML → operator |
| 1:00 | Map, station health, thresholds 940/980, bulletin |
| 2:00 | Arduino on table, serial monitor, «Логи датчиков» filtered to the station |
| 3:00 | Arduino button / LMS auto-surge: risk rises, red marker, red districts, operator toast |
| 3:30 | Queue: explanation, forecast, **Одобрить и опубликовать** |
| 4:15 | Public alert, «Журнал решений», updated bulletin |
| 4:45 | Pull Ethernet/power: station becomes offline in ~8–15 s, marker grays, toast |
| 5:15 | Reconnect / reset: station online, level returns to baseline |
| 5:45 | Close: pilot cost, integration with Kazhydromet/DChS, mobile apps |

## 7. Reset between rehearsals

Local SQLite:

```bash
.venv/bin/python scripts/demo_reset.py --code arduino-bridge-01 --level 930
```

Deployed Render/Postgres (admin-only API):

```bash
.venv/bin/python scripts/demo_reset_remote.py --scope all
# or only one station:
.venv/bin/python scripts/demo_reset_remote.py \
  --scope station --station-code arduino-bridge-01 --level 930
```

`--scope all` clears alerts/telemetry for every station and re-seeds the calm
baseline, keeping custom station codes. Station scope touches only that post.
The rest of the database and other regions stay intact.

If the station was not created yet, use `--station-id 3` for the seeded bridge
station.

## 8. Backup if hardware fails

Emulate the same code/namespace:

```bash
.venv/bin/python -m backend.mqtt_mock_publisher \
  --station-code arduino-bridge-01 \
  --prefix saqta/floodwatch/sko-demo \
  --interval 1 --scenario surge --start-level 930
```

`Ctrl+C` publishes a retained `offline` status (the same behaviour as the
Last Will), so the unhealthy-station scene still works.

## 9. Pre-demo checklist

- [ ] Backend is up with `MQTT_ENABLED=true` and the right topic prefixes.
- [ ] `mosquitto_sub -h broker.hivemq.com -t 'saqta/floodwatch/sko-demo/#' -v`
      shows telemetry and status.
- [ ] The station exists in the dashboard and shows «В сети».
- [ ] Baseline is ~930 cm, warning 940 / critical 980.
- [ ] Arduino button or LMS 30-second auto-surge works; LED is solid during surge.
- [ ] Operator logged in; queue and logs tabs open.
- [ ] Pulling the Ethernet cable produces «Нет связи» within ~15 s.
- [ ] `demo_reset.py` has been run after the last rehearsal.
- [ ] Laptop sleep/notifications disabled; projector zoom 100%.
- [ ] Backup mock publisher command and a spare cable are ready.
