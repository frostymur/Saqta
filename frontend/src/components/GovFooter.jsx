import React from "react";
import { Shield, PhoneCall, Mail, MapPin, Globe, ExternalLink } from "lucide-react";

export default function GovFooter() {
  return (
    <footer className="bg-[#0A1D30] text-slate-300 font-sans border-t-2 border-amber-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Platform & Emblem */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-600/30 border border-sky-400/40 flex items-center justify-center text-amber-400">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-white">
                Saqta<span className="text-amber-400">.kz</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Единая государственная геоинформационная система мониторинга, гидрологического моделирования и раннего предупреждения паводков Республики Казахстан.
            </p>
            <div className="text-[11px] text-amber-300 font-medium pt-1">
              Проект разработан для хакатона Digital Urpaq 2026.
            </div>
          </div>

          {/* Col 2: Government Agencies */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-700 pb-1.5">
              Государственные органы
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <a href="https://gov.kz/memleket/entities/emer" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1 transition-colors">
                  МЧС Республики Казахстан <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://sko.gov.kz" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1 transition-colors">
                  Акимат Северо-Казахстанской области <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://kazhydromet.kz" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1 transition-colors">
                  РГП «Казгидромет» <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://egov.kz" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1 transition-colors">
                  Портал eGov.kz <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Sections & Emergency Nav */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-700 pb-1.5">
              Разделы платформы
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href="#map-section" className="hover:text-white transition-colors">Интерактивная карта р. Есиль</a></li>
              <li><a href="#ml-section" className="hover:text-white transition-colors">Предиктивная ML-модель</a></li>
              <li><a href="#bulletin-section" className="hover:text-white transition-colors">Оперативный бюллетень ДЧС</a></li>
              <li><a href="#simulator-section" className="hover:text-white transition-colors">Симулятор сценарных паводков</a></li>
              <li><a href="#citizen-section" className="hover:text-white transition-colors">Памятка населению г. Петропавловск</a></li>
            </ul>
          </div>

          {/* Col 4: Hotlines & Contacts */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-700 pb-1.5">
              Экстренные службы СКО
            </h4>
            <div className="space-y-2 text-slate-400">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <PhoneCall className="w-4 h-4 flex-shrink-0" />
                <span>Единая служба спасения: 112</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <PhoneCall className="w-4 h-4 flex-shrink-0 text-slate-500" />
                <span>Дежурная часть ДЧС: +7 (7152) 55-10-10</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4 flex-shrink-0 text-slate-500" />
                <span>г. Петропавловск, ул. Парковая, 57В</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            © 2026 «Saqta.kz». Барлық құқықтар қорғалған • Все права защищены.
          </div>
          <div className="font-mono text-slate-400">
            Digital Urpaq Hackathon • Версия платформы 1.0.0
          </div>
        </div>
      </div>
    </footer>
  );
}
