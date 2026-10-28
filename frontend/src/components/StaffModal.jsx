import React, { useState } from "react";
import { Lock, Shield, Mail, ArrowRight } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { loginUser } from "../api";

export default function StaffModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (loginEmail, loginPass) => {
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(loginEmail, loginPass);
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <DialogTitle>Служебный доступ ДЧС СКО</DialogTitle>
        </div>
        <DialogDescription>
          Вход для дежурной диспетчерской смены и гидрологических аналитиков
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs mb-3">
          {error}
        </div>
      )}

      {/* Demo Fast Logins for Jury */}
      <div className="space-y-2 mb-4">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Демо-доступ для проверки:
        </div>

        <button
          type="button"
          onClick={() => handleLogin("operator@saqta.kz", "oper123")}
          className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-between text-xs"
        >
          <div>
            <div className="font-bold text-slate-900">Оператор ДЧС СКО (Дежурная смена)</div>
            <div className="text-[11px] text-slate-500 font-mono">operator@saqta.kz / oper123</div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-700" />
        </button>

        <button
          type="button"
          onClick={() => handleLogin("admin@saqta.kz", "admin123")}
          className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-between text-xs"
        >
          <div>
            <div className="font-bold text-slate-900">Главный аналитик / Администратор</div>
            <div className="text-[11px] text-slate-500 font-mono">admin@saqta.kz / admin123</div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-700" />
        </button>
      </div>

      <div className="flex items-center my-3">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="px-2 text-[10px] text-slate-400 uppercase">или логин по паролю</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleLogin(email, password); }} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@saqta.kz"
            className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Пароль</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2"
        >
          {loading ? "Авторизация..." : "Войти в служебную систему"}
        </Button>
      </form>
    </Dialog>
  );
}
