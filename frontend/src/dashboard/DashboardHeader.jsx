import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Droplets,
  Globe2,
  LogOut,
  MapPin,
  Search,
  User,
  UserRound,
  Waves,
  X,
} from "lucide-react";
import NotificationsBell from "./NotificationsBell";
import RegionSelector from "./RegionSelector";
import { allDistricts, DASHBOARD_REGIONS } from "./data/dashboardRegions";

function LanguageSwitch({ currentLang, onSelectLang, compact = false }) {
  return (
    <div
      className={`items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-[9px] font-bold text-slate-500 ${
        compact ? "flex" : "hidden lg:flex"
      }`}
    >
      {["kk", "ru", "en"].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onSelectLang(code)}
          className={`rounded-full px-2 py-1 uppercase transition ${
            currentLang === code ? "bg-emerald-600 text-white shadow-sm" : "hover:text-slate-700"
          }`}
        >
          {code === "kk" ? "Қаз" : code === "ru" ? "Рус" : "Eng"}
        </button>
      ))}
    </div>
  );
}

function SearchBox({ t, stations, regionId, onSelectStation, onSelectDistrict, onSelectRegion, autoFocus, onClose }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(Boolean(autoFocus));
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (value) => String(value || "").toLowerCase().includes(q);
    const result = [];

    allDistricts().forEach((district) => {
      if (!q || matches(district.name) || matches(district.nameEn) || matches(district.regionName)) {
        result.push({
          type: "district",
          id: `district-${district.id}`,
          title: `${district.name}${district.nameEn ? ` · ${district.nameEn}` : ""}`,
          subtitle: district.regionName,
          payload: district,
          score: district.regionId === regionId ? 2 : 1,
        });
      }
    });

    DASHBOARD_REGIONS.forEach((region) => {
      if (q && (matches(region.name) || matches(region.shortName) || matches(region.river))) {
        result.push({
          type: "region",
          id: `region-${region.id}`,
          title: region.name,
          subtitle: region.river,
          payload: region,
          score: region.id === regionId ? 3 : 1,
        });
      }
    });

    stations.forEach((station) => {
      if (!q || matches(station.name) || matches(station.region)) {
        result.push({
          type: "station",
          id: `station-${station.id}`,
          title: station.name,
          subtitle: station.region,
          payload: station,
          score: String(station.region) === String(regionId) ? 2 : 1,
        });
      }
    });

    if (!q) {
      result.unshift({
        type: "hint",
        id: "hint",
        title: t("header.searchHint"),
        subtitle: "",
        payload: null,
        score: 0,
      });
    }

    return result
      .sort((a, b) => b.score - a.score)
      .filter((item, index, array) => array.findIndex((entry) => entry.id === item.id) === index)
      .slice(0, 8);
  }, [query, regionId, stations, t]);

  const select = (item) => {
    if (!item || item.type === "hint") return;
    if (item.type === "station") onSelectStation(item.payload);
    if (item.type === "district") onSelectDistrict(item.payload);
    if (item.type === "region") onSelectRegion(item.payload.id);
    setQuery("");
    setOpen(false);
    onClose?.();
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(suggestions.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(suggestions[active] || suggestions.find((item) => item.type !== "hint"));
    } else if (event.key === "Escape") {
      setOpen(false);
      onClose?.();
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("header.searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
          aria-label={t("header.searchPlaceholder")}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-slate-400 hover:text-slate-600"
            aria-label={t("common.close")}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-900/15">
          {suggestions.length === 0 ? (
            <p className="px-3 py-6 text-center text-[10px] text-slate-400">{t("header.noResults")}</p>
          ) : (
            suggestions.map((item, index) => {
              const Icon = item.type === "station" ? Waves : item.type === "district" ? MapPin : Globe2;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.type === "hint"}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => select(item)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                    active === index && item.type !== "hint" ? "bg-emerald-50" : ""
                  } ${item.type === "hint" ? "cursor-default" : "hover:bg-slate-50"}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                      item.type === "station"
                        ? "bg-emerald-50 text-emerald-600"
                        : item.type === "district"
                        ? "bg-sky-50 text-sky-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold text-slate-700">{item.title}</span>
                    {item.subtitle && (
                      <span className="block truncate text-[9px] text-slate-400">{item.subtitle}</span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardHeader({
  t,
  lang,
  onSelectLang,
  user,
  roleLabel,
  regionId,
  onSelectRegion,
  stations,
  onSelectStation,
  onSelectDistrict,
  alerts,
  onSelectAlert,
  onViewAlerts,
  onLoginClick,
  onLogout,
  onOpenProfile,
  onLogoClick,
  connected,
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const onPointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [profileOpen]);

  const handleRegion = (id) => {
    onSelectRegion(id);
  };

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-2 border-b border-slate-100 bg-white px-3 sm:gap-3 lg:h-16 lg:px-5">
      {/* Brand */}
      <button type="button" onClick={onLogoClick} className="group flex shrink-0 items-center gap-2.5">
        <span className="relative flex h-8 w-8 items-center justify-center">
          <Droplets className="h-8 w-8 fill-emerald-500 text-emerald-500" strokeWidth={1.4} />
          <Waves className="absolute bottom-[7px] left-[9px] h-3 w-3 text-white" strokeWidth={2.2} />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[15px] font-bold leading-none tracking-[-0.6px] text-slate-900">
            Saqta<span className="text-emerald-600">.kz</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            FloodWatch
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-400"}`} />
          </span>
        </span>
      </button>

      {/* Desktop search */}
      <div className="ml-1 hidden min-w-0 flex-1 md:block lg:ml-3 lg:max-w-[520px]">
        <SearchBox
          t={t}
          stations={stations}
          regionId={regionId}
          onSelectStation={onSelectStation}
          onSelectDistrict={onSelectDistrict}
          onSelectRegion={onSelectRegion}
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 md:hidden"
          aria-label={t("common.search")}
        >
          <Search className="h-4 w-4" />
        </button>

        <span
          className="hidden items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-700 sm:inline-flex"
          title={t("about.disclaimer")}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {t("common.demo")}
        </span>

        <div className="hidden sm:block">
          <RegionSelector value={regionId} onChange={handleRegion} t={t} />
        </div>
        <div className="sm:hidden">
          <RegionSelector value={regionId} onChange={handleRegion} t={t} compact />
        </div>

        <LanguageSwitch currentLang={lang} onSelectLang={onSelectLang} />

        <NotificationsBell
          alerts={alerts}
          t={t}
          lang={lang}
          onViewAll={onViewAlerts}
          onSelectAlert={onSelectAlert}
        />

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((state) => !state)}
            className={`flex h-9 items-center gap-2 rounded-xl border pl-1 pr-1 transition sm:pl-1.5 sm:pr-2 ${
              user && ["operator", "admin"].includes(user.role)
                ? "border-sky-200 bg-sky-50/60 hover:bg-sky-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold text-white ${
                user ? (["operator", "admin"].includes(user.role) ? "bg-sky-600" : "bg-emerald-600") : "bg-slate-400"
              }`}
            >
              {user ? (user.full_name || user.email || "U").slice(0, 1).toUpperCase() : <UserRound className="h-3.5 w-3.5" />}
            </span>
            <span className="hidden max-w-[110px] truncate text-left text-[10px] font-semibold text-slate-600 xl:block">
              {user ? user.full_name || user.email : t("header.signIn")}
            </span>
            <ChevronDown className="hidden h-3 w-3 text-slate-400 sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
              <div className="border-b border-slate-100 px-3.5 py-3">
                <p className="truncate text-[11px] font-bold text-slate-800">
                  {user ? user.full_name || user.email : t("role.guest")}
                </p>
                <p className="mt-0.5 truncate text-[9px] text-slate-400">
                  {user ? user.email : t("header.readOnlyNotice")}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                    user && ["operator", "admin"].includes(user.role)
                      ? "bg-sky-50 text-sky-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {roleLabel}
                </span>
              </div>
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenProfile?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {t("header.viewProfile")}
                </button>
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t("header.signOut")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onLoginClick?.();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    <User className="h-3.5 w-3.5" />
                    {t("header.signIn")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-slate-100 bg-white p-3 shadow-xl md:hidden">
          <div className="flex items-center gap-2">
            <SearchBox
              t={t}
              stations={stations}
              regionId={regionId}
              onSelectStation={onSelectStation}
              onSelectDistrict={onSelectDistrict}
              onSelectRegion={onSelectRegion}
              autoFocus
              onClose={() => setMobileSearchOpen(false)}
            />
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
