import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MonitoringDashboard } from "@/components/MonitoringDashboard";
import { ConfigurationsPage } from "@/components/ConfigurationsPage";
import { LoginPage } from "@/components/LoginPage";
import { useState } from "react";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<"dashboard" | "config">(
    "dashboard",
  );

  const handleOpenConfigurations = () => {
    setCurrentPage("config");
  };

  const handleBackToDashboard = () => {
    setCurrentPage("dashboard");
  };

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppContent />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
