import React, { useMemo, useState } from "react";
import { ChevronRight, MapPin, Search, ShieldCheck, X } from "lucide-react";
import { formatRelative, haversineKm, normalizeHealth, stationRisk } from "./lib/format";

const RISK_RADIUS_KM = 15;

function districtState(district, stations) {
  const distances = stations
    .map((station) => ({
      station,
      km: haversineKm(
        Number(district.lat),
        Number(district.lng),
        Number(station.lat),
        Number(station.lng)
      ),
    }))
    .filter((item) => Number.isFinite(item.km))
    .sort((a, b) => a.km - b.km);

  if (!distances.length) {
    return { status: "unknown", nearest: null };
  }

  // Use the nearest *online* station: stale values must not repaint the whole
  // city, and one elevated station 15 km away is not "all districts".
  const live = distances.filter(
    (item) =>
      item.km <= RISK_RADIUS_KM &&
      normalizeHealth(item.station.health) === "online"
  );
  if (!live.length) {
    return { status: "unknown", nearest: distances[0] || null };
  }

  const nearest = live[0];
  const risk = stationRisk(nearest.station);
  if (risk === "unknown") {
    return { status: "unknown", nearest };
  }

  return {
    status: risk === "high" ? "danger" : risk === "medium" ? "warn" : "safe",
    nearest,
  };
}

export default function DistrictCheck({
  region,
  stations = [],
  onSelectDistrict,
  onClose,
  t,
  mobile = false,
  lang = "en",
}) {
  const [query, setQuery] = useState("");

  const districts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = region?.districts || [];
    if (!q) return list;
    return list.filter((district) =>
      [district.name, district.nameEn]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [query, region]);

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden bg-white ${
        mobile ? "rounded-t-2xl" : "w-[310px] rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-900/10"
      }`}
    >
      {mobile && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200" />}
      <div className="flex items-center gap-2 px-3.5 pb-2 pt-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[11px] font-bold text-slate-800">{t("district.title")}</h3>
          <p className="truncate text-[9px] text-slate-400">{region?.shortName || t("district.subtitle")}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 md:hidden"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-3 pb-2">
        <div className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2">
          <Search className="h-3 w-3 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("district.search")}
            className="min-w-0 flex-1 bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-slate-400">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className={`min-h-0 overflow-y-auto px-1.5 pb-2 ${mobile ? "max-h-[50dvh]" : "max-h-[266px]"}`}>
        {districts.length === 0 ? (
          <p className="px-3 py-6 text-center text-[10px] text-slate-400">{t("district.empty")}</p>
        ) : (
          districts.map((district) => {
            const state = districtState(district, stations);
            const danger = state.status === "danger";
            const warn = state.status === "warn";
            const unknown = state.status === "unknown";
            return (
              <button
                key={district.id}
                type="button"
                onClick={() => onSelectDistrict?.(district)}
                className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    danger
                      ? "bg-red-500 ring-4 ring-red-50"
                      : warn
                      ? "bg-amber-500 ring-4 ring-amber-50"
                      : unknown
                      ? "bg-slate-300 ring-4 ring-slate-50"
                      : "bg-emerald-500 ring-4 ring-emerald-50"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-semibold text-slate-700">{district.name}</span>
                  <span className="block truncate text-[8px] text-slate-400">
                    {state.nearest
                      ? `${state.nearest.km.toFixed(1)} ${t("common.km")} · ${formatRelative(
                          state.nearest.station.last_updated,
                          lang
                        )} · ${state.nearest.station.name}`
                      : district.nameEn}
                  </span>
                </span>
                <span
                  className={`hidden shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold sm:block ${
                    danger
                      ? "bg-red-50 text-red-600"
                      : warn
                      ? "bg-amber-50 text-amber-700"
                      : unknown
                      ? "bg-slate-100 text-slate-500"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {danger
                    ? t("district.danger")
                    : warn
                    ? t("district.warn")
                    : unknown
                    ? t("district.unknown")
                    : t("district.safe")}
                </span>
                <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-[8px] text-slate-400">
        <MapPin className="h-2.5 w-2.5" />
        {t("district.basis")}
      </div>
    </section>
  );
}
