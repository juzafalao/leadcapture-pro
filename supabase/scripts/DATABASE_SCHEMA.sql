


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "backup_20260225";


ALTER SCHEMA "backup_20260225" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."aceitar_convite_usuario"("p_token" character varying, "p_auth_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_convite RECORD;
  v_usuario_id UUID;
  v_role_id UUID;
BEGIN
  -- Buscar convite válido
  SELECT * INTO v_convite
  FROM convites_usuarios
  WHERE token = p_token
  AND usado_em IS NULL
  AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Convite inválido ou expirado');
  END IF;
  
  -- Verificar se auth_id já está vinculado
  IF EXISTS (SELECT 1 FROM usuarios WHERE auth_id = p_auth_id) THEN
    RETURN json_build_object('success', false, 'error', 'Esta conta já está vinculada a outro usuário');
  END IF;
  
  -- Buscar role_id pelo nome da role do convite
  SELECT id INTO v_role_id FROM roles WHERE nome = v_convite.role AND active = true;
  IF v_role_id IS NULL THEN
    -- Fallback: Consultor
    SELECT id INTO v_role_id FROM roles WHERE nome = 'Consultor' AND active = true;
  END IF;
  
  -- Criar usuário com role_id (sem coluna role texto)
  INSERT INTO usuarios (tenant_id, auth_id, nome, email, role_id, active)
  VALUES (v_convite.tenant_id, p_auth_id, v_convite.nome, v_convite.email, v_role_id, true)
  RETURNING id INTO v_usuario_id;
  
  -- Marcar convite como usado
  UPDATE convites_usuarios SET usado_em = NOW() WHERE id = v_convite.id;
  
  RETURN json_build_object(
    'success', true,
    'usuario_id', v_usuario_id,
    'tenant_id', v_convite.tenant_id,
    'role', v_convite.role
  );
END;
$$;


ALTER FUNCTION "public"."aceitar_convite_usuario"("p_token" character varying, "p_auth_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_role_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid", "p_novo_role" character varying) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE v_role_id UUID;
BEGIN
  IF NOT (is_platform_admin() OR (is_admin() AND get_my_tenant_id() = p_tenant_id)) THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissão');
  END IF;
  SELECT id INTO v_role_id FROM roles WHERE nome = p_novo_role AND active = true;
  IF v_role_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Role inválido');
  END IF;
  UPDATE usuarios SET role_id = v_role_id, role = p_novo_role
  WHERE id = p_usuario_id AND tenant_id = p_tenant_id;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Usuário não encontrado'); END IF;
  RETURN json_build_object('success', true, 'novo_role', p_novo_role, 'role_id', v_role_id);
END; $$;


ALTER FUNCTION "public"."atualizar_role_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid", "p_novo_role" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancelar_convite"("p_convite_id" "uuid", "p_tenant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT (is_platform_admin() OR (is_admin() AND get_my_tenant_id() = p_tenant_id)) THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissão');
  END IF;
  DELETE FROM convites_usuarios WHERE id = p_convite_id AND tenant_id = p_tenant_id AND usado_em IS NULL;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Convite não encontrado'); END IF;
  RETURN json_build_object('success', true);
END; $$;


ALTER FUNCTION "public"."cancelar_convite"("p_convite_id" "uuid", "p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_role_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_role        RECORD;
  v_count_global INT;
  v_count_tenant INT;
BEGIN
  -- Buscar dados da role
  SELECT * INTO v_role
  FROM public.roles
  WHERE id = NEW.role_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role não encontrada (role_id: %)', NEW.role_id;
  END IF;

  -- Verificar limite GLOBAL (ex: Administrador max 2 no sistema todo)
  IF v_role.max_global IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count_global
    FROM public.usuarios
    WHERE role_id = NEW.role_id
      AND active = TRUE
      AND deleted_at IS NULL
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

    IF v_count_global >= v_role.max_global THEN
      RAISE EXCEPTION 'Limite global de "%" atingido: máximo % usuários no sistema (atual: %)',
        v_role.nome, v_role.max_global, v_count_global;
    END IF;
  END IF;

  -- Verificar limite POR TENANT (ex: Diretor max 3 por tenant)
  IF v_role.max_tenant IS NOT NULL AND NEW.tenant_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count_tenant
    FROM public.usuarios
    WHERE role_id = NEW.role_id
      AND tenant_id = NEW.tenant_id
      AND active = TRUE
      AND deleted_at IS NULL
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

    IF v_count_tenant >= v_role.max_tenant THEN
      RAISE EXCEPTION 'Limite de "%" por tenant atingido: máximo % neste tenant (atual: %)',
        v_role.nome, v_role.max_tenant, v_count_tenant;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_role_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_tenant_onboarding"("p_tenant_name" "text", "p_tenant_slug" "text", "p_admin_nome" "text", "p_admin_email" "text", "p_auth_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_tenant_id UUID;
  v_role_id UUID;
  v_user_id UUID;
BEGIN
  -- Verificar se slug já existe
  IF EXISTS (SELECT 1 FROM tenants WHERE slug = p_tenant_slug) THEN
    RETURN json_build_object('success', false, 'error', 'Slug já existe');
  END IF;

  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM usuarios WHERE email = p_admin_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email já cadastrado');
  END IF;

  -- 1. Criar tenant
  INSERT INTO tenants (name, slug, active, is_platform)
  VALUES (p_tenant_name, p_tenant_slug, true, false)
  RETURNING id INTO v_tenant_id;

  -- 2. Buscar role "Diretor" (nível 4) como default para admin do tenant
  SELECT id INTO v_role_id FROM roles WHERE nivel = 4 LIMIT 1;

  -- Fallback: se não encontrar nível 4, busca o maior nível que não seja super admin
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM roles WHERE nivel < 5 ORDER BY nivel DESC LIMIT 1;
  END IF;

  -- 3. Criar usuário admin do tenant
  INSERT INTO usuarios (tenant_id, auth_id, nome, email, role_id, active)
  VALUES (v_tenant_id, p_auth_id, p_admin_nome, p_admin_email, v_role_id, true)
  RETURNING id INTO v_user_id;

  -- 4. Criar status comerciais padrão
  INSERT INTO status_comercial (tenant_id, label, slug, ordem) VALUES
    (v_tenant_id, 'Novo', 'novo', 1),
    (v_tenant_id, 'Em Contato', 'contato', 2),
    (v_tenant_id, 'Agendado', 'agendado', 3),
    (v_tenant_id, 'Em Negociação', 'negociacao', 4),
    (v_tenant_id, 'Convertido', 'convertido', 5),
    (v_tenant_id, 'Perdido', 'perdido', 6);

  RETURN json_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'user_id', v_user_id,
    'message', 'Tenant criado com sucesso'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;


ALTER FUNCTION "public"."create_tenant_onboarding"("p_tenant_name" "text", "p_tenant_slug" "text", "p_admin_nome" "text", "p_admin_email" "text", "p_auth_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_api_key"("p_encrypted" "bytea") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  IF auth.role() != 'service_role' AND NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Sem permissão para acessar API keys';
  END IF;
  
  RETURN extensions.pgp_sym_decrypt(
    p_encrypted,
    'a67ef25b47cadf8010705047b107b7deb7e4289fec168bac4fada61317a4b337'
  );
END;
$$;


ALTER FUNCTION "public"."decrypt_api_key"("p_encrypted" "bytea") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."desativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT (is_platform_admin() OR (is_admin() AND get_my_tenant_id() = p_tenant_id)) THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissão');
  END IF;
  UPDATE usuarios SET active = false WHERE id = p_usuario_id AND tenant_id = p_tenant_id;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Usuário não encontrado'); END IF;
  RETURN json_build_object('success', true);
END; $$;


ALTER FUNCTION "public"."desativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_api_key"("p_plaintext" "text") RETURNS "bytea"
    LANGUAGE "sql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT extensions.pgp_sym_encrypt(
    p_plaintext, 
    'a67ef25b47cadf8010705047b107b7deb7e4289fec168bac4fada61317a4b337'
  );
$$;


ALTER FUNCTION "public"."encrypt_api_key"("p_plaintext" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_tenant_id UUID;
  v_usuario_id UUID;
  v_registro_id UUID;
  v_dados_antes JSONB;
  v_dados_depois JSONB;
  v_old_json JSONB;
  v_new_json JSONB;
BEGIN
  -- Converter records para JSONB
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    v_old_json := to_jsonb(OLD);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    v_new_json := to_jsonb(NEW);
  END IF;

  -- Determinar tenant_id, registro_id, dados
  IF TG_OP = 'DELETE' THEN
    v_tenant_id := CASE WHEN v_old_json ? 'tenant_id' THEN (v_old_json->>'tenant_id')::UUID ELSE NULL END;
    v_registro_id := (v_old_json->>'id')::UUID;
    v_dados_antes := v_old_json;
    v_dados_depois := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_tenant_id := CASE WHEN v_new_json ? 'tenant_id' THEN (v_new_json->>'tenant_id')::UUID ELSE NULL END;
    v_registro_id := (v_new_json->>'id')::UUID;
    v_dados_antes := NULL;
    v_dados_depois := v_new_json;
  ELSE -- UPDATE
    v_tenant_id := CASE WHEN v_new_json ? 'tenant_id' THEN (v_new_json->>'tenant_id')::UUID ELSE NULL END;
    v_registro_id := (v_new_json->>'id')::UUID;
    v_dados_antes := v_old_json;
    v_dados_depois := v_new_json;
  END IF;

  -- Buscar usuario_id pelo auth.uid()
  SELECT id INTO v_usuario_id 
  FROM usuarios WHERE auth_id = auth.uid() LIMIT 1;

  -- Inserir no audit_log
  INSERT INTO audit_log (tenant_id, usuario_id, acao, tabela, registro_id, dados_antes, dados_depois)
  VALUES (v_tenant_id, v_usuario_id, TG_OP, TG_TABLE_NAME, v_registro_id, v_dados_antes, v_dados_depois);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."fn_audit_log"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gerar_convite_usuario"("p_tenant_id" "uuid", "p_email" character varying, "p_nome" character varying, "p_role" character varying DEFAULT 'operador'::character varying, "p_criado_por" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_token VARCHAR;
  v_convite_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verificar se já existe usuário com este email
  IF EXISTS (SELECT 1 FROM usuarios WHERE email = LOWER(p_email) AND tenant_id = p_tenant_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Já existe um usuário com este email neste tenant'
    );
  END IF;
  
  -- Verificar se já existe convite pendente
  IF EXISTS (
    SELECT 1 FROM convites_usuarios 
    WHERE email = LOWER(p_email) 
    AND tenant_id = p_tenant_id 
    AND usado_em IS NULL 
    AND expires_at > NOW()
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Já existe um convite pendente para este email'
    );
  END IF;
  
  -- Gerar token único
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '7 days';
  
  -- Criar convite
  INSERT INTO convites_usuarios (tenant_id, email, nome, role, token, criado_por, expires_at)
  VALUES (p_tenant_id, LOWER(p_email), p_nome, p_role, v_token, p_criado_por, v_expires_at)
  RETURNING id INTO v_convite_id;
  
  RETURN json_build_object(
    'success', true,
    'convite_id', v_convite_id,
    'token', v_token,
    'expires_at', v_expires_at,
    'link', '/aceitar-convite?token=' || v_token
  );
END;
$$;


ALTER FUNCTION "public"."gerar_convite_usuario"("p_tenant_id" "uuid", "p_email" character varying, "p_nome" character varying, "p_role" character varying, "p_criado_por" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_brand_name"("tenant_brands" "jsonb", "brand_id" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    brand JSONB;
BEGIN
    -- Se não tem brand_id, retorna NULL
    IF brand_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Buscar marca no array
    SELECT elem INTO brand
    FROM jsonb_array_elements(tenant_brands) AS elem
    WHERE elem->>'id' = brand_id;
    
    -- Retornar nome da marca
    IF brand IS NOT NULL THEN
        RETURN brand->>'name';
    ELSE
        RETURN NULL;
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_brand_name"("tenant_brands" "jsonb", "brand_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT tenant_id 
  FROM usuarios 
  WHERE auth_id = auth.uid() 
  AND active = true
  AND deleted_at IS NULL
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_my_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_tenant_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (SELECT u.tenant_id FROM public.usuarios u WHERE u.auth_id = auth.uid() AND u.active = true LIMIT 1);
END;
$$;


ALTER FUNCTION "public"."get_user_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_usuario_nome"("p_auth_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT nome FROM usuarios WHERE auth_id = p_auth_id LIMIT 1;
$$;


ALTER FUNCTION "public"."get_usuario_nome"("p_auth_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.auth_id = auth.uid()
      AND u.active = true
      AND u.deleted_at IS NULL
      AND (
        r.is_super = true
        OR r.nome IN ('Administrador', 'Diretor')
        OR u.role IN ('Administrador', 'Diretor')
      )
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_gerente_or_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.auth_id = auth.uid()
      AND u.active = true
      AND u.deleted_at IS NULL
      AND (
        r.is_super = true
        OR r.nome IN ('Administrador', 'Diretor', 'Gestor')
        OR u.role IN ('Administrador', 'Diretor', 'Gestor', 'gerente')
      )
  );
$$;


ALTER FUNCTION "public"."is_gerente_or_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_platform_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM usuarios u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.auth_id = auth.uid()
      AND u.active = true
      AND u.deleted_at IS NULL
      AND t.is_platform = true
      AND (
        EXISTS (SELECT 1 FROM roles r WHERE r.id = u.role_id AND r.is_super = true)
        OR u.role = 'Administrador'
      )
  );
$$;


ALTER FUNCTION "public"."is_platform_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."listar_convites_pendentes"("p_tenant_id" "uuid") RETURNS TABLE("id" "uuid", "email" character varying, "nome" character varying, "role" character varying, "expires_at" timestamp with time zone, "created_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT id, email, nome, role, expires_at, created_at
  FROM convites_usuarios
  WHERE tenant_id = p_tenant_id
  AND usado_em IS NULL
  AND expires_at > NOW()
  ORDER BY created_at DESC;
$$;


ALTER FUNCTION "public"."listar_convites_pendentes"("p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_unauthorized_superadmin"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_is_super BOOLEAN;
BEGIN
  -- Verificar se a role atribuída é super admin
  SELECT is_super INTO v_is_super FROM roles WHERE id = NEW.role_id;
  
  IF v_is_super = TRUE 
     AND NEW.email NOT IN ('leadcaptureadm@gmail.com', 'juzafalao@gmail.com') 
  THEN
    RAISE EXCEPTION 'Apenas emails autorizados podem receber role de Super Admin';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_unauthorized_superadmin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT (is_platform_admin() OR (is_admin() AND get_my_tenant_id() = p_tenant_id)) THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissão');
  END IF;
  UPDATE usuarios SET active = true WHERE id = p_usuario_id AND tenant_id = p_tenant_id;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Usuário não encontrado'); END IF;
  RETURN json_build_object('success', true);
END; $$;


ALTER FUNCTION "public"."reativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_observacao_lead"("p_lead_id" "uuid", "p_tenant_id" "uuid", "p_descricao" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_id      UUID;
  v_auth_id UUID;
  v_nome    TEXT;
BEGIN
  v_auth_id := auth.uid();
  v_nome    := COALESCE(get_usuario_nome(v_auth_id), 'Usuário');

  INSERT INTO lead_historico (lead_id, tenant_id, usuario_id, usuario_nome, tipo, descricao, dados)
  VALUES (
    p_lead_id,
    p_tenant_id,
    v_auth_id,
    v_nome,
    'observacao',
    p_descricao,
    '{}'::jsonb
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."registrar_observacao_lead"("p_lead_id" "uuid", "p_tenant_id" "uuid", "p_descricao" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_encryption_config"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM set_config('app.encryption_key', 'a67ef25b47cadf8010705047b107b7deb7e4289fec168bac4fada61317a4b337', false);
END;
$$;


ALTER FUNCTION "public"."set_encryption_config"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_tenant_api_key"("p_tenant_id" "uuid", "p_key_type" "text", "p_api_key" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Apenas Platform Admins podem configurar API keys');
  END IF;

  CASE p_key_type
    WHEN 'whatsapp' THEN
      UPDATE tenants SET whatsapp_api_key_enc = encrypt_api_key(p_api_key) WHERE id = p_tenant_id;
    WHEN 'manychat' THEN
      UPDATE tenants SET manychat_api_key_enc = encrypt_api_key(p_api_key) WHERE id = p_tenant_id;
    WHEN 'crm' THEN
      UPDATE tenants SET crm_api_key_enc = encrypt_api_key(p_api_key) WHERE id = p_tenant_id;
    ELSE
      RETURN json_build_object('success', false, 'error', 'Tipo inválido. Use: whatsapp, manychat, crm');
  END CASE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Tenant não encontrado');
  END IF;

  RETURN json_build_object('success', true, 'message', p_key_type || ' API key salva com criptografia');
END;
$$;


ALTER FUNCTION "public"."set_tenant_api_key"("p_tenant_id" "uuid", "p_key_type" "text", "p_api_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_lead_atualizado"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_auth_id UUID;
  v_nome    TEXT;
  v_label_novo  TEXT;
  v_label_velho TEXT;
  v_nome_novo   TEXT;
  v_nome_velho  TEXT;
BEGIN
  v_auth_id := auth.uid();
  SELECT nome INTO v_nome FROM usuarios WHERE auth_id = v_auth_id LIMIT 1;
  v_nome := COALESCE(v_nome, 'Sistema');

  IF OLD.id_operador_responsavel IS DISTINCT FROM NEW.id_operador_responsavel THEN
    SELECT nome INTO v_nome_novo  FROM usuarios WHERE id = NEW.id_operador_responsavel;
    SELECT nome INTO v_nome_velho FROM usuarios WHERE id = OLD.id_operador_responsavel;
    INSERT INTO lead_historico (lead_id, tenant_id, usuario_id, usuario_nome, tipo, descricao, dados)
    VALUES (
      NEW.id, NEW.tenant_id, v_auth_id, v_nome, 'atribuicao',
      CASE WHEN v_nome_velho IS NULL THEN 'Lead atribuido para ' || COALESCE(v_nome_novo, 'consultor')
           ELSE 'Lead reatribuido de ' || v_nome_velho || ' para ' || COALESCE(v_nome_novo, 'consultor') END,
      jsonb_build_object('operador_anterior', v_nome_velho, 'operador_novo', v_nome_novo)
    );
  END IF;

  IF OLD.id_status IS DISTINCT FROM NEW.id_status THEN
    SELECT label INTO v_label_novo  FROM status_comercial WHERE id = NEW.id_status;
    SELECT label INTO v_label_velho FROM status_comercial WHERE id = OLD.id_status;
    IF v_label_novo IS NOT NULL OR v_label_velho IS NOT NULL THEN
      INSERT INTO lead_historico (lead_id, tenant_id, usuario_id, usuario_nome, tipo, descricao, dados)
      VALUES (
        NEW.id, NEW.tenant_id, v_auth_id, v_nome, 'status_mudou',
        'Status movido: ' || COALESCE(v_label_velho, 'Novo') || ' -> ' || COALESCE(v_label_novo, 'Novo'),
        jsonb_build_object('status_anterior', v_label_velho, 'status_novo', v_label_novo)
      );
    END IF;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status AND OLD.id_status IS NOT DISTINCT FROM NEW.id_status THEN
    INSERT INTO lead_historico (lead_id, tenant_id, usuario_id, usuario_nome, tipo, descricao, dados)
    VALUES (
      NEW.id, NEW.tenant_id, v_auth_id, v_nome, 'status_mudou',
      'Status movido: ' || COALESCE(OLD.status, 'novo') || ' -> ' || NEW.status,
      jsonb_build_object('status_anterior', OLD.status, 'status_novo', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_lead_atualizado"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_lead_captura"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_fonte TEXT;
BEGIN
  v_fonte := COALESCE(NEW.fonte, 'desconhecido');

  INSERT INTO lead_historico (lead_id, tenant_id, tipo, descricao, dados)
  VALUES (
    NEW.id,
    NEW.tenant_id,
    'captura',
    CASE
      WHEN v_fonte = 'manual-gestor' THEN 'Lead adicionado manualmente (lead premiado)'
      WHEN v_fonte LIKE 'landing%'   THEN 'Lead capturado via landing page'
      WHEN v_fonte = 'google-forms'  THEN 'Lead capturado via Google Forms'
      ELSE 'Lead capturado via ' || v_fonte
    END,
    jsonb_build_object(
      'fonte',      v_fonte,
      'score',      NEW.score,
      'categoria',  NEW.categoria,
      'capital',    NEW.capital_disponivel
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_lead_captura"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_automacoes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_automacoes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_leads_sistema_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_leads_sistema_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "backup_20260225"."automacao_execucoes" (
    "id" "uuid",
    "automacao_id" "uuid",
    "tenant_id" "uuid",
    "lead_id" "uuid",
    "status" "text",
    "detalhes" "jsonb",
    "erro_mensagem" "text",
    "duracao_ms" integer,
    "created_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."automacao_execucoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."automacoes" (
    "id" "uuid",
    "tenant_id" "uuid",
    "nome" "text",
    "descricao" "text",
    "emoji" "text",
    "gatilho_tipo" "text",
    "gatilho_config" "jsonb",
    "acoes" "jsonb",
    "status" "text",
    "total_execucoes" integer,
    "ultima_execucao" timestamp with time zone,
    "total_erros" integer,
    "ultimo_erro" "text",
    "criado_por" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."automacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."configuracoes_tenant" (
    "id" "uuid",
    "tenant_id" "uuid",
    "notificar_lead_hot" boolean,
    "email_notificacao" "text",
    "score_hot" integer,
    "score_warm" integer,
    "auto_assign_leads" boolean,
    "assign_method" "text",
    "campos_formulario" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."configuracoes_tenant" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."convites_usuarios" (
    "id" "uuid",
    "tenant_id" "uuid",
    "email" character varying(255),
    "nome" character varying(255),
    "role" character varying(50),
    "token" character varying(100),
    "criado_por" "uuid",
    "expires_at" timestamp with time zone,
    "usado_em" timestamp with time zone,
    "created_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."convites_usuarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."functions_definitions" (
    "function_name" "name",
    "definition" "text"
);


ALTER TABLE "backup_20260225"."functions_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."integracoes_crm" (
    "id" "uuid",
    "tenant_id" "uuid",
    "crm_tipo" "text",
    "crm_id" "text",
    "lead_id" "uuid",
    "synced" boolean,
    "last_sync" timestamp with time zone,
    "sync_error" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."integracoes_crm" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."interacoes" (
    "id" "uuid",
    "lead_id" "uuid",
    "usuario_id" "uuid",
    "tipo" "text",
    "conteudo" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."interacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."leads" (
    "id" "uuid",
    "tenant_id" "uuid",
    "nome" "text",
    "email" "text",
    "telefone" "text",
    "instagram" "text",
    "mensagem_original" "text",
    "fonte" "text",
    "score" integer,
    "categoria" "text",
    "capital_disponivel" numeric,
    "regiao_interesse" "text",
    "resumo_qualificacao" "text",
    "status" "text",
    "motivo_perda" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "id_marca" "uuid",
    "id_operador_responsavel" "uuid",
    "cidade" "text",
    "estado" "text",
    "experiencia_anterior" boolean,
    "urgencia" "text",
    "id_status" "uuid",
    "id_motivo_desistencia" "uuid"
);


ALTER TABLE "backup_20260225"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."leads_sistema" (
    "id" "uuid",
    "nome" "text",
    "email" "text",
    "telefone" "text",
    "companhia" "text",
    "cidade" "text",
    "estado" "text",
    "observacao" "text",
    "fonte" "text",
    "status" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "observacao_interna" "text",
    "motivo_desistencia_id" "uuid"
);


ALTER TABLE "backup_20260225"."leads_sistema" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."marcas" (
    "id" "uuid",
    "tenant_id" "uuid",
    "id_segmento" "uuid",
    "nome" "text",
    "invest_min" numeric,
    "invest_max" numeric,
    "emoji" "text",
    "ativo" boolean,
    "created_at" timestamp with time zone,
    "slug" "text"
);


ALTER TABLE "backup_20260225"."marcas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."motivos_desistencia" (
    "id" "uuid",
    "tenant_id" "uuid",
    "nome" "text",
    "ativo" boolean,
    "created_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."motivos_desistencia" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."motivos_perda" (
    "id" "uuid",
    "tenant_id" "uuid",
    "motivo" "text",
    "descricao" "text",
    "active" boolean,
    "created_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."motivos_perda" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."notificacoes" (
    "id" "uuid",
    "tenant_id" "uuid",
    "usuario_id" "uuid",
    "lead_id" "uuid",
    "titulo" "text",
    "mensagem" "text",
    "tipo" "text",
    "lida" boolean,
    "created_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."notificacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."parametros_score" (
    "id" "uuid",
    "marca_id" "uuid",
    "tenant_id" "uuid",
    "peso_capital" integer,
    "peso_urgencia" integer,
    "capital_ideal" numeric(12,2),
    "threshold_hot" integer,
    "threshold_warm" integer,
    "ativo" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."parametros_score" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."policies_snapshot" (
    "tablename" "name",
    "policyname" "name",
    "permissive" "text",
    "roles" "name"[],
    "cmd" "text",
    "using_exp" "text" COLLATE "pg_catalog"."C",
    "with_check" "text" COLLATE "pg_catalog"."C"
);


ALTER TABLE "backup_20260225"."policies_snapshot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."roles" (
    "id" "uuid",
    "nome" "text",
    "descricao" "text",
    "nivel" integer,
    "emoji" "text",
    "color" "text",
    "max_global" integer,
    "max_tenant" integer,
    "is_super" boolean,
    "active" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."segmentos" (
    "id" "uuid",
    "tenant_id" "uuid",
    "nome" "text",
    "emoji" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."segmentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."status_comercial" (
    "id" "uuid",
    "label" "text",
    "slug" "text",
    "tenant_id" "uuid",
    "cor" "text"
);


ALTER TABLE "backup_20260225"."status_comercial" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."templates_mensagem" (
    "id" "uuid",
    "tenant_id" "uuid",
    "nome" "text",
    "tipo" "text",
    "conteudo" "text",
    "variaveis" "text"[],
    "active" boolean,
    "created_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."templates_mensagem" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."tenants" (
    "id" "uuid",
    "name" "text",
    "slug" "text",
    "logo_url" "text",
    "primary_color" "text",
    "secondary_color" "text",
    "ai_instructions" "text",
    "ai_model" "text",
    "business_type" "text",
    "qualification_criteria" "jsonb",
    "whatsapp_instance_id" "text",
    "whatsapp_api_key" "text",
    "manychat_api_key" "text",
    "crm_type" "text",
    "crm_api_key" "text",
    "crm_config" "jsonb",
    "active" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."usuarios" (
    "id" "uuid",
    "tenant_id" "uuid",
    "nome" "text",
    "email" "text",
    "telefone" "text",
    "password_hash" "text",
    "role" "text",
    "active" boolean,
    "created_at" timestamp with time zone,
    "auth_id" "uuid",
    "deleted_at" timestamp with time zone,
    "last_login" timestamp with time zone,
    "role_id" "uuid"
);


ALTER TABLE "backup_20260225"."usuarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."vendedores" (
    "id" "uuid",
    "nome" character varying(255),
    "email" character varying(255),
    "ativo" boolean,
    "created_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."vendedores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260225"."webhooks_log" (
    "id" "uuid",
    "tenant_id" "uuid",
    "fonte" "text",
    "payload" "jsonb",
    "status" "text",
    "error_message" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "backup_20260225"."webhooks_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "usuario_id" "uuid",
    "acao" "text" NOT NULL,
    "tabela" "text" NOT NULL,
    "registro_id" "uuid",
    "dados_antes" "jsonb",
    "dados_depois" "jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automacao_execucoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "automacao_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "lead_id" "uuid",
    "status" "text" NOT NULL,
    "detalhes" "jsonb" DEFAULT '{}'::"jsonb",
    "erro_mensagem" "text",
    "duracao_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "automacao_execucoes_status_check" CHECK (("status" = ANY (ARRAY['sucesso'::"text", 'erro'::"text", 'parcial'::"text"])))
);


ALTER TABLE "public"."automacao_execucoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "emoji" "text" DEFAULT '⚡'::"text",
    "gatilho_tipo" "text" NOT NULL,
    "gatilho_config" "jsonb" DEFAULT '{}'::"jsonb",
    "acoes" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text" DEFAULT 'configurando'::"text" NOT NULL,
    "total_execucoes" integer DEFAULT 0,
    "ultima_execucao" timestamp with time zone,
    "total_erros" integer DEFAULT 0,
    "ultimo_erro" "text",
    "criado_por" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "automacoes_gatilho_tipo_check" CHECK (("gatilho_tipo" = ANY (ARRAY['lead_criado'::"text", 'lead_hot'::"text", 'lead_warm_sem_contato'::"text", 'lead_convertido'::"text", 'lead_mensagem_recebida'::"text", 'agendamento_cron'::"text", 'manual'::"text"]))),
    CONSTRAINT "automacoes_status_check" CHECK (("status" = ANY (ARRAY['ativo'::"text", 'pausado'::"text", 'configurando'::"text"])))
);


ALTER TABLE "public"."automacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."configuracoes_tenant" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "notificar_lead_hot" boolean DEFAULT true,
    "email_notificacao" "text",
    "score_hot" integer DEFAULT 70,
    "score_warm" integer DEFAULT 40,
    "auto_assign_leads" boolean DEFAULT false,
    "assign_method" "text" DEFAULT 'round_robin'::"text",
    "campos_formulario" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."configuracoes_tenant" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."convites_usuarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "nome" character varying(255) NOT NULL,
    "role" character varying(50) DEFAULT 'operador'::character varying NOT NULL,
    "token" character varying(100) NOT NULL,
    "criado_por" "uuid",
    "expires_at" timestamp with time zone NOT NULL,
    "usado_em" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."convites_usuarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integracoes_crm" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "crm_tipo" "text" NOT NULL,
    "crm_id" "text",
    "lead_id" "uuid" NOT NULL,
    "synced" boolean DEFAULT false,
    "last_sync" timestamp with time zone,
    "sync_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integracoes_crm" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interacoes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "usuario_id" "uuid",
    "tipo" "text" NOT NULL,
    "conteudo" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."interacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_historico" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid",
    "tenant_id" "uuid",
    "usuario_id" "uuid",
    "tipo" "text",
    "descricao" "text",
    "dados" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "usuario_nome" "text"
);


ALTER TABLE "public"."lead_historico" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text",
    "email" "text",
    "telefone" "text",
    "instagram" "text",
    "mensagem_original" "text",
    "fonte" "text",
    "score" integer DEFAULT 0,
    "categoria" "text",
    "capital_disponivel" numeric,
    "regiao_interesse" "text",
    "resumo_qualificacao" "text",
    "status" "text" DEFAULT 'novo'::"text",
    "motivo_perda" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "id_marca" "uuid",
    "id_operador_responsavel" "uuid",
    "cidade" "text",
    "estado" "text",
    "experiencia_anterior" boolean DEFAULT false,
    "urgencia" "text" DEFAULT 'normal'::"text",
    "id_status" "uuid",
    "id_motivo_desistencia" "uuid",
    "gclid" "text",
    "fbclid" "text",
    "regiao" "text",
    "whatsapp_etapa" "text"
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."leads_ativos" AS
 SELECT "id",
    "tenant_id",
    "nome",
    "email",
    "telefone",
    "instagram",
    "mensagem_original",
    "fonte",
    "score",
    "categoria",
    "capital_disponivel",
    "regiao_interesse",
    "resumo_qualificacao",
    "status",
    "motivo_perda",
    "created_at",
    "updated_at",
    "deleted_at"
   FROM "public"."leads"
  WHERE ("deleted_at" IS NULL);


ALTER VIEW "public"."leads_ativos" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."leads_por_fonte" AS
 SELECT "tenant_id",
    "fonte",
    "count"(*) AS "total",
    "count"(
        CASE
            WHEN ("categoria" = 'hot'::"text") THEN 1
            ELSE NULL::integer
        END) AS "hot",
    "count"(
        CASE
            WHEN ("categoria" = 'warm'::"text") THEN 1
            ELSE NULL::integer
        END) AS "warm",
    "count"(
        CASE
            WHEN ("categoria" = 'cold'::"text") THEN 1
            ELSE NULL::integer
        END) AS "cold",
    "round"("avg"("score"), 2) AS "score_medio"
   FROM "public"."leads"
  WHERE ("fonte" IS NOT NULL)
  GROUP BY "tenant_id", "fonte";


ALTER VIEW "public"."leads_por_fonte" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads_sistema" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text" NOT NULL,
    "telefone" "text" NOT NULL,
    "companhia" "text",
    "cidade" "text",
    "estado" "text",
    "observacao" "text",
    "fonte" "text" DEFAULT 'website'::"text",
    "status" "text" DEFAULT 'novo'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "observacao_interna" "text",
    "motivo_desistencia_id" "uuid",
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."leads_sistema" OWNER TO "postgres";


COMMENT ON TABLE "public"."leads_sistema" IS 'Leads interessados em comprar o LeadCapture Pro (nossos clientes potenciais)';



COMMENT ON COLUMN "public"."leads_sistema"."observacao_interna" IS 'Notas internas CRM sobre o prospect (não visível externamente)';



CREATE TABLE IF NOT EXISTS "public"."marcas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "id_segmento" "uuid",
    "nome" "text" NOT NULL,
    "invest_min" numeric DEFAULT 0,
    "invest_max" numeric DEFAULT 0,
    "emoji" "text",
    "ativo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text",
    "logo_url" "text",
    "google_ads_conversion_id" "text",
    "google_ads_conversion_label" "text",
    "meta_pixel_id" "text"
);


ALTER TABLE "public"."marcas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo_url" "text",
    "primary_color" "text" DEFAULT '#f97316'::"text",
    "secondary_color" "text" DEFAULT '#3b82f6'::"text",
    "ai_instructions" "text",
    "ai_model" "text" DEFAULT 'gpt-4o-mini'::"text",
    "business_type" "text",
    "qualification_criteria" "jsonb" DEFAULT '{}'::"jsonb",
    "whatsapp_instance_id" "text",
    "whatsapp_api_key" "text",
    "manychat_api_key" "text",
    "crm_type" "text",
    "crm_api_key" "text",
    "crm_config" "jsonb" DEFAULT '{}'::"jsonb",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "is_platform" boolean DEFAULT false,
    "whatsapp_api_key_enc" "bytea",
    "manychat_api_key_enc" "bytea",
    "crm_api_key_enc" "bytea"
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."metricas_por_tenant" AS
 SELECT "t"."id" AS "tenant_id",
    "t"."name" AS "tenant_name",
    "count"("l"."id") AS "total_leads",
    "count"(
        CASE
            WHEN ("l"."categoria" = 'hot'::"text") THEN 1
            ELSE NULL::integer
        END) AS "leads_hot",
    "count"(
        CASE
            WHEN ("l"."categoria" = 'warm'::"text") THEN 1
            ELSE NULL::integer
        END) AS "leads_warm",
    "count"(
        CASE
            WHEN ("l"."categoria" = 'cold'::"text") THEN 1
            ELSE NULL::integer
        END) AS "leads_cold",
    "count"(
        CASE
            WHEN ("l"."status" = 'convertido'::"text") THEN 1
            ELSE NULL::integer
        END) AS "leads_convertidos",
    "count"(
        CASE
            WHEN ("l"."status" = 'perdido'::"text") THEN 1
            ELSE NULL::integer
        END) AS "leads_perdidos",
    "round"("avg"("l"."score"), 2) AS "score_medio",
    "count"(
        CASE
            WHEN ("l"."created_at" >= ("now"() - '7 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS "leads_ultimos_7_dias"
   FROM ("public"."tenants" "t"
     LEFT JOIN "public"."leads" "l" ON (("l"."tenant_id" = "t"."id")))
  GROUP BY "t"."id", "t"."name";


ALTER VIEW "public"."metricas_por_tenant" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."motivos_desistencia" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" DEFAULT '81cac3a4-caa3-43b2-be4d-d16557d7ef88'::"uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "ativo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."motivos_desistencia" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."motivos_perda" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "motivo" "text" NOT NULL,
    "descricao" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."motivos_perda" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notificacoes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "usuario_id" "uuid",
    "lead_id" "uuid",
    "titulo" "text" NOT NULL,
    "mensagem" "text",
    "tipo" "text",
    "lida" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."notificacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parametros_score" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "marca_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "peso_capital" integer DEFAULT 35,
    "peso_urgencia" integer DEFAULT 25,
    "capital_ideal" numeric(12,2) DEFAULT 100000,
    "threshold_hot" integer DEFAULT 70,
    "threshold_warm" integer DEFAULT 40,
    "ativo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."parametros_score" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "nivel" integer DEFAULT 0 NOT NULL,
    "emoji" "text",
    "color" "text",
    "max_global" integer,
    "max_tenant" integer,
    "is_super" boolean DEFAULT false,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuarios" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text" NOT NULL,
    "telefone" "text",
    "password_hash" "text",
    "role" "text" DEFAULT 'vendedor'::"text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "auth_id" "uuid",
    "deleted_at" timestamp with time zone,
    "last_login" timestamp with time zone,
    "role_id" "uuid"
);


ALTER TABLE "public"."usuarios" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."roles_com_contagem" AS
 SELECT "r"."id",
    "r"."nome",
    "r"."descricao",
    "r"."nivel",
    "r"."emoji",
    "r"."color",
    "r"."max_global",
    "r"."max_tenant",
    "r"."is_super",
    "r"."active",
    "count"("u"."id") FILTER (WHERE (("u"."active" = true) AND ("u"."deleted_at" IS NULL))) AS "total_usuarios"
   FROM ("public"."roles" "r"
     LEFT JOIN "public"."usuarios" "u" ON (("u"."role_id" = "r"."id")))
  GROUP BY "r"."id", "r"."nome", "r"."descricao", "r"."nivel", "r"."emoji", "r"."color", "r"."max_global", "r"."max_tenant", "r"."is_super", "r"."active";


ALTER VIEW "public"."roles_com_contagem" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."segmentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "emoji" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."segmentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."status_comercial" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "cor" "text" DEFAULT '#ee7b4d'::"text"
);


ALTER TABLE "public"."status_comercial" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."templates_mensagem" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text",
    "conteudo" "text" NOT NULL,
    "variaveis" "text"[],
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."templates_mensagem" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."usuarios_ativos" AS
 SELECT "u"."id",
    "u"."tenant_id",
    "u"."auth_id",
    "u"."nome",
    "u"."email",
    "u"."telefone",
    "u"."role",
    "u"."role_id",
    "r"."nome" AS "role_nome",
    "r"."nivel" AS "role_nivel",
    "r"."is_super" AS "is_super_admin",
    "r"."emoji" AS "role_emoji",
    "r"."color" AS "role_color",
    "u"."active",
    "u"."created_at",
    "u"."last_login",
    "u"."deleted_at"
   FROM ("public"."usuarios" "u"
     LEFT JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."active" = true) AND ("u"."deleted_at" IS NULL));


ALTER VIEW "public"."usuarios_ativos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendedores" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nome" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "ativo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."vendedores" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_performance_consultores" AS
 SELECT "u"."id" AS "consultor_id",
    "u"."nome" AS "consultor_nome",
    "u"."tenant_id",
    "count"("l"."id") AS "total_leads",
    "count"("l"."id") FILTER (WHERE ("l"."status" = 'novo'::"text")) AS "leads_novos",
    "count"("l"."id") FILTER (WHERE ("sc"."slug" = ANY (ARRAY['convertido'::"text", 'vendido'::"text"]))) AS "convertidos",
    "count"("l"."id") FILTER (WHERE ("sc"."slug" = 'perdido'::"text")) AS "perdidos",
    "round"(((("count"("l"."id") FILTER (WHERE ("sc"."slug" = ANY (ARRAY['convertido'::"text", 'vendido'::"text"]))))::numeric / (NULLIF("count"("l"."id"), 0))::numeric) * (100)::numeric), 1) AS "taxa_conversao_pct",
    ("avg"((EXTRACT(epoch FROM ("l"."updated_at" - "l"."created_at")) / (3600)::numeric)))::integer AS "tempo_medio_horas"
   FROM (("public"."usuarios" "u"
     LEFT JOIN "public"."leads" "l" ON ((("l"."id_operador_responsavel" = "u"."id") AND ("l"."deleted_at" IS NULL))))
     LEFT JOIN "public"."status_comercial" "sc" ON (("sc"."id" = "l"."id_status")))
  WHERE ("u"."role" = ANY (ARRAY['Consultor'::"text", 'Gestor'::"text"]))
  GROUP BY "u"."id", "u"."nome", "u"."tenant_id";


ALTER VIEW "public"."vw_performance_consultores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhooks_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "fonte" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhooks_log" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automacao_execucoes"
    ADD CONSTRAINT "automacao_execucoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automacoes"
    ADD CONSTRAINT "automacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuracoes_tenant"
    ADD CONSTRAINT "configuracoes_tenant_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuracoes_tenant"
    ADD CONSTRAINT "configuracoes_tenant_tenant_id_key" UNIQUE ("tenant_id");



ALTER TABLE ONLY "public"."convites_usuarios"
    ADD CONSTRAINT "convites_usuarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."convites_usuarios"
    ADD CONSTRAINT "convites_usuarios_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."integracoes_crm"
    ADD CONSTRAINT "integracoes_crm_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integracoes_crm"
    ADD CONSTRAINT "integracoes_crm_tenant_id_crm_tipo_lead_id_key" UNIQUE ("tenant_id", "crm_tipo", "lead_id");



ALTER TABLE ONLY "public"."interacoes"
    ADD CONSTRAINT "interacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_historico"
    ADD CONSTRAINT "lead_historico_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads_sistema"
    ADD CONSTRAINT "leads_sistema_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marcas"
    ADD CONSTRAINT "marcas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."motivos_desistencia"
    ADD CONSTRAINT "motivos_desistencia_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."motivos_perda"
    ADD CONSTRAINT "motivos_perda_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."motivos_perda"
    ADD CONSTRAINT "motivos_perda_tenant_id_motivo_key" UNIQUE ("tenant_id", "motivo");



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parametros_score"
    ADD CONSTRAINT "parametros_score_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_nome_key" UNIQUE ("nome");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."segmentos"
    ADD CONSTRAINT "segmentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status_comercial"
    ADD CONSTRAINT "status_comercial_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."templates_mensagem"
    ADD CONSTRAINT "templates_mensagem_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."templates_mensagem"
    ADD CONSTRAINT "templates_mensagem_tenant_id_nome_key" UNIQUE ("tenant_id", "nome");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."parametros_score"
    ADD CONSTRAINT "unique_parametro_marca" UNIQUE ("marca_id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_auth_id_unique" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_tenant_id_email_key" UNIQUE ("tenant_id", "email");



ALTER TABLE ONLY "public"."vendedores"
    ADD CONSTRAINT "vendedores_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."vendedores"
    ADD CONSTRAINT "vendedores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhooks_log"
    ADD CONSTRAINT "webhooks_log_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_created" ON "public"."audit_log" USING "btree" ("created_at");



CREATE INDEX "idx_audit_tabela" ON "public"."audit_log" USING "btree" ("tabela", "created_at");



CREATE INDEX "idx_audit_tenant" ON "public"."audit_log" USING "btree" ("tenant_id");



CREATE INDEX "idx_audit_tenant_created" ON "public"."audit_log" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_automacoes_gatilho" ON "public"."automacoes" USING "btree" ("gatilho_tipo");



CREATE INDEX "idx_automacoes_status" ON "public"."automacoes" USING "btree" ("status");



CREATE INDEX "idx_automacoes_tenant" ON "public"."automacoes" USING "btree" ("tenant_id");



CREATE INDEX "idx_convites_email" ON "public"."convites_usuarios" USING "btree" ("email");



CREATE INDEX "idx_convites_tenant" ON "public"."convites_usuarios" USING "btree" ("tenant_id");



CREATE INDEX "idx_convites_token" ON "public"."convites_usuarios" USING "btree" ("token");



CREATE INDEX "idx_execucoes_automacao" ON "public"."automacao_execucoes" USING "btree" ("automacao_id");



CREATE INDEX "idx_execucoes_created" ON "public"."automacao_execucoes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_execucoes_tenant" ON "public"."automacao_execucoes" USING "btree" ("tenant_id");



CREATE INDEX "idx_interacoes_created_at" ON "public"."interacoes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_interacoes_lead_id" ON "public"."interacoes" USING "btree" ("lead_id");



CREATE INDEX "idx_interacoes_tenant" ON "public"."interacoes" USING "btree" ("tenant_id");



CREATE INDEX "idx_lead_historico_created" ON "public"."lead_historico" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_lead_historico_lead_id" ON "public"."lead_historico" USING "btree" ("lead_id");



CREATE INDEX "idx_lead_historico_tenant_id" ON "public"."lead_historico" USING "btree" ("tenant_id");



CREATE INDEX "idx_leads_categoria" ON "public"."leads" USING "btree" ("categoria");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_deleted_at" ON "public"."leads" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_email_tenant" ON "public"."leads" USING "btree" ("email", "tenant_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_fonte" ON "public"."leads" USING "btree" ("fonte");



CREATE INDEX "idx_leads_id_status" ON "public"."leads" USING "btree" ("id_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_not_deleted" ON "public"."leads" USING "btree" ("tenant_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_operador" ON "public"."leads" USING "btree" ("id_operador_responsavel") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_score" ON "public"."leads" USING "btree" ("score" DESC);



CREATE INDEX "idx_leads_sistema_created" ON "public"."leads_sistema" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_sistema_email" ON "public"."leads_sistema" USING "btree" ("email");



CREATE INDEX "idx_leads_sistema_status" ON "public"."leads_sistema" USING "btree" ("status");



CREATE INDEX "idx_leads_sistema_tenant" ON "public"."leads_sistema" USING "btree" ("tenant_id");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_leads_tenant_categoria" ON "public"."leads" USING "btree" ("tenant_id", "categoria") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_tenant_created" ON "public"."leads" USING "btree" ("tenant_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_tenant_id" ON "public"."leads" USING "btree" ("tenant_id");



CREATE INDEX "idx_leads_tenant_marca" ON "public"."leads" USING "btree" ("tenant_id", "id_marca") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_tenant_status" ON "public"."leads" USING "btree" ("tenant_id", "status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_marcas_tenant_id" ON "public"."marcas" USING "btree" ("tenant_id");



CREATE INDEX "idx_notificacoes_lida" ON "public"."notificacoes" USING "btree" ("lida");



CREATE INDEX "idx_notificacoes_tenant_id" ON "public"."notificacoes" USING "btree" ("tenant_id");



CREATE INDEX "idx_notificacoes_usuario_id" ON "public"."notificacoes" USING "btree" ("usuario_id");



CREATE INDEX "idx_roles_nivel" ON "public"."roles" USING "btree" ("nivel");



CREATE INDEX "idx_roles_nome" ON "public"."roles" USING "btree" ("nome");



CREATE INDEX "idx_segmentos_tenant_id" ON "public"."segmentos" USING "btree" ("tenant_id");



CREATE INDEX "idx_status_comercial_tenant" ON "public"."status_comercial" USING "btree" ("tenant_id");



CREATE INDEX "idx_tenants_platform" ON "public"."tenants" USING "btree" ("is_platform") WHERE ("is_platform" = true);



CREATE INDEX "idx_tenants_slug" ON "public"."tenants" USING "btree" ("slug") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_usuarios_active" ON "public"."usuarios" USING "btree" ("active") WHERE (("active" = true) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_usuarios_auth_id" ON "public"."usuarios" USING "btree" ("auth_id");



CREATE INDEX "idx_usuarios_deleted_at" ON "public"."usuarios" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_usuarios_email" ON "public"."usuarios" USING "btree" ("email");



CREATE INDEX "idx_usuarios_tenant_id" ON "public"."usuarios" USING "btree" ("tenant_id");



CREATE INDEX "idx_vendedores_tenant" ON "public"."vendedores" USING "btree" ("tenant_id");



CREATE INDEX "idx_webhooks_tenant_created" ON "public"."webhooks_log" USING "btree" ("tenant_id", "created_at" DESC);



CREATE UNIQUE INDEX "marcas_slug_idx" ON "public"."marcas" USING "btree" ("slug");



CREATE OR REPLACE TRIGGER "on_lead_atualizado" AFTER UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_lead_atualizado"();



CREATE OR REPLACE TRIGGER "on_lead_inserido" AFTER INSERT ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_lead_captura"();



CREATE OR REPLACE TRIGGER "trg_audit_automacoes" AFTER INSERT OR DELETE OR UPDATE ON "public"."automacoes" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_config" AFTER INSERT OR DELETE OR UPDATE ON "public"."configuracoes_tenant" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_convites" AFTER INSERT OR DELETE OR UPDATE ON "public"."convites_usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_leads" AFTER INSERT OR DELETE OR UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_leads_sistema" AFTER INSERT OR DELETE OR UPDATE ON "public"."leads_sistema" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_marcas" AFTER INSERT OR DELETE OR UPDATE ON "public"."marcas" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_motivos_desistencia" AFTER INSERT OR DELETE OR UPDATE ON "public"."motivos_desistencia" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_motivos_perda" AFTER INSERT OR DELETE OR UPDATE ON "public"."motivos_perda" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_segmentos" AFTER INSERT OR DELETE OR UPDATE ON "public"."segmentos" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_status_comercial" AFTER INSERT OR DELETE OR UPDATE ON "public"."status_comercial" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_tenants" AFTER INSERT OR DELETE OR UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_usuarios" AFTER INSERT OR DELETE OR UPDATE ON "public"."usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_audit_vendedores" AFTER INSERT OR DELETE OR UPDATE ON "public"."vendedores" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log"();



CREATE OR REPLACE TRIGGER "trg_automacoes_updated" BEFORE UPDATE ON "public"."automacoes" FOR EACH ROW EXECUTE FUNCTION "public"."update_automacoes_updated_at"();



CREATE OR REPLACE TRIGGER "trg_check_role_limit" BEFORE INSERT OR UPDATE OF "role_id" ON "public"."usuarios" FOR EACH ROW WHEN (("new"."role_id" IS NOT NULL)) EXECUTE FUNCTION "public"."check_role_limit"();



CREATE OR REPLACE TRIGGER "trg_prevent_superadmin" BEFORE INSERT OR UPDATE ON "public"."usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_unauthorized_superadmin"();



CREATE OR REPLACE TRIGGER "trigger_update_leads_sistema_updated_at" BEFORE UPDATE ON "public"."leads_sistema" FOR EACH ROW EXECUTE FUNCTION "public"."update_leads_sistema_updated_at"();



CREATE OR REPLACE TRIGGER "update_leads_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tenants_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id");



ALTER TABLE ONLY "public"."automacao_execucoes"
    ADD CONSTRAINT "automacao_execucoes_automacao_id_fkey" FOREIGN KEY ("automacao_id") REFERENCES "public"."automacoes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automacao_execucoes"
    ADD CONSTRAINT "automacao_execucoes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."automacao_execucoes"
    ADD CONSTRAINT "automacao_execucoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automacoes"
    ADD CONSTRAINT "automacoes_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."usuarios"("id");



ALTER TABLE ONLY "public"."automacoes"
    ADD CONSTRAINT "automacoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."configuracoes_tenant"
    ADD CONSTRAINT "fk_config_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."motivos_desistencia"
    ADD CONSTRAINT "fk_motivos_desist_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."status_comercial"
    ADD CONSTRAINT "fk_status_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."webhooks_log"
    ADD CONSTRAINT "fk_webhooks_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."integracoes_crm"
    ADD CONSTRAINT "integracoes_crm_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integracoes_crm"
    ADD CONSTRAINT "integracoes_crm_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacoes"
    ADD CONSTRAINT "interacoes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacoes"
    ADD CONSTRAINT "interacoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."interacoes"
    ADD CONSTRAINT "interacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id");



ALTER TABLE ONLY "public"."lead_historico"
    ADD CONSTRAINT "lead_historico_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_id_marca_fkey" FOREIGN KEY ("id_marca") REFERENCES "public"."marcas"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_id_motivo_desistencia_fkey" FOREIGN KEY ("id_motivo_desistencia") REFERENCES "public"."motivos_desistencia"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_id_operador_fkey" FOREIGN KEY ("id_operador_responsavel") REFERENCES "public"."usuarios"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_id_status_fkey" FOREIGN KEY ("id_status") REFERENCES "public"."status_comercial"("id");



ALTER TABLE ONLY "public"."leads_sistema"
    ADD CONSTRAINT "leads_sistema_motivo_desistencia_id_fkey" FOREIGN KEY ("motivo_desistencia_id") REFERENCES "public"."motivos_desistencia"("id");



ALTER TABLE ONLY "public"."leads_sistema"
    ADD CONSTRAINT "leads_sistema_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marcas"
    ADD CONSTRAINT "marcas_id_segmento_fkey" FOREIGN KEY ("id_segmento") REFERENCES "public"."segmentos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."motivos_perda"
    ADD CONSTRAINT "motivos_perda_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id");



ALTER TABLE ONLY "public"."templates_mensagem"
    ADD CONSTRAINT "templates_mensagem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendedores"
    ADD CONSTRAINT "vendedores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



CREATE POLICY "audit_insert" ON "public"."audit_log" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR ("auth"."uid"() IS NOT NULL)));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_select" ON "public"."audit_log" FOR SELECT USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "audit_service" ON "public"."audit_log" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."automacao_execucoes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "automacoes_delete" ON "public"."automacoes" FOR DELETE USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"()));



CREATE POLICY "automacoes_insert" ON "public"."automacoes" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "automacoes_select" ON "public"."automacoes" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "automacoes_tenant_isolation" ON "public"."automacoes" TO "authenticated" USING (("tenant_id" IN ( SELECT "usuarios"."tenant_id"
   FROM "public"."usuarios"
  WHERE ("usuarios"."auth_id" = "auth"."uid"())))) WITH CHECK (("tenant_id" IN ( SELECT "usuarios"."tenant_id"
   FROM "public"."usuarios"
  WHERE ("usuarios"."auth_id" = "auth"."uid"()))));



CREATE POLICY "automacoes_update" ON "public"."automacoes" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "config_insert" ON "public"."configuracoes_tenant" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("public"."is_admin"() AND ("tenant_id" = "public"."get_my_tenant_id"()))));



CREATE POLICY "config_select" ON "public"."configuracoes_tenant" FOR SELECT USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "config_service" ON "public"."configuracoes_tenant" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "config_update" ON "public"."configuracoes_tenant" FOR UPDATE USING (("public"."is_platform_admin"() OR ("public"."is_admin"() AND ("tenant_id" = "public"."get_my_tenant_id"()))));



ALTER TABLE "public"."configuracoes_tenant" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "convites_delete" ON "public"."convites_usuarios" FOR DELETE USING (("public"."is_platform_admin"() OR ("public"."is_admin"() AND ("tenant_id" = "public"."get_my_tenant_id"()))));



CREATE POLICY "convites_insert" ON "public"."convites_usuarios" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("public"."is_admin"() AND ("tenant_id" = "public"."get_my_tenant_id"()))));



CREATE POLICY "convites_select" ON "public"."convites_usuarios" FOR SELECT USING (("public"."is_platform_admin"() OR ("public"."is_admin"() AND ("tenant_id" = "public"."get_my_tenant_id"()))));



CREATE POLICY "convites_service" ON "public"."convites_usuarios" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."convites_usuarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "execucoes_insert" ON "public"."automacao_execucoes" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "execucoes_select" ON "public"."automacao_execucoes" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



ALTER TABLE "public"."integracoes_crm" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integracoes_crm_service_all" ON "public"."integracoes_crm" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "integracoes_select" ON "public"."integracoes_crm" FOR SELECT USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



ALTER TABLE "public"."interacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interacoes_insert" ON "public"."interacoes" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "interacoes_select" ON "public"."interacoes" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "interacoes_service_all" ON "public"."interacoes" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "interacoes_update" ON "public"."interacoes" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



ALTER TABLE "public"."lead_historico" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_delete" ON "public"."leads" FOR DELETE USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"()));



CREATE POLICY "leads_insert" ON "public"."leads" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR ("auth"."role"() = 'anon'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "leads_select" ON "public"."leads" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "leads_service_all" ON "public"."leads" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."leads_sistema" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_sistema_anon_insert" ON "public"."leads_sistema" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR ("auth"."role"() = 'anon'::"text") OR "public"."is_platform_admin"()));



CREATE POLICY "leads_sistema_select" ON "public"."leads_sistema" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"()));



CREATE POLICY "leads_sistema_service_all" ON "public"."leads_sistema" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "leads_sistema_update" ON "public"."leads_sistema" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"()));



CREATE POLICY "leads_update" ON "public"."leads" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



ALTER TABLE "public"."marcas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "marcas_delete" ON "public"."marcas" FOR DELETE USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "marcas_insert" ON "public"."marcas" FOR INSERT WITH CHECK (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "marcas_select" ON "public"."marcas" FOR SELECT USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "marcas_service" ON "public"."marcas" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "marcas_update" ON "public"."marcas" FOR UPDATE USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "motivos_desist_select" ON "public"."motivos_desistencia" FOR SELECT USING (("public"."is_platform_admin"() OR ("tenant_id" IS NULL) OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "motivos_desist_service" ON "public"."motivos_desistencia" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."motivos_desistencia" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."motivos_perda" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "motivos_perda_insert" ON "public"."motivos_perda" FOR INSERT WITH CHECK (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "motivos_perda_select" ON "public"."motivos_perda" FOR SELECT USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "motivos_perda_service_all" ON "public"."motivos_perda" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."notificacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notificacoes_select" ON "public"."notificacoes" FOR SELECT USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "notificacoes_service_all" ON "public"."notificacoes" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "notificacoes_update" ON "public"."notificacoes" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR (("tenant_id" = "public"."get_my_tenant_id"()) AND ("usuario_id" = ( SELECT "usuarios"."id"
   FROM "public"."usuarios"
  WHERE ("usuarios"."auth_id" = "auth"."uid"())
 LIMIT 1)))));



CREATE POLICY "parametros_insert" ON "public"."parametros_score" FOR INSERT WITH CHECK (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



ALTER TABLE "public"."parametros_score" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parametros_select" ON "public"."parametros_score" FOR SELECT USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "parametros_service" ON "public"."parametros_score" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "parametros_update" ON "public"."parametros_score" FOR UPDATE USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roles_modify" ON "public"."roles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "roles_select" ON "public"."roles" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."segmentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "segmentos_delete" ON "public"."segmentos" FOR DELETE USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "segmentos_insert" ON "public"."segmentos" FOR INSERT WITH CHECK (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "segmentos_select" ON "public"."segmentos" FOR SELECT USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "segmentos_service" ON "public"."segmentos" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "segmentos_update" ON "public"."segmentos" FOR UPDATE USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



ALTER TABLE "public"."status_comercial" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "status_insert" ON "public"."status_comercial" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"()));



CREATE POLICY "status_select" ON "public"."status_comercial" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "status_service" ON "public"."status_comercial" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "templates_insert" ON "public"."templates_mensagem" FOR INSERT WITH CHECK (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



ALTER TABLE "public"."templates_mensagem" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "templates_select" ON "public"."templates_mensagem" FOR SELECT USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "templates_service_all" ON "public"."templates_mensagem" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "templates_update" ON "public"."templates_mensagem" FOR UPDATE USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "tenant_isolado_historico" ON "public"."lead_historico" USING (("tenant_id" IN ( SELECT "usuarios"."tenant_id"
   FROM "public"."usuarios"
  WHERE ("usuarios"."auth_id" = "auth"."uid"()))));



ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenants_anon_read_active" ON "public"."tenants" FOR SELECT USING ((("auth"."role"() = 'anon'::"text") AND ("active" = true) AND ("deleted_at" IS NULL)));



CREATE POLICY "tenants_select" ON "public"."tenants" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("id" = "public"."get_my_tenant_id"())));



CREATE POLICY "tenants_service_all" ON "public"."tenants" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "tenants_update" ON "public"."tenants" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("public"."is_admin"() AND ("id" = "public"."get_my_tenant_id"()))));



ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usuarios_insert" ON "public"."usuarios" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("public"."is_admin"() AND ("tenant_id" = "public"."get_my_tenant_id"()))));



CREATE POLICY "usuarios_select" ON "public"."usuarios" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "usuarios_service_all" ON "public"."usuarios" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "usuarios_update" ON "public"."usuarios" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("public"."is_admin"() AND ("tenant_id" = "public"."get_my_tenant_id"())) OR ("auth_id" = "auth"."uid"())));



ALTER TABLE "public"."vendedores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vendedores_insert" ON "public"."vendedores" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "vendedores_select" ON "public"."vendedores" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "vendedores_service" ON "public"."vendedores" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "vendedores_update" ON "public"."vendedores" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR "public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "webhooks_insert" ON "public"."webhooks_log" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR ("auth"."role"() = 'anon'::"text") OR "public"."is_platform_admin"()));



ALTER TABLE "public"."webhooks_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "webhooks_select" ON "public"."webhooks_log" FOR SELECT USING (("public"."is_platform_admin"() OR ("tenant_id" = "public"."get_my_tenant_id"())));



CREATE POLICY "webhooks_service" ON "public"."webhooks_log" USING (("auth"."role"() = 'service_role'::"text"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


























































































































































































GRANT ALL ON FUNCTION "public"."aceitar_convite_usuario"("p_token" character varying, "p_auth_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."aceitar_convite_usuario"("p_token" character varying, "p_auth_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."aceitar_convite_usuario"("p_token" character varying, "p_auth_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."atualizar_role_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid", "p_novo_role" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."atualizar_role_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid", "p_novo_role" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."atualizar_role_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid", "p_novo_role" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."cancelar_convite"("p_convite_id" "uuid", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancelar_convite"("p_convite_id" "uuid", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancelar_convite"("p_convite_id" "uuid", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_role_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_role_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_role_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_tenant_onboarding"("p_tenant_name" "text", "p_tenant_slug" "text", "p_admin_nome" "text", "p_admin_email" "text", "p_auth_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_tenant_onboarding"("p_tenant_name" "text", "p_tenant_slug" "text", "p_admin_nome" "text", "p_admin_email" "text", "p_auth_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_tenant_onboarding"("p_tenant_name" "text", "p_tenant_slug" "text", "p_admin_nome" "text", "p_admin_email" "text", "p_auth_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_api_key"("p_encrypted" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_api_key"("p_encrypted" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_api_key"("p_encrypted" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."desativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."desativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."desativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_api_key"("p_plaintext" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_api_key"("p_plaintext" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_api_key"("p_plaintext" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_audit_log"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_audit_log"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_audit_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gerar_convite_usuario"("p_tenant_id" "uuid", "p_email" character varying, "p_nome" character varying, "p_role" character varying, "p_criado_por" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."gerar_convite_usuario"("p_tenant_id" "uuid", "p_email" character varying, "p_nome" character varying, "p_role" character varying, "p_criado_por" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gerar_convite_usuario"("p_tenant_id" "uuid", "p_email" character varying, "p_nome" character varying, "p_role" character varying, "p_criado_por" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_brand_name"("tenant_brands" "jsonb", "brand_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_brand_name"("tenant_brands" "jsonb", "brand_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_brand_name"("tenant_brands" "jsonb", "brand_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_usuario_nome"("p_auth_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_usuario_nome"("p_auth_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_usuario_nome"("p_auth_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_gerente_or_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_gerente_or_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_gerente_or_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."listar_convites_pendentes"("p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."listar_convites_pendentes"("p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."listar_convites_pendentes"("p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_unauthorized_superadmin"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_unauthorized_superadmin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_unauthorized_superadmin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."registrar_observacao_lead"("p_lead_id" "uuid", "p_tenant_id" "uuid", "p_descricao" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_observacao_lead"("p_lead_id" "uuid", "p_tenant_id" "uuid", "p_descricao" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_observacao_lead"("p_lead_id" "uuid", "p_tenant_id" "uuid", "p_descricao" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_encryption_config"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_encryption_config"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_encryption_config"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_tenant_api_key"("p_tenant_id" "uuid", "p_key_type" "text", "p_api_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_tenant_api_key"("p_tenant_id" "uuid", "p_key_type" "text", "p_api_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_tenant_api_key"("p_tenant_id" "uuid", "p_key_type" "text", "p_api_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_lead_atualizado"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_lead_atualizado"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_lead_atualizado"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_lead_captura"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_lead_captura"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_lead_captura"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_automacoes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_automacoes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_automacoes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_leads_sistema_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_leads_sistema_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_leads_sistema_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."automacao_execucoes" TO "anon";
GRANT ALL ON TABLE "public"."automacao_execucoes" TO "authenticated";
GRANT ALL ON TABLE "public"."automacao_execucoes" TO "service_role";



GRANT ALL ON TABLE "public"."automacoes" TO "anon";
GRANT ALL ON TABLE "public"."automacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."automacoes" TO "service_role";



GRANT ALL ON TABLE "public"."configuracoes_tenant" TO "anon";
GRANT ALL ON TABLE "public"."configuracoes_tenant" TO "authenticated";
GRANT ALL ON TABLE "public"."configuracoes_tenant" TO "service_role";



GRANT ALL ON TABLE "public"."convites_usuarios" TO "anon";
GRANT ALL ON TABLE "public"."convites_usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."convites_usuarios" TO "service_role";



GRANT ALL ON TABLE "public"."integracoes_crm" TO "anon";
GRANT ALL ON TABLE "public"."integracoes_crm" TO "authenticated";
GRANT ALL ON TABLE "public"."integracoes_crm" TO "service_role";



GRANT ALL ON TABLE "public"."interacoes" TO "anon";
GRANT ALL ON TABLE "public"."interacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."interacoes" TO "service_role";



GRANT ALL ON TABLE "public"."lead_historico" TO "anon";
GRANT ALL ON TABLE "public"."lead_historico" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_historico" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."leads_ativos" TO "anon";
GRANT ALL ON TABLE "public"."leads_ativos" TO "authenticated";
GRANT ALL ON TABLE "public"."leads_ativos" TO "service_role";



GRANT ALL ON TABLE "public"."leads_por_fonte" TO "anon";
GRANT ALL ON TABLE "public"."leads_por_fonte" TO "authenticated";
GRANT ALL ON TABLE "public"."leads_por_fonte" TO "service_role";



GRANT ALL ON TABLE "public"."leads_sistema" TO "anon";
GRANT ALL ON TABLE "public"."leads_sistema" TO "authenticated";
GRANT ALL ON TABLE "public"."leads_sistema" TO "service_role";



GRANT ALL ON TABLE "public"."marcas" TO "anon";
GRANT ALL ON TABLE "public"."marcas" TO "authenticated";
GRANT ALL ON TABLE "public"."marcas" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."metricas_por_tenant" TO "anon";
GRANT ALL ON TABLE "public"."metricas_por_tenant" TO "authenticated";
GRANT ALL ON TABLE "public"."metricas_por_tenant" TO "service_role";



GRANT ALL ON TABLE "public"."motivos_desistencia" TO "anon";
GRANT ALL ON TABLE "public"."motivos_desistencia" TO "authenticated";
GRANT ALL ON TABLE "public"."motivos_desistencia" TO "service_role";



GRANT ALL ON TABLE "public"."motivos_perda" TO "anon";
GRANT ALL ON TABLE "public"."motivos_perda" TO "authenticated";
GRANT ALL ON TABLE "public"."motivos_perda" TO "service_role";



GRANT ALL ON TABLE "public"."notificacoes" TO "anon";
GRANT ALL ON TABLE "public"."notificacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."notificacoes" TO "service_role";



GRANT ALL ON TABLE "public"."parametros_score" TO "anon";
GRANT ALL ON TABLE "public"."parametros_score" TO "authenticated";
GRANT ALL ON TABLE "public"."parametros_score" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios" TO "anon";
GRANT ALL ON TABLE "public"."usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios" TO "service_role";



GRANT ALL ON TABLE "public"."roles_com_contagem" TO "anon";
GRANT ALL ON TABLE "public"."roles_com_contagem" TO "authenticated";
GRANT ALL ON TABLE "public"."roles_com_contagem" TO "service_role";



GRANT ALL ON TABLE "public"."segmentos" TO "anon";
GRANT ALL ON TABLE "public"."segmentos" TO "authenticated";
GRANT ALL ON TABLE "public"."segmentos" TO "service_role";



GRANT ALL ON TABLE "public"."status_comercial" TO "anon";
GRANT ALL ON TABLE "public"."status_comercial" TO "authenticated";
GRANT ALL ON TABLE "public"."status_comercial" TO "service_role";



GRANT ALL ON TABLE "public"."templates_mensagem" TO "anon";
GRANT ALL ON TABLE "public"."templates_mensagem" TO "authenticated";
GRANT ALL ON TABLE "public"."templates_mensagem" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios_ativos" TO "anon";
GRANT ALL ON TABLE "public"."usuarios_ativos" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios_ativos" TO "service_role";



GRANT ALL ON TABLE "public"."vendedores" TO "anon";
GRANT ALL ON TABLE "public"."vendedores" TO "authenticated";
GRANT ALL ON TABLE "public"."vendedores" TO "service_role";



GRANT ALL ON TABLE "public"."vw_performance_consultores" TO "anon";
GRANT ALL ON TABLE "public"."vw_performance_consultores" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_performance_consultores" TO "service_role";



GRANT ALL ON TABLE "public"."webhooks_log" TO "anon";
GRANT ALL ON TABLE "public"."webhooks_log" TO "authenticated";
GRANT ALL ON TABLE "public"."webhooks_log" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































