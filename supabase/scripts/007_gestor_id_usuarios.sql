-- Adiciona hierarquia de time: Consultor → Gestor → Diretor
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_gestor_id ON public.usuarios(gestor_id);
