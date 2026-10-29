import React, { Suspense, lazy, useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BrainCircuit,
  Check,
  ChevronRight,
  Code2,
  Cpu,
  Droplet,
  Globe,
  Menu,
  Search,
  ShieldCheck,
  Waves,
  X,
} from "lucide-react";
import LoginModal from "./components/LoginModal";
import { clearAuth, getStoredUser } from "./api";
import { TRANSLATIONS } from "./data/translations";

const Dashboard = lazy(() => import("./dashboard/Dashboard"));

/* ---------------------------------------------------------
   TINY PATHNAME ROUTER
   No dependency: window.location + popstate is enough for
   the two public entry points (landing and dashboard).
--------------------------------------------------------- */

function currentPath() {
  const path = window.location.pathname.replace(/\/+$/, "");
  return path || "/";
}

export function navigate(path) {
  if (window.location.pathname === path) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* =========================================================
   SAQTA.KZ LANDING PAGE
   Multi-language: English (en), Russian (ru), Kazakh (kk)
   React + Tailwind CSS + Lucide React
========================================================= */

/* ---------------------------------------------------------
   BRAND LOGO
--------------------------------------------------------- */

function SaqtaLogo() {
  return (
    <a
      href="#home"
      aria-label="Saqta.kz home"
      className="group flex shrink-0 items-center gap-3"
    >
      <div className="relative flex h-10 w-10 items-center justify-center">
        <Droplet
          className="h-10 w-10 fill-emerald-500 text-emerald-500 transition-transform duration-300 group-hover:scale-105"
          strokeWidth={1.5}
        />
        <Waves
          className="absolute bottom-[9px] left-[11px] h-4 w-4 text-white"
          strokeWidth={2}
        />
      </div>

      <span className="text-[20px] font-bold tracking-[-0.8px] text-slate-900">
        Saqta<span className="text-emerald-600">.kz</span>
      </span>
    </a>
  );
}

/* ---------------------------------------------------------
   HEADER
--------------------------------------------------------- */

function Header({ currentLang, onSelectLang, onLoginClick, currentUser, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.kk;

  const navigation = [
    { label: t.nav.features, href: "#features" },
    { label: t.nav.hardware, href: "#hardware" },
    { label: t.nav.alerts, href: "#alerts" },
    { label: t.nav.about, href: "#about" },
  ];

  const getRoleLabel = () => {
    if (!currentUser) return "";
    if (currentUser.role === "operator") {
      return currentLang === "kk" ? "🚨 ТЖД операторы" : currentLang === "en" ? "🚨 DChS Operator" : "🚨 Оператор ДЧС";
    }
    if (currentUser.role === "admin") {
      return currentLang === "kk" ? "⚙️ Әкімші" : currentLang === "en" ? "⚙️ Admin" : "⚙️ Администратор";
    }
    return currentLang === "kk" ? "👤 Тұрғын" : currentLang === "en" ? "👤 Citizen" : "👤 Гражданин";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-[78px]">
        {/* Logo */}
        <SaqtaLogo />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[13px] font-medium text-slate-500 transition-colors hover:text-emerald-600"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 lg:gap-5 md:flex">
          {/* Language Switcher */}
          <div className="flex items-center rounded-full border border-slate-200/90 bg-slate-50/90 p-0.5 text-[11px] font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => onSelectLang("kk")}
              className={`rounded-full px-2.5 py-1 transition-all ${
                currentLang === "kk"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ҚАЗ
            </button>
            <button
              type="button"
              onClick={() => onSelectLang("ru")}
              className={`rounded-full px-2.5 py-1 transition-all ${
                currentLang === "ru"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              РУС
            </button>
            <button
              type="button"
              onClick={() => onSelectLang("en")}
              className={`rounded-full px-2.5 py-1 transition-all ${
                currentLang === "en"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ENG
            </button>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                  currentUser.role === "operator" || currentUser.role === "admin"
                    ? "bg-sky-50 text-sky-800 border border-sky-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                <span>{getRoleLabel()}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="text-[11px] font-medium text-slate-400 hover:text-red-600 transition-colors px-1 py-1"
                title={t.nav.logout}
              >
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="text-[12px] font-semibold text-slate-700 hover:text-emerald-700 transition-colors px-2 py-1"
            >
              {t.nav.login}
            </button>
          )}

          <a
            href="/dashboard"
            onClick={(event) => {
              event.preventDefault();
              navigate("/dashboard");
            }}
            className="group inline-flex h-[42px] items-center justify-center gap-3 rounded-full bg-emerald-600 px-5 text-[12px] font-semibold text-white shadow-sm shadow-emerald-600/10 transition-all duration-200 hover:bg-emerald-700 hover:shadow-md"
          >
            {t.nav.openLiveMap}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              strokeWidth={2}
            />
          </a>
        </div>

        {/* Mobile Menu & Language Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile Language Switcher */}
          <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-semibold text-slate-600">
            {["kk", "ru", "en"].map((langCode) => (
              <button
                key={langCode}
                type="button"
                onClick={() => onSelectLang(langCode)}
                className={`rounded-full px-2 py-0.5 uppercase transition ${
                  currentLang === langCode
                    ? "bg-emerald-600 text-white"
                    : "text-slate-500"
                }`}
              >
                {langCode === "kk" ? "Қаз" : langCode === "ru" ? "Рус" : "Eng"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-5 py-5 md:hidden">
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
            {currentUser ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-900">{getRoleLabel()}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{currentUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="text-xs text-red-600 font-semibold px-2 py-1"
                >
                  {t.nav.logout}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:text-emerald-700"
              >
                {t.nav.login}
              </button>
            )}

            <a
              href="/dashboard"
              onClick={(event) => {
                event.preventDefault();
                setMobileMenuOpen(false);
                navigate("/dashboard");
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-semibold text-white"
            >
              {t.nav.openLiveMap}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------------------------------------------------
   HERO BADGE
--------------------------------------------------------- */

function HeroBadge({ t }) {
  return (
    <div className="inline-flex h-[30px] items-center gap-2 rounded-full border border-emerald-100/70 bg-emerald-50/80 px-3.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>

      <span className="text-[11px] font-semibold tracking-[0.1px] text-emerald-700">
        {t.hero.badgeRealtime}
      </span>

      <span className="text-emerald-400">•</span>

      <span className="text-[11px] font-semibold text-emerald-700">
        {t.hero.badgeIot}
      </span>

      <span className="text-emerald-400">•</span>

      <span className="text-[11px] font-semibold text-emerald-700">
        {t.hero.badgeAi}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------
   HERO DECORATIVE SVG
--------------------------------------------------------- */

function HeroDecoration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Main soft green glow */}
      <div className="absolute left-[42%] top-[10%] h-[360px] w-[360px] rounded-full bg-emerald-100/50 blur-[100px]" />

      {/* Water blue glow */}
      <div className="absolute right-[-120px] top-[28%] h-[300px] w-[300px] rounded-full bg-sky-100/60 blur-[100px]" />

      {/* Decorative water drop */}
      <svg
        viewBox="0 0 70 100"
        className="absolute left-[39%] top-[12%] h-[65px] w-[45px] rotate-12 text-emerald-300/70"
        fill="none"
      >
        <path
          d="M35 4C35 4 7 43 7 65C7 84 20 96 35 96C50 96 63 84 63 65C63 43 35 4 35 4Z"
          fill="currentColor"
        />
      </svg>

      {/* Decorative leaf */}
      <svg
        viewBox="0 0 100 100"
        className="absolute bottom-[18%] left-[38%] h-[44px] w-[44px] rotate-[-30deg] text-emerald-400/60"
      >
        <path
          d="M15 85C15 30 55 10 90 10C90 50 65 85 15 85Z"
          fill="currentColor"
        />
        <path
          d="M15 85L68 30"
          stroke="#ffffff"
          strokeWidth="2"
          opacity=".5"
        />
      </svg>

      {/* Right side water shapes */}
      <svg
        viewBox="0 0 240 400"
        className="absolute right-[-30px] top-[18%] hidden h-[380px] w-[180px] text-sky-100 lg:block"
        fill="none"
      >
        <path
          d="M240 10C150 50 100 120 100 190C100 255 140 315 240 360"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="100" cy="110" r="18" fill="#e0f2fe" />
        <circle cx="175" cy="220" r="10" fill="#d1fae5" />
        <circle cx="65" cy="300" r="14" fill="#e0f2fe" />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   MAP MOCKUP: DISTRICT SAFETY CHECK
--------------------------------------------------------- */

function MiniDistrictWidget({ t }) {
  const districts = [
    {
      name: t.mockup.districts.zarechny,
      status: t.mockup.statusDanger,
      danger: true,
    },
    {
      name: t.mockup.districts.kozhzavod,
      status: t.mockup.statusDanger,
      danger: true,
    },
    {
      name: t.mockup.districts.cityCenter,
      status: t.mockup.statusSafe,
      danger: false,
    },
    {
      name: t.mockup.districts.microdistrict20,
      status: t.mockup.statusSafe,
      danger: false,
    },
  ];

  return (
    <div className="absolute bottom-[-18px] left-[4%] z-20 w-[190px] rounded-xl border border-slate-100 bg-white/95 p-3 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:left-[5%] sm:w-[215px]">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-[9px] font-bold text-slate-800 truncate">
          {t.mockup.districtTitle}
        </span>
        <ChevronRight className="ml-auto h-3 w-3 text-slate-400" />
      </div>

      <div className="mb-2 flex h-[25px] items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2">
        <Search className="h-3 w-3 text-slate-400" />
        <span className="text-[8px] text-slate-400 truncate">
          {t.mockup.districtSearch}
        </span>
      </div>

      <div className="space-y-1">
        {districts.map((district) => (
          <div
            key={district.name}
            className="flex items-center gap-1.5 rounded-md px-1 py-1.5"
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                district.danger ? "bg-red-500" : "bg-emerald-500"
              }`}
            />

            <span className="min-w-0 flex-1 truncate text-[8px] font-medium text-slate-600">
              {district.name}
            </span>

            <span
              className={`whitespace-nowrap text-[7px] font-medium ${
                district.danger ? "text-red-500" : "text-emerald-600"
              }`}
            >
              {district.status}
            </span>

            <ChevronRight className="h-2.5 w-2.5 shrink-0 text-slate-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MAP MOCKUP: MAP BACKGROUND
--------------------------------------------------------- */

function MiniMap({ t }) {
  return (
    <svg
      viewBox="0 0 600 420"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="mini-map-grid"
          width="42"
          height="42"
          patternUnits="userSpaceOnUse"
        >
          <path d="M42 0H0V42" fill="none" stroke="#ffffff" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="600" height="420" fill="#edf5ee" />

      {/* Green parks */}
      <g fill="#d6ead7">
        <path d="M0 0H190L160 85L90 130L0 90Z" />
        <path d="M300 0H600V105L530 140L420 80Z" />
        <path d="M0 250L100 210L175 265L140 350L0 340Z" />
        <path d="M380 270L510 220L600 280V420H420Z" />
      </g>

      {/* City blocks */}
      <g fill="#e5eee3" stroke="#d5e2d4" strokeWidth="1">
        <path d="M150 95L240 80L285 140L230 190L150 170Z" />
        <path d="M300 100L400 85L450 140L420 190L325 180Z" />
        <path d="M180 210L280 190L330 250L290 320L190 300Z" />
        <path d="M360 205L470 190L500 255L450 320L350 290Z" />
      </g>

      {/* River */}
      <path
        d="M-20 80C80 120 130 150 170 200C215 260 275 280 335 250C390 220 410 170 470 200C520 225 550 290 620 330"
        fill="none"
        stroke="#b6e3f7"
        strokeWidth="24"
        strokeLinecap="round"
      />

      <path
        d="M-20 80C80 120 130 150 170 200C215 260 275 280 335 250C390 220 410 170 470 200C520 225 550 290 620 330"
        fill="none"
        stroke="#d9f1fc"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Roads */}
      <g fill="none" stroke="#ffffff" strokeWidth="5">
        <path d="M0 130L150 160L300 140L450 170L600 130" />
        <path d="M0 220L140 205L290 245L440 215L600 240" />
        <path d="M80 0L110 140L90 300L140 420" />
        <path d="M280 0L300 150L260 280L310 420" />
        <path d="M480 0L450 140L490 270L450 420" />
      </g>

      {/* Risk zone */}
      <path
        d="M20 110L150 95L215 150L230 215L180 265L90 240L30 190Z"
        fill="#f87171"
        fillOpacity=".18"
        stroke="#f87171"
        strokeOpacity=".65"
        strokeWidth="1.5"
      />

      <path
        d="M360 220L450 185L535 220L560 290L510 340L420 330L360 275Z"
        fill="#f87171"
        fillOpacity=".18"
        stroke="#f87171"
        strokeOpacity=".65"
        strokeWidth="1.5"
      />

      {/* Safe zone */}
      <path
        d="M360 20L475 15L565 70L550 150L450 170L370 115Z"
        fill="#22c55e"
        fillOpacity=".12"
        stroke="#4ade80"
        strokeOpacity=".65"
        strokeWidth="1.5"
      />

      {/* Grid */}
      <rect width="600" height="420" fill="url(#mini-map-grid)" />

      {/* Map labels */}
      <g fontFamily="Arial, sans-serif" fontSize="10" fill="#64748b">
        <text x="110" y="60">Moyynkum</text>
        <text x="380" y="60">Kishkenekol</text>
        <text x="70" y="290">Bulaevo</text>
        <text x="455" y="350">Rassvet</text>
        <text x="270" y="360">Shagalaly</text>
      </g>

      <text
        x="230"
        y="220"
        fontFamily="Arial, sans-serif"
        fontSize="15"
        fontWeight="600"
        fill="#334155"
      >
        Petropavlovsk
      </text>

      {/* Station markers */}
      <g>
        <circle cx="300" cy="160" r="18" fill="#ef4444" fillOpacity=".15" />
        <circle cx="300" cy="160" r="10" fill="#ef4444" stroke="white" strokeWidth="2" />
        <path
          d="M294 160H306M300 154V166"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <circle cx="180" cy="210" r="13" fill="#10b981" fillOpacity=".15" />
        <circle cx="180" cy="210" r="7" fill="#059669" stroke="white" strokeWidth="2" />

        <circle cx="400" cy="140" r="13" fill="#10b981" fillOpacity=".15" />
        <circle cx="400" cy="140" r="7" fill="#059669" stroke="white" strokeWidth="2" />

        <circle cx="240" cy="300" r="13" fill="#10b981" fillOpacity=".15" />
        <circle cx="240" cy="300" r="7" fill="#059669" stroke="white" strokeWidth="2" />

        <circle cx="470" cy="280" r="13" fill="#10b981" fillOpacity=".15" />
        <circle cx="470" cy="280" r="7" fill="#059669" stroke="white" strokeWidth="2" />
      </g>

      {/* Map pills */}
      <g>
        <rect x="105" y="115" width="105" height="20" rx="10" fill="#ef4444" />
        <text x="115" y="128" fontSize="8" fontWeight="600" fill="white">
          {t.mockup.zoneActive}
        </text>

        <rect x="410" y="105" width="85" height="20" rx="10" fill="#059669" />
        <text x="421" y="118" fontSize="8" fontWeight="600" fill="white">
          {t.mockup.zoneSafe}
        </text>

        <rect x="425" y="300" width="85" height="20" rx="10" fill="#059669" />
        <text x="436" y="313" fontSize="8" fontWeight="600" fill="white">
          {t.mockup.zoneSafe}
        </text>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------
   DASHBOARD MOCKUP: WATER LEVEL GRAPH
--------------------------------------------------------- */

function MiniWaterGraph() {
  return (
    <svg viewBox="0 0 300 100" className="h-full w-full" fill="none">
      {/* Grid */}
      <g stroke="#e9eef5" strokeWidth="1">
        <path d="M25 10H290" />
        <path d="M25 35H290" />
        <path d="M25 60H290" />
        <path d="M25 85H290" />

        <path d="M25 10V85" />
        <path d="M90 10V85" />
        <path d="M155 10V85" />
        <path d="M220 10V85" />
        <path d="M290 10V85" />
      </g>

      {/* Critical line */}
      <path
        d="M25 48H290"
        stroke="#f87171"
        strokeDasharray="4 4"
        strokeWidth="1.5"
      />

      {/* Water graph */}
      <path
        d="M25 75L45 73L65 72L85 60L105 58L125 55L145 45L165 43L185 38L205 42L225 33L245 28L265 25L290 17V85H25Z"
        fill="#60a5fa"
        fillOpacity=".10"
      />

      <path
        d="M25 75L45 73L65 72L85 60L105 58L125 55L145 45L165 43L185 38L205 42L225 33L245 28L265 25L290 17"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="290"
        cy="17"
        r="3.5"
        fill="#ef4444"
        stroke="white"
        strokeWidth="1.5"
      />

      {/* Labels */}
      <g fontFamily="Arial, sans-serif" fontSize="7" fill="#94a3b8">
        <text x="3" y="13">7.0</text>
        <text x="3" y="38">5.0</text>
        <text x="3" y="63">3.0</text>
        <text x="3" y="88">1.0</text>

        <text x="25" y="98">00:00</text>
        <text x="85" y="98">04:00</text>
        <text x="145" y="98">08:00</text>
        <text x="205" y="98">12:00</text>
        <text x="265" y="98">20:00</text>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------
   DASHBOARD MOCKUP: STATION PANEL
--------------------------------------------------------- */

function MiniStationPanel({ t }) {
  return (
    <div className="absolute right-0 top-[4%] z-10 w-[43%] rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-xl shadow-slate-900/5 backdrop-blur-md">
      {/* Station header */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
          <Waves className="h-3 w-3" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-bold text-slate-800">
            {t.mockup.stationTitle}
          </p>

          <p className="mt-0.5 truncate text-[6px] text-slate-400">
            {t.mockup.stationSub}
          </p>
        </div>

        <span className="rounded-full bg-red-50 px-2 py-1 text-[6px] font-semibold text-red-500">
          {t.mockup.riskHigh}
        </span>
      </div>

      {/* Metrics */}
      <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 rounded-lg border border-slate-100 px-2 py-2">
        <div className="pr-1">
          <p className="text-[6px] text-slate-400 truncate">
            {t.mockup.currentLevel}
          </p>
          <p className="mt-1 text-[11px] font-bold text-slate-800">
            5.42 m
          </p>
          <p className="mt-0.5 text-[6px] font-semibold text-red-500">
            ↑ +0.38 m (1h)
          </p>
        </div>

        <div className="px-2">
          <p className="text-[6px] text-slate-400 truncate">
            {t.mockup.criticalLevel}
          </p>
          <p className="mt-1 text-[11px] font-bold text-slate-800">
            4.50 m
          </p>
        </div>

        <div className="pl-2">
          <p className="text-[6px] text-slate-400 truncate">
            {t.mockup.statusLabel}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[6px] font-semibold text-red-500">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {t.mockup.statusAboveCrit}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[8px] font-bold text-slate-700">
            {t.mockup.trendTitle}
          </p>
          <span className="rounded-full bg-emerald-600 px-2 py-1 text-[6px] font-semibold text-white">
            24h
          </span>
        </div>

        <div className="h-[100px]">
          <MiniWaterGraph />
        </div>
      </div>

      {/* Alert */}
      <div className="mt-3 rounded-lg border border-red-100 bg-red-50/80 p-2">
        <div className="flex items-start gap-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
            <BellRing className="h-2.5 w-2.5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[7px] font-bold text-red-600">
              {t.mockup.alertTitle}
            </p>
            <p className="mt-1 text-[6px] leading-[10px] text-slate-500">
              {t.mockup.alertDesc}
            </p>
            <span className="mt-1 inline-flex rounded border border-red-100 bg-white px-2 py-1 text-[6px] font-semibold text-emerald-600">
              {t.mockup.viewAlerts}
            </span>
          </div>
        </div>
      </div>

      {/* Station info */}
      <div className="mt-3 rounded-lg border border-slate-100 p-2">
        <p className="mb-2 text-[7px] font-bold text-slate-700">
          {t.mockup.stationInfo}
        </p>

        <div className="space-y-1.5 text-[6px] text-slate-400">
          <div className="flex justify-between gap-2">
            <span>{t.mockup.locationLabel}</span>
            <span className="text-slate-500">{t.mockup.locationVal}</span>
          </div>

          <div className="flex justify-between gap-2">
            <span>{t.mockup.coordsLabel}</span>
            <span className="text-slate-500">54.8756° N, 69.1523° E</span>
          </div>

          <div className="flex justify-between gap-2">
            <span>{t.mockup.updateLabel}</span>
            <span className="text-slate-500">10:42, 24 Oct 2026</span>
          </div>

          <div className="flex justify-between gap-2">
            <span>{t.mockup.signalLabel}</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t.mockup.signalVal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   DASHBOARD MOCKUP
--------------------------------------------------------- */

function DashboardMockup({ t }) {
  return (
    <div
      id="live-map"
      className="relative mx-auto w-full max-w-[850px] overflow-visible"
    >
      {/* Background glow */}
      <div className="absolute inset-[-8%] rounded-[50%] bg-emerald-100/50 blur-[75px]" />

      {/* Main dashboard */}
      <div className="relative z-10 overflow-visible rounded-[18px] border border-slate-200/80 bg-white/90 p-2 shadow-[0_30px_80px_-25px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-3">
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
          {/* Dashboard navbar */}
          <div className="flex h-[35px] items-center gap-3 border-b border-slate-100 px-3">
            <div className="flex items-center gap-1.5">
              <Droplet className="h-3 w-3 fill-emerald-500 text-emerald-500" />
              <span className="text-[7px] font-bold text-slate-800">
                Saqta.kz
              </span>
            </div>

            <div className="flex h-[18px] min-w-0 flex-1 items-center gap-1.5 rounded-md border border-slate-100 bg-slate-50 px-2">
              <Search className="h-2.5 w-2.5 text-slate-400" />
              <span className="truncate text-[6px] text-slate-400">
                {t.mockup.searchPlaceholder}
              </span>
            </div>

            <span className="text-[6px] font-medium text-slate-400">
              {t.mockup.guestObserver}
            </span>
          </div>

          {/* Dashboard content */}
          <div className="relative h-[330px] sm:h-[390px]">
            {/* Map */}
            <div className="absolute inset-0">
              <MiniMap t={t} />
            </div>

            {/* Map controls */}
            <div className="absolute left-2 top-2 z-10 flex overflow-hidden rounded-md bg-white shadow-sm">
              <span className="bg-emerald-600 px-3 py-1.5 text-[6px] font-semibold text-white">
                {t.mockup.map}
              </span>
              <span className="px-3 py-1.5 text-[6px] font-medium text-slate-500">
                {t.mockup.satellite}
              </span>
            </div>

            {/* District widget */}
            <MiniDistrictWidget t={t} />

            {/* Station details */}
            <MiniStationPanel t={t} />

            {/* Map legend */}
            <div className="absolute bottom-2 right-[45%] z-10 hidden rounded-md border border-slate-100 bg-white/95 px-2 py-1.5 shadow-sm sm:block">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[6px] text-slate-500">
                    {t.mockup.legendNormal}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="text-[6px] text-slate-500">
                    {t.mockup.legendElevated}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span className="text-[6px] text-slate-500">
                    {t.mockup.legendRisk}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative glass shadow */}
        <div className="absolute inset-x-[8%] bottom-[-18px] -z-10 h-8 rounded-full bg-emerald-200/40 blur-2xl" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MOBILE PHONE
--------------------------------------------------------- */

function MobileNotification({ t }) {
  return (
    <div className="absolute bottom-[-40px] right-[-12px] z-30 w-[170px] rotate-[8deg] sm:bottom-[-48px] sm:right-[-38px] sm:w-[178px] lg:right-[-62px] lg:w-[185px]">
      {/* Phone shadow */}
      <div className="absolute inset-0 translate-y-4 scale-95 rounded-[30px] bg-slate-900/20 blur-xl" />

      {/* Phone body */}
      <div className="relative aspect-[9/19.5] rounded-[27px] border-[3px] border-slate-800 bg-slate-900 p-[4px] shadow-[0_25px_50px_-15px_rgba(15,23,42,0.45)]">
        {/* Screen */}
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[22px] bg-gradient-to-b from-[#163d4c] via-[#0c3541] to-[#06303b]">
          {/* Status bar */}
          <div className="flex items-center justify-between px-3 pt-2.5 text-[6px] text-white/80 sm:pt-3">
            <span>{t.phone.time}</span>
            <div className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-white/80" />
              <span className="h-1 w-2 rounded-sm bg-white/80" />
            </div>
          </div>

          {/* Dynamic island */}
          <div className="absolute left-1/2 top-[5px] h-[7px] w-[38px] -translate-x-1/2 rounded-full bg-black" />

          {/* Clock */}
          <div className="px-3 pb-1.5 pt-4 text-center sm:pb-2 sm:pt-6">
            <p className="text-[24px] font-light tracking-[-1px] text-white sm:text-[32px]">
              {t.phone.time}
            </p>
            <p className="mt-0.5 hidden text-[7px] text-white/65 sm:block">
              {t.phone.date}
            </p>
          </div>

          {/* Notification */}
          <div className="mx-2 mb-2 overflow-hidden rounded-xl border border-white/10 bg-white/10 p-2 backdrop-blur-md sm:mb-3 sm:p-2.5">
            {/* Telegram header */}
            <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500">
                <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-white">
                  <path d="M21.4 3.6L18.2 20c-.2 1.2-.9 1.5-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L5.6 13.7.8 12.2c-1-.3-1-1 .2-1.5L20 3.3c.9-.4 1.7.2 1.4.3Z" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[6px] font-semibold text-white">
                  {t.phone.sender}
                </p>
                <p className="text-[5px] text-white/50">
                  {t.phone.statusNow}
                </p>
              </div>

              <span className="text-[5px] text-white/40">
                {t.phone.tag}
              </span>
            </div>

            {/* Alert */}
            <div className="rounded-lg border border-red-400/20 bg-gradient-to-br from-red-500 to-red-600 p-2 shadow-lg shadow-red-950/20 sm:p-2.5">
              <div className="mb-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/15 sm:mb-2 sm:h-6 sm:w-6">
                <BellRing className="h-3 w-3 text-white sm:h-3.5 sm:w-3.5" />
              </div>

              <p className="text-[8px] font-bold leading-tight text-white">
                {t.phone.alertTitle}
              </p>

              <p className="mt-0.5 text-[6px] leading-[9px] text-white/85 sm:mt-1 sm:leading-[10px]">
                {t.phone.alertDesc}
              </p>

              <div className="mt-1.5 rounded-md bg-white/15 px-2 py-1 text-center sm:mt-2 sm:py-1.5">
                <span className="text-[6px] font-semibold text-white">
                  {t.phone.detailsBtn}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom phone bar */}
          <div className="flex justify-center pb-1.5 sm:pb-2">
            <div className="h-[3px] w-[35px] rounded-full bg-white/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   HERO SECTION
--------------------------------------------------------- */

function HeroSection({ t }) {
  return (
    <section id="home" className="relative overflow-hidden bg-white">
      <HeroDecoration />

      <div className="relative mx-auto grid max-w-[1600px] items-center gap-16 px-5 pb-24 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10 lg:px-12 lg:pb-[105px] lg:pt-[65px] xl:px-[78px]">
        {/* Left: Copy */}
        <div className="relative z-10 max-w-[540px]">
          <HeroBadge t={t} />

          <h1 className="mt-7 text-[42px] font-bold leading-[1.12] tracking-[-2.1px] text-slate-900 sm:text-[52px] lg:text-[52px] xl:text-[58px]">
            {t.hero.titleLine1}
            <br />
            <span className="block">
              {t.hero.titleLine2Prefix}
              <span className="text-emerald-600">
                {t.hero.titleLine2Accent}
              </span>
            </span>
            <span className="block text-emerald-600">
              {t.hero.titleLine3}
            </span>
          </h1>

          <p className="mt-6 max-w-[440px] text-[15px] leading-[1.8] text-slate-500 sm:text-[16px]">
            {t.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <a
              href="/dashboard"
              onClick={(event) => {
                event.preventDefault();
                navigate("/dashboard");
              }}
              className="group inline-flex h-[46px] items-center justify-center gap-3 rounded-full bg-emerald-600 px-6 text-[12px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg"
            >
              {t.hero.ctaMap}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </a>

            <a
              href="#hardware"
              className="group inline-flex h-[46px] items-center justify-center gap-3 rounded-full border border-emerald-500 bg-white/80 px-6 text-[12px] font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              {t.hero.ctaTech}
              <Code2
                className="h-[15px] w-[15px] transition-transform group-hover:scale-110"
                strokeWidth={2}
              />
            </a>
          </div>

          {/* Small decorative leaf */}
          <svg
            aria-hidden="true"
            viewBox="0 0 60 100"
            className="pointer-events-none absolute -right-2 top-[10%] hidden h-[65px] w-[45px] rotate-[-20deg] text-emerald-300/60 lg:block"
          >
            <path
              d="M30 95C5 65 0 25 50 5C60 55 50 80 30 95Z"
              fill="currentColor"
            />
            <path
              d="M30 95L45 25"
              stroke="white"
              strokeWidth="2"
              opacity=".7"
            />
          </svg>
        </div>

        {/* Right: Dashboard composite */}
        <div className="relative z-10 min-w-0 lg:ml-[-20px]">
          <DashboardMockup t={t} />
          <MobileNotification t={t} />

          {/* Small floating leaf */}
          <svg
            aria-hidden="true"
            viewBox="0 0 80 80"
            className="pointer-events-none absolute -left-6 top-[12%] hidden h-8 w-8 rotate-[-35deg] text-emerald-400/70 sm:block"
          >
            <path
              d="M10 70C10 25 40 5 70 5C70 40 50 70 10 70Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   FEATURE DECORATION
--------------------------------------------------------- */

function FeatureDecoration({ type }) {
  if (type === "waves") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 300 110"
        preserveAspectRatio="none"
        className="absolute bottom-0 right-0 h-[95px] w-[190px] opacity-70"
      >
        <path
          d="M0 90C50 85 75 55 115 55C165 55 190 95 230 75C260 60 280 30 300 20V110H0Z"
          fill="#d1fae5"
        />
        <path
          d="M0 100C50 95 80 75 120 80C170 85 205 110 245 90C270 75 285 55 300 45V110H0Z"
          fill="#a7f3d0"
          opacity=".7"
        />
        <path
          d="M0 100C55 95 90 85 125 90C180 95 215 110 255 100"
          stroke="#6ee7b7"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    );
  }

  if (type === "chart") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 300 110"
        preserveAspectRatio="none"
        className="absolute bottom-0 right-0 h-[95px] w-[200px] opacity-70"
      >
        <path
          d="M0 110L0 95L40 90L75 65L115 80L155 40L190 60L225 20L260 35L300 0V110Z"
          fill="#dbeafe"
          opacity=".7"
        />
        <path
          d="M0 95L40 90L75 65L115 80L155 40L190 60L225 20L260 35L300 0"
          stroke="#7dd3fc"
          strokeWidth="2"
          fill="none"
        />
        <g fill="#7dd3fc">
          <circle cx="75" cy="65" r="3" />
          <circle cx="155" cy="40" r="3" />
          <circle cx="225" cy="20" r="3" />
          <circle cx="300" cy="0" r="3" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 110"
      preserveAspectRatio="none"
      className="absolute bottom-0 right-0 h-[95px] w-[190px] opacity-70"
    >
      <path
        d="M0 110V95C50 95 65 70 110 75C160 80 190 110 230 85C260 65 280 45 300 45V110Z"
        fill="#d1fae5"
      />
      <path
        d="M0 100C45 100 70 85 110 90C165 95 190 110 235 100C270 90 285 75 300 70"
        stroke="#6ee7b7"
        strokeWidth="1.5"
        fill="none"
      />
      <g transform="translate(205 25) rotate(-15)">
        <path d="M0 30C0 10 20 0 40 0C40 20 20 35 0 30Z" fill="#6ee7b7" />
        <path d="M0 30L30 5" stroke="#ffffff" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------
   FEATURE CARD
--------------------------------------------------------- */

function FeatureCard({ card }) {
  const Icon =
    card.id === "iot"
      ? Cpu
      : card.id === "prediction"
      ? BrainCircuit
      : BellRing;

  const iconColor = card.id === "prediction" ? "text-blue-500" : "text-emerald-600";
  const iconBg = card.id === "prediction" ? "bg-blue-50" : "bg-emerald-50";

  return (
    <a
      id={card.id === "iot" ? "hardware" : card.id}
      href={`#${card.id}`}
      className="group relative flex min-h-[235px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_-10px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_16px_35px_-15px_rgba(15,23,42,0.12)] sm:p-7"
    >
      {/* Decoration */}
      <FeatureDecoration type={card.decoration} />

      {/* Card content */}
      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div
          className={`flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-2xl ${iconBg} transition-transform duration-300 group-hover:scale-105`}
        >
          <Icon className={`h-[30px] w-[30px] ${iconColor}`} strokeWidth={1.9} />
        </div>

        {/* Title and subtitle */}
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="text-[16px] font-bold tracking-[-0.35px] text-slate-800">
            {card.title}
          </h3>

          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            {card.subtitle}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="relative z-10 mt-5 max-w-[330px] text-[11px] leading-[19px] text-slate-500">
        {card.description}
      </p>

      {/* Footer arrow */}
      <div className="relative z-10 mt-auto flex items-center pt-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-600 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-emerald-50">
          <ArrowRight className="h-[18px] w-[18px]" />
        </span>
      </div>
    </a>
  );
}

/* ---------------------------------------------------------
   FEATURES SECTION
--------------------------------------------------------- */

function FeaturesSection({ t }) {
  return (
    <section
      id="features"
      className="relative bg-white px-5 pb-20 pt-8 sm:px-8 lg:px-12 lg:pb-24 xl:px-[78px]"
    >
      <div className="mx-auto max-w-[1600px]">
        {/* Section heading */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[1.8px] text-emerald-600">
              {t.features.kicker}
            </span>

            <h2 className="mt-2 text-[25px] font-bold tracking-[-1px] text-slate-900 sm:text-[30px]">
              {t.features.title}
            </h2>
          </div>

          <p className="max-w-[380px] text-[12px] leading-6 text-slate-500">
            {t.features.desc}
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {t.features.cards.map((card) => (
            <FeatureCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   FOOTER
--------------------------------------------------------- */

function Footer({ t }) {
  return (
    <footer
      id="about"
      className="border-t border-slate-100 bg-white px-5 py-7 sm:px-8 lg:px-12 xl:px-[78px]"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <SaqtaLogo />

        <p className="text-[11px] text-slate-400">
          {t.footer.copyright}
        </p>

        <a
          href="#home"
          className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 transition hover:text-emerald-600"
        >
          {t.footer.backToTop}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------
   MAIN PAGE
--------------------------------------------------------- */

export default function App() {
  const [path, setPath] = useState(currentPath);
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem("saqta_lang") || "kk";
  });
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginToast, setLoginToast] = useState(null);

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const syncAuth = () => setCurrentUser(getStoredUser());
    window.addEventListener("saqta-auth", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("saqta-auth", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const handleSelectLang = (lang) => {
    setCurrentLang(lang);
    localStorage.setItem("saqta_lang", lang);
  };

  const handleLoginSuccess = (user) => {
    const storedUser = getStoredUser() || user || null;
    setCurrentUser(storedUser);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    setLoginToast(
      currentLang === "kk"
        ? "Жүйеден шығу орындалды"
        : currentLang === "en"
        ? "Logged out"
        : "Вы вышли из учетной записи"
    );
    setTimeout(() => setLoginToast(null), 3000);
    navigate("/");
  };

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.kk;

  if (path === "/dashboard") {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
              <span className="text-xs font-semibold text-slate-500">Saqta.kz</span>
            </div>
          </div>
        }
      >
        <Dashboard
          currentLang={currentLang}
          onSelectLang={handleSelectLang}
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
      </Suspense>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {loginToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{loginToast}</span>
        </div>
      )}

      <Header
        currentLang={currentLang}
        onSelectLang={handleSelectLang}
        onLoginClick={() => setIsLoginOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <HeroSection t={t} />

      <FeaturesSection t={t} />

      <Footer t={t} />

      {/* Login Modal with Citizen and Operator quick switch */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentLang={currentLang}
      />
    </main>
  );
}
