# Cambios 09/10/2026

- Favicon: escudo de Seguridad Vial, usando el PNG transparente existente.
- Tipo: SICE, SEPS y OTRO. OTRO habilita un texto obligatorio que se almacena en la columna tipo; los registros anteriores se abren como OTRO con su texto original. No cambia el esquema.
- Dashboard: N° correlativo junto a cada expediente en las filas de seguimiento y alertas. Se quitó la tarjeta de total. La numeración sigue el orden del listado filtrado.
- Desplazamiento: barras contenidas dentro de los bordes redondeados en detalle, alta/edición, movimiento y ambos formularios de dependencias; altura limitada al espacio de pantalla disponible.
- Ficha de detalle reorganizada: cabecera, estado/prioridad, registro y recorrido, fechas/seguimiento, plazo y observaciones.
- Director/Jefe: botones Determinar plazos y Prioridad en el detalle, con guardado independiente. Los cambios refrescan el dashboard, expedientes y alertas.
- Mesa conserva las acciones operativas de edición y ubicación. Se mantienen los permisos de Supabase ya aplicados.
- Plazos: entre 1 y 3650 días; campo vacío elimina el plazo. Se cuentan desde fecha de ingreso, manteniendo la lógica anterior.

Archivos modificados: app/globals.css, components/MovimientoExpedienteModal.tsx, app/layout.tsx, app/page.tsx, app/alertas/page.tsx, app/expedientes/page.tsx, components/ExpedienteForm.tsx y components/ExpedienteDetalleModal.tsx.

Validación: TypeScript y build aprobados. Navegador con datos simulados: favicon, botones de autoridad, guardado separado de plazo/prioridad, rechazo de plazo inválido, eliminación de plazo, opciones y campo condicional de OTRO, guardado del tipo personalizado. Ficha revisada en escritorio; formulario revisado en móvil. Sin conexión ni cambios a la base remota.

Instalación: incorporar los archivos a tu repositorio conservando .env.local; reiniciar el servidor, comprobar los cambios y hacer commit/push. Esta modificación no requiere SQL nuevo. No volver a ejecutar migraciones anteriores ya aplicadas.

Corrección de numeración y barras: build aprobado con variables de prueba. Pruebas de navegador con datos simulados en escritorio y móvil verifican numeración por fila, ausencia de tarjeta de total, contención de las barras en los cinco paneles y guardado de plazo, prioridad y tipo personalizado.
