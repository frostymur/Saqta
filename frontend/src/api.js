// Web uses the Vite proxy (`/api`). Capacitor builds point VITE_API_BASE at
// the deployed backend, e.g. https://api.saqta.kz/api.
const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

export const TOKEN_KEY = "saqta_token";
export const USER_KEY = "saqta_user";

function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("saqta-auth"));
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export function persistAuth(payload) {
  if (!payload) return null;
  const token = payload.access_token || payload.token;
  if (token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage can be unavailable in private mode */
    }
  }
  if (payload.user) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    } catch {
      /* ignore */
    }
  }
  notifyAuthChanged();
  return payload.user || null;
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
  notifyAuthChanged();
}

async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function messageFromError(body, fallback) {
  if (!body) return fallback;
  if (typeof body === "string") return body;
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail) && body.detail[0]?.msg) return body.detail[0].msg;
  return fallback;
}

async function request(path, { method = "GET", body, headers = {}, auth = false, signal } = {}) {
  const finalHeaders = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(auth ? authHeaders() : {}),
    ...headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 401 && auth) {
    clearAuth();
    throw new Error("Session expired. Please sign in again.");
  }

  const payload = await parseBody(res);
  if (!res.ok) {
    throw new Error(messageFromError(payload, `Request failed (${res.status})`));
  }
  return payload;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export async function loginUser(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!data?.access_token) throw new Error("Invalid login response");
  persistAuth(data);
  return data;
}

export async function fetchMe() {
  return request("/auth/me", { auth: true });
}

/* ------------------------------------------------------------------ */
/* Stations & telemetry                                                */
/* ------------------------------------------------------------------ */

export async function fetchStations(region = null) {
  const query = region ? `?region=${encodeURIComponent(region)}` : "";
  return request(`/stations${query}`);
}

export async function createStation(payload) {
  return request("/stations", { method: "POST", body: payload, auth: true });
}

export async function fetchStationTelemetry(stationId, hours = 720) {
  return request(`/telemetry/${stationId}?hours=${hours}`);
}

export async function fetchTelemetryLog({ stationId = null, region = null, hours = 24, limit = 500 } = {}) {
  const params = new URLSearchParams({ hours: String(hours), limit: String(limit) });
  if (stationId != null) params.set("station_id", String(stationId));
  if (region) params.set("region", region);
  return request(`/telemetry/log?${params.toString()}`);
}

export async function fetchStationSeries(stationId, range = "24h") {
  return request(`/telemetry/${stationId}/series?range=${encodeURIComponent(range)}`);
}

export async function fetchStationPrediction(stationId) {
  return request(`/ml/predict/${stationId}`);
}

export async function fetchWeather() {
  return request("/weather/petropavlovsk");
}

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export async function fetchAlerts({ status = null, stationId = null, region = null, limit = 50, auth = false } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (stationId != null) params.set("station_id", stationId);
  if (region) params.set("region", region);
  if (limit) params.set("limit", limit);
  return request(`/alerts?${params.toString()}`, { auth });
}

export async function fetchPublicAlerts(region = null) {
  const query = region ? `?region=${encodeURIComponent(region)}` : "";
  return request(`/alerts/public${query}`);
}

export async function decideAlert(alertId, action, processedBy) {
  return request(`/alerts/${alertId}/decision`, {
    method: "PATCH",
    auth: true,
    body: { action, processed_by: processedBy },
  });
}

export async function fetchAlertStats() {
  return request("/alerts/stats", { auth: true });
}

export async function fetchAlertLog(limit = 50) {
  return request(`/alerts/log?limit=${limit}`, { auth: true });
}

export async function sendAlertTelegram(alertId) {
  return request(`/alerts/${alertId}/send-telegram`, { method: "POST", auth: true });
}

// Legacy endpoint kept for older deployments.
export async function processAlert(alertId, operatorName) {
  return request(`/alerts/${alertId}/process`, {
    method: "PATCH",
    auth: true,
    body: { processed_by: operatorName },
  });
}

/* ------------------------------------------------------------------ */
/* Reports & simulation                                                */
/* ------------------------------------------------------------------ */

export async function fetchGeoValidation() {
  return request("/geo/validate");
}

export async function fetchDchsBulletin(region = null) {
  const query = region ? `?region=${encodeURIComponent(region)}` : "";
  return request(`/reports/dchs-bulletin${query}`);
}

export async function triggerSimulationStep() {
  return request("/simulation/step", { method: "POST", auth: true });
}

export async function setSimulationScenario(scenario, intensity = 1.0) {
  return request("/simulation/scenario", {
    method: "POST",
    auth: true,
    body: { scenario, intensity },
  });
}

export async function startSimulationLoop(intervalSeconds = 3) {
  return request(`/simulation/start?interval_seconds=${intervalSeconds}`, {
    method: "POST",
    auth: true,
  });
}

export async function stopSimulationLoop() {
  return request("/simulation/stop", { method: "POST", auth: true });
}

export async function fetchSimulationStatus() {
  return request("/simulation/status", { auth: true });
}

/* ------------------------------------------------------------------ */
/* WebSocket                                                           */
/* ------------------------------------------------------------------ */

export function websocketUrl() {
  if (typeof window === "undefined") return null;
  const configured = import.meta.env.VITE_WS_URL;
  if (configured) return configured;
  if (/^https?:\/\//.test(API_BASE)) {
    const url = new URL(API_BASE);
    const proto = url.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${url.host}/ws`;
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}
