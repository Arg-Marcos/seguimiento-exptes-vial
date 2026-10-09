-- SOLO LECTURA: ejecutar ahora y compartir el resultado. No cambia datos.
select jsonb_build_object(
 'columnas', (select jsonb_agg(to_jsonb(c)) from (select table_name,column_name,data_type,udt_name,is_nullable from information_schema.columns where table_schema='public' and table_name in ('perfiles','expedientes','historial_expedientes','mesas_entrada') order by table_name,ordinal_position) c),
 'politicas', (select jsonb_agg(to_jsonb(p)) from (select tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname='public') p),
 'perfiles', (select jsonb_agg(to_jsonb(p)) from public.perfiles p),
 'roles', (select jsonb_agg(e.enumlabel order by e.enumsortorder) from pg_enum e join pg_type t on t.oid=e.enumtypid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='rol_usuario'),
 'indices', (select jsonb_agg(to_jsonb(i)) from (select tablename,indexname,indexdef from pg_indexes where schemaname='public' and tablename='expedientes') i),
 'triggers', (select jsonb_agg(to_jsonb(t)) from (select event_object_table,trigger_name,action_statement from information_schema.triggers where trigger_schema='public') t),
 'expedientes_por_creador', (select jsonb_agg(to_jsonb(r)) from (select creado_por,count(*) as cantidad from public.expedientes group by creado_por) r)
) as diagnostico;
