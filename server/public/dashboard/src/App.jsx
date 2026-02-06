import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/layout/Header';
import DashboardPage from './pages/DashboardPage';
import InteligenciaPage from './pages/InteligenciaPage';
import MarcasPage from './pages/MarcasPage';
import SegmentosPage from './pages/SegmentosPage';
import UsuariosPage from './pages/UsuariosPage';
import LoginPage from './pages/LoginPage';
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
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
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
            © 2026 LeadCapture Pro — Desenvolvido por: Juliana Zafalão
          </p>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>} />
          
          <Route path="/dashboard" element={<PrivateRoute><AuthenticatedLayout><DashboardPage /></AuthenticatedLayout></PrivateRoute>} />
          
          <Route path="/inteligencia" element={<PrivateRoute allowedRoles={['Administrador', 'Diretor', 'Gestor']}><AuthenticatedLayout><InteligenciaPage /></AuthenticatedLayout></PrivateRoute>} />
          
          <Route path="/marcas" element={<PrivateRoute allowedRoles={['Administrador', 'Diretor', 'Gestor']}><AuthenticatedLayout><MarcasPage /></AuthenticatedLayout></PrivateRoute>} />
          
          <Route path="/segmentos" element={<PrivateRoute allowedRoles={['Administrador', 'Diretor', 'Gestor']}><AuthenticatedLayout><SegmentosPage /></AuthenticatedLayout></PrivateRoute>} />
          
          {/* ✅ CORRIGIDO: Adicionado 'Gestor' */}
          <Route path="/usuarios" element={<PrivateRoute allowedRoles={['Administrador', 'Diretor', 'Gestor']}><AuthenticatedLayout><UsuariosPage /></AuthenticatedLayout></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}