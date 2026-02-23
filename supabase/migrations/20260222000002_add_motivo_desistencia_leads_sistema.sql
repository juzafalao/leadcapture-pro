ALTER TABLE leads_sistema
  ADD COLUMN IF NOT EXISTS motivo_desistencia_id UUID REFERENCES motivos_desistencia(id);

COMMENT ON COLUMN leads_sistema.motivo_desistencia_id IS 'Motivo de desistência quando status = perdido';
