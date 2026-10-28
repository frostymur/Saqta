import React, { useState } from "react";
import { Play, Pause, StepForward, Sliders, Shield, Zap, RefreshCw } from "lucide-react";

export default function SimulationBar({
  onTriggerStep,
  onStartSimulation,
  onStopSimulation,
  onSetScenario,
  isSimulating
}) {
  const [selectedScenario, setSelectedScenario] = useState("spring_flood_surge");
  const [intensity, setIntensity] = useState(1.2);
  const [stepLoading, setStepLoading] = useState(false);

  const handleScenarioChange = async (scenario) => {
    setSelectedScenario(scenario);
    await onSetScenario(scenario, intensity);
  };

  const handleStep = async () => {
    setStepLoading(true);
    try {
      await onTriggerStep();
    } finally {
      setStepLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-[#10192D] to-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Section Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Симулятор гидрологических сценариев ЧС
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/30">
                Hackathon Demo Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Генерация притока, сброса плотины и динамики волны по руслу реки Есиль
            </p>
          </div>
        </div>

        {/* Center: Scenario Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => handleScenarioChange("spring_flood_surge")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedScenario === "spring_flood_surge"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            🌊 Весенний паводок (волна)
          </button>
          <button
            onClick={() => handleScenarioChange("dam_spillover_crit")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedScenario === "dam_spillover_crit"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            🚨 Крит. сброс Сергеевки
          </button>
          <button
            onClick={() => handleScenarioChange("heavy_rainfall")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedScenario === "heavy_rainfall"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            🌧️ Штормовой ливень
          </button>
          <button
            onClick={() => handleScenarioChange("normal")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedScenario === "normal"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            ✅ Штатный режим
          </button>
        </div>

        {/* Right: Simulation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStep}
            disabled={stepLoading}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-all disabled:opacity-50"
            title="Сгенерировать 1 замер телеметрии"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>+1 Шаг</span>
          </button>

          {isSimulating ? (
            <button
              onClick={onStopSimulation}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-rose-600/30 transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Пауза live-потока</span>
            </button>
          ) : (
            <button
              onClick={onStartSimulation}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-sky-600/30 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Live-поток (3 сек)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
