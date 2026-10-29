/*
  Saqta.kz / FloodWatch — Arduino Uno field station
  -------------------------------------------------
  Publishes water level, rate of rise, air temperature and (optionally)
  rainfall / soil moisture to the Saqta backend over MQTT.

  Hardware
    Arduino Uno R3
    Ethernet W5100 shield (stacked; SPI on D11-D13, W5100 CS on D10)
    HC-SR04 ultrasonic range sensor (TRIG D6, ECHO D7)
    DHT11 or DHT22 (DATA D2, 10k pull-up to 5V)
    Status LED (D5 -> 330 ohm -> GND)

  MQTT
    topic    floodwatch/telemetry/3
    payload  {"station_id":3,"water_level":812.4,"rate_of_rise":3.1,...}
    interval 10 s (PUBLISH_INTERVAL_MS). No timestamp is sent, so the
    backend stamps the reading at receive time.

  Calibration
    distance_cm       = echo_us * 0.0343 / 2        (343 m/s at ~20 C)
    water_level_cm    = STATION_DATUM_OFFSET_CM
                        + SENSOR_MOUNT_HEIGHT_CM
                        - distance_cm

    SENSOR_MOUNT_HEIGHT_CM  tape-measured distance from the sensor face
                            straight down to the riverbed / station zero
                            mark at low water.
    STATION_DATUM_OFFSET_CM local depth -> gauge datum offset. The demo
                            uses 700 so readings land in the seeded range
                            of station 3 (~790-928 cm). Set 0 for a plain
                            depth-above-bed value.

  Wiring and the calibration procedure are documented in ../README.md.
*/

#include <SPI.h>
#include <Ethernet.h>
#include <PubSubClient.h>
#include <DHT.h>

// ---------------------------------------------------------------------------
// Identity and network
// ---------------------------------------------------------------------------
// Station code is the pairing key. Add the same code in the dashboard
// ("Добавить гидропост" -> "Код устройства"), then the station starts
// accepting this device's MQTT messages without recompiling for a DB id.
#define STATION_CODE "arduino-bridge-01"
#define MQTT_TOPIC_PREFIX "saqta/floodwatch/sko-demo"

// Must be unique on the LAN. Last byte matches the station id by convention.
static byte MAC_ADDRESS[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0x03};

// 1 = DHCP (recommended), 0 = fixed address below.
#define USE_DHCP 1

#if !USE_DHCP
static IPAddress STATIC_IP(192, 168, 1, 53);
static IPAddress STATIC_DNS(192, 168, 1, 1);
static IPAddress STATIC_GATEWAY(192, 168, 1, 1);
static IPAddress STATIC_SUBNET(255, 255, 255, 0);
#endif
#define DHCP_TIMEOUT_MS 5000UL  // bound DHCP blocking time on every retry

// LAN address of the machine running docker compose. NOT localhost,
// and not the Arduino's own address.
// Public demo broker. Change this and MQTT_TOPIC_PREFIX to a unique namespace
// for your own deployment; they must match backend MQTT_* settings.
static const char MQTT_BROKER[] = "broker.hivemq.com";
#define MQTT_PORT 1883

// ---------------------------------------------------------------------------
// Pins (Uno R3)
// ---------------------------------------------------------------------------
#define SD_CS_PIN 4       // shield microSD CS: keep HIGH (unused)
#define LED_PIN 5         // status LED, active HIGH
#define TRIG_PIN 6        // HC-SR04 trigger
#define ECHO_PIN 7        // HC-SR04 echo (5 V, safe for Uno)
#define DHTPIN 2          // DHT data, 10k pull-up to 5V
#define BUTTON_PIN 3      // demo surge button: D3 -> GND, INPUT_PULLUP

// Change this one line to DHT22 if you use the white sensor.
#define DHT_SENSOR_TYPE DHT11

// Sensor enable flags. Temperature is on; rain/soil are optional and off.
#define TEMPERATURE_SENSOR_ENABLED 1
#define RAIN_SENSOR_ENABLED 0
#define SOIL_SENSOR_ENABLED 0
#define RAIN_ANALOG_PIN A0
#define SOIL_ANALOG_PIN A1

// ---------------------------------------------------------------------------
// Timing (all non-blocking, driven by millis())
// ---------------------------------------------------------------------------
#define SAMPLE_INTERVAL_MS 1000UL
#define PUBLISH_INTERVAL_MS 5000UL
#define SURGE_PUBLISH_INTERVAL_MS 2000UL
#define MQTT_RETRY_MS 5000UL
#define ETHERNET_RETRY_MS 10000UL
#define ETHERNET_CHECK_MS 1000UL
#define DHCP_MAINTAIN_MS 30000UL
#define LED_BLINK_MS 250UL
#define SENSOR_ERROR_PRINT_MS 5000UL
#define ECHO_TIMEOUT_US 30000UL  // ~5 m max round trip

// Demo surge: pressing the button adds a virtual +60 cm over 20 seconds,
// holds it for 90 seconds, then auto-resets. This is explicitly a demo aid:
// it is not a hydrological measurement and is marked in the payload.
#define SURGE_OFFSET_CM 60.0f
#define SURGE_RAMP_MS 20000UL
#define SURGE_HOLD_MS 90000UL
#define SURGE_TOTAL_MS (SURGE_RAMP_MS + SURGE_HOLD_MS)
#define SURGE_RATE_CM_H 12.0f
#define BUTTON_DEBOUNCE_MS 250UL

// ---------------------------------------------------------------------------
// Calibration and plausibility limits
// ---------------------------------------------------------------------------
// Defaults model a bridge sensor 3.5 m above the riverbed. For a tabletop
// demo, lower SENSOR_MOUNT_HEIGHT_CM to the measured gap and adjust
// STATION_DATUM_OFFSET_CM as described in ../README.md.
#define SENSOR_MOUNT_HEIGHT_CM 350.0f
#define STATION_DATUM_OFFSET_CM 700.0f
#define MIN_DISTANCE_CM 3.0f
#define MAX_DISTANCE_CM SENSOR_MOUNT_HEIGHT_CM
#define MIN_WATER_LEVEL_CM 0.0f
#define MAX_WATER_LEVEL_CM 1200.0f
#define MAX_RATE_OF_RISE_CM_H 100.0f

// Rate of rise is computed over RATE_WINDOW_MS, not between 10-second
// publishes: a 10-second derivative is dominated by ultrasonic jitter
// (0.1 cm already reads as 36 cm/h). Changes below the deadband become 0.
#define RATE_DEADBAND_CM 1.0f
#define RATE_WINDOW_MS 300000UL  // 5 minutes
#define SAMPLE_WINDOW 5

// Optional analog sensors: calibrate these for your modules.
#define RAIN_MAX_MM_H 20.0f
#define SOIL_DRY_RAW 520  // ADC value in air (capacitive probe)
#define SOIL_WET_RAW 260  // ADC value in water / saturated soil

#define DEFAULT_TEMPERATURE_C 10.0f
#define DEFAULT_SOIL_MOISTURE_PCT 50.0f

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------
EthernetClient ethernetClient;
PubSubClient mqttClient(ethernetClient);
DHT dht(DHTPIN, DHT_SENSOR_TYPE);

static char topic[96];
static char statusTopic[96];
static char willPayload[96];
static char onlinePayload[96];

static bool ethernetUp = false;
static bool sensorFault = false;
static bool ledOn = false;
static bool havePublished = false;
static bool surgeActive = false;
static uint32_t surgeStartedMs = 0;
static bool buttonWasPressed = false;
static uint32_t lastButtonMs = 0;

static float samples[SAMPLE_WINDOW];
static uint8_t sampleIndex = 0;
static uint8_t sampleCount = 0;

static float lastRateLevelCm = 0.0f;
static float lastRateCmH = 0.0f;
static uint32_t lastRateMs = 0;

static float lastTemperatureC = DEFAULT_TEMPERATURE_C;
static float lastSoilMoisturePct = DEFAULT_SOIL_MOISTURE_PCT;

static uint32_t lastSampleMs = 0;
static uint32_t lastPublishMs = 0;
static uint32_t lastMqttAttemptMs = 0;
static uint32_t lastEthernetCheckMs = 0;
static uint32_t lastEthernetAttemptMs = 0;
static uint32_t lastDhcpMaintainMs = 0;
static uint32_t lastBlinkMs = 0;
static uint32_t lastSensorErrorMs = 0;

static float averageLevelCm();

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------
static void startEthernet() {
#if USE_DHCP
  Serial.print(F("Ethernet: DHCP"));
  if (Ethernet.begin(MAC_ADDRESS, DHCP_TIMEOUT_MS) == 0) {
    Serial.println(F(" failed"));
    ethernetUp = false;
    return;
  }
  Serial.print(F(", IP "));
#else
  Ethernet.begin(MAC_ADDRESS, STATIC_IP, STATIC_DNS, STATIC_GATEWAY, STATIC_SUBNET);
  Serial.print(F("Ethernet: static IP "));
#endif
  ethernetUp = true;
  Serial.println(Ethernet.localIP());
}

static void maintainEthernet(uint32_t now) {
  if (now - lastEthernetCheckMs < ETHERNET_CHECK_MS) {
    return;
  }
  lastEthernetCheckMs = now;

  if (Ethernet.linkStatus() == LinkOFF) {
    if (ethernetUp) {
      Serial.println(F("Ethernet: link down"));
    }
    ethernetUp = false;
    if (mqttClient.connected()) {
      mqttClient.disconnect();
    }
    return;
  }

  if (!ethernetUp) {
    if (now - lastEthernetAttemptMs < ETHERNET_RETRY_MS) {
      return;
    }
    lastEthernetAttemptMs = now;
    startEthernet();
    return;
  }

#if USE_DHCP
  if (now - lastDhcpMaintainMs >= DHCP_MAINTAIN_MS) {
    lastDhcpMaintainMs = now;
    int rc = Ethernet.maintain();
    if (rc == 1 || rc == 3) {  // renew or rebind failed
      Serial.println(F("Ethernet: DHCP lease lost"));
      ethernetUp = false;
      if (mqttClient.connected()) {
        mqttClient.disconnect();
      }
    } else if (rc == 2 || rc == 4) {  // renewed or rebound successfully
      Serial.print(F("Ethernet: lease renewed, IP "));
      Serial.println(Ethernet.localIP());
    }
  }
#endif
}

static void maintainMqtt(uint32_t now) {
  if (!ethernetUp || mqttClient.connected()) {
    return;
  }
  if (now - lastMqttAttemptMs < MQTT_RETRY_MS) {
    return;
  }
  lastMqttAttemptMs = now;

  char clientId[48];
  snprintf(clientId, sizeof(clientId), "floodwatch-%s", STATION_CODE);

  Serial.print(F("MQTT: connect "));
  Serial.print(MQTT_BROKER);
  Serial.print(F(":"));
  Serial.println(MQTT_PORT);

  // Last Will: the public broker publishes "offline" if this device vanishes.
  if (mqttClient.connect(clientId, nullptr, nullptr, statusTopic, 1, true, willPayload)) {
    Serial.println(F("MQTT: connected"));
    mqttClient.publish(statusTopic, onlinePayload, true);
    lastPublishMs = now - PUBLISH_INTERVAL_MS;  // publish on the next loop
  } else {
    Serial.print(F("MQTT: failed rc="));
    Serial.println(mqttClient.state());
  }
}

// ---------------------------------------------------------------------------
// Water level
// ---------------------------------------------------------------------------
static bool readDistanceCm(float &distanceCm) {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // pulseIn blocks for at most ECHO_TIMEOUT_US, never for seconds.
  unsigned long durationUs = pulseIn(ECHO_PIN, HIGH, ECHO_TIMEOUT_US);
  if (durationUs == 0) {
    return false;  // echo timeout / sensor disconnected
  }

  distanceCm = durationUs * 0.0343f / 2.0f;  // us -> cm, round trip
  return true;
}

static float levelFromDistance(float distanceCm) {
  return STATION_DATUM_OFFSET_CM + SENSOR_MOUNT_HEIGHT_CM - distanceCm;
}

static float surgeOffsetCm(uint32_t now) {
  if (!surgeActive) {
    return 0.0f;
  }
  uint32_t elapsed = now - surgeStartedMs;
  if (elapsed >= SURGE_RAMP_MS) {
    return SURGE_OFFSET_CM;
  }
  return SURGE_OFFSET_CM * (float)elapsed / (float)SURGE_RAMP_MS;
}

static void updateSurgeButton(uint32_t now) {
  bool pressed = digitalRead(BUTTON_PIN) == LOW;
  if (pressed && !buttonWasPressed && (now - lastButtonMs) >= BUTTON_DEBOUNCE_MS) {
    lastButtonMs = now;
    surgeActive = !surgeActive;
    surgeStartedMs = now;
    lastRateLevelCm = averageLevelCm();
    lastRateMs = now;
    lastRateCmH = 0.0f;
    Serial.println(surgeActive ? F("DEMO: surge ON (+60 cm)") : F("DEMO: surge OFF"));
  }
  buttonWasPressed = pressed;

  if (surgeActive && (now - surgeStartedMs) >= SURGE_TOTAL_MS) {
    surgeActive = false;
    lastRateLevelCm = averageLevelCm();
    lastRateMs = now;
    lastRateCmH = 0.0f;
    Serial.println(F("DEMO: surge auto-reset"));
  }
}

static void sampleWaterLevel(uint32_t now) {
  if (now - lastSampleMs < SAMPLE_INTERVAL_MS) {
    return;
  }
  lastSampleMs = now;

  float distanceCm = 0.0f;
  bool valid = readDistanceCm(distanceCm);
  float levelCm = valid ? levelFromDistance(distanceCm) : 0.0f;

  if (!valid
      || distanceCm < MIN_DISTANCE_CM
      || distanceCm > MAX_DISTANCE_CM
      || levelCm < MIN_WATER_LEVEL_CM
      || levelCm > MAX_WATER_LEVEL_CM) {
    sensorFault = true;
    if (now - lastSensorErrorMs >= SENSOR_ERROR_PRINT_MS) {
      lastSensorErrorMs = now;
      Serial.print(F("HC-SR04: invalid echo"));
      if (valid) {
        Serial.print(F(" distance="));
        Serial.print(distanceCm, 1);
      }
      Serial.println(F(" cm - publish window skipped"));
    }
    return;
  }

  sensorFault = false;
  samples[sampleIndex] = levelCm;
  sampleIndex = (sampleIndex + 1) % SAMPLE_WINDOW;
  if (sampleCount < SAMPLE_WINDOW) {
    sampleCount++;
  }
}

static float averageLevelCm() {
  if (sampleCount == 0) {
    return 0.0f;
  }
  float sum = 0.0f;
  for (uint8_t i = 0; i < sampleCount; i++) {
    sum += samples[i];
  }
  return sum / sampleCount;
}

// ---------------------------------------------------------------------------
// Environmental sensors
// ---------------------------------------------------------------------------
static float readTemperatureC() {
#if TEMPERATURE_SENSOR_ENABLED
  float t = dht.readTemperature();
  if (!isnan(t) && t >= -40.0f && t <= 80.0f) {
    lastTemperatureC = t;
  }
#endif
  return lastTemperatureC;
}

static float readRainfallMmH() {
#if RAIN_SENSOR_ENABLED
  int raw = analogRead(RAIN_ANALOG_PIN);
  // Most analog rain boards output high when dry: invert and scale.
  float rain = (1023.0f - raw) * RAIN_MAX_MM_H / 1023.0f;
  return rain < 0.0f ? 0.0f : rain;
#else
  return 0.0f;
#endif
}

static float readSoilMoisturePct() {
#if SOIL_SENSOR_ENABLED
  int raw = analogRead(SOIL_ANALOG_PIN);
  float pct = (SOIL_DRY_RAW - raw) * 100.0f / (SOIL_DRY_RAW - SOIL_WET_RAW);
  if (pct < 0.0f) {
    pct = 0.0f;
  } else if (pct > 100.0f) {
    pct = 100.0f;
  }
  lastSoilMoisturePct = pct;
#endif
  return lastSoilMoisturePct;
}

// ---------------------------------------------------------------------------
// MQTT payload
// ---------------------------------------------------------------------------
// AVR printf has no float support, so format numbers without %f.
static void formatOneDecimal(char *out, size_t outSize, float value) {
  bool negative = value < 0.0f;
  long scaled = (long)(fabsf(value) * 10.0f + 0.5f);
  if (scaled == 0) {
    negative = false;
  }
  snprintf(out, outSize, "%s%ld.%ld",
           negative ? "-" : "", scaled / 10, scaled % 10);
}

static void publishTelemetry(uint32_t now) {
  uint32_t interval = surgeActive ? SURGE_PUBLISH_INTERVAL_MS : PUBLISH_INTERVAL_MS;
  if (now - lastPublishMs < interval) {
    return;
  }
  lastPublishMs = now;

  if (!ethernetUp || !mqttClient.connected()) {
    Serial.println(F("Publish: MQTT down, skipped"));
    return;
  }
  if (sensorFault || sampleCount < SAMPLE_WINDOW) {
    Serial.println(F("Publish: no valid water-level window, skipped"));
    return;
  }

  float levelCm = averageLevelCm() + surgeOffsetCm(now);
  float temperatureC = readTemperatureC();
  float rainfallMmH = readRainfallMmH();
  float soilPct = readSoilMoisturePct();

  float rateCmH = lastRateCmH;
  if (surgeActive) {
    rateCmH = SURGE_RATE_CM_H;
    lastRateLevelCm = levelCm;
    lastRateMs = now;
    lastRateCmH = rateCmH;
  } else if (!havePublished) {
    lastRateLevelCm = levelCm;
    lastRateMs = now;
  } else if (now - lastRateMs >= RATE_WINDOW_MS) {
    float elapsedHours = (now - lastRateMs) / 3600000.0f;
    float deltaCm = levelCm - lastRateLevelCm;
    rateCmH = (fabsf(deltaCm) >= RATE_DEADBAND_CM && elapsedHours > 0.0f)
                  ? deltaCm / elapsedHours
                  : 0.0f;
    if (rateCmH > MAX_RATE_OF_RISE_CM_H) {
      rateCmH = MAX_RATE_OF_RISE_CM_H;
    } else if (rateCmH < -MAX_RATE_OF_RISE_CM_H) {
      rateCmH = -MAX_RATE_OF_RISE_CM_H;
    }
    lastRateLevelCm = levelCm;
    lastRateMs = now;
    lastRateCmH = rateCmH;
  }

  char levelStr[12];
  char rateStr[12];
  char rainStr[12];
  char tempStr[12];
  char soilStr[12];
  formatOneDecimal(levelStr, sizeof(levelStr), levelCm);
  formatOneDecimal(rateStr, sizeof(rateStr), rateCmH);
  formatOneDecimal(rainStr, sizeof(rainStr), rainfallMmH);
  formatOneDecimal(tempStr, sizeof(tempStr), temperatureC);
  formatOneDecimal(soilStr, sizeof(soilStr), soilPct);

  char payload[220];
  int written = snprintf(
      payload, sizeof(payload),
      "{\"station_code\":\"%s\",\"water_level\":%s,\"rate_of_rise\":%s,"
      "\"rainfall\":%s,\"temperature\":%s,\"soil_moisture\":%s,"
      "\"demo_surge\":%d}",
      STATION_CODE, levelStr, rateStr, rainStr, tempStr, soilStr,
      surgeActive ? 1 : 0);
  if (written < 0 || (size_t)written >= sizeof(payload)) {
    Serial.println(F("Publish: payload buffer too small"));
    return;
  }

  if (!mqttClient.publish(topic, payload)) {
    Serial.println(F("Publish: MQTT publish failed"));
    return;
  }

  Serial.print(F("Published "));
  Serial.print(topic);
  Serial.print(F(" "));
  Serial.println(payload);

  havePublished = true;
}

// ---------------------------------------------------------------------------
// Status LED: off when healthy, blinking on sensor fault
// ---------------------------------------------------------------------------
static void updateLed(uint32_t now) {
  if (!ethernetUp) {
    if (ledOn) {
      digitalWrite(LED_PIN, LOW);
      ledOn = false;
    }
    return;
  }

  if (surgeActive) {
    if (!ledOn) {
      digitalWrite(LED_PIN, HIGH);
      ledOn = true;
    }
    return;
  }

  if (!sensorFault) {
    if (ledOn) {
      digitalWrite(LED_PIN, LOW);
      ledOn = false;
    }
    return;
  }

  if (now - lastBlinkMs < LED_BLINK_MS) {
    return;
  }
  lastBlinkMs = now;
  ledOn = !ledOn;
  digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
}

// ---------------------------------------------------------------------------
// Arduino entry points
// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(SD_CS_PIN, OUTPUT);
  digitalWrite(SD_CS_PIN, HIGH);  // deselect unused shield microSD

#if TEMPERATURE_SENSOR_ENABLED
  dht.begin();
#endif

  snprintf(topic, sizeof(topic), "%s/telemetry/%s", MQTT_TOPIC_PREFIX, STATION_CODE);
  snprintf(statusTopic, sizeof(statusTopic), "%s/status/%s", MQTT_TOPIC_PREFIX, STATION_CODE);
  snprintf(willPayload, sizeof(willPayload),
           "{\"station_code\":\"%s\",\"state\":\"offline\"}", STATION_CODE);
  snprintf(onlinePayload, sizeof(onlinePayload),
           "{\"station_code\":\"%s\",\"state\":\"online\"}", STATION_CODE);

  Serial.println();
  Serial.println(F("Saqta.kz FloodWatch station"));
  Serial.print(F("Station code: "));
  Serial.println(STATION_CODE);
  Serial.print(F("Topic: "));
  Serial.println(topic);
  Serial.print(F("Status topic: "));
  Serial.println(statusTopic);
  Serial.print(F("Broker: "));
  Serial.print(MQTT_BROKER);
  Serial.print(F(":"));
  Serial.println(MQTT_PORT);

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  // 5 s keepalive lets the broker publish the Last Will within ~8-15 s.
  mqttClient.setKeepAlive(5);
  // Bound the CONNACK wait so a half-open broker cannot stall sampling.
  mqttClient.setSocketTimeout(5);

  startEthernet();

  // Try MQTT immediately, then every MQTT_RETRY_MS.
  lastMqttAttemptMs = millis() - MQTT_RETRY_MS;
  lastPublishMs = millis();
  lastDhcpMaintainMs = millis();
  lastSensorErrorMs = millis() - SENSOR_ERROR_PRINT_MS;
}

void loop() {
  uint32_t now = millis();

  maintainEthernet(now);
  maintainMqtt(now);

  if (mqttClient.connected()) {
    mqttClient.loop();  // keepalive, incoming packets
  }

  updateSurgeButton(now);
  sampleWaterLevel(now);
  publishTelemetry(now);
  updateLed(now);
}
