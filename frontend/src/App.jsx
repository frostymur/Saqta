import React, { useState } from "react";
import GovHeader from "./components/GovHeader";
import LandingHero from "./components/LandingHero";
import LandingProblem from "./components/LandingProblem";
import LandingHowItWorks from "./components/LandingHowItWorks";
import LandingStations from "./components/LandingStations";
import LandingBenefits from "./components/LandingBenefits";
import LandingEmergency from "./components/LandingEmergency";
import LandingFaq from "./components/LandingFaq";
import GovFooter from "./components/GovFooter";
import GovAuthModal from "./components/GovAuthModal";

export default function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // User state for header representation
  const [currentUser, setCurrentUser] = useState({
    id: 3,
    email: "guest@saqta.kz",
    role: "guest",
    full_name: "Гражданский режим"
  });

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

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col font-sans selection:bg-sky-200">
      {/* 1. Official State Header */}
      <GovHeader
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSelectRole={handleSelectRole}
      />

      <main className="flex-1 w-full">
        {/* 2. Hero Section */}
        <LandingHero onOpenAuth={() => setIsAuthOpen(true)} />

        {/* 3. The Challenge / Problem on River Esil */}
        <LandingProblem />

        {/* 4. How Platform Works (Architecture & Pipeline) */}
        <LandingHowItWorks />

        {/* 5. Hydro-monitoring Stations & Official MChS Risk Standards */}
        <LandingStations />

        {/* 6. Benefits for Government, DChS, Citizens */}
        <LandingBenefits />

        {/* 7. Emergency 112 Hotline & Citizen Action Center */}
        <LandingEmergency />

        {/* 8. Frequently Asked Questions (FAQ) */}
        <LandingFaq />
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
