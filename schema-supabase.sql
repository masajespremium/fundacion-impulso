-- Ya ejecutaste la creación de tablas en Supabase. NO ejecutes de nuevo si existen.
-- Se incluye para documentación de la estructura.
CREATE TABLE IF NOT EXISTS public.solicitudes (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 codigo VARCHAR(30) NOT NULL UNIQUE,
 clave_hash VARCHAR(64) NOT NULL,
 datos_json JSONB NOT NULL,
 estado VARCHAR(20) NOT NULL DEFAULT 'EN PROCESO' CHECK (estado IN ('EN PROCESO','APROBADA','RECHAZADA')),
 creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.documentos_solicitud (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 solicitud_id BIGINT NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
 campo VARCHAR(60) NOT NULL,
 nombre_original VARCHAR(255) NOT NULL,
 ruta_privada VARCHAR(500) NOT NULL,
 tipo VARCHAR(100) NOT NULL
);
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_solicitud ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.solicitudes FROM anon,authenticated;
REVOKE ALL ON TABLE public.documentos_solicitud FROM anon,authenticated;
