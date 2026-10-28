import React, { useState } from "react";
import { User, ShieldAlert, ArrowRight, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { loginUser } from "../api";

export default function LoginModal({ isOpen, onClose, onLoginSuccess, currentLang = "ru" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const t = {
    kk: {
      title: "Saqta.kz жүйесіне кіру",
      desc: "Жүйені тексеру үшін профильді таңдаңыз немесе жеке деректерді енгізіңіз",
      quickSelect: "Тестілеу үшін рөлді таңдаңыз:",
      citizenTitle: "Тестілік тұрғын (Қарапайым пайдаланушы)",
      citizenDesc: "Өз ауданының қауіпсіздігін, су деңгейін және эвакуация пункттерін тексеру",
      citizenBadge: "Қарапайым тұрғын",
      operatorTitle: "ТЖД кезекші операторы (Құтқару қызметі)",
      operatorDesc: "Шұғыл диспетчерлік басқару, гидрологиялық бюллетень, дабылдар",
      operatorBadge: "ТЖД / Құтқару қызметі",
      adminTitle: "Бас талдаушы / Әкімші",
      orManual: "немесе email арқылы кіру",
      emailLabel: "Электрондық пошта (Email)",
      passLabel: "Құпиясөз",
      submitBtn: "Жүйеге кіру",
      loadingBtn: "Тексерілуде...",
      instantLogin: "Бір рет басу арқылы кіру",
    },
    ru: {
      title: "Вход в систему Saqta.kz",
      desc: "Выберите профиль для проверки системы или введите свои учетные данные",
      quickSelect: "Быстрый выбор тестового аккаунта:",
      citizenTitle: "Тестовый гражданин (Обычный пользователь)",
      citizenDesc: "Проверка безопасности своего района, уровней воды и пунктов эвакуации",
      citizenBadge: "Обычный пользователь",
      operatorTitle: "Оператор ДЧС (Дежурный офицер)",
      operatorDesc: "Диспетчерский журнал, оперативная гидрологическая сводка, тревоги",
      operatorBadge: "Служба спасения",
      adminTitle: "Главный аналитик / Администратор",
      orManual: "или стандартный вход по паролю",
      emailLabel: "Электронная почта (Email)",
      passLabel: "Пароль",
      submitBtn: "Войти в систему",
      loadingBtn: "Авторизация...",
      instantLogin: "Войти в 1 клик",
    },
    en: {
      title: "Sign in to Saqta.kz",
      desc: "Select a test profile to explore the system or enter your credentials",
      quickSelect: "Quick test account selection:",
      citizenTitle: "Test Citizen (Regular User)",
      citizenDesc: "Check district flood safety, local water levels and nearest shelters",
      citizenBadge: "Regular Citizen",
      operatorTitle: "DChS Duty Operator (Rescue Service)",
      operatorDesc: "Dispatch incident triage, official hydrologic bulletin, and alerts",
      operatorBadge: "Rescue Operator",
      adminTitle: "Lead Analyst / Administrator",
      orManual: "or sign in with password",
      emailLabel: "Email address",
      passLabel: "Password",
      submitBtn: "Sign In",
      loadingBtn: "Authenticating...",
      instantLogin: "1-Click Sign In",
    },
  }[currentLang] || {
    title: "Вход в систему Saqta.kz",
    desc: "Выберите профиль для проверки системы или введите свои учетные данные",
    quickSelect: "Быстрый выбор тестового аккаунта:",
    citizenTitle: "Тестовый гражданин (Обычный пользователь)",
    citizenDesc: "Проверка безопасности своего района, уровней воды и пунктов эвакуации",
    citizenBadge: "Обычный пользователь",
    operatorTitle: "Оператор ДЧС (Дежурный офицер)",
    operatorDesc: "Диспетчерский журнал, оперативная гидрологическая сводка, тревоги",
    operatorBadge: "Служба спасения",
    adminTitle: "Главный аналитик / Администратор",
    orManual: "или стандартный вход по паролю",
    emailLabel: "Электронная почта (Email)",
    passLabel: "Пароль",
    submitBtn: "Войти в систему",
    loadingBtn: "Авторизация...",
    instantLogin: "Войти в 1 клик",
  };

  const handleLogin = async (loginEmail, loginPass) => {
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(loginEmail, loginPass);
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Ошибка авторизации. Проверьте логин и пароль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-slate-900">
              {t.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              {t.desc}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-3 flex items-start gap-2">
          <span className="text-red-500 font-bold">✕</span>
          <span>{error}</span>
        </div>
      )}

      {/* Быстрый выбор: Гражданин или Оператор */}
      <div className="space-y-2.5 my-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {t.quickSelect}
        </div>

        {/* 1. Тестовый гражданин */}
        <button
          type="button"
          onClick={() => {
            setSelectedRole("citizen");
            handleLogin("guest@saqta.kz", "guest123");
          }}
          className="w-full text-left p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-500 transition-all group flex items-center justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">
                  {t.citizenTitle}
                </span>
                <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {t.citizenBadge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t.citizenDesc}
              </p>
              <div className="text-[10px] text-emerald-700 font-mono mt-1">
                guest@saqta.kz
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 shrink-0 ml-2">
            <span className="hidden sm:inline text-[11px]">{t.instantLogin}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </button>

        {/* 2. Оператор ДЧС */}
        <button
          type="button"
          onClick={() => {
            setSelectedRole("operator");
            handleLogin("operator@saqta.kz", "oper123");
          }}
          className="w-full text-left p-3.5 rounded-2xl border border-sky-200 bg-sky-50/40 hover:bg-sky-50 hover:border-sky-500 transition-all group flex items-center justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">
                  {t.operatorTitle}
                </span>
                <span className="text-[9px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                  {t.operatorBadge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t.operatorDesc}
              </p>
              <div className="text-[10px] text-sky-700 font-mono mt-1">
                operator@saqta.kz
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 shrink-0 ml-2">
            <span className="hidden sm:inline text-[11px]">{t.instantLogin}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>

      <div className="flex items-center my-3">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="px-3 text-[10px] text-slate-400 uppercase font-semibold">
          {t.orManual}
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin(email, password);
        }}
        className="space-y-3"
      >
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            {t.emailLabel}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@saqta.kz"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            {t.passLabel}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs transition-all"
        >
          {loading ? t.loadingBtn : t.submitBtn}
        </Button>
      </form>
    </Dialog>
  );
}
