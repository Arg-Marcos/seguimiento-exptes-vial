-- ============================================================
-- SEGUIMIENTO DE EXPTES. DGSV - MIGRACIÓN V2
-- Área procedente, fecha de ingreso y control de prioridad por JEFE.
-- Ejecutar UNA VEZ en Supabase SQL Editor.
-- ============================================================

alter table public.expedientes
  add column if not exists fecha_ingreso date;

update public.expedientes
set fecha_ingreso = coalesce(fecha_ingreso, created_at::date)
where fecha_ingreso is null;

alter table public.expedientes
  alter column fecha_ingreso set default current_date;

alter table public.expedientes
  alter column fecha_ingreso set not null;

alter table public.expedientes
  add column if not exists area_procedente_id uuid references public.dependencias(id);

-- Intento de vinculación automática para registros existentes cuando el texto
-- de área coincide exactamente con una dependencia del catálogo.
update public.expedientes e
set area_procedente_id = d.id
from public.dependencias d
where e.area_procedente_id is null
  and lower(btrim(e.area_solicitante)) = lower(btrim(d.nombre));

create index if not exists expedientes_area_procedente_idx
  on public.expedientes(area_procedente_id);

-- Solo JEFE puede modificar plazo o prioridad.
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

    -- Mesa puede crear expedientes únicamente con la prioridad por defecto NORMAL.
    if new.prioridad <> 'normal'::public.prioridad_expediente
       and not public.es_jefe() then
      raise exception 'Solo el perfil JEFE puede definir una prioridad distinta de NORMAL.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;
