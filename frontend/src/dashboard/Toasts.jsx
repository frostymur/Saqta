import React from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
  warning: AlertTriangle,
};

const TONES = {
  success: "border-emerald-200 bg-white text-slate-700",
  error: "border-red-200 bg-white text-slate-700",
  info: "border-slate-200 bg-white text-slate-700",
  warning: "border-amber-200 bg-white text-slate-700",
};

const ICON_TONES = {
  success: "bg-emerald-50 text-emerald-600",
  error: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-600",
  warning: "bg-amber-50 text-amber-600",
};

export default function Toasts({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-20 z-[80] flex flex-col items-end gap-2 md:inset-x-auto md:bottom-5 md:right-5"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-3 py-2.5 shadow-xl shadow-slate-900/10 ${
              TONES[toast.type] || TONES.info
            }`}
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${ICON_TONES[toast.type] || ICON_TONES.info}`}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <p className="min-w-0 flex-1 text-[11px] font-medium leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-slate-300 hover:text-slate-500"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
