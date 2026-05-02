-- ============================================================
-- MIGRATION 006 — Limpeza de leads de teste e duplicatas
-- Tenant: dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f
-- Mantém apenas os 20 leads com melhor qualidade de dados.
-- ============================================================

DO $$
DECLARE
  leads_para_manter uuid[] := ARRAY[
    '77b938cd-e9a1-45d0-8b7b-c1c13538498a', -- Marcos Teixeira      | score 99 | R$800k  | convertido
    '8b5ea747-f5db-44ad-aff0-56c02da884bd', -- Diego Carvalho       | score 98 | R$600k  | convertido
    'f3da054a-d378-44d4-bf38-a31aa72ce17a', -- Beatriz Rodrigues    | score 97 | R$500k  | convertido
    '0a3e351d-040b-48aa-9062-4728f2774e21', -- Roberto Silva        | score 95 | R$400k  | convertido
    '62957261-3e44-41c6-8483-1c6269f9115f', -- Carlos Eduardo       | score 93 | R$450k  | convertido
    '24fd188d-79ed-413a-9a32-d855fe3ecb91', -- Mariana Santos       | score 95 | R$550k  | contato
    '4688a810-fd47-470d-9565-c4faa0775fec', -- Bianca Oliveira      | score 92 | R$480k  | contato
    '8fb2e564-c7bd-4b00-a2be-78e484e8a6a0', -- Karen Silva          | score 93 | R$320k  | convertido
    '13d34a5e-3dc6-465b-9554-adf5c53ecc7a', -- Eduarda Lima         | score 95 | R$350k  | convertido
    'b7dc5589-19c3-44ed-b2c3-cbc0df7f4b9e', -- Mariana Castro       | score 91 | R$250k  | convertido
    '4b7962c9-034c-4cbb-97c9-a3ed2be2daf6', -- Rafael Mendes        | score 89 | R$320k  | convertido
    '371f97d7-57f5-46b4-889b-350678030562', -- Rafaela Gomes        | score 89 | R$220k  | convertido
    '8b8d042e-59d5-4f52-a4fa-ac97474fa267', -- Ana Paula Ferreira   | score 88 | R$120k  | convertido
    '9498ecef-8f1f-4d40-8448-cc144fad5dd3', -- João Victor Alves    | score 88 | R$320k  | agendado
    '0bc1d02c-e97f-436e-ae25-9b271e8015fa', -- Camila Souza         | score 85 | R$280k  | convertido
    'cff5c79c-ff24-4ff2-a707-adcdfa5b5932', -- Anderson Lima        | score 79 | R$200k  | convertido
    '07d643b3-6e93-4730-9d08-cba5d6ec4c4c', -- Vanessa Gomes        | score 76 | R$240k  | contato
    'fbac2f52-666c-4cfd-a08c-8290430486b7', -- Fernanda Costa       | score 68 | R$180k  | convertido
    'c55e5420-bcd3-4b0a-bdb2-95b69f13c95e', -- Maria Santos         | score 55 | R$120k  | agendado
    'ee1dac52-9cd5-47c7-b3cd-7911d5e029aa'  -- Thiago Martins       | score 58 | R$120k  | convertido
  ];

  tenant uuid := 'dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f';

BEGIN

  -- 1. Tabelas dependentes: apaga registros vinculados aos leads removidos
  DELETE FROM lead_historico
  WHERE lead_id NOT IN (SELECT unnest(leads_para_manter))
    AND lead_id IN (SELECT id FROM leads WHERE tenant_id = tenant);

  DELETE FROM ranking_comissoes
  WHERE lead_id NOT IN (SELECT unnest(leads_para_manter))
    AND lead_id IN (SELECT id FROM leads WHERE tenant_id = tenant);

  DELETE FROM automacao_execucoes
  WHERE lead_id NOT IN (SELECT unnest(leads_para_manter))
    AND lead_id IN (SELECT id FROM leads WHERE tenant_id = tenant);

  DELETE FROM notificacoes
  WHERE lead_id NOT IN (SELECT unnest(leads_para_manter))
    AND lead_id IN (SELECT id FROM leads WHERE tenant_id = tenant);

  DELETE FROM interacoes
  WHERE lead_id NOT IN (SELECT unnest(leads_para_manter))
    AND lead_id IN (SELECT id FROM leads WHERE tenant_id = tenant);

  DELETE FROM integracoes_crm
  WHERE lead_id NOT IN (SELECT unnest(leads_para_manter))
    AND lead_id IN (SELECT id FROM leads WHERE tenant_id = tenant);

  -- 2. Remove os leads fora da lista de preservação
  DELETE FROM leads
  WHERE tenant_id = tenant
    AND id NOT IN (SELECT unnest(leads_para_manter));

  RAISE NOTICE 'Limpeza concluída. Leads mantidos: %', array_length(leads_para_manter, 1);

END $$;
