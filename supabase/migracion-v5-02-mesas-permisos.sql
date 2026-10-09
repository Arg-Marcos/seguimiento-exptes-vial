-- Validada contra columnas, índices, políticas y perfiles informados el 08/10/2026.
-- Completar asignación de las cuentas a su mesa antes de iniciar sesión.
-- Primero ejecutar migracion-v5-01-director.sql por separado.
begin;
-- El esquema real conserva Área destino obligatoria: permitir registro sin salida.
alter table public.expedientes alter column dependencia_solicitante drop not null;
create table if not exists public.mesas_entrada (
 id text primary key,
 nombre text not null unique,
 activo boolean not null default true
);
insert into public.mesas_entrada (id,nombre) values
 ('operaciones_dsv','Dpto. Operaciones (DSV)'),
 ('seguridad_vial_dgsv','Dirección Seguridad Vial (DGSV)'),
 ('general_vial_sjp','Dirección Gral. Seg. Vial (SJP)')
on conflict (id) do nothing;
alter table public.perfiles add column if not exists mesa_id text references public.mesas_entrada(id);
alter table public.expedientes add column if not exists mesa_id text references public.mesas_entrada(id);
create index if not exists expedientes_mesa_idx on public.expedientes(mesa_id);
-- No adivinar la mesa de perfiles/expedientes existentes: quedan sin asignar.
-- Los registros sin mesa solo los ven Director y Jefe hasta asignarlos.
-- La misma referencia puede registrarse una vez EN CADA mesa.
drop index if exists public.expedientes_numero_anio_uq;
create unique index if not exists expedientes_mesa_numero_anio_uq
 on public.expedientes(mesa_id,lower(tipo),numero,anio);

create or replace function public.es_autoridad()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.perfiles where id=auth.uid() and rol::text in ('director','jefe')); $$;
-- Mantiene compatibilidad con el trigger de plazos existente.
create or replace function public.es_jefe()
returns boolean language sql stable security definer set search_path=public
as $$ select public.es_autoridad(); $$;
create or replace function public.mesa_del_usuario()
returns text language sql stable security definer set search_path=public
as $$ select p.mesa_id from public.perfiles p join public.mesas_entrada m on m.id=p.mesa_id and m.activo where p.id=auth.uid() and p.rol::text='mesa'; $$;
revoke all on function public.es_autoridad(), public.es_jefe(), public.mesa_del_usuario() from public;
grant execute on function public.es_autoridad(), public.es_jefe(), public.mesa_del_usuario() to authenticated;

alter table public.perfiles enable row level security;
alter table public.mesas_entrada enable row level security;
alter table public.expedientes enable row level security;
alter table public.historial_expedientes enable row level security;
-- Los perfiles se administran con SQL Editor/service role, nunca desde el cliente.
revoke insert,update,delete on public.perfiles from authenticated,anon;
revoke all on public.mesas_entrada from authenticated,anon;
grant select on public.mesas_entrada to authenticated;
grant select on public.perfiles to authenticated;

drop policy if exists perfiles_lectura on public.perfiles;
create policy perfiles_lectura on public.perfiles for select to authenticated
 using (id=auth.uid() or public.es_autoridad());
drop policy if exists perfiles_limite_v5 on public.perfiles;
create policy perfiles_limite_v5 on public.perfiles as restrictive for select to authenticated
 using (id=auth.uid() or public.es_autoridad());
drop policy if exists mesas_lectura on public.mesas_entrada;
create policy mesas_lectura on public.mesas_entrada for select to authenticated using (true);

drop policy if exists expedientes_auth on public.expedientes;
create policy expedientes_auth on public.expedientes for all to authenticated
 using (public.es_autoridad() or mesa_id=public.mesa_del_usuario())
 with check (public.es_autoridad() or mesa_id=public.mesa_del_usuario());
-- Restringe incluso si hay otra política permisiva anterior.
drop policy if exists expedientes_limite_v5 on public.expedientes;
create policy expedientes_limite_v5 on public.expedientes as restrictive for all to authenticated
 using (public.es_autoridad() or mesa_id=public.mesa_del_usuario())
 with check (public.es_autoridad() or mesa_id=public.mesa_del_usuario());
-- El archivado conserva registros y recuentos; no se borra desde el cliente.
revoke delete on public.expedientes from authenticated,anon;

drop policy if exists historial_auth on public.historial_expedientes;
create policy historial_auth on public.historial_expedientes for select to authenticated
 using (exists(select 1 from public.expedientes e where e.id=expediente_id));
drop policy if exists historial_insert_v5 on public.historial_expedientes;
create policy historial_insert_v5 on public.historial_expedientes for insert to authenticated
 with check (usuario_id=auth.uid() and exists(select 1 from public.expedientes e where e.id=expediente_id));
drop policy if exists historial_limite_v5 on public.historial_expedientes;
create policy historial_limite_v5 on public.historial_expedientes as restrictive for all to authenticated
 using (exists(select 1 from public.expedientes e where e.id=expediente_id))
 with check (usuario_id=auth.uid() and exists(select 1 from public.expedientes e where e.id=expediente_id));
revoke update,delete on public.historial_expedientes from authenticated,anon;

-- La mesa registradora no cambia cuando el expediente se deriva a otra área.
create or replace function public.controlar_mesa_registro()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is not null then
  if tg_op='INSERT' then
   if new.mesa_id is null or not exists(select 1 from public.mesas_entrada where id=new.mesa_id and activo) then
    raise exception 'Debe indicar una mesa de entrada activa.';
   end if;
   if not public.es_autoridad() and new.mesa_id is distinct from public.mesa_del_usuario() then
    raise exception 'Solo puede registrar expedientes en su mesa.';
   end if;
   new.creado_por := auth.uid();
  else
   if new.mesa_id is distinct from old.mesa_id or new.creado_por is distinct from old.creado_por then
    raise exception 'No puede cambiar la mesa registradora ni el creador.';
   end if;
  end if;
  new.actualizado_por := auth.uid();
 end if;
 return new;
end; $$;
drop trigger if exists trg_mesa_registro on public.expedientes;
create trigger trg_mesa_registro before insert or update on public.expedientes
 for each row execute function public.controlar_mesa_registro();
notify pgrst,'reload schema';
commit;
