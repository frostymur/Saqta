import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { formatRelative, riskMeta } from "./lib/format";

const READ_KEY = "saqta_read_alerts";

function loadReadIds() {
  try {
    const raw = localStorage.getItem(READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

export default function NotificationsBell({ alerts = [], t, lang = "en", onViewAll, onSelectAlert }) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(loadReadIds);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const sorted = useMemo(
    () => [...alerts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [alerts]
  );
  const unread = sorted.filter((alert) => !readIds.has(String(alert.id)));

  const persist = (next) => {
    setReadIds(next);
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...next]));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = () => {
    persist(new Set(sorted.map((alert) => String(alert.id))));
  };

  const openAlert = (alert) => {
    persist(new Set([...readIds, String(alert.id)]));
    setOpen(false);
    onSelectAlert?.(alert);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        title={t("header.notifications")}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
      >
        <Bell className="h-4 w-4" />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-[min(340px,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
          <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
            <div>
              <p className="text-[11px] font-bold text-slate-800">{t("notifications.title")}</p>
              <p className="text-[9px] text-slate-400">{t("notifications.regionNote")}</p>
            </div>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                title={t("notifications.markAll")}
                className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[9px] font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                <CheckCheck className="h-3 w-3" />
                <span className="hidden sm:inline">{t("notifications.unread", { n: unread.length })}</span>
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {sorted.length === 0 ? (
              <p className="px-4 py-8 text-center text-[11px] text-slate-400">{t("notifications.empty")}</p>
            ) : (
              sorted.slice(0, 12).map((alert) => {
                const isRead = readIds.has(String(alert.id));
                const meta = riskMeta(alert.risk_level);
                return (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => openAlert(alert)}
                    className={`flex w-full gap-2.5 border-b border-slate-50 px-3.5 py-2.5 text-left transition last:border-0 hover:bg-slate-50 ${
                      isRead ? "opacity-65" : ""
                    }`}
                  >
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[10px] font-bold text-slate-700">{alert.station_name}</span>
                        <span className="shrink-0 text-[8px] text-slate-400">
                          {formatRelative(alert.created_at, lang)}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[9px] leading-4 text-slate-500">
                        {alert.explanation}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onViewAll?.();
            }}
            className="w-full border-t border-slate-100 bg-slate-50/70 py-2 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            {t("notifications.viewAll")} →
          </button>
        </div>
      )}
    </div>
  );
}
