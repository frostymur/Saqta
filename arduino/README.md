# FloodWatch field station (Arduino Uno + Ethernet)

Demo hardware integration for **Saqta.kz**: a small river gauge that measures
water level with an ultrasonic sensor and publishes telemetry to the backend
over MQTT. It is a showcase prototype, **not** certified hydrological or
life-safety equipment.

The sketch is in [`floodwatch_station/floodwatch_station.ino`](floodwatch_station/floodwatch_station.ino).
It publishes to `saqta/floodwatch/sko-demo/telemetry/<STATION_CODE>`, which the
backend bridge consumes. Add a station in the dashboard with the same device
code (for example `arduino-bridge-01`) and it starts accepting this device
immediately — no database id needs to be flashed into the board.

What it does:

- Samples the HC-SR04 once per second and keeps a 5-sample moving average.
- Publishes every 5 seconds (every 2 seconds during the demo surge) as a single-line JSON message.
- Computes `rate_of_rise` (cm/h) over a rolling 5-minute window with a
  1 cm noise gate, clamped to ±100 cm/h.
- Skips publishing and blinks the status LED when the echo times out or the
  distance/level is outside the configured plausibility range.
- Reads air temperature from a DHT11 (or DHT22 with one `#define`).
- Has disabled-by-default hooks for analog rain and soil-moisture sensors.
- Reconnects Ethernet and MQTT on failure using `millis()` timers, without
  blocking forever. Serial diagnostics run at **115200 baud**.

## Bill of materials

| Item | Qty | Notes |
| :--- | :-- | :---- |
| Arduino Uno R3 (ATmega328P, 5 V) | 1 | Genuine or good clone; CH340 clones need a driver |
| Ethernet W5100 shield | 1 | Stacks on the Uno; W5500 also works with the Ethernet library |
| HC-SR04 ultrasonic sensor | 1 | Indoor/protected use only — **not waterproof** |
| JSN-SR04T waterproof ultrasonic sensor | optional | Recommended for a real outdoor installation |
| DHT11 or DHT22 | 1 | DHT22 is more accurate and has a wider range |
| 10 kΩ resistor | 1 | Pull-up on the DHT data line |
| 5 mm LED + 330 Ω resistor | 1 | Status/fault indicator |
| Breadboard, dupont wires, or perfboard | 1 | Prefer soldered connections outdoors |
| 5 V regulated supply, ≥ 1 A | 1 | Uno + shield + sensors draw ~200–300 mA |
| IP65 enclosure, cable glands, desiccant | 1 | For any outdoor deployment |
| USB cable | 1 | Flashing and serial monitor |
| Analog rain sensor module | optional | Enable with `RAIN_SENSOR_ENABLED` |
| Capacitive soil-moisture probe | optional | Enable with `SOIL_SENSOR_ENABLED` |

## Wiring

The Ethernet shield occupies the SPI pins and the card-select pins. Do not
reuse them.

| Signal | Module pin | Uno pin | Notes |
| :--- | :--- | :--- | :---- |
| HC-SR04 power | VCC / GND | 5V / GND | 5 V logic, safe for the Uno |
| HC-SR04 trigger | TRIG | **D6** | 10 µs pulse |
| HC-SR04 echo | ECHO | **D7** | Input; keep the cable short |
| DHT power | VCC / GND | 5V / GND | DHT11: 3.3–5.5 V; DHT22: 3.3–6 V |
| DHT data | DATA | **D2** | 10 kΩ from DATA to 5 V |
| Status LED | anode via 330 Ω | **D5** | Cathode to GND; blinks on sensor fault |
| Demo surge button | leg 1 | **D3** | Leg 2 to GND; internal pull-up, no resistor needed |
| Ethernet shield | stacked | D10–D13 | D10 = W5100 CS, D11 MOSI, D12 MISO, D13 SCK |
| Ethernet shield microSD CS | — | **D4** | Left unused; sketch drives it HIGH to deselect the card |
| Rain sensor (optional) | AO | **A0** | Enable `RAIN_SENSOR_ENABLED 1` |
| Soil probe (optional) | AO | **A1** | Enable `SOIL_SENSOR_ENABLED 1` |

Power the Uno through the barrel jack with **7–12 V** or through USB. If you
feed regulated 5 V directly to the 5V pin, it must be a clean, fused supply.
Do not power the shield and sensors from the Uno's 3.3 V pin.

## Calibration

The sketch converts echo time to distance and distance to gauge level:

```text
distance_cm    = echo_pulse_us × 0.0343 / 2      # 343 m/s at ~20 °C
water_level_cm = STATION_DATUM_OFFSET_CM
                 + SENSOR_MOUNT_HEIGHT_CM
                 - distance_cm
```

Two constants at the top of the sketch matter:

- `SENSOR_MOUNT_HEIGHT_CM` (default `350.0`) — tape-measure from the **face of
  the sensor** straight down to the riverbed / station zero mark, with the
  river at its lowest practical level. This is the physical "zero depth"
  reference.
- `STATION_DATUM_OFFSET_CM` (default `700.0`) — maps local depth to the gauge
  datum used by the seeded database. Station 3's seeded history spans roughly
  **790–928 cm**, so 700 makes demo readings comparable. Set it to `0` if you
  want a plain depth-above-bed value instead.

Procedure:

1. Mount the sensor rigidly, pointing straight down at the water, clear of
   banks, bridge beams, vegetation and turbulent white water.
2. Measure the distance from the sensor face to the dry riverbed at low water.
   Put that value into `SENSOR_MOUNT_HEIGHT_CM`.
3. Read the official/known staff-gauge level `L` (cm) and the sensor distance
   `D` (cm) at the same moment. Then solve for the mount height:
   `SENSOR_MOUNT_HEIGHT_CM = D + L − STATION_DATUM_OFFSET_CM`.
   Example: `D = 238`, `L = 812`, offset `700` → mount height `350`.
4. Re-flash the sketch and check the serial output. The computed level should
   match the staff gauge within a few centimetres.
5. With the defaults, level 940 cm (warning for station 3) is reached at
   distance ≈ 110 cm, and level 980 cm (critical) at ≈ 70 cm.

## Cup-of-water demo

A cup on a desk can drive the same pipeline as a real station: ultrasonic
readings arrive over MQTT, the backend scores them, the operator queue gets a
pending alert, and approving it publishes a notification.

1. Reset the calm baseline and start the backend + Mosquitto. The backend needs
   `MQTT_ENABLED=true` and a reachable broker; `docker compose up` sets this
   automatically. For a local uvicorn run, export both variables first.

   ```bash
   PYTHONPATH=. .venv/bin/python -m backend.seed --reset
   ```

2. Mount the HC-SR04 face-down above the cup. Measure `H`, the distance from
   the sensor face to the **cup bottom**. Set `SENSOR_MOUNT_HEIGHT_CM = H`.
3. Pick the datum offset so the initial reading sits just below the station's
   warning level (for the demo station: 940 cm). With water depth `d` at the
   start, `D_start = H − d`, and
   `STATION_DATUM_OFFSET_CM = 930 − H + D_start`.
   Example: `H = 40`, initial depth `10` → `D_start = 30` → offset `920`.
   The station reads `930 cm` (green).
4. Flash the sketch and confirm the serial output/API shows ≈ `930 cm`.
5. Pour water into the cup. Depth `20 cm` → distance `20` → `940 cm`, which
   crosses the warning threshold and creates a **pending** alert for the
   operator. Depth `30 cm` → `950 cm` (still medium).
6. Approve the alert in the operator queue. It becomes `published` and appears
   in the public alert feed and notifications.

The cup only covers the warning band; use the mock `surge` scenario when you
need to demonstrate critical/high alerts.

Plausibility limits are also configurable: `MIN_DISTANCE_CM`,
`MAX_DISTANCE_CM`, `MIN_WATER_LEVEL_CM` and `MAX_WATER_LEVEL_CM`. Readings
outside them, and echo timeouts, are rejected.

The reported rate is computed over a **5-minute window** (`RATE_WINDOW_MS`),
not between 10-second publishes: a 10-second derivative is dominated by
ultrasonic jitter, where 0.1 cm already equals 36 cm/h. The sketch reports
`0.0` when the change over the window is below `RATE_DEADBAND_CM` (1 cm) and
clamps anything larger to ±`MAX_RATE_OF_RISE_CM_H`. Real stations average over
much longer windows; treat this value as demo telemetry, not a hydrological
measurement.

Practical notes:

- The HC-SR04 has a minimum range of ~2–3 cm and a usable maximum of ~4 m. Its
  beam is fairly wide (~15°); nearby walls and the water surface angle cause
  false echoes. Foam, ice, heavy rain and debris can break the echo.
- The speed of sound is fixed at 343 m/s. Temperature changes cause a small
  error (~0.2 % per 10 °C); the DHT reading is reported but not used for
  compensation.
- For outdoor use, replace the HC-SR04 with a waterproof JSN-SR04T. It uses
  the same trigger/echo interface and the same conversion.
- Re-measure after bed scour or after moving the sensor. A loose mount is the
  most common cause of slowly drifting readings.

## Libraries and build

Arduino IDE → **Tools → Manage Libraries**:

| Library | Author | Purpose |
| :--- | :--- | :---- |
| **PubSubClient** | Nick O'Leary (knolleary) | MQTT 3.1.1 client |
| **DHT sensor library** | Adafruit | DHT11/DHT22 driver |
| **Adafruit Unified Sensor** | Adafruit | Dependency of the DHT library |
| **Ethernet** | Arduino | Built in; version **2.0+** is required (`linkStatus()`, bounded DHCP) |

Board: **Arduino Uno**. Open `arduino/floodwatch_station/floodwatch_station.ino`,
select the port and upload. There is no ArduinoJson dependency — the JSON is
built with `snprintf()`.

PlatformIO users can build from this directory with the supplied
[`platformio.ini`](platformio.ini):

```bash
cd arduino
pio run -e uno
pio run -e uno -t upload
pio device monitor -b 115200
```

## Demo surge button

A momentary button between **D3** and **GND** toggles a labelled demo surge:

- adds **+60 cm** virtually over 20 seconds (ramp), holds for 90 seconds, then
  auto-resets;
- publishes every **2 seconds** while active, with `"demo_surge":1`;
- the status LED is solid on during the surge;
- pressing the button again resets immediately.

The surge is an explicit demo aid, not a hydrological measurement. It exists
because a tabletop cup cannot physically reach the critical threshold of the
seeded bridge station.

## MQTT pairing and Last Will

The sketch identifies itself with **`STATION_CODE`**, not a database id. Add a
station in the dashboard with the same device code (for example
`arduino-bridge-01`); the station starts accepting this device immediately,
without recompiling for a new id.

The sketch publishes:

- telemetry: `saqta/floodwatch/sko-demo/telemetry/<STATION_CODE>`
- retained status: `saqta/floodwatch/sko-demo/status/<STATION_CODE>`

On connect it publishes `{"state":"online"}` retained. The broker has a Last
Will `{"state":"offline"}` retained, published when the device disappears.
With `mqttClient.setKeepAlive(5)` the dashboard shows «Нет связи» in roughly
8–15 seconds after pulling the cable or power.

`MQTT_TOPIC_PREFIX` and `MQTT_BROKER` must match the backend environment:
`MQTT_TOPIC`, `MQTT_STATUS_TOPIC`, `MQTT_HOST`.

## Configuration

All settings are constants at the top of the sketch:

| Constant | Default | Meaning |
| :--- | :--- | :---- |
| `MAC_ADDRESS` | `DE:AD:BE:EF:FE:03` | Must be unique on the LAN; last byte follows the station id |
| `USE_DHCP` | `1` | `1` = DHCP, `0` = use the static IP block |
| `STATIC_IP` / `STATIC_GATEWAY` / `STATIC_SUBNET` / `STATIC_DNS` | `192.168.1.53` etc. | Used when `USE_DHCP 0` |
| `MQTT_PORT` | `1883` | MQTT port |
| `STATION_CODE` | `arduino-bridge-01` | Pairing code entered in the dashboard; final topic is `<prefix>/telemetry/<code>` |
| `MQTT_TOPIC_PREFIX` | `saqta/floodwatch/sko-demo` | Must match backend `MQTT_TOPIC` / `MQTT_STATUS_TOPIC` |
| `MQTT_BROKER` | `broker.hivemq.com` | Public demo broker; use a private broker for production |
| `DHT_SENSOR_TYPE` | `DHT11` | Change to `DHT22` for the white sensor |
| `TEMPERATURE_SENSOR_ENABLED` | `1` | Set to `0` if no DHT is fitted |
| `RAIN_SENSOR_ENABLED` / `SOIL_SENSOR_ENABLED` | `0` | Optional analog sensors |
| Calibration constants | see above | Mount height, datum offset, limits, rate clamp |

The demo uses the **public HiveMQ broker** (`broker.hivemq.com:1883`), so the
Arduino only needs internet access from the Ethernet shield; no local broker
or Docker is required. Set the backend env to the same namespace:

```bash
export MQTT_ENABLED=true
export MQTT_HOST=broker.hivemq.com
export MQTT_PORT=1883
export MQTT_TOPIC='saqta/floodwatch/sko-demo/telemetry/#'
export MQTT_STATUS_TOPIC='saqta/floodwatch/sko-demo/status/#'
```

Use a unique prefix for your team/event. Public brokers are unauthenticated;
never publish production or personal data there.

## Topic and payload

Topic: `saqta/floodwatch/sko-demo/telemetry/<STATION_CODE>`.

One JSON object per message, published every 5 s, QoS 0, not retained:

```json
{"station_code":"arduino-bridge-01","water_level":812.4,"rate_of_rise":3.1,"rainfall":0.0,"temperature":12.5,"soil_moisture":68.0,"demo_surge":0}
```

| Field | Unit | Source |
| :--- | :--- | :---- |
| `station_code` | — | `STATION_CODE`; must match the station added in the dashboard |
| `water_level` | cm | 5-sample average after calibration |
| `rate_of_rise` | cm/h | Change over the last 5 minutes ÷ elapsed hours; changes below 1 cm are treated as 0 (noise gate); ±100 clamp; `0.0` on first publish |
| `rainfall` | mm/h | `0.0` unless the optional analog rain sensor is enabled |
| `temperature` | °C | DHT11/22; last valid value if a read fails; `10.0` initially |
| `soil_moisture` | % | `50.0` by default, or the optional probe value |
| `demo_surge` | 0/1 | `1` while the D3 button surge is active |
| `timestamp` | — | **Omitted on purpose**; the backend uses its receive time |

If rainfall/soil are enabled, `RAIN_MAX_MM_H`, `SOIL_DRY_RAW` and
`SOIL_WET_RAW` must be calibrated. The analog rain module is an intensity
proxy, not a tipping-bucket rain gauge.

The outbound packet is about 120 bytes; PubSubClient's default 256-byte
buffer is sufficient.

## Verify the public broker

On a machine with `mosquitto-clients` installed:

```bash
mosquitto_sub -h broker.hivemq.com -p 1883 -t 'saqta/floodwatch/sko-demo/#' -v
```

Expected output every 5 s:

```text
saqta/floodwatch/sko-demo/telemetry/arduino-bridge-01 {"station_code":"arduino-bridge-01","water_level":930.0,...}
```

The Arduino serial monitor (115200 baud) shows the boot banner, IP, MQTT state
and each published payload:

```text
Saqta.kz FloodWatch station
Station code: arduino-bridge-01
Topic: saqta/floodwatch/sko-demo/telemetry/arduino-bridge-01
Broker: broker.hivemq.com:1883
Ethernet: DHCP, IP 192.168.1.53
MQTT: connected
Published saqta/floodwatch/sko-demo/telemetry/arduino-bridge-01 {...}
```

Inject a test reading without hardware:

```bash
mosquitto_pub -h broker.hivemq.com -p 1883 \
  -t saqta/floodwatch/sko-demo/telemetry/arduino-bridge-01 \
  -m '{"station_code":"arduino-bridge-01","water_level":985.0,"rate_of_rise":12.0,"rainfall":4.0,"temperature":11.0,"soil_moisture":72.0}'
```

## Mock publisher (no hardware)

`backend/mqtt_mock_publisher.py` emulates the Arduino for demos and tests:

```bash
cd /home/timur/projects/saqta
.venv/bin/python -m backend.mqtt_mock_publisher \
  --station-code arduino-bridge-01 --prefix saqta/floodwatch/sko-demo \
  --interval 1 --scenario surge --start-level 930
```

Options: `--station-id` / `--station-code`, `--prefix`, `--interval`,
`--start-level`, `--scenario normal|surge`, `--stay-online`. On exit it
publishes a retained `offline` status, so it can also rehearse the disconnect
scene. Do not run it against the same station while the real Arduino is
publishing.

## Expected dashboard behavior

- The station added in the dashboard (same `STATION_CODE`) receives a new
  telemetry point every 5 seconds; the current level and chart update live.
- Values are centimetres on the station's gauge datum. With the default bridge
  calibration `water_level = 1050 − distance`, so a sensor about 2.4 m above
  the water reads ~812 cm. A desk setup with a ~30 cm gap will read above
  1000 cm until the constants are adjusted (see Calibration).
- The seeded thresholds for station 3 are **warning 940 cm**, **critical
  980 cm**, and a rate-of-rise threshold of **10 cm/h**. Crossing them should
  produce the corresponding alert/risk state (backend alert rules), and the ML
  forecast uses the recent level/rate/rain/soil window.
- Rainfall stays `0.0` and soil `50.0` unless the optional sensors are enabled.
- Because the sketch omits `timestamp`, points appear at server receive time;
  the Arduino needs no RTC or NTP.
- If the cable/power is pulled, the broker publishes the Last Will and the
  dashboard shows «Нет связи» within ~8–15 seconds.

## Troubleshooting

| Symptom | Likely cause / fix |
| :--- | :---- |
| No serial output | Wrong port or baud; select 115200; install CH340 driver for clones |
| `Ethernet: DHCP failed` | Cable/switch, no DHCP server, Wi-Fi client isolation; try `USE_DHCP 0` with a free static IP |
| IP shows `0.0.0.0` | No DHCP lease; check link LEDs and router |
| `MQTT: failed rc=-2` | Broker unreachable — wrong `MQTT_BROKER`/port, different subnet, host firewall blocks 1883 |
| `rc=-4` / connection timeout | Broker IP unreachable or overloaded; ping it from another host |
| `rc=4` / `rc=5` | Broker requires credentials; the demo broker does not, so check for a config mismatch |
| Publishes fail while connected | Check broker logs; topic size/payload buffer are well within limits |
| `HC-SR04: invalid echo` repeatedly | Check 5 V/GND, TRIG/ECHO wiring, sensor aim, minimum distance, foam/ice; try the waterproof JSN-SR04T |
| Distance stuck near 0 | Echo line floating/disconnected or sensor faulty |
| Level drifts slowly | Loose mount, temperature (fixed speed of sound), debris, or wrong calibration |
| Dashboard unchanged | Topic/`station_code` mismatch, MQTT bridge disabled, wrong broker/namespace, or mock/real publishers conflicting |

## Safety and caveats

- **Demo prototype, not certified equipment.** Never use this station as the
  sole basis for evacuation or other life-safety decisions. Official data
  comes from Казгидромет and ДЧС; the platform is a demonstration for
  Digital Urpaq 2026.
- **Outdoor electronics:** use an IP65+ enclosure with cable glands and a drip
  loop, add desiccant, and keep all electronics above the maximum expected
  flood level. Secure the sensor mechanically (bracket + safety chain) so it
  cannot fall into the river.
- **Power:** use a regulated, fused supply of adequate current; the W5100
  shield is power-hungry. Long/weak USB cables cause brownouts and random
  resets. Consider a UPS or solar/battery setup for unattended use.
- **Water and sensors:** the HC-SR04 and DHT11 are not waterproof or
  condensation-rated. Use a JSN-SR04T in a protected mount and a radiation
  shield/vented enclosure for the DHT. Conformal coating helps but does not
  make a module submersible.
- **Cabling and ESD/lightning:** keep TTL cables short; long outdoor runs pick
  up noise and surges. Use shielded cable, common ground, surge protection and
  disconnect during thunderstorms. For long distances prefer RS-485, LoRa or
  an industrial 4–20 mA sensor instead of 5 V TTL.
- **Network security:** the demo Mosquitto has **no TLS and no
  authentication** on port 1883. Anyone on the LAN can publish fake readings.
  Use an isolated demo VLAN, never expose 1883 to the internet, and add
  TLS/auth before any real deployment.
- **Data plausibility:** echoes from debris, ice, foam, boats or the sensor
  itself can produce believable but wrong levels. Keep the range checks,
  watch the LED/serial diagnostics, and cross-check against a staff gauge.
