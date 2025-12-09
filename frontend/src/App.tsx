import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RegisterEmployee from "./pages/RegisterEmployee";
import EmployeesList from "./pages/EmployeesList";
import EmployeeProfile from "./pages/EmployeeProfile";
import QRScanner from "./pages/QRScanner";
import Reports from "./pages/Reports";
import ReportsDashboard from "./pages/ReportsDashboard";
import Statistics from "./pages/Statistics";
import FedToday from "./pages/FedToday";
import NotFound from "./pages/NotFound";
import { OptimizedScannerDemo } from "./pages/OptimizedScannerDemo"; // Added import
import { useState } from "react";
import { lazy, Suspense } from "react";

// Lazy load heavy components
const EditEmployee = lazy(() => import("./pages/EditEmployee"));

const queryClient = new QueryClient();

// Debug toggle for responsiveness testing
const DebugToggle = () => {
  const [debugMode, setDebugMode] = useState(false);
  
  const toggleDebug = () => {
    setDebugMode(!debugMode);
    if (!debugMode) {
      const style = document.createElement('style');
      style.id = 'debug-outline';
      style.innerHTML = '* { outline: 1px solid red !important; }';
      document.head.appendChild(style);
    } else {
      const style = document.getElementById('debug-outline');
      if (style) style.remove();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleDebug}
        className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg hover:bg-red-600 transition-colors"
      >
        {debugMode ? 'Disable Debug' : 'Enable Debug'}
      </button>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WebSocketProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/scan" element={
                <ProtectedRoute>
                  <QRScanner />
                </ProtectedRoute>
              } />
              <Route path="/optimized-scan" element={ // Added new route
                <ProtectedRoute>
                  <OptimizedScannerDemo />
                </ProtectedRoute>
              } />
              <Route path="/employees/register" element={
                <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
                  <RegisterEmployee />
                </ProtectedRoute>
              } />
              <Route path="/employees" element={
                <ProtectedRoute>
                  <EmployeesList />
                </ProtectedRoute>
              } />
              <Route path="/employees/:uid" element={
                <ProtectedRoute>
                  <EmployeeProfile />
                </ProtectedRoute>
              } />
              <Route path="/employees/edit/:uid" element={
                <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
                    <EditEmployee />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/reports-dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ReportsDashboard />
                </ProtectedRoute>
              } />
              <Route path="/statistics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Statistics />
                </ProtectedRoute>
              } />
              <Route path="/fed-today" element={
                <ProtectedRoute>
                  <FedToday />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
          <DebugToggle />
        </TooltipProvider>
      </WebSocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;