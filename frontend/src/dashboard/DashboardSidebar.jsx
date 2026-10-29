import React from "react";
import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  History,
  Info,
  LayoutDashboard,
  Radio,
  ShieldCheck,
  Waves,
} from "lucide-react";

const monitoringItems = [
  { id: "map", key: "nav.map", icon: LayoutDashboard },
  { id: "stations", key: "nav.stations", icon: Waves },
  { id: "alerts", key: "nav.alerts", icon: Bell },
  { id: "reports", key: "nav.reports", icon: FileText },
  { id: "about", key: "nav.about", icon: Info },
];

const operatorItems = [
  { id: "queue", key: "nav.queue", icon: ClipboardList },
  { id: "telemetry", key: "nav.telemetry", icon: Radio },
  { id: "logs", key: "nav.logs", icon: History },
  { id: "stats", key: "nav.stats", icon: BarChart3 },
];

function NavButton({ item, active, onClick, t, badge }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onClick(item.id)}
      title={t(item.key)}
      className={`group relative flex w-full items-center justify-center gap-3 rounded-xl px-0 py-2.5 transition xl:justify-start xl:px-3 ${
        active ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      <span className={`relative flex h-5 w-5 shrink-0 items-center justify-center ${active ? "text-emerald-600" : ""}`}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
        {badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 h-3.5 min-w-[14px] rounded-full bg-red-500 px-1 text-center text-[8px] font-bold leading-[14px] text-white xl:hidden">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className={`hidden flex-1 truncate text-left text-[12px] xl:block ${active ? "font-bold" : "font-medium"}`}>
        {t(item.key)}
      </span>
      {badge > 0 && (
        <span className="hidden rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white xl:block">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {active && (
        <span className="absolute left-0 top-1/2 hidden h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-600 xl:block" />
      )}
    </button>
  );
}

export default function DashboardSidebar({
  view,
  onNavigate,
  isOperator,
  pendingCount = 0,
  user,
  roleLabel,
  t,
}) {
  return (
    <aside className="hidden shrink-0 flex-col border-r border-slate-100 bg-white md:flex md:w-[66px] xl:w-[250px]">
      <div className="flex-1 overflow-y-auto px-2 py-4 xl:px-3">
        <p className="mb-2 hidden px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 xl:block">
          {t("nav.sectionMonitoring")}
        </p>
        <nav className="space-y-1">
          {monitoringItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={view === item.id}
              onClick={onNavigate}
              t={t}
              compact={false}
            />
          ))}
        </nav>

        {isOperator && (
          <>
            <div className="mx-3 my-4 border-t border-slate-100" />
            <p className="mb-2 hidden px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 xl:block">
              {t("nav.sectionOperator")}
            </p>
            <div className="mb-2 hidden items-center gap-2 rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-1.5 xl:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
              <span className="truncate text-[9px] font-semibold text-sky-700">{roleLabel}</span>
            </div>
            <nav className="space-y-1">
              {operatorItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={view === item.id}
                  onClick={onNavigate}
                  t={t}
                  badge={item.id === "queue" ? pendingCount : 0}
                  compact={false}
                />
              ))}
            </nav>
          </>
        )}
      </div>

      <div className="px-2 pb-3 xl:px-3">
        {!isOperator && (
          <div className="hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 text-white shadow-lg shadow-emerald-900/20 xl:block">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[12px] font-bold leading-tight">{t("about.subtitle")}</p>
            <p className="mt-1.5 text-[10px] leading-4 text-emerald-50/80">{t("about.body1")}</p>
            <button
              type="button"
              onClick={() => onNavigate("alerts")}
              className="mt-3 w-full rounded-lg bg-white/15 py-1.5 text-[10px] font-semibold text-white transition hover:bg-white/25"
            >
              {t("nav.alerts")} →
            </button>
          </div>
        )}

        <div className="mt-3 hidden items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2 xl:flex">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[9px] font-bold text-slate-500">
            {user ? (user.full_name || user.email || "U").slice(0, 1).toUpperCase() : "G"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-bold text-slate-700">
              {user ? user.full_name || user.email : t("role.guest")}
            </p>
            <p className="truncate text-[8px] text-slate-400">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
