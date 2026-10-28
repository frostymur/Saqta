import React from "react";
import { Shield, PhoneCall } from "lucide-react";

export default function CivicFooter({ onOpenStaff }) {
  return (
    <footer className="bg-white border-t border-slate-200 py-10 px-4 sm:px-8 text-xs text-slate-500 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
            <Shield className="w-4 h-4 text-emerald-200" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">
              Saqta<span className="text-emerald-700">.kz</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Официальная система мониторинга паводковой обстановки р. Есиль (г. Петропавловск)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-slate-600 text-xs">
          <span>МЧС Республики Казахстан</span>
          <span>•</span>
          <span>Акимат Северо-Казахстанской области</span>
          <span>•</span>
          <span>РГП «Казгидромет»</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenStaff}
            className="text-slate-400 hover:text-emerald-800 transition-colors"
          >
            Служебный вход ДЧС
          </button>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-400 text-[11px]">Digital Urpaq 2026</span>
        </div>
      </div>
    </footer>
  );
}
