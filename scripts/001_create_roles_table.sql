-- ============================================================
-- Script: 001_create_roles_table.sql
-- Descrição: Cria a tabela roles para controle de perfis
-- LeadCapture Pro - Multi-Tenant System
-- Data: 2026-02-23
-- ============================================================
-- ATENÇÃO: Execute este script manualmente no Supabase SQL Editor
-- ============================================================

-- Tabela de perfis (roles)
CREATE TABLE IF NOT EXISTS public.roles (
  id         SERIAL PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  nivel      INTEGER NOT NULL DEFAULT 1,
  descricao  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir perfis padrão
INSERT INTO public.roles (key, label, nivel, descricao) VALUES
  ('Administrador', 'Administrador', 5, 'Super Admin - Acesso total ao sistema'),
  ('Diretor',       'Diretor',       4, 'Gestão estratégica do tenant'),
  ('Gestor',        'Gestor',        3, 'Gestão operacional'),
  ('Consultor',     'Consultor',     2, 'Atendimento e qualificação'),
  ('Cliente',       'Cliente',       1, 'Acesso somente visualização - casos especiais')
ON CONFLICT (key) DO NOTHING;

-- Adicionar coluna role_id na tabela usuarios (FK para roles)
-- Mantém coluna role (texto) para compatibilidade retroativa
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES public.roles(id);

-- Habilitar RLS na tabela roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário autenticado pode ler os roles
CREATE POLICY "roles_select_authenticated"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);
