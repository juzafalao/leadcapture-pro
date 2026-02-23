


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."aceitar_convite_usuario"("p_token" character varying, "p_auth_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_convite RECORD;
  v_usuario_id UUID;
BEGIN
  -- Buscar convite válido
  SELECT * INTO v_convite
  FROM convites_usuarios
  WHERE token = p_token
  AND usado_em IS NULL
  AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Convite inválido ou expirado'
    );
  END IF;
  
  -- Verificar se auth_id já está vinculado
  IF EXISTS (SELECT 1 FROM usuarios WHERE auth_id = p_auth_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Esta conta já está vinculada a outro usuário'
    );
  END IF;
  
  -- Criar usuário
  INSERT INTO usuarios (tenant_id, auth_id, nome, email, role, ativo)
  VALUES (v_convite.tenant_id, p_auth_id, v_convite.nome, v_convite.email, v_convite.role, true)
  RETURNING id INTO v_usuario_id;
  
  -- Marcar convite como usado
  UPDATE convites_usuarios
  SET usado_em = NOW()
  WHERE id = v_convite.id;
  
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
    AS $$
BEGIN
  -- Validar role
  IF p_novo_role NOT IN ('admin', 'gerente', 'operador') THEN
    RETURN json_build_object('success', false, 'error', 'Role inválido');
  END IF;
  
  UPDATE usuarios
  SET role = p_novo_role
  WHERE id = p_usuario_id
  AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
  RETURN json_build_object('success', true, 'novo_role', p_novo_role);
END;
$$;


ALTER FUNCTION "public"."atualizar_role_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid", "p_novo_role" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancelar_convite"("p_convite_id" "uuid", "p_tenant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM convites_usuarios
  WHERE id = p_convite_id
  AND tenant_id = p_tenant_id
  AND usado_em IS NULL;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Convite não encontrado');
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."cancelar_convite"("p_convite_id" "uuid", "p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."desativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE usuarios
  SET ativo = false
  WHERE id = p_usuario_id
  AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."desativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") OWNER TO "postgres";


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
  AND ativo = true
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_my_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_tenant_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (SELECT u.tenant_id FROM public.usuarios u WHERE u.auth_id = auth.uid() LIMIT 1);
END;
$$;


ALTER FUNCTION "public"."get_user_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios 
    WHERE auth_id = auth.uid() 
    AND role = 'admin'
    AND ativo = true
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_gerente_or_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios 
    WHERE auth_id = auth.uid() 
    AND role IN ('admin', 'gerente')
    AND ativo = true
  );
$$;


ALTER FUNCTION "public"."is_gerente_or_admin"() OWNER TO "postgres";


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
BEGIN
  IF NEW.is_super_admin = TRUE 
     AND NEW.email NOT IN ('leadcaptureadm@gmail.com', 'juzafalao@gmail.com') 
  THEN
    RAISE EXCEPTION 'Apenas emails autorizados podem ser Super Admin';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_unauthorized_superadmin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE usuarios
  SET ativo = true
  WHERE id = p_usuario_id
  AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."reativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."configuracoes_tenant" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
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
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."interacoes" OWNER TO "postgres";


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
    "id_motivo_desistencia" "uuid"
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


CREATE TABLE IF NOT EXISTS "public"."leads_backup_20260205" (
    "id" "uuid",
    "tenant_id" "uuid",
    "marca_id" "uuid",
    "nome" "text",
    "email" "text",
    "telefone" "text",
    "cidade" "text",
    "estado" "text",
    "capital_disponivel" numeric,
    "status" "text",
    "categoria" "text",
    "score" integer,
    "fonte" "text",
    "mensagem_original" "text",
    "observacao" "text",
    "created_at" timestamp with time zone,
    "motivo_perda" "text",
    "motivo_desistencia" "text",
    "id_motivo_desistencia" "uuid"
);


ALTER TABLE "public"."leads_backup_20260205" OWNER TO "postgres";


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
    "tenant_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text" NOT NULL,
    "telefone" "text" NOT NULL,
    "companhia" "text",
    "cidade" "text",
    "estado" "text",
    "observacao" "text",
    "observacao_original" "text",
    "fonte" "text" DEFAULT 'website'::"text",
    "status" "text" DEFAULT 'novo'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "observacao_interna" "text",
    "motivo_desistencia_id" "uuid"
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
    "slug" "text"
);


ALTER TABLE "public"."marcas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marcas_backup_20260205" (
    "id" "uuid",
    "tenant_id" "uuid",
    "id_segmento" "uuid",
    "nome" "text",
    "invest_min" numeric,
    "invest_max" numeric,
    "emoji" "text",
    "ativo" boolean,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."marcas_backup_20260205" OWNER TO "postgres";


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
    "deleted_at" timestamp with time zone
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
    "tenant_id" "uuid" DEFAULT '81cac3a4-caa3-43b2-be4d-d16557d7ef88'::"uuid",
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


CREATE TABLE IF NOT EXISTS "public"."segmentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "emoji" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."segmentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."segmentos_backup_20260205" (
    "id" "uuid",
    "tenant_id" "uuid",
    "nome" "text",
    "emoji" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."segmentos_backup_20260205" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."status_comercial" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "tenant_id" "uuid",
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


CREATE TABLE IF NOT EXISTS "public"."tenants_backup_20260205" (
    "id" "uuid",
    "nome" "text",
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
    "brands" "jsonb",
    "crm_api_key_encrypted" "text",
    "crm_api_iv" "text",
    "crm_api_tag" "text",
    "crm_api_updated_at" timestamp with time zone
);


ALTER TABLE "public"."tenants_backup_20260205" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuarios" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text" NOT NULL,
    "telefone" "text",
    "password_hash" "text",
    "role" "text" DEFAULT 'vendedor'::"text",
    "ativo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "auth_id" "uuid",
    "deleted_at" timestamp with time zone,
    "last_login" timestamp with time zone
);


ALTER TABLE "public"."usuarios" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."usuarios_ativos" AS
 SELECT "id",
    "tenant_id",
    "nome",
    "email",
    "telefone",
    "password_hash",
    "role",
    "ativo",
    "created_at",
    "auth_id",
    "deleted_at",
    "last_login"
   FROM "public"."usuarios"
  WHERE ("deleted_at" IS NULL);


ALTER VIEW "public"."usuarios_ativos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuarios_backup_20260205" (
    "id" "uuid",
    "tenant_id" "uuid",
    "nome" "text",
    "email" "text",
    "telefone" "text",
    "password_hash" "text",
    "role" "text",
    "ativo" boolean,
    "created_at" timestamp with time zone,
    "auth_id" "uuid"
);


ALTER TABLE "public"."usuarios_backup_20260205" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendedores" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nome" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "ativo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vendedores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhooks_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "fonte" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhooks_log" OWNER TO "postgres";


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



CREATE INDEX "idx_convites_email" ON "public"."convites_usuarios" USING "btree" ("email");



CREATE INDEX "idx_convites_tenant" ON "public"."convites_usuarios" USING "btree" ("tenant_id");



CREATE INDEX "idx_convites_token" ON "public"."convites_usuarios" USING "btree" ("token");



CREATE INDEX "idx_interacoes_created_at" ON "public"."interacoes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_interacoes_lead_id" ON "public"."interacoes" USING "btree" ("lead_id");



CREATE INDEX "idx_leads_categoria" ON "public"."leads" USING "btree" ("categoria");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_deleted_at" ON "public"."leads" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_email_tenant" ON "public"."leads" USING "btree" ("email", "tenant_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_fonte" ON "public"."leads" USING "btree" ("fonte");



CREATE INDEX "idx_leads_score" ON "public"."leads" USING "btree" ("score" DESC);



CREATE INDEX "idx_leads_sistema_created" ON "public"."leads_sistema" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_sistema_email" ON "public"."leads_sistema" USING "btree" ("email");



CREATE INDEX "idx_leads_sistema_status" ON "public"."leads_sistema" USING "btree" ("status");



CREATE INDEX "idx_leads_sistema_tenant" ON "public"."leads_sistema" USING "btree" ("tenant_id");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_leads_tenant_categoria" ON "public"."leads" USING "btree" ("tenant_id", "categoria") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_tenant_created" ON "public"."leads" USING "btree" ("tenant_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_leads_tenant_id" ON "public"."leads" USING "btree" ("tenant_id");



CREATE INDEX "idx_leads_tenant_status" ON "public"."leads" USING "btree" ("tenant_id", "status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_notificacoes_lida" ON "public"."notificacoes" USING "btree" ("lida");



CREATE INDEX "idx_notificacoes_usuario_id" ON "public"."notificacoes" USING "btree" ("usuario_id");



CREATE INDEX "idx_tenants_slug" ON "public"."tenants" USING "btree" ("slug") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_usuarios_deleted_at" ON "public"."usuarios" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_usuarios_email" ON "public"."usuarios" USING "btree" ("email");



CREATE INDEX "idx_usuarios_tenant_id" ON "public"."usuarios" USING "btree" ("tenant_id");



CREATE UNIQUE INDEX "marcas_slug_idx" ON "public"."marcas" USING "btree" ("slug");



CREATE OR REPLACE TRIGGER "trigger_update_leads_sistema_updated_at" BEFORE UPDATE ON "public"."leads_sistema" FOR EACH ROW EXECUTE FUNCTION "public"."update_leads_sistema_updated_at"();



CREATE OR REPLACE TRIGGER "update_leads_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tenants_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."integracoes_crm"
    ADD CONSTRAINT "integracoes_crm_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integracoes_crm"
    ADD CONSTRAINT "integracoes_crm_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacoes"
    ADD CONSTRAINT "interacoes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacoes"
    ADD CONSTRAINT "interacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id");



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
    ADD CONSTRAINT "leads_sistema_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



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
    ADD CONSTRAINT "usuarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



CREATE POLICY "Acesso Marcas por Tenant" ON "public"."marcas" USING (("tenant_id" = '81cac3a4-caa3-43b2-be4d-d16557d7ef88'::"uuid"));



CREATE POLICY "Inserção pública leads_sistema" ON "public"."leads_sistema" FOR INSERT WITH CHECK (true);



CREATE POLICY "Leitura pública leads_sistema" ON "public"."leads_sistema" FOR SELECT USING (true);



CREATE POLICY "leads_sistema_update_tenant" ON "public"."leads_sistema" FOR UPDATE TO "authenticated" USING (("tenant_id" = ( SELECT "usuarios"."tenant_id"
   FROM "public"."usuarios"
  WHERE ("usuarios"."auth_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "Leitura_Segmentos" ON "public"."segmentos" FOR SELECT TO "authenticated" USING (("tenant_id" = '81cac3a4-caa3-43b2-be4d-d16557d7ef88'::"uuid"));



CREATE POLICY "Master_Status_Policy" ON "public"."status_comercial" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "convites_delete" ON "public"."convites_usuarios" FOR DELETE USING ((("tenant_id" = "public"."get_my_tenant_id"()) AND "public"."is_admin"()));



CREATE POLICY "convites_insert" ON "public"."convites_usuarios" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_my_tenant_id"()) AND "public"."is_admin"()));



CREATE POLICY "convites_select" ON "public"."convites_usuarios" FOR SELECT USING ((("tenant_id" = "public"."get_my_tenant_id"()) AND "public"."is_admin"()));



ALTER TABLE "public"."integracoes_crm" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integracoes_crm_service_all" ON "public"."integracoes_crm" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."interacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interacoes_service_all" ON "public"."interacoes" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "leads_anon_insert" ON "public"."leads" FOR INSERT WITH CHECK (true);



CREATE POLICY "leads_insert_tenant" ON "public"."leads" FOR INSERT TO "authenticated" WITH CHECK (("tenant_id" = ( SELECT "usuarios"."tenant_id"
   FROM "public"."usuarios"
  WHERE ("usuarios"."auth_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "leads_select_tenant" ON "public"."leads" FOR SELECT TO "authenticated" USING (("tenant_id" = ( SELECT "usuarios"."tenant_id"
   FROM "public"."usuarios"
  WHERE ("usuarios"."auth_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "leads_service_all" ON "public"."leads" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."leads_sistema" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_sistema_anon_insert" ON "public"."leads_sistema" FOR INSERT WITH CHECK (true);



CREATE POLICY "leads_sistema_service_all" ON "public"."leads_sistema" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "leads_update_tenant" ON "public"."leads" FOR UPDATE TO "authenticated" USING (("tenant_id" = ( SELECT "usuarios"."tenant_id"
   FROM "public"."usuarios"
  WHERE ("usuarios"."auth_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "marcas_select_tenant" ON "public"."marcas" FOR SELECT TO "authenticated" USING (("tenant_id" = ( SELECT "usuarios"."tenant_id"
   FROM "public"."usuarios"
  WHERE ("usuarios"."auth_id" = "auth"."uid"())
 LIMIT 1)));



ALTER TABLE "public"."motivos_perda" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "motivos_perda_service_all" ON "public"."motivos_perda" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."notificacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notificacoes_service_all" ON "public"."notificacoes" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "parametros_tenant_isolation" ON "public"."parametros_score" USING (("tenant_id" = "public"."get_user_tenant_id"()));



ALTER TABLE "public"."templates_mensagem" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "templates_service_all" ON "public"."templates_mensagem" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "tenants_anon_slug_read" ON "public"."tenants" FOR SELECT USING ((("active" = true) AND ("deleted_at" IS NULL)));



CREATE POLICY "tenants_service_all" ON "public"."tenants" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "usuarios_podem_atualizar_marcas" ON "public"."marcas" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "usuarios_podem_atualizar_segmentos" ON "public"."segmentos" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "usuarios_podem_inserir_marcas" ON "public"."marcas" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "usuarios_podem_inserir_segmentos" ON "public"."segmentos" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "usuarios_podem_ver_marcas" ON "public"."marcas" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "usuarios_podem_ver_segmentos" ON "public"."segmentos" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "usuarios_select_own" ON "public"."usuarios" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "auth_id"));



CREATE POLICY "usuarios_service_all" ON "public"."usuarios" USING (("auth"."role"() = 'service_role'::"text"));



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



GRANT ALL ON FUNCTION "public"."desativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."desativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."desativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_gerente_or_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_gerente_or_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_gerente_or_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."listar_convites_pendentes"("p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."listar_convites_pendentes"("p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."listar_convites_pendentes"("p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_unauthorized_superadmin"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_unauthorized_superadmin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_unauthorized_superadmin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reativar_usuario"("p_usuario_id" "uuid", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_leads_sistema_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_leads_sistema_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_leads_sistema_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



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



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."leads_ativos" TO "anon";
GRANT ALL ON TABLE "public"."leads_ativos" TO "authenticated";
GRANT ALL ON TABLE "public"."leads_ativos" TO "service_role";



GRANT ALL ON TABLE "public"."leads_backup_20260205" TO "anon";
GRANT ALL ON TABLE "public"."leads_backup_20260205" TO "authenticated";
GRANT ALL ON TABLE "public"."leads_backup_20260205" TO "service_role";



GRANT ALL ON TABLE "public"."leads_por_fonte" TO "anon";
GRANT ALL ON TABLE "public"."leads_por_fonte" TO "authenticated";
GRANT ALL ON TABLE "public"."leads_por_fonte" TO "service_role";



GRANT ALL ON TABLE "public"."leads_sistema" TO "anon";
GRANT ALL ON TABLE "public"."leads_sistema" TO "authenticated";
GRANT ALL ON TABLE "public"."leads_sistema" TO "service_role";



GRANT ALL ON TABLE "public"."marcas" TO "anon";
GRANT ALL ON TABLE "public"."marcas" TO "authenticated";
GRANT ALL ON TABLE "public"."marcas" TO "service_role";



GRANT ALL ON TABLE "public"."marcas_backup_20260205" TO "anon";
GRANT ALL ON TABLE "public"."marcas_backup_20260205" TO "authenticated";
GRANT ALL ON TABLE "public"."marcas_backup_20260205" TO "service_role";



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



GRANT ALL ON TABLE "public"."segmentos" TO "anon";
GRANT ALL ON TABLE "public"."segmentos" TO "authenticated";
GRANT ALL ON TABLE "public"."segmentos" TO "service_role";



GRANT ALL ON TABLE "public"."segmentos_backup_20260205" TO "anon";
GRANT ALL ON TABLE "public"."segmentos_backup_20260205" TO "authenticated";
GRANT ALL ON TABLE "public"."segmentos_backup_20260205" TO "service_role";



GRANT ALL ON TABLE "public"."status_comercial" TO "anon";
GRANT ALL ON TABLE "public"."status_comercial" TO "authenticated";
GRANT ALL ON TABLE "public"."status_comercial" TO "service_role";



GRANT ALL ON TABLE "public"."templates_mensagem" TO "anon";
GRANT ALL ON TABLE "public"."templates_mensagem" TO "authenticated";
GRANT ALL ON TABLE "public"."templates_mensagem" TO "service_role";



GRANT ALL ON TABLE "public"."tenants_backup_20260205" TO "anon";
GRANT ALL ON TABLE "public"."tenants_backup_20260205" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants_backup_20260205" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios" TO "anon";
GRANT ALL ON TABLE "public"."usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios_ativos" TO "anon";
GRANT ALL ON TABLE "public"."usuarios_ativos" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios_ativos" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios_backup_20260205" TO "anon";
GRANT ALL ON TABLE "public"."usuarios_backup_20260205" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios_backup_20260205" TO "service_role";



GRANT ALL ON TABLE "public"."vendedores" TO "anon";
GRANT ALL ON TABLE "public"."vendedores" TO "authenticated";
GRANT ALL ON TABLE "public"."vendedores" TO "service_role";



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







