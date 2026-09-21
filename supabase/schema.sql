-- ============================================================
-- SEGUIMIENTO DE EXPTES. - DIRECCIÓN GENERAL DE SEGURIDAD VIAL
-- Ejecutar en Supabase SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

do $$ begin
  create type public.rol_usuario as enum ('jefe','mesa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.prioridad_expediente as enum ('baja','normal','alta','urgente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estado_expediente as enum ('en_tramite','devuelto','finalizado','archivado');
exception when duplicate_object then null; end $$;

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol public.rol_usuario not null default 'mesa',
  created_at timestamptz not null default now()
);

create table if not exists public.dependencias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists dependencias_nombre_uq
  on public.dependencias (lower(btrim(nombre)));

create table if not exists public.expedientes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'Expte.',
  numero text not null,
  anio integer not null check (anio between 2000 and 2100),
  fecha_salida date not null,
  area_solicitante text not null,
  dependencia_id uuid references public.dependencias(id),
  dependencia_solicitante text not null,
  prioridad public.prioridad_expediente not null default 'normal',
  ubicacion_actual text not null,
  fecha_actualizacion_ubicacion timestamptz not null default now(),
  observaciones text,
  estado public.estado_expediente not null default 'en_tramite',
  plazo_dias integer check (plazo_dias in (3,5,7)),
  plazo_definido_en timestamptz,
  creado_por uuid references auth.users(id),
  actualizado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists expedientes_numero_anio_uq
  on public.expedientes (lower(tipo), numero, anio);

create index if not exists expedientes_estado_idx on public.expedientes(estado);
create index if not exists expedientes_dependencia_idx on public.expedientes(dependencia_id);
create index if not exists expedientes_anio_idx on public.expedientes(anio);
create index if not exists expedientes_prioridad_idx on public.expedientes(prioridad);

create table if not exists public.historial_expedientes (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  ubicacion_anterior text,
  ubicacion_nueva text not null,
  observacion text,
  usuario_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists historial_expediente_idx
  on public.historial_expedientes(expediente_id, created_at desc);

-- Helper: es jefe
create or replace function public.es_jefe()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfiles
    where id = auth.uid()
      and rol = 'jefe'
  );
$$;

-- Trigger: solo jefe puede cambiar plazos.
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
  elsif tg_op = 'INSERT' then
    if (new.plazo_dias is not null or new.plazo_definido_en is not null)
       and not public.es_jefe() then
      raise exception 'Solo el perfil JEFE puede definir el plazo del expediente.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_controlar_cambio_plazo on public.expedientes;
create trigger trg_controlar_cambio_plazo
before insert or update on public.expedientes
for each row execute function public.controlar_cambio_plazo();

-- RLS
alter table public.perfiles enable row level security;
alter table public.dependencias enable row level security;
alter table public.expedientes enable row level security;
alter table public.historial_expedientes enable row level security;

drop policy if exists perfiles_lectura on public.perfiles;
create policy perfiles_lectura on public.perfiles
for select to authenticated using (true);

drop policy if exists dependencias_auth on public.dependencias;
create policy dependencias_auth on public.dependencias
for all to authenticated using (true) with check (true);

drop policy if exists expedientes_auth on public.expedientes;
create policy expedientes_auth on public.expedientes
for all to authenticated using (true) with check (true);

drop policy if exists historial_auth on public.historial_expedientes;
create policy historial_auth on public.historial_expedientes
for all to authenticated using (true) with check (true);

grant usage on schema public to authenticated;
grant select on public.perfiles to authenticated;
grant select, insert, update, delete on public.dependencias to authenticated;
grant select, insert, update, delete on public.expedientes to authenticated;
grant select, insert, update, delete on public.historial_expedientes to authenticated;
grant execute on function public.es_jefe() to authenticated;

-- Crear los usuarios desde Authentication > Users.
-- Luego asignar rol manualmente, por ejemplo:
-- insert into public.perfiles (id,nombre,rol)
-- values ('UUID_DEL_USUARIO','Crio. Nombre Apellido','jefe');
--
-- insert into public.perfiles (id,nombre,rol)
-- values ('UUID_DEL_USUARIO','Nombre Mesa de Entrada','mesa');
