import React, { useState, useEffect, useRef } from "react";
import GovHeader from "./components/GovHeader";
import HeroLanding from "./components/HeroLanding";
import LiveMapSection from "./components/LiveMapSection";
import HydroAnalyticsSection from "./components/HydroAnalyticsSection";
import SimulatorSection from "./components/SimulatorSection";
import DchsBulletinSection from "./components/DchsBulletinSection";
import MlTechnologySection from "./components/MlTechnologySection";
import CitizenGuideSection from "./components/CitizenGuideSection";
import GovFooter from "./components/GovFooter";
import GovAuthModal from "./components/GovAuthModal";

import {
  fetchStations,
  fetchStationTelemetry,
  fetchAlerts,
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

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Default user state: Guest / Citizen
  const [currentUser, setCurrentUser] = useState({
    id: 3,
    email: "guest@saqta.kz",
    role: "guest",
    full_name: "Гражданский режим"
  });

  const wsRef = useRef(null);

  // 1. Initial Load
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [stList, altList, wth, blt] = await Promise.all([
          fetchStations(),
          fetchAlerts(),
          fetchWeather().catch(() => null),
          fetchDchsBulletin().catch(() => null)
        ]);

        setStations(stList);
        setAlerts(altList);
        if (wth) setWeather(wth);
        if (blt) setBulletin(blt);

        // По умолчанию выбираем створ «Гидропост г. Петропавловск (Мост)» или первый гидропост
        const defaultStation = stList.find((s) => s.name.includes("Мост")) || stList[0];
        if (defaultStation) {
          setSelectedStation(defaultStation);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    loadInitialData();
  }, []);

  // 2. Load Telemetry & ML Prediction when selectedStation changes
  useEffect(() => {
    if (!selectedStation) return;

    let active = true;
    async function loadStationDetails() {
      try {
        const [tel, pred] = await Promise.all([
          fetchStationTelemetry(selectedStation.id, 48),
          fetchStationPrediction(selectedStation.id)
        ]);
        if (active) {
          setTelemetry(tel);
          setPrediction(pred);
        }
      } catch (err) {
        console.error("Failed to load station telemetry/prediction:", err);
      }
    }
    loadStationDetails();

    return () => {
      active = false;
    };
  }, [selectedStation?.id]);

  // 3. Real-time WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws;
    let timer;

    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "telemetry_update") {
            const data = msg.data;

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

            // Если обновляется выбранная станция, добавляем точку в график
            setSelectedStation((curr) => {
              if (curr && curr.id === data.station_id) {
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
              return curr;
            });
          } else if (msg.type === "new_alert") {
            setAlerts((prev) => [msg.data, ...prev]);
          }
        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        timer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      if (timer) clearTimeout(timer);
      if (ws) ws.close();
    };
  }, []);

  // Handlers
  const handleSelectRole = (role) => {
    if (role === "admin") {
      setCurrentUser({
        id: 1,
        email: "admin@saqta.kz",
        role: "admin",
        full_name: "Касымов А. М. (Главный аналитик ДЧС)"
      });
    } else if (role === "operator") {
      setCurrentUser({
        id: 2,
        email: "operator@saqta.kz",
        role: "operator",
        full_name: "Сериков Н. Б. (Дежурный оператор ДЧС)"
      });
    } else {
      setCurrentUser({
        id: 3,
        email: "guest@saqta.kz",
        role: "guest",
        full_name: "Гражданский режим"
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
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col font-sans selection:bg-sky-200">
      {/* 1. Official Government Header */}
      <GovHeader
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSelectRole={handleSelectRole}
      />

      <main className="flex-1 w-full">
        {/* 2. Hero Section with Live Metrics */}
        <HeroLanding
          stations={stations}
          onOpenBulletin={() => {
            const el = document.getElementById("bulletin-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          weather={weather}
        />

        {/* 3. Interactive Map of Esil River & Stations */}
        <LiveMapSection
          stations={stations}
          selectedStation={selectedStation}
          onSelectStation={(st) => setSelectedStation(st)}
        />

        {/* 4. Hydrograph & ML Explainability Section */}
        <HydroAnalyticsSection
          station={selectedStation}
          telemetry={telemetry}
          prediction={prediction}
        />

        {/* 5. Interactive Simulation Control Bar */}
        <SimulatorSection
          onTriggerStep={handleTriggerStep}
          onStartSimulation={handleStartSimulation}
          onStopSimulation={handleStopSimulation}
          onSetScenario={handleSetScenario}
          isSimulating={isSimulating}
          wsConnected={wsConnected}
        />

        {/* 6. Official DChS Operational Bulletin */}
        <DchsBulletinSection bulletin={bulletin} />

        {/* 7. ML Architecture & Pipeline Section */}
        <MlTechnologySection />

        {/* 8. Citizen Safety Guide & 112 Dispatch Form */}
        <CitizenGuideSection />
      </main>

      {/* 9. Official GovTech Kazakhstan Footer */}
      <GovFooter />

      {/* 10. Authentication Dialog (eGov QR / NCALayer / Demo) */}
      <GovAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
