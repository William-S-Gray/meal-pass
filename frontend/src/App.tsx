import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RegisterBeneficiary from "./pages/RegisterBeneficiary";
import BeneficiariesList from "./pages/BeneficiariesList";
import BeneficiaryProfile from "./pages/BeneficiaryProfile";
import EditBeneficiary from "./pages/EditBeneficiary";
import QRScanner from "./pages/QRScanner";
import Reports from "./pages/Reports";
import ReportsDashboard from "./pages/ReportsDashboard";
import Statistics from "./pages/Statistics";
import FedToday from "./pages/FedToday";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WebSocketProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
              <Route path="/beneficiaries/register" element={
                <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
                  <RegisterBeneficiary />
                </ProtectedRoute>
              } />
              <Route path="/beneficiaries" element={
                <ProtectedRoute>
                  <BeneficiariesList />
                </ProtectedRoute>
              } />
              <Route path="/beneficiaries/:uid" element={
                <ProtectedRoute>
                  <BeneficiaryProfile />
                </ProtectedRoute>
              } />
              <Route path="/beneficiaries/edit/:uid" element={
                <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
                  <EditBeneficiary />
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
          </BrowserRouter>
        </TooltipProvider>
      </WebSocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;