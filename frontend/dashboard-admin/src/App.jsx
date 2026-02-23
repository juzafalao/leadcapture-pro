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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 15,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
  </div>
);

function PrivateRoute({ children, allowedRoles }) {
  const { usuario, loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard"     element={<PrivateRoute><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><DashboardPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/relatorios"    element={<PrivateRoute allowedRoles={ROLES_CONSULTOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><RelatoriosPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/analytics"     element={<PrivateRoute allowedRoles={ROLES_DIRETOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><AnalyticsPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/automacao"     element={<PrivateRoute allowedRoles={ROLES_DIRETOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><AutomacaoPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/marcas"        element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><MarcasPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/segmentos"     element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><SegmentosPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/usuarios"      element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><UsuariosPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/leads-sistema" element={<PrivateRoute allowedRoles={ROLES_ADMIN}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><LeadsSistemaPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="/configuracoes" element={<PrivateRoute allowedRoles={ROLES_DIRETOR}><AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><SettingsPage /></Suspense></AnimatedPage></AuthenticatedLayout></PrivateRoute>} />
        <Route path="*"              element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function AuthenticatedLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="flex bg-[#0F172A] min-h-screen font-sans text-[#F8FAFC]">
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <main className="flex-1 min-h-screen flex flex-col lg:pl-32">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-[#1F2937] py-4 text-center bg-[#0F172A]">
          <p className="text-[9px] text-[#CBD5E1]/30 font-bold uppercase tracking-[0.2em]">
            Desenvolvido por — <span className="text-[#10B981]">Zafalão Tech</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

const ROLES_CONSULTOR = ['Administrador', 'admin', 'Diretor', 'Gestor', 'Consultor'];
const ROLES_GESTOR    = ['Administrador', 'admin', 'Diretor', 'Gestor'];
const ROLES_DIRETOR   = ['Administrador', 'admin', 'Diretor'];
const ROLES_ADMIN     = ['Administrador', 'admin'];

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
