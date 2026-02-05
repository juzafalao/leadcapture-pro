import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UserModal from '../components/usuarios/UserModal';

export default function UsuariosPage() {
  const { usuario: me, isDiretor, isAdministrador, isSuperAdmin, isGestor } = useAuth();
  const queryClient = useQueryClient();
  const [searchName, setSearchName] = useState('');
  const [searchProfile, setSearchProfile] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ✅ BUSCAR USUÁRIOS (MULTI-TENANT)
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios', me?.tenant_id, me?.is_super_admin],
    queryFn: async () => {
      console.log('📊 Buscando usuários... Super Admin?', me?.is_super_admin);
      
      let query = supabase
        .from('usuarios')
        .select('*, tenant:tenants(id, nome, slug)')
        .order('nome');
      
      if (!me?.is_super_admin) {
        console.log('🔒 Filtrando por tenant:', me.tenant_id);
        query = query.eq('tenant_id', me.tenant_id);
      } else {
        console.log('👑 Super Admin - Vendo TODOS os tenants');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        throw error;
      }
      
      console.log('✅ Usuários carregados:', data?.length);
      return data || [];
    },
    enabled: !!me?.tenant_id || !!me?.is_super_admin
  });

  const filteredUsers = usuarios.filter(u => {
    const matchName = u.nome.toLowerCase().includes(searchName.toLowerCase());
    const matchProfile = searchProfile === '' || u.role.toLowerCase().includes(searchProfile.toLowerCase());
    return matchName && matchProfile;
  });

  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.ativo).length,
    inativos: usuarios.filter(u => !u.ativo).length
  };

  // ✅ SALVAR USUÁRIO (COM TOAST DISCRETO)
  const saveUser = useMutation({
    mutationFn: async (userData) => {
      console.log('💾 Salvando usuário:', userData);
      console.log('👤 Usuário logado:', me.email, 'Super Admin?', me.is_super_admin);
      
      if (userData.id) {
        console.log('📝 Atualizando usuário ID:', userData.id);
        
        const { data: exists, error: checkError } = await supabase
          .from('usuarios')
          .select('id, nome, role')
          .eq('id', userData.id)
          .single();
        
        if (checkError) {
          console.error('❌ Erro ao verificar usuário:', checkError);
          throw new Error('Usuário não encontrado: ' + checkError.message);
        }
        
        console.log('✅ Usuário existe:', exists);
        
        const { data: updated, error: updateError } = await supabase
          .from('usuarios')
          .update({
            nome: userData.nome,
            email: userData.email,
            telefone: userData.telefone || '',
            role: userData.role,
            ativo: userData.ativo
          })
          .eq('id', userData.id)
          .select();
        
        if (updateError) {
          console.error('❌ Erro no UPDATE:', updateError);
          throw new Error('Erro ao atualizar: ' + updateError.message);
        }
        
        console.log('✅ Resposta do UPDATE:', updated);
        
        if (!updated || updated.length === 0) {
          console.error('⚠️ UPDATE não retornou dados!');
          throw new Error('Atualização bloqueada. Verifique permissões.');
        }
        
        console.log('✅ Usuário atualizado com sucesso:', updated[0]);
        return updated[0];
        
      } else {
        console.log('�� Criando novo usuário');
        
        const { data, error } = await supabase
          .from('usuarios')
          .insert({
            nome: userData.nome,
            email: userData.email,
            telefone: userData.telefone || '',
            role: userData.role,
            ativo: userData.ativo,
            tenant_id: me.tenant_id,
            is_super_admin: false
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
      
      // ✅ TOAST DISCRETO
      if (!data.auth_id) {
        const toast = document.createElement('div');
        toast.style.cssText = `
          position: fixed;
          top: 80px;
          right: 20px;
          background: linear-gradient(135deg, #ee7b4d 0%, #d4663a 100%);
          color: white;
          padding: 20px 24px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(238, 123, 77, 0.4), 0 0 0 1px rgba(255,255,255,0.1);
          z-index: 9999;
          max-width: 420px;
          font-family: system-ui, -apple-system, sans-serif;
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        `;
        
        toast.innerHTML = `
          <div style="display: flex; align-items: start; gap: 14px;">
            <div style="font-size: 28px; line-height: 1;">⚠️</div>
            <div style="flex: 1;">
              <strong style="display: block; margin-bottom: 6px; font-size: 15px; font-weight: 600;">
                ✅ Usuário "${data.nome}" criado!
              </strong>
              <p style="font-size: 13px; opacity: 0.95; margin: 0; line-height: 1.5;">
                Solicite ao administrador o registro no <strong>Supabase Auth</strong> para permitir login.
              </p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 18px; cursor: pointer; padding: 4px 8px; line-height: 1; border-radius: 6px; transition: background 0.2s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                    onmouseout="this.style.background='rgba(255,255,255,0.2)'">
              ×
            </button>
          </div>
        `;
        
        if (!document.getElementById('toast-animation-style')) {
          const style = document.createElement('style');
          style.id = 'toast-animation-style';
          style.textContent = `
            @keyframes slideIn {
              from {
                transform: translateX(120%) scale(0.9);
                opacity: 0;
              }
              to {
                transform: translateX(0) scale(1);
                opacity: 1;
              }
            }
            @keyframes slideOut {
              from {
                transform: translateX(0) scale(1);
                opacity: 1;
              }
              to {
                transform: translateX(120%) scale(0.9);
                opacity: 0;
              }
            }
          `;
          document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
          toast.style.animation = 'slideOut 0.3s cubic-bezier(0.5, 0, 0.75, 0) forwards';
          setTimeout(() => toast.remove(), 300);
        }, 10000);
      }
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error);
      alert('❌ Erro ao salvar usuário: ' + error.message);
    }
  });

  const handleEditUser = (user) => {
    console.log('✏️ Editando usuário:', user.nome, user.role);
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const canEdit = isDiretor() || isAdministrador();

  if (!isDiretor() && !isAdministrador() && !isGestor()) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-[#6a6a6f]">Acesso restrito a Gestores, Diretores e Administradores</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      
      <div className="sticky top-[52px] lg:top-[56px] z-30 bg-[#0a0a0b] pb-6">
        
        <div className="px-6 lg:px-10 pt-8 lg:pt-10 mb-8">
          <h1 className="text-3xl lg:text-4xl font-light text-white mb-3">
            Gestão de <span className="text-[#ee7b4d] font-bold">Acesso</span>
          </h1>
          <div className="w-24 h-0.5 bg-[#ee7b4d] rounded-full mb-4"></div>
          <p className="text-[9px] lg:text-[10px] text-[#6a6a6f] uppercase tracking-[0.25em] font-bold">
            Controle Hierárquico e Status do Time
          </p>
        </div>

        <div className="px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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

        <div className="px-6 lg:px-10 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-light text-white">
                Time <span className="text-[#ee7b4d] font-bold">LeadCapture Pro</span>
              </h2>
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
            {canEdit && (
              <button 
                onClick={handleNewUser}
                className="bg-[#ee7b4d] text-black font-bold px-5 py-2 rounded-lg hover:bg-[#d4663a] transition-all text-sm whitespace-nowrap"
              >
                + NOVO
              </button>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-10 hidden lg:grid lg:grid-cols-[60px_1fr_150px_200px_150px_120px] gap-4 pb-3 border-b border-[#1f1f23]">
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider">Status</div>
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider">Nome</div>
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider">Telefone</div>
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider">E-mail</div>
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider text-center">Perfil</div>
          <div className="text-[10px] text-[#6a6a6f] font-bold uppercase tracking-wider text-center">Ação</div>
        </div>
      </div>

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
                onClick={() => canEdit && handleEditUser(user)}
                className={`grid lg:grid-cols-[60px_1fr_150px_200px_150px_120px] gap-4 items-center bg-[#12121a] border border-[#1f1f23] rounded-xl p-4 transition-all ${
                  canEdit ? 'hover:border-[#ee7b4d]/30 hover:bg-[#1f1f23]/30 cursor-pointer' : ''
                } group`}
              >
                <div className="flex lg:justify-center">
                  <div className={`w-3 h-3 rounded-full ${user.ativo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>

                <div>
                  <p className="text-white font-medium text-sm lg:text-base">{user.nome}</p>
                  <p className="text-[10px] text-[#6a6a6f] lg:hidden">{user.email}</p>
                </div>

                <div className="hidden lg:block">
                  <p className="text-[#6a6a6f] text-sm">{user.telefone || '---'}</p>
                </div>

                <div className="hidden lg:block">
                  <p className="text-[#6a6a6f] text-sm truncate">{user.email}</p>
                </div>

                <div className="flex lg:justify-center">
                  <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#ee7b4d]/10 text-[#ee7b4d] border border-[#ee7b4d]/20">
                    {user.role}
                  </span>
                </div>

                <div className="flex lg:justify-center">
                  {canEdit ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditUser(user);
                      }}
                      className="px-4 py-1.5 bg-[#1f1f23] border border-[#2a2a2f] rounded-lg text-xs text-[#6a6a6f] hover:text-[#ee7b4d] hover:border-[#ee7b4d]/30 transition-all group-hover:bg-[#2a2a2f]"
                    >
                      ALTERAR
                    </button>
                  ) : (
                    <span className="text-xs text-[#4a4a4f] italic">Visualização</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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

      {showModal && canEdit && (
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