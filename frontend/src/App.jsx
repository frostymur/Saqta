import React, { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import StatsOverview from "./components/StatsOverview";
import MapView from "./components/MapView";
import HydroChart from "./components/HydroChart";
import MlExplainability from "./components/MlExplainability";
import AlertsTable from "./components/AlertsTable";
import SimulationBar from "./components/SimulationBar";
import DchsReportModal from "./components/DchsReportModal";
import LoginModal from "./components/LoginModal";

import {
  fetchStations,
  fetchStationTelemetry,
  fetchAlerts,
  processAlert,
  sendAlertTelegram,
  fetchStationPrediction,
  fetchWeather,
  fetchDchsBulletin,
  triggerSimulationStep,
  setSimulationScenario,
  startSimulationLoop,
  stopSimulationLoop
} from "./api";

export default function App() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [weather, setWeather] = useState(null);
  const [bulletin, setBulletin] = useState(null);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Default demo user: Guest (Public view)
  const [currentUser, setCurrentUser] = useState({
    id: 3,
    email: "guest@saqta.kz",
    role: "guest",
    full_name: "Гражданский наблюдатель"
  });

  const wsRef = useRef(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    async function init() {
      try {
        const [stList, altList, wth] = await Promise.all([
          fetchStations(),
          fetchAlerts(),
          fetchWeather().catch(() => null)
        ]);

        setStations(stList);
        setAlerts(altList);
        if (wth) setWeather(wth);

        // По умолчанию выбираем створ «Гидропост г. Петропавловск (Мост)» или первую станцию
        const defaultStation = stList.find((s) => s.name.includes("Мост")) || stList[0];
        if (defaultStation) {
          setSelectedStation(defaultStation);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    init();
  }, []);

  // 2. Load telemetry & ML prediction whenever selectedStation changes
  useEffect(() => {
    if (!selectedStation) return;

    let isMounted = true;
    async function loadStationDetails() {
      try {
        const [tel, pred] = await Promise.all([
          fetchStationTelemetry(selectedStation.id, 48),
          fetchStationPrediction(selectedStation.id)
        ]);
        if (isMounted) {
          setTelemetry(tel);
          setPrediction(pred);
        }
      } catch (err) {
        console.error("Error loading station details:", err);
      }
    }
    loadStationDetails();

    return () => {
      isMounted = false;
    };
  }, [selectedStation?.id]);

  // 3. WebSocket Setup for Live Updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws;
    let reconnectTimeout;

    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "telemetry_update") {
            const data = message.data;

            // Обновляем список станций
            setStations((prev) =>
              prev.map((s) =>
                s.id === data.station_id
                  ? {
                      ...s,
                      current_water_level: data.water_level,
                      current_rate_of_rise: data.rate_of_rise,
                      current_risk_level: data.risk_level,
                      last_updated: data.timestamp
                    }
                  : s
              )
            );

            // Если обновляется выбранная станция, добавляем точку в график и обновляем прогноз
            setSelectedStation((current) => {
              if (current && current.id === data.station_id) {
                setTelemetry((prevTel) => [
                  ...prevTel.slice(-47),
                  {
                    id: Date.now(),
                    station_id: data.station_id,
                    timestamp: data.timestamp,
                    water_level: data.water_level,
                    rate_of_rise: data.rate_of_rise,
                    rainfall: data.rainfall,
                    temperature: data.temperature,
                    soil_moisture: data.soil_moisture,
                    is_valid: true
                  }
                ]);

                setPrediction((prevPred) =>
                  prevPred
                    ? {
                        ...prevPred,
                        risk_level: data.risk_level,
                        risk_score: data.risk_score,
                        forecast_1h: data.forecast_1h,
                        forecast_2h: data.forecast_2h,
                        forecast_3h: data.forecast_3h
                      }
                    : prevPred
                );
              }
              return current;
            });
          } else if (message.type === "new_alert") {
            const newAlert = message.data;
            setAlerts((prev) => [newAlert, ...prev]);
          } else if (message.type === "alert_processed") {
            const { alert_id, status, processed_by } = message.data;
            setAlerts((prev) =>
              prev.map((a) => (a.id === alert_id ? { ...a, status, processed_by } : a))
            );
          }
        } catch (e) {
          console.error("WS Parse error:", e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  // Handlers
  const handleProcessAlert = async (alertId) => {
    try {
      const updated = await processAlert(alertId, currentUser.full_name);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };

  const handleSendTelegram = async (alertId) => {
    return await sendAlertTelegram(alertId);
  };

  const handleOpenBulletin = async () => {
    try {
      const data = await fetchDchsBulletin();
      setBulletin(data);
      setIsReportOpen(true);
    } catch (err) {
      alert("Ошибка генерации сводки: " + err.message);
    }
  };

  const handleSelectRole = (role) => {
    if (role === "admin") {
      setCurrentUser({
        id: 1,
        email: "admin@saqta.kz",
        role: "admin",
        full_name: "Касымов Асет Муратович (Главный аналитик ДЧС)"
      });
    } else if (role === "operator") {
      setCurrentUser({
        id: 2,
        email: "operator@saqta.kz",
        role: "operator",
        full_name: "Сериков Нурлан Бауржанович (Дежурный оператор)"
      });
    } else {
      setCurrentUser({
        id: 3,
        email: "guest@saqta.kz",
        role: "guest",
        full_name: "Гражданский наблюдатель"
      });
    }
  };

  const handleTriggerStep = async () => {
    await triggerSimulationStep();
  };

  const handleStartSimulation = async () => {
    await startSimulationLoop(3);
    setIsSimulating(true);
  };

  const handleStopSimulation = async () => {
    await stopSimulationLoop();
    setIsSimulating(false);
  };

  const handleSetScenario = async (scenario, intensity) => {
    await setSimulationScenario(scenario, intensity);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenReport={handleOpenBulletin}
        onLogout={() => handleSelectRole("guest")}
        weather={weather}
        wsConnected={wsConnected}
        onSelectRole={handleSelectRole}
      />

      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 lg:p-6 space-y-4">
        {/* Top Key Metrics */}
        <StatsOverview stations={stations} alerts={alerts} weather={weather} />

        {/* Interactive Simulation Control Bar */}
        <SimulationBar
          onTriggerStep={handleTriggerStep}
          onStartSimulation={handleStartSimulation}
          onStopSimulation={handleStopSimulation}
          onSetScenario={handleSetScenario}
          isSimulating={isSimulating}
        />

        {/* Main Grid: Interactive Map + Hydro Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Interactive MapLibre Map (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <MapView
              stations={stations}
              selectedStation={selectedStation}
              onSelectStation={(st) => setSelectedStation(st)}
            />

            {/* Emergency Alerts Feed */}
            <AlertsTable
              alerts={alerts}
              onProcessAlert={handleProcessAlert}
              onSendTelegram={handleSendTelegram}
              currentUser={currentUser}
            />
          </div>

          {/* Right Column: Hydrograph & ML Explainability (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <HydroChart
              station={selectedStation}
              telemetry={telemetry}
              prediction={prediction}
            />

            <MlExplainability prediction={prediction} />
          </div>
        </div>
      </main>

      {/* Official DChS Report Modal */}
      {isReportOpen && (
        <DchsReportModal
          bulletin={bulletin}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-800/80 bg-[#0B1120] py-4 text-center text-xs text-slate-500">
        <div className="max-w-[1720px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Платформа «Saqta.kz» © 2026. Разработано для хакатона Digital Urpaq.
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Фокус: р. Есиль (Петропавловск, СКО) • ML-аналитика и гидрологическое прогнозирование
          </span>
        </div>
      </footer>
    </div>
  );
}
