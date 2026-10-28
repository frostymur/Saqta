import React, { useState } from "react";
import { QrCode, KeyRound, Lock, Mail, Shield, Check, ArrowRight } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import { loginUser } from "../api";

export default function GovAuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
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

  const handleQuickDemo = async (demoEmail, demoPassword) => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
            <Shield className="w-4 h-4 text-sky-700" />
          </div>
          <DialogTitle>Авторизация в системе «Saqta.kz»</DialogTitle>
        </div>
        <DialogDescription>
          Единая точка безопасного доступа к ресурсам оперативного мониторинга МЧС РК
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="demo" className="mt-2">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="demo">Демо (Хакатон)</TabsTrigger>
          <TabsTrigger value="egov">eGov QR</TabsTrigger>
          <TabsTrigger value="eds">ЭЦП (NCALayer)</TabsTrigger>
        </TabsList>

        {/* Tab 1: Demo Quick Access for Hackathon Jury */}
        <TabsContent value="demo" className="space-y-3 pt-2">
          <div className="text-xs text-slate-600">
            Для проверки функций системы используйте подготовленные аккаунты с разными уровнями доступа:
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleQuickDemo("operator@saqta.kz", "oper123")}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-sky-800">Оператор ДЧС СКО</div>
                <div className="text-[11px] text-slate-500 font-mono">operator@saqta.kz / oper123</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleQuickDemo("admin@saqta.kz", "admin123")}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-purple-800">Главный аналитик / Администратор</div>
                <div className="text-[11px] text-slate-500 font-mono">admin@saqta.kz / admin123</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => {
                onLoginSuccess({ full_name: "Гражданский наблюдатель", role: "guest" }, "");
                onClose();
              }}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-emerald-800">Гость / Гражданский режим</div>
                <div className="text-[11px] text-slate-500">Публичный мониторинг без пароля</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </TabsContent>

        {/* Tab 2: eGov QR */}
        <TabsContent value="egov" className="pt-2 text-center space-y-3">
          <div className="w-48 h-48 mx-auto bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-4">
            <QrCode className="w-32 h-32 text-slate-800" />
          </div>
          <p className="text-xs text-slate-600">
            Отсканируйте QR-код в мобильном приложении <strong>eGov Mobile</strong> для входа
          </p>
          <Button
            variant="govPrimary"
            size="sm"
            onClick={() => handleQuickDemo("operator@saqta.kz", "oper123")}
            className="w-full text-xs font-semibold"
          >
            Имитировать успешное сканирование QR eGov
          </Button>
        </TabsContent>

        {/* Tab 3: EDS / ЭЦП */}
        <TabsContent value="eds" className="pt-2 text-center space-y-3">
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <KeyRound className="w-10 h-10 text-sky-700 mx-auto" />
            <div className="text-xs font-bold text-slate-800">
              Поиск запущенного модуля NCALayer...
            </div>
            <p className="text-[11px] text-slate-500">
              Убедитесь, что приложение NCALayer запущено на вашем компьютере для выбора сертификата ГОСТ/RSA.
            </p>
          </div>
          <Button
            variant="govNavy"
            size="sm"
            onClick={() => handleQuickDemo("admin@saqta.kz", "admin123")}
            className="w-full text-xs font-semibold"
          >
            Выбрать сертификат ЭЦП (Тестовый ключ)
          </Button>
        </TabsContent>
      </Tabs>
    </Dialog>
  );
}
