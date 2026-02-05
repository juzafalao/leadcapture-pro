import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UserModal from '../components/usuarios/UserModal';

export default function UsuariosPage() {
  const { usuario: me, isDiretor, isAdministrador } = useAuth();
  const queryClient = useQueryClient();
  const [searchName, setSearchName] = useState('');
  const [searchProfile, setSearchProfile] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Buscar usuários do banco
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios', me?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('tenant_id', me.tenant_id)
        .order('nome');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!me?.tenant_id
  });

  // Filtrar usuários
  const filteredUsers = usuarios.filter(u => {
    const matchName = u.nome.toLowerCase().includes(searchName.toLowerCase());
    const matchProfile = searchProfile === '' || u.role.toLowerCase().includes(searchProfile.toLowerCase());
    return matchName && matchProfile;
  });

  // Estatísticas
  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.ativo).length,
    inativos: usuarios.filter(u => !u.ativo).length
  };

  // ✅ SALVAR USUÁRIO (CORRIGIDO)
  const saveUser = useMutation({
    mutationFn: async (userData) => {
      console.log('💾 Salvando usuário:', userData);
      
      if (userData.id) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('usuarios')
          .update({
            nome: userData.nome,
            email: userData.email,
            telefone: userData.telefone || '',
            role: userData.role,
            ativo: userData.ativo
          })
          .eq('id', userData.id);
        
        if (error) {
          console.error('❌ Erro Supabase:', error);
          throw new Error(error.message || 'Erro ao atualizar usuário');
        }
        
        console.log('✅ Usuário atualizado com sucesso!');
        return userData;
        
      } else {
        // Criar novo usuário
        const { data, error } = await supabase
          .from('usuarios')
          .insert({
            nome: userData.nome,
            email: userData.email,
            telefone: userData.telefone || '',
            role: userData.role,
            ativo: userData.ativo,
            tenant_id: me.tenant_id
          })
          .select()
          .single();
        
        if (error) {
          console.error('❌ Erro ao criar usuário:', error);
          throw new Error(error.message || 'Erro ao criar usuário');
        }
        
        console.log('✅ Usuário criado com sucesso!');
        return data;
      }
    },
    onSuccess: (data) => {
      console.log('✅ Mutation success:', data);
      queryClient.invalidateQueries(['usuarios']);
      setShowModal(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error);
      alert('Erro ao salvar usuário: ' + error.message);
    }
  });

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  // Controle de acesso
  if (!isDiretor() && !isAdministrador()) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-[#6a6a6f]">Acesso restrito a Diretores e Administradores</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      
      {/* ============================================== */}
      {/* STICKY HEADER - Título + Busca                */}
      {/* ============================================== */}
      <div className="sticky top-[52px] lg:top-[56px] z-30 bg-[#0a0a0b] pb-6">
        
        {/* Título da Página */}
        <div className="px-6 lg:px-10 pt-8 lg:pt-10 mb-8">
          <h1 className="text-3xl lg:text-4xl font-light text-white mb-3">
            Gestão de <span className="text-[#ee7b4d] font-bold">Acesso</span>
          </h1>
          <div className="w-24 h-0.5 bg-[#ee7b4d] rounded-full mb-4"></div>
          <p className="text-[9px] lg:text-[10px] text-[#6a6a6f] uppercase tracking-[0.25em] font-bold">
            Controle Hierárquico e Status do Time
          </p>
        </div>

        {/* Barras de Busca */}
        <div className="px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Busca por Nome */}
          <div className="relative">
            <input
              type="text"
              placeholder="BUSCAR NOME..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-[#1a1a1f] border border-[#2a2a2f] rounded-xl px-4 py-3 pl-10 text-white text-sm placeholder:text-[#4a4a4f] placeholder:text-xs focus:outline-none focus:border-[#ee7b4d]/50"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a4f]">🔍</span>
          </div>

          {/* Busca por Perfil */}
          <div className="relative">
            <input
              type="text"
              placeholder="BUSCAR PERFIL..."
              value={searchProfile}
              onChange={(e) => setSearchProfile(e.target.value)}
              className="w-full bg-[#1a1a1f] border border-[#2a2a2f] rounded-xl px-4 py-3 pl-10 text-white text-sm placeholder:text-[#4a4a4f] placeholder:text-xs focus:outline-none focus:border-[#ee7b4d]/50"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a4f]">🛡️</span>
          </div>
        </div>

        {/* Header da Tabela - Time LeadCapture Pro + Contador */}
        <div className="px-6 lg:px-10 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-light text-white">
                Time <span className="text-[#ee7b4d] font-bold">LeadCapture Pro</span>
              </h2>
              {/* CONTADOR ESTILIZADO */}
              <div className="flex flex-wrap items-center gap-3 lg:gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ee7b4d]"></div>
                  <span className="text-xs text-[#6a6a6f]">
                    <span className="text-[#ee7b4d] font-bold">{stats.total}</span> usuários
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-[#6a6a6f]">
                    <span className="text-green-500 font-bold">{stats.ativos}</span> ativos
                  </span>
                </div>
                {stats.inativos > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs text-[#6a6a6f]">
                      <span className="text-red-500 font-bold">{stats.inativos}</span> inativos
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={handleNewUser}
              className="bg-[#ee7b4d] text-black font-bold px-5 py-2 rounded-lg hover:bg-[#d4663a] transition-all text-sm whitespace-nowrap"
            >
              + NOVO
            </button>
          </div>
        </div>

        {/* Cabeçalho da Tabela (Desktop) */}
        <div className="px-6 lg:px-10 hidden lg:grid lg:grid-cols-[60px_1fr_150px_200px_150px_120px] gap-4 pb-3 border-b border-[#1f1f23]">
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider">Status</div>
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider">Nome</div>
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider">Telefone</div>
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider">E-mail</div>
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider text-center">Perfil</div>
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider text-center">Ação</div>
        </div>
      </div>

      {/* ============================================== */}
      {/* SCROLLABLE CONTENT - Lista de Usuários        */}
      {/* ============================================== */}
      <div className="flex-1 px-6 lg:px-10 overflow-y-auto">
        
        {isLoading ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 animate-pulse">⏳</div>
            <p className="text-[#6a6a6f]">Carregando usuários...</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleEditUser(user)}
                className="grid lg:grid-cols-[60px_1fr_150px_200px_150px_120px] gap-4 items-center bg-[#12121a] border border-[#1f1f23] rounded-xl p-4 hover:border-[#ee7b4d]/30 hover:bg-[#1f1f23]/30 transition-all cursor-pointer group"
              >
                {/* Status Indicator */}
                <div className="flex lg:justify-center">
                  <div 
                    className={`w-3 h-3 rounded-full ${user.ativo ? 'bg-green-500' : 'bg-red-500'}`}
                    title={user.ativo ? 'Ativo' : 'Inativo'}
                  ></div>
                </div>

                {/* Nome */}
                <div>
                  <p className="text-white font-medium text-sm lg:text-base">{user.nome}</p>
                  <p className="text-[10px] text-[#6a6a6f] lg:hidden">{user.email}</p>
                </div>

                {/* Telefone (Desktop) */}
                <div className="hidden lg:block">
                  <p className="text-[#6a6a6f] text-sm">{user.telefone || '---'}</p>
                </div>

                {/* E-mail (Desktop) */}
                <div className="hidden lg:block">
                  <p className="text-[#6a6a6f] text-sm truncate">{user.email}</p>
                </div>

                {/* Perfil Badge */}
                <div className="flex lg:justify-center">
                  <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#ee7b4d]/10 text-[#ee7b4d] border border-[#ee7b4d]/20">
                    {user.role}
                  </span>
                </div>

                {/* Botão Ação */}
                <div className="flex lg:justify-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditUser(user);
                    }}
                    className="px-4 py-1.5 bg-[#1f1f23] border border-[#2a2a2f] rounded-lg text-xs text-[#6a6a6f] hover:text-[#ee7b4d] hover:border-[#ee7b4d]/30 transition-all group-hover:bg-[#2a2a2f]"
                  >
                    ALTERAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-30">🔍</div>
            <p className="text-[#6a6a6f] mb-4">Nenhum usuário encontrado</p>
            <button
              onClick={() => { setSearchName(''); setSearchProfile(''); }}
              className="text-[#ee7b4d] text-sm hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {showModal && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onSave={(data) => saveUser.mutate(data)}
          isSaving={saveUser.isPending}
        />
      )}
    </div>
  );
}