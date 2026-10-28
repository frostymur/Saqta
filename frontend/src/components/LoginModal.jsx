import React, { useState } from "react";
import { X, Lock, Mail, Shield, User, ArrowRight } from "lucide-react";
import { loginUser } from "../api";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      onLoginSuccess(data.user, data.access_token);
      onClose();
    } catch (err) {
      setError(err.message || "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(demoEmail, demoPassword);
      onLoginSuccess(data.user, data.access_token);
      onClose();
    } catch (err) {
      setError(err.message || "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#10192D] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">
              Авторизация в Saqta.kz
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Demo Fast Login Buttons */}
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Демо-аккаунты для хакатона:
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            <button
              onClick={() => handleQuickLogin("operator@saqta.kz", "oper123")}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 transition-all text-left"
            >
              <div>
                <div className="font-bold text-sky-400">Оператор ДЧС СКО</div>
                <div className="text-[11px] text-slate-400">operator@saqta.kz / oper123</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
            <button
              onClick={() => handleQuickLogin("admin@saqta.kz", "admin123")}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 transition-all text-left"
            >
              <div>
                <div className="font-bold text-purple-400">Администратор системы</div>
                <div className="text-[11px] text-slate-400">admin@saqta.kz / admin123</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="px-2 text-[11px] text-slate-500 uppercase">или вход по паролю</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                placeholder="name@saqta.kz"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-xl text-xs shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "Авторизация..." : "Войти в систему"}
          </button>
        </form>
      </div>
    </div>
  );
}
