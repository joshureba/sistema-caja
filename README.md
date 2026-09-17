# Sistema de Caja: caja diaria y caja chica

Aplicación web que reemplaza los libros Excel con macros del área. Lleva la **caja de fondo (diaria)**, que arrastra el saldo anterior, suma cobros en efectivo y descuenta envíos a gerencia, y la **caja chica**, que cubre gastos. La apertura del fondo se calcula en la base de datos y no admite un monto manual. La caja chica registra egresos y reposiciones desde el banco; desde el 16/09/2026 los retiros de efectivo solo salen de la caja de fondo. Incluye arqueo, cierre, dashboard, histórico, exportación, roles y auditoría.

Base vigente: `CAJA AUTOMATIZADA 2026 (TEMPORAL SOLO POR HOY 14-09).xlsm`, con 125 movimientos hasta el 13/09. El cierre contado de S/ 6,032.90 pasa a caja chica al 14/09; se registra la última salida de S/ 500 para abrir el fondo. Resultado de apertura: **caja chica S/ 5,532.90 y fondo S/ 500**, antes de nuevas operaciones. Los cobros digitales se muestran en ingresos, pero no forman parte del efectivo físico.

- Frontend: React 19 + Vite + TypeScript + Tailwind CSS + Recharts.
- Backend: Supabase (Postgres, Auth, RLS). Migraciones en `supabase/migrations`.
- Lógica de negocio: `src/dominio` (sin dependencias de UI ni de red, probada con Vitest contra los valores del Excel original).

El plan funcional y las reglas de negocio están en [docs/PLAN.md](docs/PLAN.md).

## Requisitos

- Node.js 20 o superior.
- Docker Desktop (solo para el entorno local de Supabase).
- Python 3 con `openpyxl` (solo para volver a importar el Excel).

## Entorno local

```bash
npm install
npm run db:start            # levanta Postgres + Auth + API en Docker
npm run db:reset            # aplica migraciones y carga supabase/seed.sql (datos del Excel)
npm run db:usuarios-locales # crea supervisor@caja.local y cajero@caja.local (clave: caja12345)
cp .env.example .env        # la URL y la clave anon locales ya vienen en .env.example
npm run dev
```

`npm run db:status` muestra las claves locales; `npm run db:stop` apaga los contenedores.

## Pruebas y verificación

```bash
npm test          # 42 pruebas, incluidos ambos libros, el dashboard y los envíos a gerencia
npm run typecheck # TypeScript
npm run build     # build de producción en dist/
```

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/dominio` | Tipos, dinero, fechas, períodos, saldos, arqueo y resúmenes. Toda la aritmética de la caja. |
| `src/datos` | Consultas y mutaciones contra Supabase (TanStack Query). |
| `src/auth` | Sesión y perfil del usuario. |
| `src/componentes` | Componentes de interfaz, formulario de movimiento, contador de denominaciones, gráficos. |
| `src/paginas` | Dashboard, Movimientos, Caja diaria (jornada), Caja chica, Histórico, Configuración, Usuarios. |
| `supabase/migrations` | Esquema, triggers de auditoría, vista de resumen diario y políticas RLS. |
| `supabase/seed.sql` | Parámetros, catálogos, jornadas y los 125 movimientos importados del Excel vigente. |
| `scripts/importar_excel.py` | Genera `seed.sql` y el fixture de pruebas a partir del libro Excel. |

## Puesta en producción (Supabase + hosting estático)

1. Crear un proyecto en [supabase.com](https://supabase.com) y anotar la URL y la clave `anon` (Project Settings → API).
2. Aplicar el esquema: `npx supabase link --project-ref <ref>` y luego `npx supabase db push`. Alternativa sin CLI: pegar `supabase/migrations/20260911000000_esquema_inicial.sql` en el SQL Editor.
3. Cargar los datos iniciales pegando `supabase/seed.sql` en el SQL Editor (es idempotente).
4. En Authentication → Providers → Email, desactivar "Allow new users to sign up" para que nadie se registre solo. Las cuentas se crean desde Authentication → Users → Add user; en *User Metadata* se puede indicar `{"nombre": "Nombre Apellido", "rol": "supervisor"}` (si no, entra como cajero).
5. Crear `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del proyecto, ejecutar `npm run build` y publicar `dist/` en Vercel, Netlify o Cloudflare Pages (o configurar esas dos variables en el panel del hosting). En Vercel/Netlify hay que agregar una regla de reescritura de todas las rutas a `index.html` (es una SPA).

## Volver a importar el Excel

```bash
python scripts/importar_excel.py "ruta\al\libro.xlsm"
```

El script valida el cierre autorizado del 13/09 por S/ 6,032.90, detecta los encabezados y lee las denominaciones en AA o V. Limpia espacios, corrige los tres años 2025 conocidos y separa retiros de gastos con observaciones. Mantiene los importes cero del archivo; no inventa montos. Genera archivos locales, no sincroniza automáticamente una base existente.

La migración `20260914000000_actualizar_excel_y_separar_cajas.sql` guarda un respaldo privado en `respaldo_caja.antes_20260914`, verifica la importación anterior, carga el nuevo libro y registra la base final una vez. Se detiene ante importaciones modificadas o registros manuales del 11 al 13 que requieran conciliación. Para otro Excel se debe preparar una nueva migración y conciliar el corte; no ejecutar `db:reset` contra una caja en uso.

## Respaldo

Supabase hace copias automáticas en los planes de pago; en el plan gratuito conviene programar `npx supabase db dump --linked -f respaldo.sql` o exportar los movimientos a Excel desde la aplicación cada cierre de mes.
