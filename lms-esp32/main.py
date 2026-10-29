"""
Saqta.kz / FloodWatch — LMS-ESP32 v2 (MicroPython) field station.

Hardware
    LMS-ESP32 v2 (ESP32-PICO-V3-02, MicroPython 1.27)
    HC-SR04 / JSN-SR04T ultrasonic sensor:
        VCC  -> 5V
        GND  -> GND
        TRIG -> GPIO18
        ECHO -> GPIO19 through a 1k/2k divider (3.3 V GPIO!)
    On-board RGB NeoPixel: GPIO25

Demo behaviour
    After AUTO_SURGE_DELAY_MS (30 s) the station automatically enters a
    virtual +60 cm surge for 90 s, then resets. No button is required.
    If the ultrasonic sensor is absent or has no valid echo, the surge
    publishes a labelled fallback level (930 cm + surge) so the dashboard
    demo still produces a high-risk alert.

MQTT
    <prefix>/telemetry/<station_code>
    <prefix>/status/<station_code>   (retained Last Will "offline")
"""

import binascii
import json
import machine
import network
import time
import neopixel

from umqtt.simple import MQTTClient

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
WIFI_SSID = "CHANGE_ME"
WIFI_PASSWORD = "CHANGE_ME"

MQTT_HOST = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_PREFIX = "saqta/floodwatch/sko-demo"
STATION_CODE = "arduino-bridge-01"

# ---------------------------------------------------------------------------
# Pins (LMS-ESP32 v2)
# Do NOT use GPIO23 for general I/O on this board: it causes a WDT reset.
# ---------------------------------------------------------------------------
TRIG_PIN = 18
ECHO_PIN = 19
LED_PIN = 25

# ---------------------------------------------------------------------------
# Calibration: cup-of-water defaults (H=40 cm, initial depth=10 cm -> 930 cm)
# ---------------------------------------------------------------------------
SENSOR_MOUNT_HEIGHT_CM = 40.0
STATION_DATUM_OFFSET_CM = 920.0
MIN_DISTANCE_CM = 3.0
MAX_DISTANCE_CM = SENSOR_MOUNT_HEIGHT_CM
MIN_WATER_LEVEL_CM = 0.0
MAX_WATER_LEVEL_CM = 1200.0

DEMO_FALLBACK_LEVEL_CM = 930.0

# ---------------------------------------------------------------------------
# Timing
# ---------------------------------------------------------------------------
SAMPLE_INTERVAL_MS = 1000
PUBLISH_INTERVAL_MS = 5000
SURGE_PUBLISH_INTERVAL_MS = 5000
MQTT_RETRY_MS = 5000
WIFI_RETRY_MS = 10000
KEEPALIVE_S = 5
PING_INTERVAL_MS = 3000

RATE_WINDOW_MS = 300000  # 5 minutes
RATE_DEADBAND_CM = 1.0
MAX_RATE_OF_RISE_CM_H = 100.0

# Automatic demo surge: no button needed.
AUTO_SURGE_DELAY_MS = 30000
SURGE_OFFSET_CM = 60.0
SURGE_RAMP_MS = 20000
SURGE_HOLD_MS = 90000
SURGE_TOTAL_MS = SURGE_RAMP_MS + SURGE_HOLD_MS
SURGE_RATE_CM_H = 12.0

TELEMETRY_TOPIC = "{}/telemetry/{}".format(MQTT_PREFIX, STATION_CODE)
STATUS_TOPIC = "{}/status/{}".format(MQTT_PREFIX, STATION_CODE)
ONLINE_PAYLOAD = json.dumps(
    {"station_code": STATION_CODE, "state": "online"}
).encode()
OFFLINE_PAYLOAD = json.dumps(
    {"station_code": STATION_CODE, "state": "offline"}
).encode()

# ---------------------------------------------------------------------------
# Hardware
# ---------------------------------------------------------------------------
trig = machine.Pin(TRIG_PIN, machine.Pin.OUT)
echo = machine.Pin(ECHO_PIN, machine.Pin.IN)
np = neopixel.NeoPixel(machine.Pin(LED_PIN), 1)

wlan = network.WLAN(network.STA_IF)

boot_ms = time.ticks_ms()
samples = [0.0] * 5
sample_index = 0
sample_count = 0
sensor_fault = True

auto_surge_started = False
surge_active = False
surge_started_ms = 0

last_sample_ms = 0
last_publish_ms = 0
last_rate_level = 0.0
last_rate_ms = 0
last_rate_cm_h = 0.0
have_published = False
last_ping_ms = 0
last_mqtt_try_ms = 0
last_wifi_try_ms = 0

mqtt_client = None
last_led = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def set_led(color):
    global last_led
    if color == last_led:
        return
    last_led = color
    np[0] = color
    np.write()


def ticks_diff(now, then):
    return time.ticks_diff(now, then)


def ensure_wifi(now):
    global last_wifi_try_ms
    if not wlan.active():
        wlan.active(True)
        time.sleep_ms(200)
    if wlan.isconnected():
        return True
    if last_wifi_try_ms and ticks_diff(now, last_wifi_try_ms) < WIFI_RETRY_MS:
        return False
    last_wifi_try_ms = now
    print("WiFi: connecting to", WIFI_SSID)
    try:
        # No disconnect() on the first attempt: it costs ~300 ms at boot.
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        for _ in range(50):
            if wlan.isconnected():
                print("WiFi: connected", wlan.ifconfig()[0])
                return True
            time.sleep_ms(100)
    except Exception as exc:
        print("WiFi error:", exc)
        try:
            wlan.active(False)
            time.sleep_ms(300)
            wlan.active(True)
            time.sleep_ms(500)
        except Exception:
            pass
    print("WiFi: not connected, status", wlan.status())
    return False


def connect_mqtt(now):
    global mqtt_client, last_ping_ms, last_mqtt_try_ms
    if mqtt_client is not None:
        return True
    if last_mqtt_try_ms and ticks_diff(now, last_mqtt_try_ms) < MQTT_RETRY_MS:
        return False
    last_mqtt_try_ms = now

    client_id = "saqta-lms-" + binascii.hexlify(machine.unique_id()).decode()
    print("MQTT: connecting to", MQTT_HOST, MQTT_PORT)
    try:
        client = MQTTClient(
            client_id,
            MQTT_HOST,
            port=MQTT_PORT,
            keepalive=KEEPALIVE_S,
        )
        client.set_last_will(STATUS_TOPIC, OFFLINE_PAYLOAD, retain=True, qos=1)
        client.connect(timeout=2)
        client.sock.settimeout(1)
        client.publish(STATUS_TOPIC, ONLINE_PAYLOAD, retain=True)
        mqtt_client = client
        last_ping_ms = now
        print("MQTT: connected, topic", TELEMETRY_TOPIC)
        return True
    except Exception as exc:
        print("MQTT: connect failed:", exc)
        mqtt_client = None
        return False


def disconnect_mqtt():
    global mqtt_client
    if mqtt_client is not None:
        try:
            mqtt_client.disconnect()
        except Exception:
            pass
    mqtt_client = None


def read_distance_cm():
    trig.value(0)
    time.sleep_us(2)
    trig.value(1)
    time.sleep_us(10)
    trig.value(0)
    duration = machine.time_pulse_us(echo, 1, 30000)
    if duration < 0:
        return None
    return duration * 0.0343 / 2.0


def level_from_distance(distance_cm):
    return STATION_DATUM_OFFSET_CM + SENSOR_MOUNT_HEIGHT_CM - distance_cm


def sample_water_level(now):
    global sample_index, sample_count, sensor_fault, last_sample_ms
    if ticks_diff(now, last_sample_ms) < SAMPLE_INTERVAL_MS:
        return
    last_sample_ms = now

    distance = read_distance_cm()
    if distance is None:
        sensor_fault = True
        return
    level = level_from_distance(distance)
    if (
        distance < MIN_DISTANCE_CM
        or distance > MAX_DISTANCE_CM
        or level < MIN_WATER_LEVEL_CM
        or level > MAX_WATER_LEVEL_CM
    ):
        sensor_fault = True
        return

    sensor_fault = False
    samples[sample_index] = level
    sample_index = (sample_index + 1) % len(samples)
    if sample_count < len(samples):
        sample_count += 1


def average_level():
    if sample_count == 0:
        return 0.0
    return sum(samples) / sample_count


def surge_offset_cm(now):
    if not surge_active:
        return 0.0
    elapsed = ticks_diff(now, surge_started_ms)
    if elapsed >= SURGE_RAMP_MS:
        return SURGE_OFFSET_CM
    return SURGE_OFFSET_CM * elapsed / SURGE_RAMP_MS


def update_auto_surge(now):
    global auto_surge_started, surge_active, surge_started_ms, last_rate_level, last_rate_ms, last_rate_cm_h
    if not auto_surge_started and ticks_diff(now, boot_ms) >= AUTO_SURGE_DELAY_MS:
        auto_surge_started = True
        surge_active = True
        surge_started_ms = now
        last_rate_level = average_level()
        last_rate_ms = now
        last_rate_cm_h = 0.0
        print("DEMO: AUTO SURGE ON (+60 cm) after 30 s")

    if surge_active and ticks_diff(now, surge_started_ms) >= SURGE_TOTAL_MS:
        surge_active = False
        last_rate_level = average_level()
        last_rate_ms = now
        last_rate_cm_h = 0.0
        print("DEMO: surge auto-reset")


def publish_telemetry(now):
    global last_publish_ms, last_rate_level, last_rate_ms, last_rate_cm_h, have_published
    interval = SURGE_PUBLISH_INTERVAL_MS if surge_active else PUBLISH_INTERVAL_MS
    if ticks_diff(now, last_publish_ms) < interval:
        return
    last_publish_ms = now

    if mqtt_client is None:
        return

    fallback = sensor_fault or sample_count < len(samples)
    if fallback and not surge_active:
        print("Publish skipped: no valid water-level window")
        return

    if fallback:
        level = DEMO_FALLBACK_LEVEL_CM + surge_offset_cm(now)
        rate = SURGE_RATE_CM_H
        last_rate_level = level
        last_rate_ms = now
        last_rate_cm_h = rate
    else:
        level = average_level() + surge_offset_cm(now)
        rate = last_rate_cm_h
        if surge_active:
            rate = SURGE_RATE_CM_H
            last_rate_level = level
            last_rate_ms = now
            last_rate_cm_h = rate
        elif not have_published:
            last_rate_level = level
            last_rate_ms = now
        elif ticks_diff(now, last_rate_ms) >= RATE_WINDOW_MS:
            elapsed_h = ticks_diff(now, last_rate_ms) / 3600000.0
            delta = level - last_rate_level
            rate = delta / elapsed_h if abs(delta) >= RATE_DEADBAND_CM and elapsed_h > 0 else 0.0
            rate = max(-MAX_RATE_OF_RISE_CM_H, min(MAX_RATE_OF_RISE_CM_H, rate))
            last_rate_level = level
            last_rate_ms = now
            last_rate_cm_h = rate

    payload = json.dumps(
        {
            "station_code": STATION_CODE,
            "water_level": round(level, 1),
            "rate_of_rise": round(rate, 1),
            "rainfall": 0.0,
            "temperature": 10.0,
            "soil_moisture": 60.0,
            "demo_surge": 1 if surge_active else 0,
            "demo_sensor_fallback": 1 if fallback else 0,
        }
    ).encode()
    try:
        mqtt_client.publish(TELEMETRY_TOPIC, payload)
        have_published = True
        print("Published", payload.decode())
    except Exception as exc:
        print("Publish failed:", exc)
        disconnect_mqtt()


def update_led(now):
    if not wlan.isconnected():
        set_led((0, 0, 40))       # blue: WiFi down
    elif surge_active:
        set_led((80, 0, 0))       # red: demo surge
    elif sensor_fault:
        set_led((40, 20, 0) if (now // 250) % 2 else (0, 0, 0))  # orange blink
    elif mqtt_client is None:
        set_led((40, 20, 0))      # orange: MQTT down
    else:
        set_led((0, 40, 0))       # green: healthy


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
print("Saqta.kz LMS-ESP32 station starting")
try:
    print("Reset cause:", machine.reset_cause())
except Exception:
    pass
print("Station code:", STATION_CODE)
print("Telemetry topic:", TELEMETRY_TOPIC)
print("Status topic:", STATUS_TOPIC)
print("Auto surge in", AUTO_SURGE_DELAY_MS // 1000, "s")

try:
    while True:
        now = time.ticks_ms()

        wifi_ok = ensure_wifi(now)
        if wifi_ok:
            connect_mqtt(now)
        else:
            disconnect_mqtt()

        update_auto_surge(now)
        sample_water_level(now)
        publish_telemetry(now)
        update_led(now)

        if mqtt_client is not None:
            try:
                mqtt_client.check_msg()
                if ticks_diff(now, last_ping_ms) >= PING_INTERVAL_MS:
                    mqtt_client.ping()
                    last_ping_ms = now
            except Exception as exc:
                print("MQTT: connection lost:", exc)
                disconnect_mqtt()

        time.sleep_ms(50)
except KeyboardInterrupt:
    print("Stopped by Ctrl+C")
    set_led((0, 0, 0))
