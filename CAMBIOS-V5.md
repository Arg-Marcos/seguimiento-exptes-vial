# Perfiles y mesas de entrada

Implementación preparada sobre el ZIP recibido el 08/10/2026. No se aplicaron cambios a la base de datos remota.

## Comportamiento

- Roles: Director, Jefe y Mesa de Entrada; cada perfil puede tener una de las tres mesas asignadas.
- Dpto. Operaciones (DSV), Dirección Seguridad Vial (DGSV) y Dirección Gral. Seg. Vial (SJP), con las denominaciones solicitadas.
- Mesa ve y gestiona los expedientes registrados en su mesa, incluso si fueron cargados por otro usuario de esa misma mesa.
- Director y Jefe acceden a todas las mesas. Conservan las funciones anteriores de Jefe (registro, edición, archivado, prioridad y plazos), con filtros por mesa en expedientes, dashboard y alertas.
- La mesa registradora se conserva al cambiar procedencia, destino o ubicación. No se puede cambiar desde el cliente.
- N° numera las filas visibles desde 1 según el orden/filtro vigente. No es un número permanente de registro. Se muestra aparte el total registrado en las mesas accesibles o en la mesa filtrada, incluyendo archivados en la página de expedientes.
- La referencia Tipo/Número/Año debe ser única dentro de cada mesa. Puede existir en otras mesas.
- La lista carga todas las páginas de Supabase; el dashboard ya no recorta la consulta a 100 expedientes.
- Login con escudos PNG de transparencia exterior; ajuste object-contain para conservar completos los escudos. El negro interior pertenece a los escudos.
- Se reutilizó el escudo DGSV que ya tenía transparencia; el policial se editó con la herramienta integrada de imágenes. Instrucción: quitar solamente el fondo exterior, conservando borde dorado, contenido, letras y fondo interior.

## Antes de instalar

1. Diagnóstico recibido: esquema confirmado; dos cuentas actuales (Jefe y Mesa), un expediente de prueba. No se eliminó ese expediente.
2. Confirmar a cuál mesa pertenecen las cuentas actuales. Las cuentas nuevas necesitan crearse en Authentication y luego asignarse a perfiles. El 08/10/2026 se verificaron las columnas, índices, políticas y los dos perfiles actuales con el resultado aportado por el usuario. La migración V5 se adaptó a que dependencia_solicitante todavía era NOT NULL.
3. Tras adaptar/validar la migración, ejecutar `migracion-v5-01-director.sql` en una ejecución independiente; después `migracion-v5-02-mesas-permisos.sql`.
4. Crear las cuentas necesarias en Authentication > Users y asignar nombre, rol y mesa en perfiles usando los ejemplos. No se creó un panel de administración de usuarios.
5. Asignar la mesa de los expedientes existentes con datos confirmados. No se presupone su origen: mientras mesa_id esté vacía, solo Director/Jefe pueden verlos; las mesas no los ven. La edición desde el formulario requiere esa asignación.
6. Incorporar los archivos a tu proyecto conservando tu `.env.local`. Reiniciar el servidor y volver a iniciar sesión.
7. Nunca volver a ejecutar el viejo `schema.sql` ni las migraciones V1–V4 sobre V5: contienen permisos amplios y el índice global antiguo.

El ZIP contiene el proyecto completo sin node_modules, .next, credenciales ni historial .git. Extraer en una carpeta separada antes de integrar; no reemplazar el repositorio ni borrar archivos locales que no están en el ZIP.

## Validación realizada

- `npx tsc --noEmit`: aprobado.
- `npm run build`: aprobado, con variables públicas ficticias para compilación; sin conexión a Supabase real.
- Migraciones ejecutadas en PostgreSQL embebido PGlite con auth/usuarios simulados: aprobadas las nueve combinaciones de rol/mesa, lecturas y escrituras entre mesas bloqueadas, no elevación de rol desde cliente, historial restringido, mesa inmutable, duplicados por mesa, visibilidad de registros anteriores y plazos/prioridad para Director/Jefe.
- Se comprobó que una política SELECT permisiva adicional no elimina la restricción por mesa.
- Comprobadas las transparencias PNG. No se pudo ejecutar la prueba visual del navegador porque el entorno no tenía Chromium y falló su descarga. La vista real del login queda pendiente de comprobar en tu equipo.

Pendiente: asignar las cuentas a las mesas en la base remota; probar con las cuentas reales después de aplicar la migración. No se ha desplegado la aplicación.

## Cuentas existentes confirmadas

- 9c765c29-af85-4125-89f1-d933147c4ebd: Crio. My. Oscar Rearte, Jefe. Se conserva su rol.
- 2634b6bf-cd63-4b12-a950-30e4c1a03566: Mesa de Entrada. Requiere asignación a una de las tres mesas; no se elige automáticamente.
- Un expediente de prueba creado por Mesa: se conserva sin asignar, visible para Jefe/Director.

La cuenta de Mesa no podrá iniciar sesión en la nueva versión hasta completar su mesa_id.

## V6: perfiles automáticos

Ejecutar `supabase/migracion-v6-perfil-automatico.sql` después de V5. Cada cuenta nueva en Authentication crea su perfil con rol mesa y mesa_id vacío. Las cuentas existentes sin perfil también reciben uno; se conservan los perfiles ya existentes. El administrador asigna nombre, rol (director/jefe/mesa) y mesa_id desde Table Editor > perfiles. Hasta asignar una mesa al rol mesa, el login sigue bloqueado. La función nunca toma rol ni mesa_id desde los metadatos enviados por el usuario.

Probado en PostgreSQL embebido: alta automática, perfiles faltantes, reejecución sin duplicados y conservación de asignaciones previas.
