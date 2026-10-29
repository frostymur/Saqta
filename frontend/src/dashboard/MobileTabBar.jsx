import React from "react";
import { Bell, Map, User, Waves } from "lucide-react";

const ITEMS = [
  { id: "map", key: "nav.map", icon: Map },
  { id: "stations", key: "nav.stations", icon: Waves },
  { id: "alerts", key: "nav.alerts", icon: Bell },
  { id: "profile", key: "nav.profile", icon: User },
];

export default function MobileTabBar({ view, onNavigate, t, alertCount = 0 }) {
  return (
    <nav
      className="flex shrink-0 items-stretch border-t border-slate-100 bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2 transition ${
              active ? "text-emerald-700" : "text-slate-400"
            }`}
          >
            <span className="relative">
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 1.8} />
              {item.id === "alerts" && alertCount > 0 && (
                <span className="absolute -right-1.5 -top-1 h-3 min-w-[12px] rounded-full bg-red-500 px-0.5 text-center text-[7px] font-bold leading-3 text-white">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </span>
            <span className={`text-[9px] ${active ? "font-bold" : "font-medium"}`}>{t(item.key)}</span>
            {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-600" />}
          </button>
        );
      })}
    </nav>
  );
}
