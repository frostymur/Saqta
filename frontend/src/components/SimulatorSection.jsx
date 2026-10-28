import React, { useState } from "react";
import { Play, Pause, StepForward, Zap, Shield, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export default function SimulatorSection({
  onTriggerStep,
  onStartSimulation,
  onStopSimulation,
  onSetScenario,
  isSimulating,
  wsConnected
}) {
  const [activeScenario, setActiveScenario] = useState("spring_flood_surge");
  const [loadingStep, setLoadingStep] = useState(false);

  const handleSelectScenario = async (sc) => {
    setActiveScenario(sc);
    await onSetScenario(sc, 1.2);
  };

  const handleStep = async () => {
    setLoadingStep(true);
    try {
      await onTriggerStep();
    } finally {
      setLoadingStep(false);
    }
  };

  return (
    <section id="simulator-section" className="py-12 px-4 sm:px-8 bg-slate-100 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <Card className="border-slate-300 shadow-sm bg-white overflow-hidden">
          {/* Header Bar */}
          <div className="bg-[#0F2942] text-white p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white">
                    Интерактивный симулятор гидрологических сценариев ЧС
                  </h3>
                  <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[10px]">
                    ДЕМО ХАКАТОНА
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Моделирование сброса плотины Сергеевского водохранилища и прохождения волны по руслу р. Есиль в реальном времени
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${wsConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-slate-300 font-mono">
                {wsConnected ? "WebSocket активен" : "Подключение к шине..."}
              </span>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Scenarios Buttons */}
              <div className="w-full lg:w-auto">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Выберите сценарный режим для тестирования:
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={activeScenario === "spring_flood_surge" ? "govPrimary" : "outline"}
                    size="sm"
                    onClick={() => handleSelectScenario("spring_flood_surge")}
                    className="font-medium text-xs"
                  >
                    🌊 Весенний паводок (нарастание волны)
                  </Button>
                  <Button
                    type="button"
                    variant={activeScenario === "dam_spillover_crit" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleSelectScenario("dam_spillover_crit")}
                    className="font-medium text-xs"
                  >
                    🚨 Крит. сброс Сергеевки (&gt;1100 см)
                  </Button>
                  <Button
                    type="button"
                    variant={activeScenario === "heavy_rainfall" ? "govPrimary" : "outline"}
                    size="sm"
                    onClick={() => handleSelectScenario("heavy_rainfall")}
                    className="font-medium text-xs"
                  >
                    🌧️ Штормовой ливень (20 мм/ч)
                  </Button>
                  <Button
                    type="button"
                    variant={activeScenario === "normal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectScenario("normal")}
                    className="font-medium text-xs"
                  >
                    ✅ Штатный гидрорежим (норма)
                  </Button>
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                <Button
                  variant="outline"
                  size="default"
                  disabled={loadingStep}
                  onClick={handleStep}
                  className="font-semibold text-slate-700 hover:text-slate-900 border-slate-300 shadow-sm"
                >
                  <StepForward className="w-4 h-4 mr-1.5" />
                  +1 Шаг замеров
                </Button>

                {isSimulating ? (
                  <Button
                    variant="destructive"
                    size="default"
                    onClick={onStopSimulation}
                    className="bg-red-600 hover:bg-red-700 font-bold shadow-md shadow-red-600/30"
                  >
                    <Pause className="w-4 h-4 mr-1.5" />
                    Приостановить Live-поток
                  </Button>
                ) : (
                  <Button
                    variant="govNavy"
                    size="default"
                    onClick={onStartSimulation}
                    className="bg-[#0F2942] hover:bg-blue-900 text-white font-bold shadow-md"
                  >
                    <Play className="w-4 h-4 mr-1.5 text-amber-400" />
                    Запустить Live-поток (каждые 3 сек)
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>
                💡 <strong>Подсказка для жюри:</strong> При запуске симуляции новые замеры сразу отправляются через WebSocket на карту, в графики и в журнал оповещений ДЧС.
              </span>
              <span className="font-mono text-slate-500">
                Сценарий: {activeScenario}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
