import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import PageHeader from '../components/shared/PageHeader';

export default function UsuariosPage() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showNovoUsuario, setShowNovoUsuario] = useState(false);

  // ESTADOS DE BUSCA
  const [buscaNome, setBuscaNome] = useState('');
  const [buscaRole, setBuscaRole] = useState('');

  // ESTADO PARA NOVO MEMBRO
  const [novoMembro, setNovoMembro] = useState({
    nome: '', telefone: '', email: '', role: 'Consultor', ativo: true
  });

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('tenant_id', '81cac3a4-caa3-43b2-be4d-d16557d7ef88') // Tenant ID Fixo
      .order('nome');
    
    if (!error && data) setUsuarios(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsuarios(); }, []);

  // LÓGICA DE PERSISTÊNCIA DE NOVO USUÁRIO
  const handleCreateUsuario = async () => {
    if (!novoMembro.nome || !novoMembro.email) return alert("Preencha Nome e E-mail.");
    
    const { error } = await supabase
      .from('usuarios')
      .insert([{
        ...novoMembro,
        tenant_id: '81cac3a4-caa3-43b2-be4d-d16557d7ef88'
      }]);

    if (!error) {
      // Aviso de validação manual no Supabase Auth conforme solicitado
      alert(
        "✅ PERFIL REGISTRADO COM SUCESSO!\n\n" +
        "⚠️ O login ainda não está ativo no sistema.\n" +
        "É necessário que o ADMINISTRADOR valide este e-mail no painel de segurança (Supabase Auth) para liberar o acesso."
      );
      setShowNovoUsuario(false);
      setNovoMembro({ nome: '', telefone: '', email: '', role: 'Consultor', ativo: true });
      fetchUsuarios();
    } else {
      alert("Erro ao gravar: " + error.message);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const matchNome = u.nome?.toLowerCase().includes(buscaNome.toLowerCase());
    const matchRole = u.role?.toLowerCase().includes(buscaRole.toLowerCase());
    return matchNome && matchRole;
  });

  // REGRAS DE HIERARQUIA PARA EDIÇÃO E CADASTRO
  const podeAlterarRole = ['Administrador', 'Diretor'].includes(usuario?.role);
  const podeCadastrar = ['Administrador', 'Diretor', 'Gestor'].includes(usuario?.role);

  return (
    <div className="p-10 pt-32 bg-[#0a0a0b] min-h-screen text-left text-white font-sans">
      <PageHeader 
        title="Gestão de" 
        highlight="Acessos" 
        description="CENTRAL DE CONTROLE HIERÁRQUICO E STATUS DO TIME" 
      />

      {/* BARRAS DE BUSCA */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-[#12121a] border border-white/5 p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4 focus-within:border-[#ee7b4d]/30 transition-all">
          <span className="text-xl opacity-30">🔍</span>
          <input 
            type="text" placeholder="BUSCAR PELO NOME..." value={buscaNome}
            onChange={(e) => setBuscaNome(e.target.value)}
            className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-white w-full placeholder:text-gray-700"
          />
        </div>
        <div className="bg-[#12121a] border border-white/5 p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4 focus-within:border-[#ee7b4d]/30 transition-all">
          <span className="text-xl opacity-30">🛡️</span>
          <input 
            type="text" placeholder="FILTRAR POR ROLE..." value={buscaRole}
            onChange={(e) => setBuscaRole(e.target.value)}
            className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-white w-full placeholder:text-gray-700"
          />
        </div>
      </div>

      {/* GRID DE GESTÃO */}
      <div className="bg-[#12121a] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-2xl font-light italic text-white">Membros <span className="font-bold text-[#ee7b4d]">LeadCapture Pro</span></h3>
          {podeCadastrar && (
            <button 
              onClick={() => setShowNovoUsuario(true)}
              className="bg-[#ee7b4d] text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#ee7b4d]/20"
            >
              + Adicionar Membro
            </button>
          )}
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-[9px] text-gray-600 uppercase font-black tracking-[0.2em] border-b border-white/5 text-left">
              <th className="pb-8">Status</th>
              <th className="pb-8">Nome Completo</th>
              <th className="pb-8">Telefone</th>
              <th className="pb-8">E-mail</th>
              <th className="pb-8">Perfil</th>
              <th className="pb-8 text-right">Gestão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {usuariosFiltrados.map((u) => (
              <tr key={u.id} className="group hover:bg-white/[0.01] transition-all">
                <td className="py-6">
                  {/* STATUS NEON VERDE/VERMELHO */}
                  <div className={`w-2.5 h-2.5 rounded-full ${u.ativo ? 'bg-[#00d95f] shadow-[0_0_10px_#00d95f]' : 'bg-red-600 shadow-[0_0_10px_#dc2626]'}`} />
                </td>
                <td className="py-6 font-bold text-sm uppercase text-white">{u.nome}</td>
                <td className="py-6 text-gray-500 text-xs">{u.telefone || '---'}</td>
                <td className="py-6 text-gray-500 text-xs">{u.email}</td>
                <td className="py-6">
                  <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${u.role === 'Administrador' ? 'border-[#ee7b4d] text-[#ee7b4d]' : 'border-white/10 text-gray-500'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-6 text-right">
                  {podeAlterarRole && (
                    <button 
                      onClick={() => setSelectedUser(u)} 
                      className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:bg-[#ee7b4d] hover:text-black transition-all"
                    >
                      Alterar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NOVO MEMBRO */}
      {showNovoUsuario && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <div className="bg-[#0d0d12] border border-white/5 w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl relative">
            <h3 className="text-3xl font-light text-white mb-2 italic">Novo <span className="text-[#ee7b4d] font-bold">Membro</span></h3>
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-10">Cadastrar perfil no banco de dados</p>
            
            <div className="space-y-4">
              <InputForm label="Nome Completo" value={novoMembro.nome} onChange={(v) => setNovoMembro({...novoMembro, nome: v})} />
              <InputForm label="E-mail" value={novoMembro.email} onChange={(v) => setNovoMembro({...novoMembro, email: v})} />
              <InputForm label="Telefone" value={novoMembro.telefone} onChange={(v) => setNovoMembro({...novoMembro, telefone: v})} />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block">Nível de Acesso</label>
                  <select 
                    value={novoMembro.role} 
                    onChange={(e) => setNovoMembro({...novoMembro, role: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-white text-xs outline-none focus:border-[#ee7b4d]/50"
                  >
                    {/* Regras de restrição baseadas em quem está criando */}
                    {usuario?.role === 'Administrador' && <option value="Administrador">Administrador</option>}
                    <option value="Diretor">Diretor</option>
                    <option value="Gestor">Gestor</option>
                    <option value="Consultor">Consultor</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block">Estado Atual</label>
                  <select 
                    value={novoMembro.ativo} 
                    onChange={(e) => setNovoMembro({...novoMembro, ativo: e.target.value === 'true'})}
                    className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-white text-xs outline-none focus:border-[#ee7b4d]/50"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowNovoUsuario(false)} className="flex-1 py-5 text-[10px] font-black uppercase text-gray-600 hover:text-white transition-all">Cancelar</button>
              <button onClick={handleCreateUsuario} className="flex-1 py-5 bg-[#ee7b4d] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#ee7b4d]/20">Gravar Perfil</button>
            </div>
            <p className="text-[8px] text-gray-700 mt-6 uppercase text-center font-black italic tracking-widest">
              * O acesso de login deverá ser validado pelo Administrador
            </p>
          </div>
        </div>
      )}

      {/* MODAL ALTERAR ROLE EXISTENTE */}
      {selectedUser && (
        <RoleModal user={selectedUser} currentUserRole={usuario?.role} onClose={() => setSelectedUser(null)} onSave={fetchUsuarios} />
      )}
    </div>
  );
}

function InputForm({ label, value, onChange }) {
  return (
    <div>
      <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block">{label}</label>
      <input 
        type="text" value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-white text-xs outline-none focus:border-[#ee7b4d]/50 transition-all" 
      />
    </div>
  );
}

function RoleModal({ user, currentUserRole, onClose, onSave }) {
  const [newRole, setNewRole] = useState(user.role);
  const rolesDisponiveis = ['Administrador', 'Diretor', 'Gestor', 'Consultor'].filter(r => {
    if (currentUserRole === 'Diretor' && r === 'Administrador') return false;
    return true;
  });

  const handleUpdate = async () => {
    const { error } = await supabase.from('usuarios').update({ role: newRole }).eq('id', user.id);
    if (!error) { onSave(); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <div className="bg-[#0d0d12] border border-white/5 w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl relative text-left">
        <h3 className="text-2xl font-light text-white mb-2 italic">Ajustar <span className="text-[#ee7b4d] font-bold">Hierarquia</span></h3>
        <p className="text-[10px] text-gray-600 font-black uppercase mb-10 tracking-widest">{user.nome}</p>
        <div className="space-y-3 mb-10">
          {rolesDisponiveis.map(role => (
            <button 
              key={role} onClick={() => setNewRole(role)} 
              className={`w-full py-5 px-6 rounded-2xl text-[10px] font-black uppercase border text-left flex justify-between items-center transition-all ${newRole === role ? 'bg-[#ee7b4d] text-black border-[#ee7b4d]' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
            >
              {role} {newRole === role && <span>✓</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 text-[10px] font-black uppercase text-gray-600">Cancelar</button>
          <button onClick={handleUpdate} className="flex-1 py-5 bg-[#ee7b4d]/10 border border-[#ee7b4d]/30 text-[#ee7b4d] rounded-2xl text-[10px] font-black uppercase">Confirmar</button>
        </div>
      </div>
    </div>
  );
}