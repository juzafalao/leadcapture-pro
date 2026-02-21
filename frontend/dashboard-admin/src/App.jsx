import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/layout/Header';

const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const MarcasPage       = lazy(() => import('./pages/MarcasPage'));
const SegmentosPage    = lazy(() => import('./pages/SegmentosPage'));
const UsuariosPage     = lazy(() => import('./pages/UsuariosPage'));
const SettingsPage     = lazy(() => import('./pages/SettingsPage'));
const LeadsSistemaPage = lazy(() => import('./pages/LeadsSistemaPage'));
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const LandingPage      = lazy(() => import('./pages/LandingPage'));
const AnalyticsPage    = lazy(() => import('./pages/AnalyticsPage'));
const RelatoriosPage   = lazy(() => import('./pages/RelatoriosPage'));
const AutomacaoPage    = lazy(() => import('./pages/AutomacaoPage'));

import { AuthProvider, useAuth } from './components/AuthContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DebugInfo } from './components/DebugInfo.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
    <span className="text-[#10B981] font-black tracking-widest animate-pulse">CARREGANDO...</span>
  </div>
);

function PrivateRoute({ children, allowedRoles }) {
  const { usuario, loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-6xl animate-pulse">⏳</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(usuario?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login"         element={<AnimatedPage><Suspense fallback={<PageFallback />}><LoginPage /></Suspense></AnimatedPage>} />
        <Route path="/landing/:slug" element={<AnimatedPage><Suspense fallback={<PageFallback />}><LandingPage /></Suspense></AnimatedPage>} />
        <Route path="/" element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>} />
        <Route path="/dashboard"     element={<PrivateRoute><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><DashboardPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/relatorios"    element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><RelatoriosPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/analytics"     element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><AnalyticsPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/automacao"     element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><AutomacaoPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/marcas"        element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><MarcasPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/segmentos"     element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><SegmentosPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/usuarios"      element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><UsuariosPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/leads-sistema" element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><LeadsSistemaPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/configuracoes" element={<PrivateRoute><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><SettingsPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="*"              element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function AuthenticatedLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="flex bg-[#0F172A] min-h-screen font-sans text-white">
      {import.meta.env.DEV && <DebugInfo />}
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <main className="flex-1 min-h-screen flex flex-col lg:pl-32">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-white/5 py-6 text-center bg-[#0F172A]">
          <div className="flex items-center justify-center gap-3 mb-2">
            <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' }}>
              <rect width="56" height="56" rx="14" fill="#0B1220"/>
              <line x1="12" y1="16" x2="44" y2="16" stroke="#10B981" strokeWidth="3" strokeLinecap="round"/>
              <line x1="44" y1="16" x2="12" y2="40" stroke="#10B981" strokeWidth="3" strokeLinecap="round"/>
              <line x1="12" y1="40" x2="44" y2="40" stroke="#10B981" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span className="text-[#F8FAFC] font-black text-sm tracking-wider">ZAFALÃO TECH</span>
          </div>
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
            © 2026 LeadCapture Pro · Powered by <span className="text-[#10B981]">Zafalão Tech</span>
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
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
