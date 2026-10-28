import React from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { TrendingUp, CloudRain, Thermometer, Droplet, Sparkles, Brain, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export default function HydroAnalyticsSection({ station, telemetry, prediction }) {
  if (!station) return null;

  const warnLevel = station.thresholds?.warn_level || 900;
  const critLevel = station.thresholds?.crit_level || 980;

  // Format telemetry for Recharts
  const chartData = telemetry.map((t) => {
    const dt = new Date(t.timestamp);
    const timeStr = `${dt.getHours().toString().padStart(2, "0")}:00`;
    return {
      time: timeStr,
      fullTime: dt.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      water_level: t.water_level,
      forecast: null,
      rainfall: t.rainfall,
      rate_of_rise: t.rate_of_rise
    };
  });

  // Attach ML 3h forecast points
  if (prediction && chartData.length > 0) {
    const lastPoint = chartData[chartData.length - 1];
    lastPoint.forecast = lastPoint.water_level;

    chartData.push({
      time: "+1ч",
      fullTime: "ML Прогноз через 1 час",
      water_level: null,
      forecast: prediction.forecast_1h
    });
    chartData.push({
      time: "+2ч",
      fullTime: "ML Прогноз через 2 часа",
      water_level: null,
      forecast: prediction.forecast_2h
    });
    chartData.push({
      time: "+3ч",
      fullTime: "ML Прогноз через 3 часа",
      water_level: null,
      forecast: prediction.forecast_3h
    });
  }

  const allLevels = [
    ...telemetry.map((t) => t.water_level),
    warnLevel,
    critLevel,
    prediction?.forecast_3h || 0
  ].filter((v) => typeof v === "number" && !isNaN(v));

  const minY = Math.floor((Math.min(...allLevels, 600) - 30) / 50) * 50;
  const maxY = Math.ceil((Math.max(...allLevels, 1000) + 30) / 50) * 50;

  const latestTel = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

  return (
    <section className="py-10 px-4 sm:px-8 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              Временные ряды и предиктивная аналитика
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Гидрограф: {station.name}
              <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 font-semibold px-2.5 py-1 rounded-md">
                {station.region}
              </span>
            </h2>
          </div>

          {/* Current Sensors Bar */}
          {latestTel && (
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
              <span className="text-slate-500 font-medium">Текущие датчики:</span>
              <span className="font-mono font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {latestTel.rate_of_rise > 0 ? "+" : ""}{latestTel.rate_of_rise} см/ч
              </span>
              <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {latestTel.rainfall} мм/ч
              </span>
              <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {latestTel.temperature}°C
              </span>
              <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                грунт {latestTel.soil_moisture}%
              </span>
            </div>
          )}
        </div>

        {/* Grid: Chart (8 cols) + ML Explainability (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hydrograph Chart */}
          <Card className="lg:col-span-8 p-5 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-slate-500">
                График фактического уровня (см) за 48 часов + пунктирная линия ML-прогноза на 3 часа
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-0.5 bg-sky-600"></span>
                  Фактический уровень
                </span>
                <span className="flex items-center gap-1.5 font-medium text-purple-700">
                  <span className="w-3 h-0.5 bg-purple-600 border-dashed"></span>
                  ML Прогноз (+3ч)
                </span>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="govWaterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis domain={[minY, maxY]} stroke="#64748B" fontSize={11} tickLine={false} unit=" см" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xl text-xs space-y-1">
                            <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">
                              {data.fullTime}
                            </div>
                            {data.water_level !== null && (
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-600">Уровень воды:</span>
                                <span className="font-mono font-bold text-sky-700">{data.water_level} см</span>
                              </div>
                            )}
                            {data.forecast !== null && (
                              <div className="flex justify-between gap-4">
                                <span className="text-purple-700 font-semibold">ML Прогноз:</span>
                                <span className="font-mono font-bold text-purple-800">{data.forecast} см</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={warnLevel}
                    stroke="#D97706"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Предупреждение (${warnLevel} см)`,
                      fill: "#B45309",
                      fontSize: 10,
                      position: "insideTopRight"
                    }}
                  />
                  <ReferenceLine
                    y={critLevel}
                    stroke="#DC2626"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `КРИТИЧЕСКИЙ (${critLevel} см)`,
                      fill: "#B91C1C",
                      fontSize: 10,
                      position: "insideTopRight"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="water_level"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fill="url(#govWaterGrad)"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#9333ea"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: "#9333ea" }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* ML Explainability Card */}
          <Card className="lg:col-span-4 p-5 border-slate-200 shadow-sm flex flex-col justify-between">
            {prediction ? (
              <div>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Оценка риска (XAI)
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {prediction.model_type}
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={
                      prediction.risk_level === "high"
                        ? "high"
                        : prediction.risk_level === "medium"
                        ? "medium"
                        : "low"
                    }
                  >
                    {prediction.risk_level === "high"
                      ? "Высокий риск"
                      : prediction.risk_level === "medium"
                      ? "Желтый код"
                      : "В норме"}
                  </Badge>
                </div>

                {/* Score Bar */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Индекс опасности:</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {prediction.risk_score} / 100
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        prediction.risk_score >= 70
                          ? "bg-red-600"
                          : prediction.risk_score >= 40
                          ? "bg-amber-500"
                          : "bg-emerald-600"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, prediction.risk_score))}%` }}
                    />
                  </div>
                </div>

                {/* Forecast 1h, 2h, 3h */}
                <div className="grid grid-cols-3 gap-1.5 text-center mb-3">
                  <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
                    <div className="text-[10px] text-slate-500">+1ч</div>
                    <div className="text-xs font-bold font-mono text-purple-900">
                      {prediction.forecast_1h} см
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
                    <div className="text-[10px] text-slate-500">+2ч</div>
                    <div className="text-xs font-bold font-mono text-purple-900">
                      {prediction.forecast_2h} см
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
                    <div className="text-[10px] text-slate-500">+3ч</div>
                    <div className="text-xs font-bold font-mono text-purple-900">
                      {prediction.forecast_3h} см
                    </div>
                  </div>
                </div>

                {/* Text Explanation */}
                <div className="text-xs text-slate-700 bg-sky-50/50 border border-sky-100 rounded-lg p-3 leading-relaxed mb-3">
                  {prediction.explanation}
                </div>

                {/* Feature Factors */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Факторы влияния:
                  </div>
                  {prediction.factors?.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                      <span className="text-slate-600 text-[11px]">{f.name}</span>
                      <span className="font-mono font-bold text-sky-800">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-12">
                Загрузка данных ML инференса...
              </div>
            )}

            <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between font-mono">
              <span>Горизонт: 3 часа</span>
              <span>Точность: R² = 0.94</span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
