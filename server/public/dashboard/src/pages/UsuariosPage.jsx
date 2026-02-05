import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
// Importe seus hooks reais aqui (useUsuarios, etc)

export default function UsuariosPage() {
  const { usuario: me, isDiretor, isAdministrador } = useAuth();
  const [searchName, setSearchName] = useState('');
  const [searchProfile, setSearchProfile] = useState('');

  // SUBSTITUA pelos seus dados reais
  const usuarios = [
    { id: 1, nome: 'ADMINISTRADOR', telefone: '---', email: 'leadcaptureadm@gmail.com', role: 'Administrador', ativo: true },
    { id: 2, nome: 'EREREWR', telefone: 'werewr', email: 'werewr', role: 'Operador', ativo: false },
    { id: 3, nome: 'GESTOR TESTE', telefone: '---', email: 'gestor@teste.com', role: 'Gestor', ativo: true },
    { id: 4, nome: 'JOSIANE TIAGO', telefone: '17981647869', email: 'josyaptiago@gmail.com', role: 'Operador', ativo: true },
    { id: 5, nome: 'JULIANA ZAFALAO', telefone: '14996011482', email: 'juzafalao@gmail.com', role: 'Gestor', ativo: true },
  ];

  // Filtrar usuários
  const filteredUsers = usuarios.filter(u => {
    const matchName = u.nome.toLowerCase().includes(searchName.toLowerCase());
    const matchProfile = searchProfile === '' || u.role.toLowerCase().includes(searchProfile.toLowerCase());
    return matchName && matchProfile;
  });

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
      {/* Ajuste o top-[XX] conforme altura do Header   */}
      {/* ============================================== */}
      <div className="sticky top-[52px] lg:top-[56px] z-30 bg-[#0a0a0b] pb-6">
        
        {/* Título da Página */}
        <div className="px-6 lg:px-10 pt-8 lg:pt-10 mb-8">
          <h1 className="text-3xl lg:text-4xl font-light text-white mb-4">
            Gestão de <span className="text-[#ee7b4d] font-bold">Acessos</span>
          </h1>
          <div className="w-24 h-0.5 bg-[#ee7b4d] rounded-full mb-3"></div>
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

        {/* Header da Tabela - Time LeadCapture Pro */}
        <div className="px-6 lg:px-10 flex items-center justify-between mb-4">
          <h2 className="text-lg font-light text-white">
            Time <span className="text-[#ee7b4d] font-bold">LeadCapture Pro</span>
          </h2>
          <button className="bg-[#ee7b4d] text-black font-bold px-5 py-2 rounded-lg hover:bg-[#d4663a] transition-all text-sm">
            + NOVO
          </button>
        </div>

        {/* Cabeçalho da Tabela */}
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
        
        {/* Lista de Usuários */}
        <div className="space-y-3 pb-8">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="grid lg:grid-cols-[60px_1fr_150px_200px_150px_120px] gap-4 items-center bg-[#12121a] border border-[#1f1f23] rounded-xl p-4 hover:border-[#ee7b4d]/30 transition-all"
            >
              {/* Status Indicator */}
              <div className="flex lg:justify-center">
                <div className={`w-3 h-3 rounded-full ${user.ativo ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>

              {/* Nome */}
              <div>
                <p className="text-white font-medium text-sm lg:text-base">{user.nome}</p>
                <p className="text-[10px] text-[#6a6a6f] lg:hidden">{user.email}</p>
              </div>

              {/* Telefone */}
              <div className="hidden lg:block">
                <p className="text-[#6a6a6f] text-sm">{user.telefone}</p>
              </div>

              {/* E-mail */}
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
                <button className="px-4 py-1.5 bg-[#1f1f23] border border-[#2a2a2f] rounded-lg text-xs text-[#6a6a6f] hover:text-[#ee7b4d] hover:border-[#ee7b4d]/30 transition-all">
                  ALTERAR
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
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
    </div>
  );
}