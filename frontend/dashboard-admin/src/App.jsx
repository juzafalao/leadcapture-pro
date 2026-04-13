import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './components/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// ── Lazy imports ─────────────────────────────────────────────
const DashboardPage     = lazy(() => import('./pages/DashboardPage'));
const MarcasPage        = lazy(() => import('./pages/MarcasPage'));
const SegmentosPage     = lazy(() => import('./pages/SegmentosPage'));
const UsuariosPage      = lazy(() => import('./pages/UsuariosPage'));
const SettingsPage      = lazy(() => import('./pages/SettingsPage'));
const LeadsSistemaPage  = lazy(() => import('./pages/LeadsSistemaPage'));
const LoginPage         = lazy(() => import('./pages/LoginPage'));
const LandingPage       = lazy(() => import('./pages/LandingPage'));
const AnalyticsPage     = lazy(() => import('./pages/AnalyticsPage'));
const RelatoriosPage    = lazy(() => import('./pages/RelatoriosPage'));
const AutomacaoPage     = lazy(() => import('./pages/AutomacaoPage'));
const AuditLogPage      = lazy(() => import('./pages/AuditLogPage'));
const KanbanPage        = lazy(() => import('./pages/KanbanPage'));
const CRMPage           = lazy(() => import('./pages/CRMPage'));
const EmailMarketingPage = lazy(() => import('./pages/EmailMarketingPage'));
const CanaisPage        = lazy(() => import('./pages/CanaisPage'));
const APIPage           = lazy(() => import('./pages/APIPage'));
const MonitoramentoPage = lazy(() => import('./pages/MonitoramentoPage'));
const RankingPage       = lazy(() => import('./pages/RankingPage'));

// ── Níveis de acesso ─────────────────────────────────────────
const LEVEL_CONSULTOR = 2;
const LEVEL_GESTOR    = 3;
const LEVEL_DIRETOR   = 4;
const LEVEL_ADMIN     = 5;

const ROLES_CONSULTOR = ['Consultor', 'Operador', 'Gestor', 'Diretor', 'Administrador', 'admin'];
const ROLES_GESTOR    = ['Gestor', 'Diretor', 'Administrador', 'admin'];
const ROLES_DIRETOR   = ['Diretor', 'Administrador', 'admin'];
const ROLES_ADMIN     = ['Administrador', 'admin'];

// ── Query Client ─────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime:    1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Loading fallback ─────────────────────────────────────────
function PageFallback() {
  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-3">⏳</div>
        <p className="text-gray-600 text-sm">Carregando...</p>
      </div>
    </div>
  );
}

// ── Animated page wrapper ─────────────────────────────────────
function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// ── Layout autenticado (com Sidebar) ─────────────────────────
const Sidebar = lazy(() => import('./components/Sidebar'));

function AuthenticatedLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0B1220]">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

// ── PrivateRoute ─────────────────────────────────────────────
function PrivateRoute({ children, minLevel = LEVEL_CONSULTOR, allowedRoles = ROLES_CONSULTOR }) {
  const { usuario, loading, isAuthenticated } = useAuth();

  if (loading) return <PageFallback />;
  if (!isAuthenticated || !usuario) return <Navigate to="/login" replace />;

  const userRole  = usuario.role || '';
  const isSuperAdmin = usuario.is_super_admin === true || usuario.is_platform === true;

  if (isSuperAdmin) return children;
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ── App Routes ───────────────────────────────────────────────
function AppRoutes() {
  const { usuario, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageFallback />;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* Públicas */}
        <Route path="/login" element={
          <Suspense fallback={<PageFallback />}>
            <AnimatedPage><LoginPage /></AnimatedPage>
          </Suspense>
        } />

        <Route path="/lp/:slug" element={
          <Suspense fallback={<PageFallback />}>
            <AnimatedPage><LandingPage /></AnimatedPage>
          </Suspense>
        } />

        {/* Consultor+ */}
        <Route path="/dashboard" element={
          <PrivateRoute minLevel={LEVEL_CONSULTOR} allowedRoles={ROLES_CONSULTOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><DashboardPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/kanban" element={
          <PrivateRoute minLevel={LEVEL_CONSULTOR} allowedRoles={ROLES_CONSULTOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><KanbanPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/configuracoes" element={
          <PrivateRoute minLevel={LEVEL_CONSULTOR} allowedRoles={ROLES_CONSULTOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><SettingsPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        {/* Ranking — visível para todos */}
        <Route path="/ranking" element={
          <PrivateRoute minLevel={LEVEL_CONSULTOR} allowedRoles={ROLES_CONSULTOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><RankingPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        {/* Gestor+ */}
        <Route path="/relatorios" element={
          <PrivateRoute minLevel={LEVEL_GESTOR} allowedRoles={ROLES_GESTOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><RelatoriosPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/email-marketing" element={
          <PrivateRoute minLevel={LEVEL_GESTOR} allowedRoles={ROLES_GESTOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><EmailMarketingPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/canais" element={
          <PrivateRoute minLevel={LEVEL_GESTOR} allowedRoles={ROLES_GESTOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><CanaisPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/marcas" element={
          <PrivateRoute minLevel={LEVEL_GESTOR} allowedRoles={ROLES_GESTOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><MarcasPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/usuarios" element={
          <PrivateRoute minLevel={LEVEL_GESTOR} allowedRoles={ROLES_GESTOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><UsuariosPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/automacao" element={
          <PrivateRoute minLevel={LEVEL_GESTOR} allowedRoles={ROLES_GESTOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><AutomacaoPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        {/* Diretor+ */}
        <Route path="/analytics" element={
          <PrivateRoute minLevel={LEVEL_DIRETOR} allowedRoles={ROLES_DIRETOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><AnalyticsPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/crm" element={
          <PrivateRoute minLevel={LEVEL_DIRETOR} allowedRoles={ROLES_DIRETOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><CRMPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/audit-log" element={
          <PrivateRoute minLevel={LEVEL_DIRETOR} allowedRoles={ROLES_DIRETOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><AuditLogPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/segmentos" element={
          <PrivateRoute minLevel={LEVEL_DIRETOR} allowedRoles={ROLES_DIRETOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><SegmentosPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/api-docs" element={
          <PrivateRoute minLevel={LEVEL_DIRETOR} allowedRoles={ROLES_DIRETOR}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><APIPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        {/* Admin */}
        <Route path="/leads" element={
          <PrivateRoute minLevel={LEVEL_ADMIN} allowedRoles={ROLES_ADMIN}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><LeadsSistemaPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/monitoramento" element={
          <PrivateRoute minLevel={LEVEL_ADMIN} allowedRoles={ROLES_ADMIN}>
            <AuthenticatedLayout>
              <AnimatedPage><Suspense fallback={<PageFallback />}><MonitoramentoPage /></Suspense></AnimatedPage>
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </AnimatePresence>
  );
}

// ── Root ─────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
