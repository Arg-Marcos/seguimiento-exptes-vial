# Seguimiento de Exptes. — DGSV

MVP para Dirección General de Seguridad Vial — Policía de Salta.

## Stack
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth + PostgreSQL

## 1. Crear proyecto Supabase
1. Crear un proyecto.
2. Abrir SQL Editor.
3. Ejecutar `supabase/schema.sql`.

## 2. Crear usuarios
En Supabase: Authentication → Users → Add user.

Luego en SQL Editor:

```sql
insert into public.perfiles (id,nombre,rol)
values ('UUID_USUARIO_JEFE','Crio. Nombre Apellido','jefe');

insert into public.perfiles (id,nombre,rol)
values ('UUID_USUARIO_MESA','Nombre Mesa de Entrada','mesa');
```

Roles:
- `jefe`: puede definir/cambiar plazo 3, 5 o 7 días.
- `mesa`: trabaja expedientes, pero el trigger impide modificar plazos.

## 3. Variables
Copiar `.env.local.example` a `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 4. Instalar
```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## 5. Build
```bash
npm run build
npm start
```

## Lógica de alertas
- El Jefe define 3, 5 o 7 días.
- Antes del plazo: normal.
- Al alcanzar el plazo: amarillo intermitente.
- Con 2 días o más de exceso: rojo intermitente.

Está concentrado en una función simple del frontend para que se pueda cambiar fácilmente.

## Futuro servidor propio
El proyecto no depende de Vercel. Puede desplegarse con Node.js:
```bash
npm run build
npm start
```

También se puede dockerizar detrás de Nginx/Traefik. Para un despliegue institucional futuro conviene:
- PostgreSQL/Supabase self-hosted o PostgreSQL propio.
- Reverse proxy HTTPS.
- backups automáticos.
- logs/auditoría.
- SSO/LDAP si la infraestructura de Policía lo permite.
