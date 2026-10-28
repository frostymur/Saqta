const API_BASE = "/api";

export async function fetchStations() {
  const res = await fetch(`${API_BASE}/stations`);
  if (!res.ok) throw new Error("Ошибка загрузки гидропостов");
  return res.json();
}

export async function fetchStationTelemetry(stationId, hours = 48) {
  const res = await fetch(`${API_BASE}/telemetry/${stationId}?hours=${hours}`);
  if (!res.ok) throw new Error("Ошибка загрузки телеметрии");
  return res.json();
}

export async function fetchAlerts(status = null) {
  const url = status ? `${API_BASE}/alerts?status=${status}` : `${API_BASE}/alerts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Ошибка загрузки оповещений");
  return res.json();
}

export async function processAlert(alertId, operatorName) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/process`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ processed_by: operatorName })
  });
  if (!res.ok) throw new Error("Ошибка обработки оповещения");
  return res.json();
}

export async function sendAlertTelegram(alertId) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/send-telegram`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Ошибка отправки в Telegram");
  return res.json();
}

export async function fetchStationPrediction(stationId) {
  const res = await fetch(`${API_BASE}/ml/predict/${stationId}`);
  if (!res.ok) throw new Error("Ошибка ML-прогноза");
  return res.json();
}

export async function fetchWeather() {
  const res = await fetch(`${API_BASE}/weather/petropavlovsk`);
  if (!res.ok) throw new Error("Ошибка загрузки погоды");
  return res.json();
}

export async function fetchDchsBulletin() {
  const res = await fetch(`${API_BASE}/reports/dchs-bulletin`);
  if (!res.ok) throw new Error("Ошибка загрузки сводки");
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error("Неверный логин или пароль");
  return res.json();
}

export async function triggerSimulationStep() {
  const res = await fetch(`${API_BASE}/simulation/step`, { method: "POST" });
  return res.json();
}

export async function setSimulationScenario(scenario, intensity = 1.0) {
  const res = await fetch(`${API_BASE}/simulation/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario, intensity })
  });
  return res.json();
}

export async function startSimulationLoop(intervalSeconds = 3) {
  const res = await fetch(`${API_BASE}/simulation/start?interval_seconds=${intervalSeconds}`, {
    method: "POST"
  });
  return res.json();
}

export async function stopSimulationLoop() {
  const res = await fetch(`${API_BASE}/simulation/stop`, { method: "POST" });
  return res.json();
}
