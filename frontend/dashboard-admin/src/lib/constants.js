// ============================================
// ROLES - HIERARQUIA DE PERFIS
// LeadCapture Pro - Multi-Tenant System
// Data: 2026-02-05
// ============================================

export const ROLES = {
  // ============================================
  // SUPER ADMIN (Nível Sistema - Vocês)
  // ============================================
  Administrador: {
    key: 'Administrador',
    label: 'Administrador',
    emoji: '👑',
    nivel: 5,
    color: '#ef4444',
    descricao: 'Super Admin - Acesso total ao sistema',
    isSuperAdmin: true,
    permissoes: ['*'] // Todas as permissões em todos os tenants
  },
  
  // ============================================
  // ROLES POR TENANT (Níveis do Cliente)
  // ============================================
  Diretor: {
    key: 'Diretor',
    label: 'Diretor',
    emoji: '🎯',
    nivel: 4,
    color: '#f59e0b',
    descricao: 'Gestão estratégica do tenant',
    isSuperAdmin: false,
    permissoes: [
      'usuarios.ver',
      'usuarios.criar',
      'usuarios.editar',
      'usuarios.excluir',
      'leads.ver_todos',
      'leads.criar',
      'leads.editar_todos',
      'leads.excluir',
      'leads.atribuir',
      'leads.exportar',
      'marcas.ver',
      'marcas.criar',
      'marcas.editar',
      'marcas.excluir',
      'segmentos.ver',
      'segmentos.criar',
      'segmentos.editar',
      'segmentos.excluir',
      'bi.dashboard',
      'bi.relatorios_avancados',
      'bi.metricas_financeiras',
      'configuracoes.tenant'
    ]
  },
  
  Gestor: {
    key: 'Gestor',
    label: 'Gestor',
    emoji: '📊',
    nivel: 3,
    color: '#3b82f6',
    descricao: 'Gestão operacional',
    isSuperAdmin: false,
    permissoes: [
      'usuarios.ver',
      'leads.ver_todos',
      'leads.criar',
      'leads.editar_todos',
      'leads.excluir',
      'leads.atribuir',
      'leads.exportar',
      'marcas.ver',
      'segmentos.ver',
      'bi.dashboard',
      'bi.relatorios_avancados'
    ]
  },
  
  Consultor: {
    key: 'Consultor',
    label: 'Consultor',
    emoji: '💼',
    nivel: 2,
    color: '#8b5cf6',
    descricao: 'Atendimento e qualificação',
    isSuperAdmin: false,
    permissoes: [
      'leads.ver_atribuidos',
      'leads.criar',
      'leads.editar_atribuidos',
      'marcas.ver',
      'bi.dashboard_proprio'
    ]
  }
};

// ============================================
// HELPERS DE PERMISSÃO
// ============================================

/**
 * Verifica se é Super Admin (ignora tenant)
 */
export const isSuperAdmin = (user) => {
  return user?.is_super_admin === true || user?.role === 'Administrador';
};

/**
 * Verifica permissão (Super Admin tem todas)
 */
export const hasPermission = (user, permission) => {
  if (isSuperAdmin(user)) return true;
  
  const role = ROLES[user?.role];
  if (!role) return false;
  
  if (role.permissoes.includes('*')) return true;
  return role.permissoes.includes(permission);
};

/**
 * Verifica se pode editar outro usuário
 */
export const canEditUser = (editor, target) => {
  // Super Admin pode editar qualquer um
  if (isSuperAdmin(editor)) return true;
  
  // Não pode editar usuários de outro tenant
  if (editor.tenant_id !== target.tenant_id) return false;
  
  const editorRole = ROLES[editor.role];
  const targetRole = ROLES[target.role];
  
  if (!editorRole || !targetRole) return false;
  
  // Diretor pode editar Gestor e Consultor
  if (editorRole.nivel === 4 && targetRole.nivel < 4) return true;
  
  return false;
};

/**
 * Retorna roles que um usuário pode atribuir
 */
export const getAssignableRoles = (user) => {
  // Super Admin pode atribuir qualquer role (inclusive outro admin)
  if (isSuperAdmin(user)) {
    return Object.values(ROLES);
  }
  
  const userRole = ROLES[user?.role];
  if (!userRole) return [];
  
  // Diretor pode atribuir Gestor e Consultor
  if (userRole.nivel === 4) {
    return Object.values(ROLES).filter(r => r.nivel <= 3 && !r.isSuperAdmin);
  }
  
  // Gestor e Consultor não podem atribuir roles
  return [];
};

/**
 * Verifica se pode acessar página
 */
export const canAccessPage = (user, page) => {
  if (isSuperAdmin(user)) return true;
  
  const permissions = {
    'usuarios': ['usuarios.ver'],
    'marcas': ['marcas.ver'],
    'segmentos': ['segmentos.ver'],
    'inteligencia': ['bi.dashboard'],
    'leads': ['leads.ver_atribuidos', 'leads.ver_todos']
  };
  
  const required = permissions[page];
  if (!required) return true;
  
  return required.some(perm => hasPermission(user, perm));
};

/**
 * Retorna o nível de acesso de um usuário
 */
export const getUserLevel = (userRole) => {
  return ROLES[userRole]?.nivel || 0;
};

/**
 * Verifica se um usuário tem nível maior ou igual a outro
 */
export const hasEqualOrHigherLevel = (userRole, targetRole) => {
  const userLevel = getUserLevel(userRole);
  const targetLevel = getUserLevel(targetRole);
  return userLevel >= targetLevel;
};