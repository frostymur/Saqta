# Saqta.kz station on LMS-ESP32 v2 (MicroPython)

This is the MicroPython port of the Arduino demo for the **Anton's Mindstorms
LMS-ESP32 v2** board. It publishes the same MQTT contract, uses Wi-Fi instead of
Ethernet, and keeps the demo surge button and Last Will offline status.

Files:

- `main.py` — station firmware.
- `umqtt/simple.py` — vendored MicroPython MQTT client (MIT, micropython-lib);
  upload the `umqtt` folder so the board does not need internet access to
  `mip install` at the venue.

## 1. Flash MicroPython

Use the official firmware selector/flasher:

<https://firmware.antonsmindstorms.com/>

Choose **LMS-ESP32 v2 → MicroPython 1.24** (or newer). The board ships with
MicroPython 1.24.

## 2. Wiring

> **The LMS-ESP32 v2 exposes 3.3 V GPIO. Do not feed 5 V into a GPIO.**
> The HC-SR04 echo output is 5 V, so use a divider.

| Signal | HC-SR04 / JSN-SR04T | LMS-ESP32 v2 |
| :--- | :--- | :--- |
| Power | VCC | **5V** pin (USB-powered board) |
| Ground | GND | GND |
| Trigger | TRIG | **GPIO18** |
| Echo | ECHO | **GPIO19** via divider: ECHO → 1 kΩ → GPIO19, GPIO19 → 2 kΩ → GND |
| Button | one leg | **GPIO23** |
| Button | other leg | **GND** (internal pull-up) |
| Status LED | — | on-board NeoPixel **GPIO25** |

If you use a 3.3 V-compatible ultrasonic module, the divider is not needed —
check its datasheet first.

The 5 V rail is available when the board is powered over USB. If you power it
from a LEGO hub, the hub may keep 5 V off until the PUPRemote heartbeat runs;
for the demo, USB power is simpler.

## 3. Configure

Edit the top of `main.py`:

```python
WIFI_SSID = "YOUR_WIFI"
WIFI_PASSWORD = "YOUR_PASSWORD"

MQTT_HOST = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_PREFIX = "saqta/floodwatch/sko-demo"
STATION_CODE = "arduino-bridge-01"
```

`STATION_CODE` must match the **«Код устройства (MQTT)»** entered in the
dashboard when adding the station. No numeric database id is needed.

The Wi-Fi network must be **2.4 GHz** (ESP32 does not support 5 GHz).

## 4. Upload

Using Thonny / Viper IDE: upload `main.py` and the whole `umqtt` folder to the
board root.

Using `mpremote`:

```bash
cd lms-esp32
mpremote cp main.py :
mpremote cp -r umqtt :
mpremote reset
```

Open the serial console at **115200** baud. Expected boot output:

```text
Saqta.kz LMS-ESP32 station starting
Station code: arduino-bridge-01
Telemetry topic: saqta/floodwatch/sko-demo/telemetry/arduino-bridge-01
Status topic: saqta/floodwatch/sko-demo/status/arduino-bridge-01
WiFi: connecting to ...
WiFi: connected 192.168.x.x
MQTT: connecting to broker.hivemq.com 1883
MQTT: connected, topic ...
Published {"station_code":"arduino-bridge-01","water_level":930.0,...}
```

## 5. Calibration

The default constants are for the cup demo:

```python
SENSOR_MOUNT_HEIGHT_CM = 40.0   # sensor face -> cup bottom
STATION_DATUM_OFFSET_CM = 920.0 # H=40, initial depth=10 -> 930 cm
```

Formula:

```text
distance_cm = echo_us * 0.0343 / 2
level_cm    = STATION_DATUM_OFFSET_CM + SENSOR_MOUNT_HEIGHT_CM - distance_cm
```

For a real installation, use the same procedure as the Arduino README:
measure the sensor-to-bed distance at low water, read the staff gauge, and
solve for the two constants.

If the station card is not around **930 cm** with the cup, adjust
`STATION_DATUM_OFFSET_CM` until it is. The dashboard warning/critical
thresholds for the demo station should be **940 / 980 cm**.

## 6. Demo surge button

Button between **GPIO23** and **GND**:

- press once: virtual **+60 cm** ramp over 20 s;
- holds for 90 s, then auto-resets;
- press again: immediate reset;
- publish interval changes from 5 s to **2 s**;
- `rate_of_rise` becomes 12 cm/h;
- payload gets `"demo_surge": 1`;
- on-board NeoPixel turns **red**;
- serial prints `DEMO: surge ON (+60 cm)` / `OFF`.

With a 930 cm baseline, the level reaches 980 cm after about 17 s and the
operator gets a high-risk pending alert.

## 7. Wi-Fi / MQTT health

- The board publishes a retained `online` status on connect.
- It sets a retained **Last Will** `offline` on the status topic.
- Keepalive is 5 seconds; after cable/power loss the dashboard should show
  «Нет связи» within roughly 8–15 seconds.
- The code reconnects Wi-Fi and MQTT automatically.
- NeoPixel: green = healthy, red = surge, orange = sensor/MQTT problem,
  blue = Wi-Fi down.

## 8. Troubleshooting

| Symptom | Fix |
| :--- | :--- |
| `ImportError: umqtt` | Upload the `umqtt` folder; don't rely on `mip` at the venue |
| Wi-Fi never connects | 2.4 GHz network, correct SSID/password, board antenna clear |
| MQTT connect fails | Port 1883 outbound allowed; `broker.hivemq.com` reachable |
| Dashboard says «станция не найдена» | `STATION_CODE` != code in the add-station form |
| Level is 0 or wrong | Check divider/echo, `SENSOR_MOUNT_HEIGHT_CM`, `STATION_DATUM_OFFSET_CM` |
| Sensor reads absurdly close | HC-SR04 minimum range ~2–3 cm; aim away from walls |
| No offline status after unplug | Keepalive/Last Will needs a clean broker connection first; check serial |
| Public broker collisions | Change `MQTT_PREFIX` here **and** in Render env |

## 9. Production note

This is a demo. For a real station use a waterproof JSN-SR04T or pressure/radar
sensor, a proper 3.3 V level shifter, an IP65 enclosure, and a private MQTT
broker with TLS and credentials.
