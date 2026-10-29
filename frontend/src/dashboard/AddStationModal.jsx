import React, { useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { createStation } from "../api";
import InfoModal from "./InfoModal";
import MapPicker from "./MapPicker";
import { DASHBOARD_REGIONS } from "./data/dashboardRegions";

function initialForm(region) {
  return {
    name: "",
    code: "arduino-bridge-01",
    region: region?.name || DASHBOARD_REGIONS[0].name,
    lat: region?.center?.[1] ?? "",
    lng: region?.center?.[0] ?? "",
    warn: 940,
    crit: 980,
    maxRate: 10,
  };
}

export default function AddStationModal({ open, onClose, region, t, onCreated, onToast }) {
  const [form, setForm] = useState(() => initialForm(region));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(region));
    setError(null);
    setSaving(false);
  }, [open, region?.id]);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const pickCoordinates = (nextLat, nextLng) => {
    setForm((prev) => ({ ...prev, lat: nextLat, lng: nextLng }));
  };

  const changeRegion = (event) => {
    const name = event.target.value;
    const selected = DASHBOARD_REGIONS.find((item) => item.name === name);
    setForm((prev) => ({
      ...prev,
      region: name,
      lat: selected?.center?.[1] ?? prev.lat,
      lng: selected?.center?.[0] ?? prev.lng,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    const warn = Number(form.warn);
    const crit = Number(form.crit);
    const maxRate = Number(form.maxRate);

    if (!form.name.trim()) {
      setError(t("station.addNameRequired"));
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError(t("station.addCoordsRequired"));
      return;
    }
    if (!Number.isFinite(warn) || !Number.isFinite(crit) || !Number.isFinite(maxRate)) {
      setError(t("station.addThresholdsRequired"));
      return;
    }
    if (warn >= crit) {
      setError(t("station.addThresholdOrder"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createStation({
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        region: form.region,
        lat,
        lng,
        hazard_type: "flood",
        status: "active",
        thresholds: {
          warn_level: warn,
          crit_level: crit,
          max_rate_of_rise: maxRate,
        },
      });
      onCreated?.(created);
      onToast?.(
        created?.code
          ? `${t("station.added")}: ${created.code}`
          : t("station.added"),
        "success"
      );
      onClose?.();
    } catch (err) {
      setError(err?.message || t("station.addError"));
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 outline-none focus:border-emerald-400";
  const labelClass = "text-[9px] font-semibold uppercase tracking-wide text-slate-400";

  return (
    <InfoModal
      open={open}
      onClose={onClose}
      title={t("station.addTitle")}
      subtitle={t("station.addSubtitle")}
      t={t}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className={labelClass}>{t("station.fieldName")}</span>
          <input
            value={form.name}
            onChange={update("name")}
            placeholder={t("station.fieldNamePlaceholder")}
            className={fieldClass}
            autoFocus
          />
        </label>

        <label className="block">
          <span className={labelClass}>{t("station.fieldCode")}</span>
          <input
            value={form.code}
            onChange={update("code")}
            placeholder={t("station.fieldCodePlaceholder")}
            className={fieldClass}
          />
          <span className="mt-1 block text-[9px] leading-4 text-slate-400">
            {t("station.fieldCodeHint")}
          </span>
        </label>

        <label className="block">
          <span className={labelClass}>{t("station.fieldRegion")}</span>
          <select value={form.region} onChange={changeRegion} className={fieldClass}>
            {DASHBOARD_REGIONS.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={labelClass}>{t("station.fieldLat")}</span>
            <input
              value={form.lat}
              onChange={update("lat")}
              inputMode="decimal"
              placeholder="54.8753"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t("station.fieldLng")}</span>
            <input
              value={form.lng}
              onChange={update("lng")}
              inputMode="decimal"
              placeholder="69.1389"
              className={fieldClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="block">
            <span className={labelClass}>{t("station.warnLevel")}</span>
            <input
              value={form.warn}
              onChange={update("warn")}
              inputMode="decimal"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t("station.criticalLevel")}</span>
            <input
              value={form.crit}
              onChange={update("crit")}
              inputMode="decimal"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t("station.maxRate")}</span>
            <input
              value={form.maxRate}
              onChange={update("maxRate")}
              inputMode="decimal"
              className={fieldClass}
            />
          </label>
        </div>

        <div>
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {t("station.pickOnMap")}
          </p>
          <MapPicker
            lat={form.lat}
            lng={form.lng}
            region={DASHBOARD_REGIONS.find((item) => item.name === form.region)}
            onChange={pickCoordinates}
          />
        </div>

        <p className="flex items-start gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[10px] leading-4 text-slate-500">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
          {t("station.addHint")}
        </p>

        {error && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-medium leading-4 text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            {saving ? t("common.loading") : t("station.add")}
          </button>
        </div>
      </form>
    </InfoModal>
  );
}
