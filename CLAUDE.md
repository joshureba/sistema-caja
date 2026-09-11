# Guía para trabajar en este repositorio

- Todo en español: código (nombres de funciones, variables, comentarios), interfaz y documentación. Moneda S/ (PEN), fechas ISO `YYYY-MM-DD` interpretadas en hora local.
- La aritmética de dinero vive en `src/dominio` y se hace en céntimos (`sumar`, `restar`, `multiplicar`, `redondear`). Nunca sumar montos con `+` fuera del dominio ni calcular saldos dentro de componentes.
- `src/dominio/excel.test.ts` es la regresión contra el Excel original del área: si cambia una regla de negocio, actualizar la prueba con la justificación.
- Tipos de movimiento: `INGRESO` (caja diaria, digital o efectivo), `EGRESO` (caja chica), `REPOSICION_CAJA_CHICA` (origen BANCO o CAJA_DIARIA) y `RETIRO` (sale de la caja indicada en `caja_retiro`; no es gasto).
- Base de datos: cambios de esquema solo con una nueva migración en `supabase/migrations` (nunca editar una ya aplicada en producción) y regenerar tipos con `npx supabase gen types typescript --local > src/lib/database.types.ts`.
- Comandos: `npm run dev`, `npm test`, `npm run typecheck`, `npm run db:start`, `npm run db:reset`, `npm run db:usuarios-locales`.
- Las políticas RLS son la autorización real; la interfaz solo oculta acciones. Cajero: registra y edita en jornadas abiertas. Supervisor: todo, incluido parámetros, catálogos, perfiles y auditoría.
- Gráficos con Recharts siguiendo la guía de visualización: paleta fija (`COLORES` en `src/componentes/graficos.tsx`), marcas finas, leyenda cuando hay dos o más series y siempre una vista de tabla gemela.
