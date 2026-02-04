import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/layout/Header';
import DashboardPage from './pages/DashboardPage';
import InteligenciaPage from './pages/InteligenciaPage';
import MarcasPage from './pages/MarcasPage';
import SegmentosPage from './pages/SegmentosPage';
import UsuariosPage from './pages/UsuariosPage';
import { AuthProvider, useAuth } from './components/AuthContext.jsx';

function PrivateRoute({ children, allowedRoles }) {
  const { usuario, loading } = useAuth();
  if (loading) return null;
  return allowedRoles.includes(usuario?.role) ? children : <Navigate to="/dashboard" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

function AppLayout() {
  return (
    <div className="flex bg-[#0a0a0b] min-h-screen font-sans text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto pl-28 lg:pl-32 flex flex-col">
        <Header />
        
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/inteligencia" element={
              <PrivateRoute allowedRoles={['Administrador', 'Diretor', 'Gestor']}>
                <InteligenciaPage />
              </PrivateRoute>
            } />
            <Route path="/marcas" element={
              <PrivateRoute allowedRoles={['Administrador', 'Diretor', 'Gestor']}>
                <MarcasPage />
              </PrivateRoute>
            } />
            <Route path="/segmentos" element={
              <PrivateRoute allowedRoles={['Administrador', 'Diretor', 'Gestor']}>
                <SegmentosPage />
              </PrivateRoute>
            } />
            <Route path="/usuarios" element={
              <PrivateRoute allowedRoles={['Administrador', 'Diretor', 'Gestor']}>
                <UsuariosPage />
              </PrivateRoute>
            } />
          </Routes>
        </div>

        {/* RODAPÉ SEM O BOTÃO DE SAIR */}
        <footer className="p-10 border-t border-white/5 flex flex-col items-center bg-[#0a0a0b]">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] italic">
            © 2026 LeadCapture Pro — Desenvolvido por: Juliana Zafalão
          </p>
        </footer>
      </main>
    </div>
  );
}