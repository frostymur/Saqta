import React from "react";
import { Bell, Building2, Globe2, LogOut, ShieldCheck, User, Waves } from "lucide-react";
import { DASHBOARD_REGIONS } from "./data/dashboardRegions";

export default function ProfileView({
  user,
  roleLabel,
  currentLang,
  onSelectLang,
  regionId,
  onSelectRegion,
  onLoginClick,
  onLogout,
  t,
}) {
  const isOperator = user && ["operator", "admin"].includes(user.role);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{t("profile.title")}</h1>
        <p className="mt-1 text-[11px] text-slate-500">{t("profile.subtitle")}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white ${
              isOperator ? "bg-sky-600" : user ? "bg-emerald-600" : "bg-slate-400"
            }`}
          >
            {user ? (user.full_name || user.email || "U").slice(0, 1).toUpperCase() : <User className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">
              {user ? user.full_name || user.email : t("role.guest")}
            </p>
            <p className="truncate text-[10px] text-slate-400">
              {user ? user.email : t("header.readOnlyNotice")}
            </p>
            <span
              className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                isOperator ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <ShieldCheck className="h-2.5 w-2.5" />
              {roleLabel}
            </span>
          </div>
          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-3 w-3" />
              {t("profile.logout")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-emerald-700"
            >
              {t("profile.login")}
            </button>
          )}
        </div>

        {!user && (
          <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-[10px] leading-5 text-slate-500">
            {t("profile.guestDesc")}
          </div>
        )}

        <div className="p-4">
          <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <Building2 className="h-3 w-3" />
            {t("profile.region")}
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {DASHBOARD_REGIONS.map((region) => (
              <button
                key={region.id}
                type="button"
                onClick={() => onSelectRegion(region.id)}
                className={`rounded-xl border px-2.5 py-2 text-left transition ${
                  regionId === region.id
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="block truncate text-[10px] font-semibold">{region.name}</span>
                <span className="mt-0.5 flex items-center gap-1 truncate text-[8px] text-slate-400">
                  <Waves className="h-2.5 w-2.5" />
                  {region.river}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <Globe2 className="h-3 w-3" />
            {t("profile.language")}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              { id: "kk", label: "Қазақша" },
              { id: "ru", label: "Русский" },
              { id: "en", label: "English" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectLang(item.id)}
                className={`rounded-xl border px-3 py-1.5 text-[10px] font-semibold transition ${
                  currentLang === item.id
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[9px] leading-4 text-slate-400">
            <Bell className="h-3 w-3 shrink-0" />
            {t("profile.nativeNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
