import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/layout/Header';

// Páginas
import DashboardPage    from './pages/DashboardPage';
import InteligenciaPage from './pages/InteligenciaPage';
import MarcasPage       from './pages/MarcasPage';
import SegmentosPage    from './pages/SegmentosPage';
import UsuariosPage     from './pages/UsuariosPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import RelatoriosPage   from './pages/RelatoriosPage';
import AutomacaoPage    from './pages/AutomacaoPage';
import SettingsPage     from './pages/SettingsPage';
import LoginPage        from './pages/LoginPage';
import LandingPage      from './pages/LandingPage';

// Auth
import { AuthProvider, useAuth } from './components/AuthContext.jsx';

function PrivateRoute({ children, allowedRoles }) {
  const { usuario, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
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

function AuthenticatedLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex bg-[#0a0a0b] min-h-screen font-sans text-white">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      <main className="flex-1 min-h-screen flex flex-col lg:pl-32">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        <div className="flex-1">
          {children}
        </div>

        <footer className="border-t border-white/5 py-6 text-center bg-[#0a0a0b]">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
            © 2026 LeadCapture Pro · <span className="text-[#ee7b4d]">Zafalão Tech</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

const ROLES_GESTOR    = ['Administrador', 'Diretor', 'Gestor'];
const ROLES_ADMIN     = ['Administrador'];

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Públicas ─────────────────────────────────── */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/landing/:slug"   element={<LandingPage />} />

          {/* ── Redirect raiz ────────────────────────────── */}
          <Route path="/"
            element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>}
          />

          {/* ── Leads / Dashboard ────────────────────────── */}
          <Route path="/dashboard"
            element={<PrivateRoute><AuthenticatedLayout><DashboardPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Inteligência / BI (Gestor+) ──────────────── */}
          <Route path="/inteligencia"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><InteligenciaPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Analytics (Gestor+) ──────────────────────── */}
          <Route path="/analytics"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AnalyticsPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Relatórios (Gestor+) ─────────────────────── */}
          <Route path="/relatorios"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><RelatoriosPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Automação (Gestor+) ──────────────────────── */}
          <Route path="/automacao"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><AutomacaoPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Marcas (Gestor+) ─────────────────────────── */}
          <Route path="/marcas"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><MarcasPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Segmentos (Gestor+) ──────────────────────── */}
          <Route path="/segmentos"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><SegmentosPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Usuários / Time (Gestor+) ────────────────── */}
          <Route path="/usuarios"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><UsuariosPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Configurações (todos os autenticados) ────── */}
          <Route path="/configuracoes"
            element={<PrivateRoute><AuthenticatedLayout><SettingsPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Fallback ─────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
