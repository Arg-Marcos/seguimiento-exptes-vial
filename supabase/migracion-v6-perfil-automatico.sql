-- Ejecutar después de V5. Crea perfiles sin conceder permisos de autoridad.
begin;

create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, rol, mesa_id)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'nombre'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Usuario nuevo'
    ),
    'mesa'::public.rol_usuario,
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;

drop trigger if exists trg_crear_perfil_nuevo_usuario on auth.users;
create trigger trg_crear_perfil_nuevo_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- Completar solo perfiles faltantes. Conserva roles/mesas ya asignados.
insert into public.perfiles (id, nombre, rol, mesa_id)
select
  u.id,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'nombre'), ''),
    nullif(split_part(u.email, '@', 1), ''),
    'Usuario nuevo'
  ),
  'mesa'::public.rol_usuario,
  null
from auth.users u
where not exists (select 1 from public.perfiles p where p.id = u.id)
on conflict (id) do nothing;

commit;
