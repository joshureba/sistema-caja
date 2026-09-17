# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Cajero de recepción**: registra cada cobro (diplomados, cursos, congresos) y cada salida de caja chica durante su turno (mañana o noche), en la PC de recepción con teclado y mouse, mientras atiende a alumnos en ventanilla. Al cierre cuenta billetes y monedas y compara contra el teórico.
- **Supervisor**: revisa saldos, diferencias de arqueo, sustentos pendientes y el dashboard del período; administra parámetros, catálogos, usuarios y auditoría. También trabaja en PC.

## Product Purpose

Reemplaza dos libros Excel con macros (.xlsm) del área de Rebagliati Diplomados. Lleva la caja de fondo (diaria) y la caja chica como cajas independientes, con saldos exactos al céntimo, arqueo por denominaciones y cierre de jornada. El éxito es que el cajero registre rápido y sin errores, que la caja cuadre al cierre y que el supervisor vea en segundos si algo requiere atención.

## Positioning

Es una herramienta interna hecha a la medida de las reglas reales del área (arrastre del fondo, envíos a gerencia, retiros solo desde la caja de fondo desde el 16/09, tolerancia de arqueo), validada contra el Excel original. No es un software contable genérico.

## Operating Context

- Cobros por Niubiz, Yape, Plin, transferencia y efectivo; pagos mixtos (efectivo + digital).
- Comprobantes BV/RE con serie y número; estados de sustento (con comprobante, sin comprobante, pendiente).
- Jornada diaria con apertura automática y cierre con arqueo; el supervisor puede reabrir.
- Envíos del fondo a GERENCIA (los retiros solo salen del fondo); egresos y reposiciones de caja chica.
- Exportación a Excel e impresión del día.

## Capabilities and Constraints

- Stack existente: React 19 + Vite + TypeScript + Tailwind 4 + Recharts + Supabase (RLS como autorización real).
- Todo en español; moneda S/ (PEN); fechas ISO interpretadas en hora local.
- La aritmética de dinero vive en `src/dominio` (céntimos); los componentes no calculan saldos.
- Gráficos con Recharts, paleta fija `COLORES`, leyenda con dos o más series y siempre una tabla gemela.
- Roles: cajero (registra y edita en jornadas abiertas) y supervisor (todo).

## Brand Commitments

- Nombre visible: "Sistema de Caja", del área de Rebagliati Diplomados.
- Logo institucional `public/logo-rebagliati.png` (azules sobre blanco); debe mostrarse en la barra lateral y en el inicio de sesión.

## Evidence on Hand

- Datos reales importados del Excel (fixtures en `src/dominio/fixtures/`), 125 operaciones hasta el 13/09/2026.
- No hay fotografías, testimonios ni material de marketing; no inventarlos.

## Product Principles

1. El dinero se lee primero: saldos, diferencias y estados de caja siempre visibles y sin ambigüedad.
2. Registrar un movimiento debe ser más rápido que en el Excel.
3. Las reglas de negocio se explican en la interfaz donde afectan una decisión, no en párrafos sueltos.
4. Lo que requiere atención (caja fuera de rango, arqueo que no cuadra, sustentos pendientes) se distingue de lo normal.

## Accessibility & Inclusion

Contraste AA, navegación completa por teclado (el cajero trabaja con teclado) y cifras tabulares legibles en jornadas largas.
