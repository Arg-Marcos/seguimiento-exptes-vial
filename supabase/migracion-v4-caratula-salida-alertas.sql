-- ============================================================
-- DGSV - MIGRACIÓN V4
-- Corrige esquema para Carátula, Fecha de salida opcional,
-- Área destino opcional hasta que exista salida y recarga
-- el schema cache de PostgREST/Supabase.
-- EJECUTAR UNA VEZ EN SUPABASE SQL EDITOR.
-- ============================================================

alter table public.expedientes
  add column if not exists caratula text;

update public.expedientes
set caratula = coalesce(
  nullif(btrim(caratula), ''),
  concat(tipo, ' ', numero, '/', anio)
)
where caratula is null
   or btrim(caratula) = '';

alter table public.expedientes
  alter column caratula set not null;

-- Fecha de salida puede quedar vacía.
alter table public.expedientes
  alter column fecha_salida drop not null;

-- Área destino puede quedar vacía hasta que el expediente tenga salida.
alter table public.expedientes
  alter column dependencia_solicitante drop not null;

-- Plazos personalizados: 3, 5, 7 u otro valor positivo.
alter table public.expedientes
  drop constraint if exists expedientes_plazo_dias_check;

alter table public.expedientes
  add constraint expedientes_plazo_dias_check
  check (
    plazo_dias is null
    or (plazo_dias >= 1 and plazo_dias <= 3650)
  );

-- Duplicados: Tipo + Número + Año.
create unique index if not exists expedientes_numero_anio_uq
  on public.expedientes (lower(tipo), numero, anio);

-- Fuerza a PostgREST a refrescar el esquema para que reconozca "caratula".
notify pgrst, 'reload schema';
