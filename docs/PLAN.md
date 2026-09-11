# Plan: Sistema de Caja (caja diaria + caja chica)

Fecha del plan: 11 de septiembre de 2026.

## 1. Origen

El área lleva su caja en dos libros Excel con macros VBA:

| Archivo | Modelo | Estado |
|---|---|---|
| `CAJA AUTOMATIZADA 2026 (TEMPORAL SOLO POR HOY 10-09).xlsm` | Una sola caja: saldo inicial + ingresos efectivo − egresos, un arqueo. | Versión temporal. |
| `CAJA20ACTUALIZADA2010-09.xlsm` | Doble caja: caja diaria (base S/ 500 + cobros del día) y caja chica (egresos + reposiciones), un arqueo por caja. | Versión vigente. Es la base del nuevo sistema. |

Ambos contienen los mismos 83 movimientos (01 al 10 de septiembre de 2026) y la misma macro: fecha y turno automáticos, "Nueva jornada", "Cerrar caja" con validación CUADRA/REVISAR.

## 2. Decisiones tomadas (11/09/2026)

| Tema | Decisión |
|---|---|
| Modelo de caja | Doble caja (caja diaria + caja chica). |
| Rango caja chica | Mínimo S/ 3,000, máximo S/ 5,000. Semáforo: rojo < 3,000, ámbar 3,000 a 3,500, verde 3,500 a 5,000, rojo > 5,000. Todo configurable. |
| Despliegue | Nube: Supabase (Postgres + Auth + RLS) y frontend estático (Vercel/Netlify). Acceso desde cualquier lugar. |
| Usuarios | Login con correo y contraseña. Roles: `cajero` y `supervisor`. |
| Idioma | Interfaz 100 % en español, moneda S/ (PEN). |

## 3. Reglas de negocio

### Cajas (regla vigente desde el 11/09/2026)
- Hasta el 10/09 todo el efectivo del área era un solo montón; el conteo del Excel de ese día, S/ 4,767.90, es el punto de partida.
- **Caja chica** ("el bolsillo grande"): arranca el 11/09 con S/ 4,767.90, entrega S/ 500 una sola vez para formar la caja de recepción (registrado como RETIRO de caja chica) y desde entonces solo baja con EGRESOS y sube con REPOSICIONES. Las ventas nunca entran a la caja chica. Debe mantenerse entre el mínimo y el máximo y tiene su propio arqueo.
- **Caja diaria (recepción)**: empieza con esos S/ 500 y solo crece con el efectivo de los cobros; su saldo se arrastra de un día al siguiente y nunca vuelve a la caja chica. Cada jornada abre con el efectivo con que cerró la anterior; al cierre se cuenta con el contador de denominaciones y se compara con el teórico. Un RETIRO de caja diaria (por ejemplo, al banco) es la única forma de que baje.
- **Fecha de corte**: 11/09/2026. Antes de esa fecha el sistema muestra el histórico tal cual se registró, sin saldos de caja.

### Tipos de movimiento
| Tipo | Efecto | Campos de monto |
|---|---|---|
| INGRESO | Cobro de cliente. Suma a caja diaria solo la parte en efectivo. | `monto_digital`, `monto_efectivo` |
| EGRESO | Gasto. Resta de caja chica. | `monto` |
| REPOSICION_CAJA_CHICA | Suma a caja chica. Si el origen es la caja diaria, también resta de ella. | `monto`, `origen` (BANCO / CAJA_DIARIA) |
| RETIRO | Retiro de efectivo hacia banco u otro destino. Resta de la caja indicada (diaria o chica). No cuenta como egreso. | `monto`, `caja_retiro` (DIARIA / CHICA), `destino` |

Nota: el Excel tenía dos "retiros de excedente" registrados como egresos: 04/09 por S/ 2,349.30 (antes del corte, sale de la caja diaria) y 08/09 por S/ 962.60 (el Excel lo descontaba de la caja chica, y así se importa). Por eso el saldo de caja chica al 10/09 sigue siendo S/ 3,595.30, igual que en el Excel.

### Turnos
MAÑANA hasta la hora configurada (17:00), NOCHE después. Se asignan automáticamente y se pueden corregir.

### Arqueo
Denominaciones: 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10. Diferencia = contado − teórico. Estado CUADRA si |diferencia| ≤ tolerancia (S/ 0.01), si no REVISAR. Un cierre con REVISAR requiere observación y lo aprueba un supervisor.

### Catálogos (editables por el supervisor)
- Estado de sustento: CON COMPROBANTE, SIN COMPROBANTE, PENDIENTE.
- Comprobante: BV, FACT, RE, SIN RE, SIN RI.
- Área: DIPLOMADOS, CURSOS Y CONGRESOS, ADMINISTRACIÓN, OTROS.
- Medio de pago: EFECTIVO, NIUBIZ, YAPE, PLIN, TRANSFERENCIA, OTRO.
- Cuenta: CONSORCIO, HUGO, LUIS RIVERO, MARIAFE.

## 4. Arquitectura

- **Frontend**: React 19 + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query, react-hook-form + zod, Recharts, date-fns, lucide-react, SheetJS para exportar a Excel, impresión a PDF con CSS de impresión.
- **Dominio**: módulo puro `src/dominio` con toda la aritmética de saldos, arqueos, estados y períodos. Probado con Vitest. Ningún cálculo de dinero vive dentro de componentes.
- **Backend**: Supabase. Tablas con RLS, trigger de auditoría, vista de resumen diario. Migraciones SQL versionadas en `supabase/migrations`.
- **Hosting**: build estático en Vercel o Netlify. Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

### Tablas
| Tabla | Contenido |
|---|---|
| `perfiles` | Un registro por usuario de Auth: nombre, DNI, rol, activo. |
| `parametros` | Fila única: mínimo, máximo, umbral ámbar, base caja diaria, saldo inicial caja chica, fecha de corte, tolerancia, hora inicio noche. |
| `catalogos` | Listas cerradas: tipo, valor, orden, activo. |
| `jornadas` | Una por fecha: responsables de apertura y cierre, horas, base, estado ABIERTA/CERRADA, observación. |
| `movimientos` | El registro continuo. Campos del Excel más tipo, origen/destino, anulado, creado/modificado por. |
| `arqueos` | Conteo por denominación (jsonb), total contado, teórico, diferencia, estado, caja DIARIA/CHICA, jornada. |
| `auditoria` | Antes/después de cada cambio en movimientos, jornadas, arqueos y parámetros. |

## 5. Módulos y orden de entrega

1. Proyecto base, dominio con pruebas, migraciones SQL, login.
2. Registro de movimientos (formulario con validaciones, tabla con filtros, edición con auditoría) e importación de los 83 movimientos del Excel ya limpios.
3. Jornada: apertura, cierre con arqueo de caja diaria, nueva jornada.
4. Caja chica: saldo en tiempo real, semáforo, reposiciones, arqueo propio, alertas.
5. Dashboard: selector diario / semanal / quincenal / mensual / semestral / anual, KPIs, ventas por turno y canal, sustentos pendientes, curva de saldo de caja chica contra el rango.
6. Histórico y reportes: tablas por período, exportación Excel, cierre imprimible.
7. Configuración (parámetros y catálogos) y usuarios (roles).

## 6. Problemas del Excel que el sistema corrige

- Fechas con año equivocado y valores con espacios finales que rompían los SUMIFS: el sistema usa listas cerradas y fechas reales.
- Fórmulas sobreescritas a mano: los totales se calculan, nunca se escriben.
- El retiro de excedente registrado como egreso: pasa a ser tipo RETIRO y no infla los gastos.
- Hojas ocultas con FILTER que fallaban en Excel antiguos: consultas por fecha nativas.
- Tope de 2,000 filas, un usuario a la vez y sin rastro de cambios: base de datos, multiusuario y auditoría.

## 7. Estado al 11 de septiembre de 2026

Construido y verificado en el entorno local (Supabase en Docker con los 83 movimientos reales):

- Dominio con 33 pruebas que reproducen los valores del Excel (ingresos 5,040.80; saldo caja chica 3,595.30 al 10/09; histórico diario).
- Esquema, triggers de auditoría, vista diaria, función de saldo y 19 políticas RLS. Probado por API: el cajero no puede registrar en jornadas cerradas, ni editar parámetros, ni leer la auditoría; sin sesión no se lee nada.
- Login, dashboard (períodos, indicadores, semáforo, dos gráficos con vista de tabla, turnos, áreas), movimientos (filtros, formulario por tipo, edición, anulación con motivo, Excel), caja diaria (apertura, contador de denominaciones, arqueo, cierre, reapertura por supervisor, impresión), caja chica (saldo, alertas, acciones rápidas, arqueo propio, evolución), histórico por seis períodos con Excel, configuración (parámetros, catálogos, auditoría) y usuarios (roles y estado).

Pendiente para salir a producción: crear el proyecto en Supabase, aplicar migración y seed, crear las cuentas reales, publicar el frontend (ver README) y hacer una semana de uso en paralelo con el Excel para validar los cierres.

## 8. Pendientes de confirmar con el área
- Si el ámbar de 3,000 a 3,500 sigue siendo útil o basta con mínimo y máximo.
- Quién será supervisor inicial y qué correos tendrán acceso.
- Si las reposiciones de caja chica salen del banco, de la caja diaria o de ambos.
