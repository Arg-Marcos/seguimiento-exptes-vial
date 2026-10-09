-- Esquema de perfiles confirmado: rol usa el enum public.rol_usuario.
-- Ejecutar ESTE archivo por separado (el enum debe confirmar su transacción).
alter type public.rol_usuario add value if not exists 'director';
