-- Adiciona coluna "Em Atendimento IA" ao Kanban de todos os tenants
-- Usada quando a LIA (agente virtual) inicia uma conversa com o lead.
-- O lead transita: novo_lead → em_atendimento_ia (LIA) → em_negociacao (handoff) → ...

INSERT INTO public.status_comercial
  (tenant_id, label, slug, cor, ordem, is_final, permite_reabertura, requer_valor)
SELECT
  t.id,
  'Atendimento IA',
  'em_atendimento_ia',
  '#8b5cf6',
  2,
  false,
  false,
  false
FROM public.tenants t
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Reordena: novo_lead(1) → em_atendimento_ia(2) → em_agendamento(3) → em_negociacao(4) → ...
UPDATE public.status_comercial SET ordem = 3 WHERE slug = 'em_agendamento';
UPDATE public.status_comercial SET ordem = 4 WHERE slug = 'em_negociacao';
UPDATE public.status_comercial SET ordem = 5 WHERE slug = 'vendido';
UPDATE public.status_comercial SET ordem = 6 WHERE slug = 'perdido';
UPDATE public.status_comercial SET ordem = 7 WHERE slug = 'reaberto';
