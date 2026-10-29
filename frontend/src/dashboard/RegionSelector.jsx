import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { DASHBOARD_REGIONS, getRegionByName } from "./data/dashboardRegions";

export default function RegionSelector({ value, onChange, t, compact = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = DASHBOARD_REGIONS.find((region) => region.id === value) || DASHBOARD_REGIONS[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        title={current.name}
        className={`flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 ${
          compact ? "h-9 w-9 justify-center" : "h-9 px-2.5"
        }`}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        {!compact && (
          <>
            <span className="max-w-[135px] truncate text-[11px] font-semibold">{current.name}</span>
            <ChevronDown className={`h-3 w-3 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10">
          <p className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {t("header.region")}
          </p>
          {DASHBOARD_REGIONS.map((region) => (
            <button
              key={region.id}
              type="button"
              onClick={() => {
                onChange(region.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                region.id === current.id ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  region.id === current.id ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold">{region.name}</span>
                <span className="block truncate text-[9px] text-slate-400">{region.river}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function regionIdForName(name) {
  return getRegionByName(name)?.id || null;
}
