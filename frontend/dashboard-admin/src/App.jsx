import React, { useState, lazy, Suspense } from 'react';
import LeadCaptureLogo from './components/LeadCaptureLogo';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/layout/Header';

import DashboardPage    from './pages/DashboardPage';
import MarcasPage       from './pages/MarcasPage';
import SegmentosPage    from './pages/SegmentosPage';
import UsuariosPage     from './pages/UsuariosPage';
import SettingsPage     from './pages/SettingsPage';
import LeadsSistemaPage from './pages/LeadsSistemaPage';
import LoginPage        from './pages/LoginPage';
import LandingPage      from './pages/LandingPage';

const AnalyticsPage    = lazy(() => import('./pages/AnalyticsPage'));
const RelatoriosPage   = lazy(() => import('./pages/RelatoriosPage'));
const AutomacaoPage    = lazy(() => import('./pages/AutomacaoPage'));

import { AuthProvider, useAuth } from './components/AuthContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DebugInfo } from './components/DebugInfo.jsx';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const PageFallback = () => (
  <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-6">
    <LeadCaptureLogo variant="full" size={120} />
    <span className="text-white/40 text-xs font-black tracking-[0.4em] uppercase animate-pulse">CARREGANDO...</span>
  </div>
);

function PrivateRoute({ children, allowedRoles }) {
  const { usuario, loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-6">
        <div className="animate-pulse">
          <LeadCaptureLogo variant="icon" size={64} />
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(usuario?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AuthenticatedLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="flex bg-[#0a0a0b] min-h-screen font-sans text-white">
      <DebugInfo />
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <main className="flex-1 min-h-screen flex flex-col lg:pl-32">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-white/5 py-4 text-center bg-[#0a0a0b]">
          <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">
            LeadCapture Pro — Desenvolvido por Zafalão Tech
          </p>
        </footer>
      </main>
    </div>
  );
}

const ROLES_GESTOR = ['Administrador', 'admin', 'Diretor', 'Gestor'];
const ROLES_ADMIN  = ['Administrador', 'admin'];

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login"         element={<LoginPage />} />
            <Route path="/landing/:slug" element={<LandingPage />} />
            <Route path="/" element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><AuthenticatedLayout><DashboardPage /></AuthenticatedLayout></PrivateRoute>} />
            <Route path="/relatorios" element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><Suspense fallback={<PageFallback />}><RelatoriosPage /></Suspense></AuthenticatedLayout></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><Suspense fallback={<PageFallback />}><AnalyticsPage /></Suspense></AuthenticatedLayout></PrivateRoute>} />
            <Route path="/automacao" element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><Suspense fallback={<PageFallback />}><AutomacaoPage /></Suspense></AuthenticatedLayout></PrivateRoute>} />
            <Route path="/marcas" element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><MarcasPage /></AuthenticatedLayout></PrivateRoute>} />
            <Route path="/segmentos" element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><SegmentosPage /></AuthenticatedLayout></PrivateRoute>} />
            <Route path="/usuarios" element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><UsuariosPage /></AuthenticatedLayout></PrivateRoute>} />
            <Route path="/leads-sistema" element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><LeadsSistemaPage /></AuthenticatedLayout></PrivateRoute>} />
            <Route path="/configuracoes" element={<PrivateRoute><AuthenticatedLayout><SettingsPage /></AuthenticatedLayout></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
