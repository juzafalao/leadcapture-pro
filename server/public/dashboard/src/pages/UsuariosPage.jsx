import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import PageHeader from '../components/shared/PageHeader';

export default function UsuariosPage() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Controle de Modais
  const [selectedUser, setSelectedUser] = useState(null);
  const [showNovoUsuario, setShowNovoUsuario] = useState(false);

  // Estados para Busca/Filtro
  const [buscaNome, setBuscaNome] = useState('');
  const [buscaRole, setBuscaRole] = useState('');

  // Estado para Formulário de Novo Membro
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

  // Lógica de Persistência do Novo Usuário
  const handleCreateUsuario = async () => {
    if (!novoMembro.nome || !novoMembro.email) return alert("Nome e E-mail são obrigatórios.");
    
    const { error } = await supabase
      .from('usuarios')
      .insert([{
        ...novoMembro,
        tenant_id: '81cac3a4-caa3-43b2-be4d-d16557d7ef88'
      }]);

    if (!error) {
      alert("✅ PERFIL CRIADO NO BANCO!\n\n⚠️ O Administrador agora deve validar o acesso no Supabase Auth.");
      setShowNovoUsuario(false);
      setNovoMembro({ nome: '', telefone: '', email: '', role: 'Consultor', ativo: true });
      fetchUsuarios();
    } else {
      alert("Erro ao gravar: " + error.message);
    }
  };

  // Filtro em Tempo Real
  const usuariosFiltrados = usuarios.filter(u => 
    u.nome?.toLowerCase().includes(buscaNome.toLowerCase()) &&
    u.role?.toLowerCase().includes(buscaRole.toLowerCase())
  );

  const podeGerenciar = ['Administrador', 'Diretor'].includes(usuario?.role);

  return (
    <div className="p-4 md:p-10 pt-24 md:pt-32 text-left bg-[#0a0a0b] min-h-screen">
      <PageHeader 
        title="Gestão de" 
        highlight="Acessos" 
        description="CONTROLE HIERÁRQUICO E STATUS DO TIME" 
      />

      {/* BUSCAS RESPONSIVAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-[#12121a] border border-white/5 p-5 rounded-2xl flex items-center gap-4 focus-within:border-[#ee7b4d]/30 transition-all">
          <span className="opacity-30">🔍</span>
          <input 
            type="text" placeholder="BUSCAR NOME..." value={buscaNome}
            onChange={(e) => setBuscaNome(e.target.value)}
            className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-white w-full"
          />
        </div>
        <div className="bg-[#12121a] border border-white/5 p-5 rounded-2xl flex items-center gap-4 focus-within:border-[#ee7b4d]/30 transition-all">
          <span className="opacity-30">🛡️</span>
          <input 
            type="text" placeholder="BUSCAR PERFIL..." value={buscaRole}
            onChange={(e) => setBuscaRole(e.target.value)}
            className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-white w-full"
          />
        </div>
      </div>

      <div className="bg-[#12121a] border border-white/5 rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-12 shadow-2xl relative">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl md:text-2xl font-light italic">Time <span className="font-bold text-[#ee7b4d]">LeadCapture Pro</span></h3>
          {podeGerenciar && (
            <button 
              onClick={() => setShowNovoUsuario(true)}
              className="bg-[#ee7b4d] text-black px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg"
            >
              + Novo
            </button>
          )}
        </div>

        {/* VIEW MOBILE: CARDS (O polegar do cliente agradece) */}
        <div className="md:hidden flex flex-col gap-4">
          {usuariosFiltrados.map(u => (
            <div key={u.id} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 relative active:scale-95 transition-all">
              <div className={`absolute top-6 right-6 w-2.5 h-2.5 rounded-full ${u.ativo ? 'bg-[#00d95f] shadow-[0_0_10px_#00d95f]' : 'bg-red-600'}`} />
              <p className="text-white font-bold text-sm uppercase tracking-tight mb-1">{u.nome}</p>
              <p className="text-gray-500 text-[10px] mb-4">{u.email}</p>
              <div className="flex justify-between items-center">
                <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${u.role === 'Administrador' ? 'border-[#ee7b4d] text-[#ee7b4d]' : 'border-white/10 text-gray-500'}`}>
                  {u.role}
                </span>
                {podeGerenciar && (
                  <button onClick={() => setSelectedUser(u)} className="text-[#ee7b4d] text-[10px] font-black uppercase tracking-widest">Alterar</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* VIEW DESKTOP: TABELA (Para visão executiva no PC) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] text-gray-600 uppercase font-black tracking-[0.2em] border-b border-white/5">
                <th className="pb-8">Status</th>
                <th className="pb-8">Nome</th>
                <th className="pb-8">Telefone</th>
                <th className="pb-8">E-mail</th>
                <th className="pb-8">Perfil</th>
                <th className="pb-8 text-right pr-4">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className="group hover:bg-white/[0.01]">
                  <td className="py-6">
                    <div className={`w-2 h-2 rounded-full ${u.ativo ? 'bg-[#00d95f] shadow-[0_0_8px_#00d95f]' : 'bg-red-600'}`} />
                  </td>
                  <td className="py-6 font-bold text-sm uppercase text-white">{u.nome}</td>
                  <td className="py-6 text-gray-500 text-xs">{u.telefone || '---'}</td>
                  <td className="py-6 text-gray-500 text-xs">{u.email}</td>
                  <td className="py-6">
                    <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${u.role === 'Administrador' ? 'border-[#ee7b4d] text-[#ee7b4d]' : 'border-white/10 text-gray-500'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-6 text-right pr-4">
                    {podeGerenciar && (
                      <button onClick={() => setSelectedUser(u)} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:bg-[#ee7b4d] hover:text-black transition-all">
                        Alterar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVO USUÁRIO */}
      {showNovoUsuario && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <div className="bg-[#0d0d12] border border-white/5 w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
            <h3 className="text-2xl font-light text-white mb-8 italic">Adicionar <span className="text-[#ee7b4d] font-bold">Membro</span></h3>
            <div className="space-y-4 mb-10">
              <InputNovo label="Nome" value={novoMembro.nome} onChange={(v) => setNovoMembro({...novoMembro, nome: v})} />
              <InputNovo label="E-mail" value={novoMembro.email} onChange={(v) => setNovoMembro({...novoMembro, email: v})} />
              <InputNovo label="Telefone" value={novoMembro.telefone} onChange={(v) => setNovoMembro({...novoMembro, telefone: v})} />
              <div className="grid grid-cols-2 gap-4">
                <SelectNovo label="Perfil" value={novoMembro.role} onChange={(v) => setNovoMembro({...novoMembro, role: v})}>
                  {usuario?.role === 'Administrador' && <option value="Administrador">Administrador</option>}
                  <option value="Diretor">Diretor</option>
                  <option value="Gestor">Gestor</option>
                  <option value="Consultor">Consultor</option>
                </SelectNovo>
                <SelectNovo label="Status" value={novoMembro.ativo} onChange={(v) => setNovoMembro({...novoMembro, ativo: v === 'true'})}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </SelectNovo>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowNovoUsuario(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-600">Cancelar</button>
              <button onClick={handleCreateUsuario} className="flex-1 py-4 bg-[#ee7b4d] text-black rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-[#ee7b4d]/20">Gravar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTERAR ROLE */}
      {selectedUser && (
        <RoleModal user={selectedUser} currentUserRole={usuario?.role} onClose={() => setSelectedUser(null)} onSave={fetchUsuarios} />
      )}
    </div>
  );
}

// COMPONENTES AUXILIARES
function InputNovo({ label, value, onChange }) {
  return (
    <div>
      <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-white text-xs outline-none focus:border-[#ee7b4d]/50" />
    </div>
  );
}

function SelectNovo({ label, value, onChange, children }) {
  return (
    <div>
      <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-white text-xs outline-none focus:border-[#ee7b4d]/50 cursor-pointer">
        {children}
      </select>
    </div>
  );
}

function RoleModal({ user, currentUserRole, onClose, onSave }) {
  const [newRole, setNewRole] = useState(user.role);
  const rolesDisponiveis = ['Administrador', 'Diretor', 'Gestor', 'Consultor'].filter(r => currentUserRole === 'Diretor' ? r !== 'Administrador' : true);

  const handleUpdate = async () => {
    const { error } = await supabase.from('usuarios').update({ role: newRole }).eq('id', user.id);
    if (!error) { onSave(); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <div className="bg-[#0d0d12] border border-white/5 w-full max-w-md rounded-[3rem] p-12 text-left">
        <h3 className="text-2xl font-light text-white mb-2 italic tracking-tighter">Ajustar <span className="text-[#ee7b4d] font-bold">Nível</span></h3>
        <p className="text-[10px] text-gray-600 font-black uppercase mb-10 tracking-widest">{user.nome}</p>
        <div className="space-y-3 mb-10">
          {rolesDisponiveis.map(role => (
            <button key={role} onClick={() => setNewRole(role)} className={`w-full py-5 px-6 rounded-2xl text-[10px] font-black uppercase border text-left flex justify-between items-center transition-all ${newRole === role ? 'bg-[#ee7b4d] text-black border-[#ee7b4d]' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}>
              {role} {newRole === role && <span>✓</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 text-[10px] font-black uppercase text-gray-600">Cancelar</button>
          <button onClick={handleUpdate} className="flex-1 py-5 bg-[#ee7b4d]/10 border border-[#ee7b4d]/30 text-[#ee7b4d] rounded-2xl text-[10px] font-black uppercase tracking-widest">Confirmar</button>
        </div>
      </div>
    </div>
  );
}