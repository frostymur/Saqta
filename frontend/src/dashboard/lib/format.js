export const RISK_META = {
  high: {
    hex: "#dc2626",
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
    soft: "bg-red-50 text-red-700 border-red-100",
  },
  medium: {
    hex: "#f59e0b",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    soft: "bg-amber-50 text-amber-700 border-amber-100",
  },
  low: {
    hex: "#059669",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  unknown: {
    hex: "#94a3b8",
    badge: "border-slate-200 bg-slate-50 text-slate-500",
    dot: "bg-slate-400",
    soft: "bg-slate-50 text-slate-600 border-slate-200",
  },
};

export const HEALTH_META = {
  online: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
  },
  stale: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    text: "text-amber-600",
  },
  offline: {
    badge: "border-slate-200 bg-slate-50 text-slate-500",
    dot: "bg-slate-400",
    text: "text-slate-500",
  },
  error: {
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
    text: "text-red-600",
  },
};

export function normalizeHealth(value) {
  const health = String(value || "").toLowerCase();
  return HEALTH_META[health] ? health : "offline";
}

export function healthMeta(value) {
  return HEALTH_META[normalizeHealth(value)];
}

export function healthLabelKey(value) {
  return `health.${normalizeHealth(value)}`;
}

export function riskMeta(level) {
  return RISK_META[level] || RISK_META.low;
}

export function riskLabelKey(level) {
  if (level === "high") return "station.riskHigh";
  if (level === "medium") return "station.riskMedium";
  if (level === "unknown") return "station.riskUnknown";
  return "station.riskLow";
}

export function normalizeRisk(level) {
  const value = String(level || "").toLowerCase();
  if (value === "high" || value === "critical") return "high";
  if (value === "medium" || value === "elevated" || value === "warning") return "medium";
  if (value === "unknown" || value === "no_data" || value === "none") return "unknown";
  return value ? "low" : "unknown";
}

export function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number.toFixed(digits);
}

export function cmToMeters(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return (number / 100).toFixed(digits);
}

export function formatDate(value, lang = "en", { time = true, short = false } = {}) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const locale = lang === "ru" ? "ru-RU" : lang === "kk" ? "kk-KZ" : "en-GB";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: short ? "short" : "2-digit",
      year: "numeric",
      ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function formatRelative(value, lang = "en") {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (Number.isFinite(minutes) && Math.abs(minutes) < 60) {
    if (lang === "ru") return minutes <= 1 ? "только что" : `${minutes} мин назад`;
    if (lang === "kk") return minutes <= 1 ? "жаңа ғана" : `${minutes} мин бұрын`;
    return minutes <= 1 ? "just now" : `${minutes} min ago`;
  }
  return formatDate(date, lang);
}

export function formatChartTick(value, range, lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const locale = lang === "ru" ? "ru-RU" : lang === "kk" ? "kk-KZ" : "en-GB";
  try {
    if (range === "24h") {
      return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date);
    }
    return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(date);
  } catch {
    return "";
  }
}

export function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestStation(stations, lat, lng) {
  if (!Array.isArray(stations) || !stations.length) return null;
  return stations.reduce(
    (best, station) => {
      const distance = haversineKm(lat, lng, Number(station.lat), Number(station.lng));
      if (!best || distance < best.distance) return { station, distance };
      return best;
    },
    null
  )?.station || null;
}

export function highestRiskStation(stations) {
  if (!Array.isArray(stations) || !stations.length) return null;
  const rank = { high: 3, medium: 2, low: 1 };
  return [...stations].sort((a, b) => {
    const risk = (rank[normalizeRisk(b.current_risk_level)] || 0) - (rank[normalizeRisk(a.current_risk_level)] || 0);
    if (risk !== 0) return risk;
    return (Number(b.current_water_level) || 0) - (Number(a.current_water_level) || 0);
  })[0];
}

export function stationRisk(station) {
  if (!station) return "unknown";
  if (station.current_risk_level) return normalizeRisk(station.current_risk_level);
  if (!station.last_updated) return "unknown";
  const level = Number(station.current_water_level);
  const crit = Number(station.thresholds?.crit_level);
  const warn = Number(station.thresholds?.warn_level);
  if (Number.isFinite(level) && Number.isFinite(crit) && level >= crit) return "high";
  if (Number.isFinite(level) && Number.isFinite(warn) && level >= warn) return "medium";
  return "low";
}

export function stationLocalTime(value, lang) {
  if (!value) return "—";
  return formatDate(value, lang, { time: true });
}

export function cn(...values) {
  return values.filter(Boolean).join(" ");
}
