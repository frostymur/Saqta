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
import { KAZAKHSTAN_REGIONS } from "./data/regionsData";

export default function App() {
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState("all");

  const selectedRegion = KAZAKHSTAN_REGIONS.find((r) => r.id === selectedRegionId) || null;

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. National Civic Header with Regional Switcher */}
      <CivicHeader
        selectedRegionId={selectedRegionId}
        onSelectRegion={(id) => setSelectedRegionId(id)}
        onOpenStaff={() => setIsStaffOpen(true)}
      />

      <main className="flex-1 w-full">
        {/* 2. National / Regional Status Board */}
        <HeroStatus
          selectedRegionId={selectedRegionId}
          selectedRegion={selectedRegion}
          onSelectRegion={(id) => setSelectedRegionId(id)}
        />

        {/* 3. "What is happening in my district?" Interactive Checker */}
        <DistrictCheck
          selectedRegionId={selectedRegionId}
          onSelectRegion={(id) => setSelectedRegionId(id)}
        />

        {/* 4. River Gauges & Dams Margin for Selected Basin */}
        <RiverGauges
          selectedRegionId={selectedRegionId}
        />

        {/* 5. 3-Step Resident Action Checklist (Without panic) */}
        <ActionChecklist />

        {/* 6. Evacuation Shelters (PVR) */}
        <SheltersList
          selectedRegionId={selectedRegionId}
        />

        {/* 7. Emergency 112 Hotline & Citizen Help Form */}
        <EmergencyHelp
          selectedRegionId={selectedRegionId}
        />
      </main>

      {/* 8. Official Civic Footer */}
      <CivicFooter onOpenStaff={() => setIsStaffOpen(true)} />

      {/* 9. Staff Access Modal */}
      <StaffModal
        isOpen={isStaffOpen}
        onClose={() => setIsStaffOpen(false)}
        onLoginSuccess={(user) => {
          alert(`Вход выполнен успешно: ${user.full_name} (${user.role})`);
        }}
      />
    </div>
  );
}
