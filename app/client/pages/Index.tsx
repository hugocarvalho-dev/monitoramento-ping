import { MonitoringDashboard } from "@/components/MonitoringDashboard";
import { useState } from "react";
import { ConfigurationsPage } from "@/components/ConfigurationsPage";

export default function Index() {
  const [currentPage, setCurrentPage] = useState<"dashboard" | "config">(
    "dashboard",
  );

  const handleOpenConfigurations = () => {
    setCurrentPage("config");
  };

  const handleBackToDashboard = () => {
    setCurrentPage("dashboard");
  };

  return (
    <>
      {currentPage === "dashboard" && (
        <MonitoringDashboard onOpenConfigurations={handleOpenConfigurations} />
      )}
      {currentPage === "config" && (
        <ConfigurationsPage onBack={handleBackToDashboard} />
      )}
    </>
  );
}
