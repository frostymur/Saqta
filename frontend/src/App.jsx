import React, { useState } from "react";
import CivicHeader from "./components/CivicHeader";
import HeroStatus from "./components/HeroStatus";
import DistrictCheck from "./components/DistrictCheck";
import RiverGauges from "./components/RiverGauges";
import ActionChecklist from "./components/ActionChecklist";
import SheltersList from "./components/SheltersList";
import EmergencyHelp from "./components/EmergencyHelp";
import CivicFooter from "./components/CivicFooter";
import StaffModal from "./components/StaffModal";

export default function App() {
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [staffUser, setStaffUser] = useState(null);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Civic Header */}
      <CivicHeader onOpenStaff={() => setIsStaffOpen(true)} />

      <main className="flex-1 w-full">
        {/* 2. City Status Board (Memorable Hero Element) */}
        <HeroStatus />

        {/* 3. "What is happening in my district?" Interactive Checker */}
        <DistrictCheck />

        {/* 4. River Esil Water Gauges (Where is water coming from) */}
        <RiverGauges />

        {/* 5. 3-Step Resident Action Checklist (Without panic) */}
        <ActionChecklist />

        {/* 6. Official Evacuation Shelters (PVR) in Petropavlovsk */}
        <SheltersList />

        {/* 7. Emergency 112 Hotline & Resident Rescue Alert Form */}
        <EmergencyHelp />
      </main>

      {/* 8. Official Civic Footer */}
      <CivicFooter onOpenStaff={() => setIsStaffOpen(true)} />

      {/* 9. Staff Access Modal */}
      <StaffModal
        isOpen={isStaffOpen}
        onClose={() => setIsStaffOpen(false)}
        onLoginSuccess={(user) => {
          setStaffUser(user);
          alert(`Вход выполнен успешно: ${user.full_name} (${user.role})`);
        }}
      />
    </div>
  );
}
