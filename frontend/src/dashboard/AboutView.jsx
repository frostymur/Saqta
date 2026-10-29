import React, { useEffect, useState } from "react";
import { BrainCircuit, Database, Droplets, Globe2, Info, Map as MapIcon, MapPin, ShieldCheck, Waves } from "lucide-react";
import { fetchGeoValidation } from "../api";

export default function AboutView({ t, onNavigate }) {
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    fetchGeoValidation()
      .then((data) => setGeo(data))
      .catch(() => setGeo(null));
  }, []);

  const sources = [
    { icon: Database, text: t("about.sourceBackend") },
    { icon: MapIcon, text: t("about.sourceMap") },
    { icon: BrainCircuit, text: t("about.sourceMl") },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="relative overflow-hidden border-b border-emerald-100 bg-emerald-50/60 px-6 py-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-100/60" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Droplets className="h-8 w-8 fill-emerald-500 text-emerald-500" />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Saqta<span className="text-emerald-600">.kz</span>
              </span>
            </div>
            <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{t("about.title")}</h1>
            <p className="mt-1 text-[11px] font-medium text-emerald-700">{t("about.subtitle")}</p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <p className="text-[12px] leading-6 text-slate-600">{t("about.body1")}</p>
          <p className="text-[12px] leading-6 text-slate-600">{t("about.body2")}</p>

          <div className="rounded-xl border border-slate-100 p-4">
            <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <Globe2 className="h-3.5 w-3.5" />
              {t("about.sources")}
            </h2>
            <ul className="mt-2.5 space-y-2">
              {sources.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2 text-[11px] leading-5 text-slate-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                    <Icon className="h-3 w-3" />
                  </span>
                  {text}
                </li>
              ))}
              {geo && (
                <li className="flex items-start gap-2 text-[11px] leading-5 text-slate-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                    <MapPin className="h-3 w-3" />
                  </span>
                  {t("about.geoCheck")}: {geo.ok_count}/{geo.checked} · {geo.source}
                </li>
              )}
            </ul>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <Waves className="h-4 w-4 text-emerald-600" />
              <p className="mt-2 text-[10px] font-bold text-slate-700">{t("nav.alerts")}</p>
              <p className="mt-0.5 text-[9px] leading-4 text-slate-400">{t("alerts.subtitle")}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <p className="mt-2 text-[10px] font-bold text-slate-700">{t("district.title")}</p>
              <p className="mt-0.5 text-[9px] leading-4 text-slate-400">{t("district.subtitle")}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <BrainCircuit className="h-4 w-4 text-emerald-600" />
              <p className="mt-2 text-[10px] font-bold text-slate-700">{t("station.mlForecast")}</p>
              <p className="mt-0.5 text-[9px] leading-4 text-slate-400">{t("about.sourceMl")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate?.("alerts")}
              className="rounded-xl bg-emerald-600 px-3.5 py-2 text-[10px] font-semibold text-white transition hover:bg-emerald-700"
            >
              {t("nav.alerts")} →
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("reports")}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              {t("nav.reports")} →
            </button>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[9px] text-slate-400">
              <Info className="h-2.5 w-2.5" />
              {t("about.tech")}
            </span>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5 text-[10px] leading-5 text-amber-800">
            {t("about.disclaimer")}
          </div>
        </div>
      </div>
    </div>
  );
}
