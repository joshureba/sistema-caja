---
version: 1
slug: "src-componentes-layout-tsx"
primary_target: "src/componentes/Layout.tsx"
related_targets: ["src/paginas/Dashboard.tsx","src/paginas/Jornada.tsx","src/paginas/CajaChica.tsx","src/paginas/Movimientos.tsx","src/paginas/Login.tsx"]
---

Alcance: toda la app autenticada (shell, Dashboard, Movimientos, Caja de fondo, Caja chica, Histórico, Configuración, Usuarios) y el inicio de sesión. Modo: Operate.

Audiencia y tarea: cajero de recepción en PC con teclado (registrar cobros y salidas, arquear, cerrar el día) y supervisor (revisar saldos, descuadres y pendientes). Restricciones: reglas de dinero en `src/dominio`, sin cambiar lógica ni datos; logo institucional visible.

## Direction contract

THESIS: Cada jornada es una cinta de caja impresa que termina en su Reporte Z. Se rechaza el tablero SaaS de tarjetas blancas iguales con fila de KPIs.

OWN-WORLD: Campo azul del logo como mostrador; cintas de papel térmico con borde dentado; tinta negra para cifras, tinta roja de cinta para salidas, negativos y descuadres; azul de sello para acciones, selección y estados. Cifras, correlativos y totales en monoespaciada, totales a doble ancho; rayas discontinuas, puntos guía, sellos rectangulares. Raises: Reporte X antes del Z (cuarto oscuro), rejilla de caracteres (ASCII), un solo campo de color (campo verde), correlativo N.º visible (catálogo), estados con nombre (capa), escala vertical de rango de caja chica (inmersión).

STORY: El cajero ve cuánto hay en cada caja y si cuadra, registra desde cualquier pantalla con Alt+N y cierra pasando del Reporte X al Z. El supervisor detecta en rojo lo que pide atención.

FIRST VIEWPORT: Dashboard a 1440: barra lateral sobre el campo azul con pestaña de papel activa y botón Registrar; cabecera con período; dos cintas verticales (caja de fondo; caja chica con escala vertical de rango) con saldo a doble ancho, y a su derecha la cinta Reporte X de hoy; debajo, la hoja del período.

FORM: Cinta de caja (registradora con impresora bicolor), posición 4 de 7 en la lista propia, seed key 42bd81fc.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Decisiones abiertas: ninguna de producto; atajos de teclado adicionales quedan para una ronda posterior.
