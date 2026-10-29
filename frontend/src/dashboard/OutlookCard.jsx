import React, { useEffect, useState } from "react";
import { CloudRain } from "lucide-react";
import { fetchStationOutlook } from "../api";
import { formatDate, formatNumber, normalizeRisk, riskLabelKey, riskMeta } from "./lib/format";

export default function OutlookCard({ station, t, lang = "en" }) {
  const [outlook, setOutlook] = useState(null);
  const [loading, setLoading] = useState(true);

  const stationId = station?.id;

  useEffect(() => {
    if (!stationId) {
      setOutlook(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    fetchStationOutlook(stationId)
      .then((data) => {
        if (!cancelled) setOutlook(data);
      })
      .catch(() => {
        if (!cancelled) setOutlook(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stationId]);

  const days = Array.isArray(outlook?.days) ? outlook.days.slice(0, 3) : [];

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm shadow-slate-900/[0.02]">
      <div className="mb-2 flex items-start gap-2">
        <CloudRain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-bold text-slate-700">{t("outlook.title")}</h3>
          <p className="mt-0.5 text-[9px] text-slate-400">{t("outlook.subtitle")}</p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-700">
          {t("outlook.confidence")}
        </span>
      </div>

      {outlook?.source && (
        <p className="mb-2 truncate text-[8px] text-slate-400" title={outlook.source}>
          {outlook.source}
        </p>
      )}

      {loading ? (
        <p className="py-2 text-center text-[10px] text-slate-400">{t("common.loading")}</p>
      ) : days.length === 0 ? (
        <p className="py-2 text-center text-[10px] text-slate-400">{t("outlook.empty")}</p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {days.map((day) => {
            const risk = normalizeRisk(day.risk_level);
            const meta = riskMeta(risk);
            return (
              <div key={day.date} className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/60 p-1.5">
                <p className="truncate text-[9px] font-semibold text-slate-500">
                  {formatDate(day.date, lang, { time: false, short: true })}
                </p>
                <p className="mt-1 text-[8px] text-slate-400">{t("outlook.rain")}</p>
                <p className="text-[11px] font-bold leading-tight text-slate-700">
                  {formatNumber(day.rainfall_mm, 1)}
                  <span className="ml-0.5 text-[8px] font-medium text-slate-400">mm</span>
                </p>
                <p className="mt-1 text-[8px] text-slate-400">{t("outlook.temp")}</p>
                <p className="text-[11px] font-bold leading-tight text-slate-700">
                  {formatNumber(day.temp_c, 1)}
                  <span className="ml-0.5 text-[8px] font-medium text-slate-400">°C</span>
                </p>
                <p className="mt-1 text-[8px] text-slate-400">{t("outlook.level")}</p>
                <p className="text-[11px] font-bold leading-tight text-slate-700">
                  {formatNumber(day.expected_level_cm, 0)}
                  <span className="ml-0.5 text-[8px] font-medium text-slate-400">{t("common.cm")}</span>
                </p>
                <span
                  className={`mt-1.5 inline-block rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${meta.badge}`}
                >
                  {t(riskLabelKey(risk))}
                </span>
                {day.note && <p className="mt-1 line-clamp-2 text-[8px] leading-tight text-slate-500">{day.note}</p>}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-[8px] leading-4 text-slate-400">{t("outlook.disclaimer")}</p>
    </section>
  );
}
