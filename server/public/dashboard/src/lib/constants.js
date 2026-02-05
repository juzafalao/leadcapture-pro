// ============================================
// CONSTANTES DO SISTEMA - LEADCAPTURE PRO
// Roles em PORTUGUÊS (sincronizado com banco)
// ============================================

export const ROLES = {
  Administrador: {
    key: 'Administrador',
    label: 'Administrador',
    emoji: '👑',
    color: '#ee7b4d',
    nivel: 5,
    descricao: 'Acesso total ao sistema'
  },
  Diretor: {
    key: 'Diretor',
    label: 'Diretor',
    emoji: '🎯',
    color: '#f97316',
    nivel: 4,
    descricao: 'Acesso administrativo completo'
  },
  Gestor: {
    key: 'Gestor',
    label: 'Gestor',
    emoji: '📊',
    color: '#a78bfa',
    nivel: 3,
    descricao: 'Gerenciar leads, marcas e segmentos'
  },
  Consultor: {
    key: 'Consultor',
    label: 'Consultor',
    emoji: '👓',
    color: '#60a5fa',
    nivel: 2,
    descricao: 'Visualizar leads e relatórios'
  },
  Operador: {
    key: 'Operador',
    label: 'Operador',
    emoji: '👤',
    color: '#22c55e',
    nivel: 1,
    descricao: 'Editar leads básicos'
  }
}

export const STATUS_OPTIONS = {
  all: 'Todos',
  novo: '🆕 Novo',
  contato: '📞 Em Contato',
  agendado: '📅 Agendado',
  negociacao: '💼 Negociação',
  convertido: '✅ Convertido',
  perdido: '❌ Perdido'
}

export const CATEGORIAS = {
  all: 'Todas',
  hot: '🔥 Hot',
  warm: '🌤 Warm',
  cold: '❄️ Cold'
}

export const FONTES = {
  all: 'Todas',
  website: 'Website',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  indicacao: 'Indicação',
  evento: 'Evento',
  google_ads: 'Google Ads'
}

// HELPER FUNCTIONS
export const getRoleInfo = (roleKey) => {
  return ROLES[roleKey] || {
    key: roleKey,
    label: roleKey,
    emoji: '❓',
    color: '#6b7280',
    nivel: 0
  }
}

export const getRoleLabel = (roleKey) => getRoleInfo(roleKey).label
export const getRoleColor = (roleKey) => getRoleInfo(roleKey).color
export const getRoleEmoji = (roleKey) => getRoleInfo(roleKey).emoji
export const getRoleNivel = (roleKey) => getRoleInfo(roleKey).nivel

// Verifica se role1 tem nível maior ou igual a role2
export const hasRoleLevel = (role1, role2) => {
  return getRoleNivel(role1) >= getRoleNivel(role2)
}

// Lista de roles ordenada por nível (maior para menor)
export const ROLES_ORDENADAS = Object.values(ROLES).sort((a, b) => b.nivel - a.nivel)