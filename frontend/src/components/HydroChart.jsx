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
  ReferenceLine,
  Legend
} from "recharts";
import { TrendingUp, CloudRain, Thermometer, Droplet, Clock } from "lucide-react";

export default function HydroChart({ station, telemetry, prediction }) {
  if (!station) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
        Выберите гидропост на карте или из списка для просмотра аналитики
      </div>
    );
  }

  const warnLevel = station.thresholds?.warn_level || 900;
  const critLevel = station.thresholds?.crit_level || 980;

  // Форматируем данные телеметрии для Recharts
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

  // Добавляем точки прогноза ML на +1ч, +2ч, +3ч
  if (prediction && chartData.length > 0) {
    const lastPoint = chartData[chartData.length - 1];
    // Связующая точка на текущем замере
    lastPoint.forecast = lastPoint.water_level;

    chartData.push({
      time: "+1ч",
      fullTime: "ML Прогноз через 1 час",
      water_level: null,
      forecast: prediction.forecast_1h,
      isForecast: true
    });
    chartData.push({
      time: "+2ч",
      fullTime: "ML Прогноз через 2 часа",
      water_level: null,
      forecast: prediction.forecast_2h,
      isForecast: true
    });
    chartData.push({
      time: "+3ч",
      fullTime: "ML Прогноз через 3 часа",
      water_level: null,
      forecast: prediction.forecast_3h,
      isForecast: true
    });
  }

  // Расчет динамических границ шкалы Y
  const allLevels = [
    ...telemetry.map((t) => t.water_level),
    warnLevel,
    critLevel,
    prediction?.forecast_3h || 0
  ].filter((v) => typeof v === "number" && !isNaN(v));

  const minY = Math.floor((Math.min(...allLevels, 600) - 40) / 50) * 50;
  const maxY = Math.ceil((Math.max(...allLevels, 1000) + 40) / 50) * 50;

  const latestTel = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Chart Title and Current Station Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              {station.name}
            </h3>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {station.region}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>Порог предупреждения: <strong className="text-amber-400 font-mono">{warnLevel} см</strong></span>
            <span>•</span>
            <span>Критический уровень: <strong className="text-rose-400 font-mono">{critLevel} см</strong></span>
          </p>
        </div>

        {/* Live sensors summary badges */}
        {latestTel && (
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1 text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono font-bold text-sky-400">
                {latestTel.rate_of_rise > 0 ? "+" : ""}{latestTel.rate_of_rise} см/ч
              </span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1 text-slate-300">
              <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono">{latestTel.rainfall} мм/ч</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1 text-slate-300">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">{latestTel.temperature}°C</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1 text-slate-300">
              <Droplet className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono">{latestTel.soil_moisture}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Recharts Area + Forecast Line */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="waterLevelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              domain={[minY, maxY]}
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              unit=" см"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#131C31] border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1">
                      <div className="font-semibold text-slate-300 border-b border-slate-700 pb-1 mb-1">
                        {data.fullTime}
                      </div>
                      {data.water_level !== null && (
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Фактический уровень:</span>
                          <span className="font-mono font-bold text-sky-400">{data.water_level} см</span>
                        </div>
                      )}
                      {data.forecast !== null && (
                        <div className="flex justify-between gap-4">
                          <span className="text-purple-300">ML Прогноз:</span>
                          <span className="font-mono font-bold text-purple-400">{data.forecast} см</span>
                        </div>
                      )}
                      {data.rate_of_rise !== undefined && (
                        <div className="flex justify-between gap-4 text-slate-400">
                          <span>Скорость подъема:</span>
                          <span className="font-mono">{data.rate_of_rise} см/ч</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Threshold Reference Lines */}
            <ReferenceLine
              y={warnLevel}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Предупреждение (${warnLevel} см)`,
                fill: "#F59E0B",
                fontSize: 10,
                position: "insideTopRight"
              }}
            />
            <ReferenceLine
              y={critLevel}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1.8}
              label={{
                value: `КРИТИЧЕСКИЙ (${critLevel} см)`,
                fill: "#EF4444",
                fontSize: 10,
                position: "insideTopRight"
              }}
            />

            {/* Historical water level area */}
            <Area
              type="monotone"
              dataKey="water_level"
              name="Фактический уровень"
              stroke="#38BDF8"
              strokeWidth={2.5}
              fill="url(#waterLevelGrad)"
              isAnimationActive={false}
            />

            {/* Forecast Projection dotted line */}
            <Line
              type="monotone"
              dataKey="forecast"
              name="ML Прогноз (+3ч)"
              stroke="#C084FC"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: "#C084FC" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-400"></span>
            <span>Фактический уровень гидропоста</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-purple-400 border-dashed"></span>
            <span>ML Прогноз модели (+1ч, +2ч, +3ч)</span>
          </div>
        </div>
        <div className="text-slate-500 font-mono">
          Интервал измерений: 1 час
        </div>
      </div>
    </div>
  );
}
