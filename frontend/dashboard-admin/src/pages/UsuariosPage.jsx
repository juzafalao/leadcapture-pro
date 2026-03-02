import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import UserCard from '../components/dashboard/UserCard';
import FAB from '../components/dashboard/FAB';
import UserModal from '../components/usuarios/UserModal';
import { exportUsuariosToExcel, exportUsuariosToPDF } from '../utils/exportUtils.js';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const PAGE_SIZE = 20;

export default function UsuariosPage() {
  const { usuario, isPlatformAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [filtroRole, setFiltroRole] = useState('todos');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const debounceRef = useRef(null);

  const handleBuscaChange = useCallback((value) => {
    setBuscaInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBusca(value), 300);
  }, []);

  const fetchUsuarios = useCallback(async () => {
    if (!usuario?.tenant_id && !isPlatformAdmin()) {
      console.log('Sem tenant_id');
      return;
    }
    setLoading(true);

    try {
      let query = supabase
        .from('usuarios')
        .select('id, nome, email, role, active, tenant_id, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!isPlatformAdmin()) {
        query = query.eq('tenant_id', usuario.tenant_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar usuarios:', error);
        setUsuarios([]);
      } else {
        console.log('Usuarios carregados:', data?.length);
        setUsuarios(data || []);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [usuario?.tenant_id]);

  useEffect(() => {
    if (usuario?.tenant_id) {
      fetchUsuarios();
    }
  }, [usuario?.tenant_id, fetchUsuarios]);

  useEffect(() => {
    console.log('🔍 UsuariosPage - usuario:', usuario);
    console.log('🔍 UsuariosPage - tenant_id:', usuario?.tenant_id);
    console.log('🔍 UsuariosPage - usuarios:', usuarios.length);
  }, [usuario, usuarios]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [busca, filtroRole]);

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusca = u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                       u.email?.toLowerCase().includes(busca.toLowerCase());
    const matchRole = filtroRole === 'todos' || u.role === filtroRole;
    return matchBusca && matchRole;
  });

  const totalPages = Math.ceil(usuariosFiltrados.length / PAGE_SIZE);
  const paginatedUsuarios = usuariosFiltrados.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const startIndex = (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, usuariosFiltrados.length);

  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    fetchUsuarios();
  };

  const handleExportExcel = () => {
    exportUsuariosToExcel(usuariosFiltrados);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    exportUsuariosToPDF(usuariosFiltrados);
    setShowExportMenu(false);
  };

  if (loading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  return (
    <div className="text-white pb-32">
      
      {/* HEADER */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 mb-6 lg:mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-2">
            Gestão de <span className="text-[#10B981] font-bold">Usuários</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#10B981] rounded-full"></div>
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              {usuarios.length} {usuarios.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* SEARCH BAR & FILTERS & EXPORT */}
      <div className="px-4 lg:px-10 mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Buscar usuário..."
            value={buscaInput}
            onChange={(e) => handleBuscaChange(e.target.value)}
            className="
              w-full
              bg-[#0F172A]
              border border-white/5
              rounded-2xl
              px-5 py-4
              lg:px-6 lg:py-4
              text-sm lg:text-base
              text-white
              placeholder:text-gray-600
              focus:outline-none
              focus:border-[#10B981]/50
              focus:ring-2
              focus:ring-[#10B981]/20
              transition-all
            "
          />
          {buscaInput && (
            <button
              onClick={() => { setBuscaInput(''); setBusca(''); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role filter + Export button */}
        <div className="flex items-center gap-3">
          {/* Filtros */}
          <div className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['todos', 'Administrador', 'Diretor', 'Gestor', 'Consultor', 'Operador'].map((role) => (
              <motion.button
                key={role}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFiltroRole(role)}
                className={`
                  px-4 py-2.5 lg:px-5 lg:py-3
                  rounded-full
                  text-xs lg:text-sm
                  font-bold
                  uppercase
                  tracking-wide
                  whitespace-nowrap
                  transition-all
                  ${filtroRole === role
                    ? 'bg-[#10B981]/30 text-white shadow-lg shadow-[#10B981]/20 border border-[#10B981]/50'
                    : 'bg-[#0F172A] text-gray-400 border border-white/5 hover:bg-white/5'
                  }
                `}
              >
                {role === 'todos' && '⚪ Todos'}
                {role === 'Administrador' && '👑 Admin'}
                {role === 'Diretor' && '🎯 Diretor'}
                {role === 'Gestor' && '📊 Gestor'}
                {role === 'Consultor' && '💼 Consultor'}
                {role === 'Operador' && '⚙️ Operador'}
              </motion.button>
            ))}
          </div>

          {/* BOTÃO EXPORT - AO LADO DOS FILTROS */}
          <div className="relative flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="
                flex items-center gap-2
                px-4 py-2.5 lg:px-5 lg:py-3
                bg-[#0F172A]
                border border-white/10
                rounded-xl
                text-sm font-bold
                text-white
                hover:bg-white/5
                transition-all
                whitespace-nowrap
              "
            >
              <span className="text-lg">📥</span>
              <span className="hidden lg:inline">Exportar</span>
            </motion.button>

            {/* MENU EXPORT */}
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="
                  absolute right-0 top-full mt-2
                  bg-[#0F172A]
                  border border-white/10
                  rounded-xl
                  shadow-2xl
                  overflow-hidden
                  z-50
                  min-w-[200px]
                "
              >
                <button
                  onClick={handleExportExcel}
                  className="
                    w-full
                    flex items-center gap-3
                    px-4 py-3
                    text-left text-sm font-semibold
                    text-white
                    hover:bg-green-500/10
                    transition-colors
                  "
                >
                  <span className="text-xl">📗</span>
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="
                    w-full
                    flex items-center gap-3
                    px-4 py-3
                    text-left text-sm font-semibold
                    text-white
                    hover:bg-red-500/10
                    transition-colors
                    border-t border-white/5
                  "
                >
                  <span className="text-xl">📕</span>
                  <span>PDF (.pdf)</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* USERS GRID */}
      <div className="px-4 lg:px-10">
        {usuariosFiltrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4 opacity-30">👥</div>
            <p className="text-xl text-gray-400 mb-2">
              {busca || filtroRole !== 'todos' ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {busca || filtroRole !== 'todos' ? 'Tente ajustar os filtros' : 'Comece criando seu primeiro usuário!'}
            </p>
            {!busca && filtroRole === 'todos' && (
              <p className="text-xs text-white/30 mt-2">tenant_id: {usuario?.tenant_id}</p>
            )}
            {(busca || filtroRole !== 'todos') && (
              <button
                onClick={() => {
                  setBuscaInput('');
                  setBusca('');
                  setFiltroRole('todos');
                }}
                className="px-6 py-3 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#059669] transition-all"
              >
                Limpar Filtros
              </button>
            )}
          </motion.div>
        ) : (
          <div className="bg-[#0F172A] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {paginatedUsuarios.map((user, index) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    index={index}
                    onClick={() => handleOpenModal(user)}
                  />
                ))}
              </div>
            </div>

            {/* FOOTER COM PAGINAÇÃO */}
            <div className="px-4 py-4 border-t border-white/5 bg-[#0F172A] rounded-b-3xl">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Info */}
                <p className="text-xs text-gray-600">
                  Exibindo <span className="text-white font-bold">{startIndex}</span> a{' '}
                  <span className="text-white font-bold">{endIndex}</span> de{' '}
                  <span className="text-white font-bold">{usuariosFiltrados.length}</span> itens
                </p>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= page - 1 && pageNum <= page + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`
                                w-8 h-8 rounded-lg text-xs font-bold transition-all
                                ${page === pageNum
                                  ? 'bg-[#10B981] text-black'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }
                              `}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return <span key={pageNum} className="text-gray-600">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Próxima →
                    </button>
                  </div>
                )}

                {/* Branding */}
                <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">
                  LeadCapture Pro · Zafalão Tech
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <FAB onClick={() => handleOpenModal(null)} />

      {/* MODAL */}
      {isModalOpen && (
        <UserModal
          usuario={selectedUser}
          onClose={handleCloseModal}
        />
      )}

      {/* Overlay para fechar menu export */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
}