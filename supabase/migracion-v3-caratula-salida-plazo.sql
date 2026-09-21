-- ============================================================
-- SEGUIMIENTO DE EXPTES. DGSV - MIGRACIÓN V3
-- Carátula, salida opcional y plazo personalizado.
-- Ejecutar UNA VEZ en Supabase SQL Editor.
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

-- La fecha de salida se completa recién al primer movimiento fuera de Mesa de Entrada.
alter table public.expedientes
  alter column fecha_salida drop not null;

-- Permitir 3, 5, 7 u otra cantidad positiva de días.
alter table public.expedientes
  drop constraint if exists expedientes_plazo_dias_check;

alter table public.expedientes
  add constraint expedientes_plazo_dias_check
  check (
    plazo_dias is null
    or (plazo_dias >= 1 and plazo_dias <= 3650)
  );

-- Reafirmar prevención de duplicados.
create unique index if not exists expedientes_numero_anio_uq
  on public.expedientes (lower(tipo), numero, anio);

-- Mantener control institucional:
-- solo JEFE puede modificar prioridad y plazo.
create or replace function public.controlar_cambio_plazo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if (new.plazo_dias is distinct from old.plazo_dias)
       or (new.plazo_definido_en is distinct from old.plazo_definido_en) then
      if not public.es_jefe() then
        raise exception 'Solo el perfil JEFE puede modificar el plazo del expediente.';
      end if;
    end if;

    if new.prioridad is distinct from old.prioridad then
      if not public.es_jefe() then
        raise exception 'Solo el perfil JEFE puede modificar la prioridad del expediente.';
      end if;
    end if;

  elsif tg_op = 'INSERT' then
    if (new.plazo_dias is not null or new.plazo_definido_en is not null)
       and not public.es_jefe() then
      raise exception 'Solo el perfil JEFE puede definir el plazo del expediente.';
    end if;

    if new.prioridad <> 'normal'::public.prioridad_expediente
       and not public.es_jefe() then
      raise exception 'Solo el perfil JEFE puede definir una prioridad distinta de NORMAL.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;
