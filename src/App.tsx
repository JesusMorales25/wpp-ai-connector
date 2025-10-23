import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SessionNotifications from "@/components/SessionNotifications";
import Index from "./pages/Index";
import MensajeriaPage from "./pages/MensajeriaPage";
import DifusionPage from "./pages/DifusionPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import MetricasPage from "./pages/MetricasPage";
import { LeadsPage } from "./pages/LeadsPage";
import { ConversacionesPage } from "./pages/ConversacionesPage";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

// Dashboard principal con todas las secciones
const Dashboard = () => {
  const [currentSection, setCurrentSection] = useState('whatsapp');

  const renderSection = () => {
    switch (currentSection) {
      case 'whatsapp':
        return <Index />;
      case 'messages':
        return <MensajeriaPage />;
      case 'broadcast':
        return <DifusionPage />;
      case 'leads':
        return <LeadsPage />;
      case 'conversations':
        return <ConversacionesPage />;
      case 'reports':
        return <MetricasPage />;
      case 'settings':
        return <ConfiguracionPage />;
      default:
        return <Index />;
    }
  };

  return (
    <DashboardLayout 
      currentSection={currentSection} 
      onSectionChange={setCurrentSection}
    >
      {renderSection()}
      <SessionNotifications />
    </DashboardLayout>
  );
};

// Componente para redirección automática
const AuthRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Ruta raíz con redirección automática */}
            <Route path="/" element={<AuthRedirect />} />
            
            {/* Ruta de login */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Ruta de dashboard principal */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas específicas por sección (futuro) */}
            <Route 
              path="/whatsapp" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/broadcast" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
