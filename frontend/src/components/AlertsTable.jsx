import React, { useState } from "react";
import { AlertTriangle, Send, CheckCheck, Clock, ShieldCheck, Filter } from "lucide-react";

export default function AlertsTable({ alerts, onProcessAlert, onSendTelegram, currentUser }) {
  const [filter, setFilter] = useState("all"); // 'all', 'new', 'processed'
  const [processingId, setProcessingId] = useState(null);
  const [telegramStatus, setTelegramStatus] = useState({});

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "new") return a.status === "new";
    if (filter === "processed") return a.status === "processed";
    return true;
  });

  const handleProcess = async (alertId) => {
    setProcessingId(alertId);
    try {
      await onProcessAlert(alertId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleTelegram = async (alertId) => {
    setTelegramStatus((prev) => ({ ...prev, [alertId]: "sending" }));
    try {
      const res = await onSendTelegram(alertId);
      setTelegramStatus((prev) => ({
        ...prev,
        [alertId]: res.success ? "success" : "error"
      }));
      setTimeout(() => {
        setTelegramStatus((prev) => ({ ...prev, [alertId]: null }));
      }, 4000);
    } catch {
      setTelegramStatus((prev) => ({ ...prev, [alertId]: "error" }));
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Журнал предупреждений и оперативных инцидентов
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Протокол фиксации опасных явлений и действий оперативной смены ДЧС
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              filter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Все ({alerts.length})
          </button>
          <button
            onClick={() => setFilter("new")}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              filter === "new" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Новые ({alerts.filter((a) => a.status === "new").length})
          </button>
          <button
            onClick={() => setFilter("processed")}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              filter === "processed" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Обработано
          </button>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">
          Нет предупреждений в выбранной категории
        </div>
      ) : (
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredAlerts.map((alert) => {
            const isHigh = alert.risk_level === "high";
            const isNew = alert.status === "new";
            const dateStr = new Date(alert.created_at).toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            });

            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isNew && isHigh
                    ? "bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60"
                    : isNew
                    ? "bg-amber-950/20 border-amber-800/40 hover:border-amber-700/60"
                    : "bg-slate-950/40 border-slate-800/60 opacity-80"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isHigh
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {isHigh ? "ВЫСОКИЙ РИСК" : "ПРЕДУПРЕЖДЕНИЕ"}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {alert.station_name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({alert.station_region})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-mono">{dateStr}</span>
                    <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-purple-300">
                      Прогноз 3ч: {alert.forecast_3h} см
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {alert.explanation}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    {isNew ? (
                      <span className="text-amber-400 font-medium flex items-center gap-1 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                        Ожидает подтверждения диспетчера
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                        <CheckCheck className="w-3.5 h-3.5" />
                        Обработано: <strong className="text-slate-200">{alert.processed_by || "Оператор ДЧС"}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Telegram Alert Button */}
                    <button
                      onClick={() => handleTelegram(alert.id)}
                      disabled={telegramStatus[alert.id] === "sending"}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
                      title="Экстренная рассылка в Telegram-канал ДЧС"
                    >
                      <Send className="w-3 h-3" />
                      <span>
                        {telegramStatus[alert.id] === "sending"
                          ? "Отправка..."
                          : telegramStatus[alert.id] === "success"
                          ? "✓ Отправлено в Telegram"
                          : telegramStatus[alert.id] === "error"
                          ? "Ошибка отправки"
                          : "Telegram оповещение"}
                      </span>
                    </button>

                    {/* Acknowledge Button for Operator/Admin */}
                    {isNew && (
                      <button
                        onClick={() => handleProcess(alert.id)}
                        disabled={processingId === alert.id}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{processingId === alert.id ? "Принятие..." : "Принять в работу"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
