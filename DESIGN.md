---
name: Sistema de Caja
description: Cinta de caja de Rebagliati Diplomados, cada jornada es una cinta impresa que termina en su Reporte Z
colors:
  campo: "#16316b"
  campo-2: "#1f3f82"
  campo-3: "#0f2553"
  campo-tinta: "#c7d4ee"
  papel: "#f7f7f3"
  papel-2: "#efefe9"
  papel-3: "#e2e2da"
  raya: "#cdcdc4"
  borde-control: "#8f8f88"
  blanco: "#ffffff"
  tinta: "#1c1c22"
  tinta-2: "#4a4a53"
  tinta-3: "#66666f"
  rojo: "#bf2a2a"
  rojo-2: "#9e2020"
  rojo-claro: "#f7e4e1"
  sello: "#1f4fa3"
  sello-2: "#173f86"
  sello-claro: "#e3eaf6"
typography:
  display:
    fontFamily: "Martian Mono Variable, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontFeature: "tnum, zero"
    fontVariation: "wdth 112.5"
  headline:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
    fontVariation: "wdth 92"
  title:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
  body:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    fontFeature: "tnum"
  label:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    letterSpacing: "0.07em"
    fontVariation: "wdth 80"
  cifra:
    fontFamily: "Martian Mono Variable, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "13.5px"
    fontWeight: 400
    letterSpacing: "-0.01em"
    fontFeature: "tnum, zero"
    fontVariation: "wdth 87.5"
  sello:
    fontFamily: "Martian Mono Variable, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "10.5px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.02em"
    fontVariation: "wdth 75"
rounded:
  sello: "2px"
  hoja: "3px"
spacing:
  renglon: "5px"
  control: "12px"
  dentado: "14px"
  hoja: "20px"
  bloque: "24px"
  pagina: "32px"
components:
  button-primario:
    backgroundColor: "{colors.sello}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.hoja}"
    padding: "0 16px"
    height: "40px"
  button-primario-hover:
    backgroundColor: "{colors.sello-2}"
  button-secundario:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.hoja}"
    padding: "0 16px"
    height: "40px"
  button-peligro:
    backgroundColor: "{colors.rojo}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.hoja}"
    padding: "0 16px"
    height: "40px"
  button-emitir:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
    rounded: "{rounded.hoja}"
    padding: "0 16px"
    height: "40px"
  button-fantasma:
    textColor: "{colors.tinta-2}"
    rounded: "{rounded.hoja}"
    padding: "0 16px"
    height: "40px"
  hoja:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.hoja}"
    padding: "{spacing.hoja}"
  cinta:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    padding: "14px 20px"
  control:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.hoja}"
    padding: "0 12px"
    height: "40px"
  sello-peligro:
    backgroundColor: "{colors.rojo}"
    textColor: "{colors.blanco}"
    typography: "{typography.sello}"
    rounded: "{rounded.sello}"
    padding: "3px 6px"
  sello-info:
    backgroundColor: "{colors.sello-claro}"
    textColor: "{colors.sello-2}"
    typography: "{typography.sello}"
    rounded: "{rounded.sello}"
    padding: "3px 6px"
  nav-activo:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.hoja}"
    padding: "8px 12px"
  nav-reposo:
    textColor: "{colors.campo-tinta}"
    rounded: "{rounded.hoja}"
    padding: "8px 12px"
  segmentado-activo:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
    rounded: "{rounded.sello}"
    padding: "6px 12px"
---

# Design System: Sistema de Caja

## Overview

**Creative North Star: "La cinta de caja"**

Cada jornada es una cinta impresa por una registradora con impresora bicolor y termina en su Reporte Z. El azul del logo institucional se extiende como mostrador (el campo) y sobre él se apoyan cintas de papel térmico con borde dentado y hojas de papel más formales. La tinta negra imprime cifras; la tinta roja de cinta marca salidas, negativos y descuadres; el azul de sello marca acciones, selección y estados.

La densidad es de oficina: renglones con puntos guía, rayas discontinuas en lugar de líneas sólidas, cifras monoespaciadas tabulares y totales a doble ancho como en el visor de la registradora. La interfaz se lee de pie en ventanilla y durante jornadas largas; nada es decorativo si no ayuda a leer dinero.

Se rechaza el tablero SaaS de tarjetas blancas iguales con una fila de KPIs sobre fondo gris.

**Key Characteristics:**
- Campo azul único detrás de toda la app, incluidas barra lateral y cabeceras.
- Papel térmico (cintas dentadas) para saldos y reportes; hoja de papel (esquina de 3px) para tablas y formularios.
- Tres tintas con significado fijo: negra, roja, azul de sello.
- Cifras, correlativos, fechas y totales en Martian Mono; texto en Archivo con ancho variable.
- Estados con nombre en sellos rectangulares, nunca solo por color.

## Colors

Paleta de mostrador y papel: un campo azul saturado, neutros de papel ligeramente cálidos y dos tintas de impresora.

### Primary
- **Azul de sello** (sello): botón primario, icono de la pestaña activa, foco (`outline` de 2px), caret, enlaces de acción, serie 1 de gráficos y estado óptimo. **sello-2** es su hover; **sello-claro** es el relleno de sellos informativos y de la banda correcta de la escala de caja chica.

### Secondary
- **Tinta roja de cinta** (rojo): salidas, montos negativos, descuadres, alertas y estados fuera de rango; botón de peligro. **rojo-2** es hover y tono crítico; **rojo-claro** rellena la alerta de peligro y las zonas fuera de rango de la escala.

### Tertiary
- **Mostrador azul del logo** (campo): fondo de `body`, barra lateral y barra superior móvil. **campo-2** es el hover de la navegación sobre el campo; **campo-3** el riel del scroll; **campo-tinta** es el texto secundario sobre el campo (descripciones de cabecera, enlaces en reposo, bloque de jornada).

### Neutral
- **Papel térmico** (papel): superficie de cintas, hojas, modales y la pestaña activa.
- **Papel gastado** (papel-2): fondo del segmentado, filas anuladas, controles de solo lectura, hover fantasma.
- **Papel sombra** (papel-3): divisores entre filas de tabla, rejilla de gráficos, renglones de carga.
- **Raya** (raya): rayas discontinuas de cabeceras de hoja y bordes suaves.
- **Borde de control** (borde-control): contorno de entradas y selectores.
- **Blanco** (blanco): interior de controles editables, hover de filas y botón secundario, placa del logo. Es el único lugar donde aparece blanco puro sobre papel.
- **Tinta negra** (tinta), **tinta-2** (etiquetas, texto de renglón), **tinta-3** (subtítulos, cabeceras de tabla, correlativos, texto inactivo).

### Named Rules
**The Tres Tintas Rule.** Sobre papel solo se imprime en negro, rojo o azul de sello, y cada tinta conserva su significado: negro es dinero normal, rojo es salida o atención, azul es acción o estado correcto. No hay verde ni ámbar.

**The Cero Sin Tinta Rule.** Un monto cero no lleva signo ni tinta roja aunque la línea sea de salida.

**The Un Solo Campo Rule.** El azul del logo es el único fondo de color de la app; las superficies de trabajo son papel encima de él.

## Typography

**Display Font:** Martian Mono Variable (con ui-monospace, Cascadia Mono, Consolas)
**Body Font:** Archivo Variable (con Segoe UI, system-ui)
**Label/Mono Font:** Martian Mono Variable para cifras y sellos; Archivo estrecho para rótulos

**Character:** Archivo aporta una grotesca de oficina con eje de ancho que se estrecha para rótulos impresos; Martian Mono es la impresora: tabular, cero con barra y a doble ancho en los totales.

### Hierarchy
- **Display** (600, 30px en saldos principales; 26px, 22px y 18px en totales secundarios; ancho 112.5%, interlineado 1.05): saldo de caja y totales de arqueo con `MontoDoble`; el símbolo S/ va a la mitad del tamaño.
- **Headline** (600, 28px, ancho 92%, blanco sobre el campo): título de página en `Encabezado`, con descripción de 14.5px en campo-tinta y máximo 70ch.
- **Title** (600, 17px a 19px): título de modal y fecha larga de la jornada; 22px en el inicio de sesión.
- **Body** (400, 15px en el cuerpo, 14px en renglones, tablas y controles): texto corriente y etiquetas de renglón.
- **Label** (650, 13px, mayúsculas, ancho 80%, 0.07em): títulos de cinta y hoja, grupos internos; 11.5px en cabeceras de tabla.
- **Cifra** (400, 13px a 13.5px, ancho 87.5%): todo monto, fecha, hora, correlativo y conteo dentro de renglones y tablas.
- **Sello** (600, 10.5px, mayúsculas, ancho 75%): estados rectangulares.

### Named Rules
**The Cifra Monoespaciada Rule.** Todo número que se compara (monto, fecha, hora, N.º, cantidad) va en Martian Mono tabular; nunca en Archivo.

**The Doble Ancho Rule.** Solo el total o saldo que responde la pregunta de la cinta va a doble ancho; los renglones usan la cifra normal.

## Layout

Barra lateral fija de 240px sobre el campo en escritorio (`lg`, 1024px) con logo en placa blanca, botón Registrar con tecla Alt+N, navegación, bloque de jornada con borde discontinuo y usuario al pie. Debajo de `lg` se sustituye por una barra superior pegajosa con logo, botón de registrar y menú que abre la navegación a pantalla completa sobre el campo.

El contenido se centra con máximo de 1440px y relleno de 32px horizontal y 28px vertical en escritorio (24px en `sm`, 16px y 20px en móvil). La separación entre bloques es de 24px. En el Dashboard, las cintas se alinean en tres columnas iguales y colapsan a una columna en móvil; las hojas ocupan el ancho y las tablas se desplazan horizontalmente dentro de su hoja.

El ritmo interno es de 20px en hojas y cintas, 14px de cabecera y 5px de relleno vertical por renglón. Los renglones con puntos guía (`LineaCinta`) son la unidad básica de lectura.

## Elevation & Depth

Dos niveles sobre el campo, ambos papel. La profundidad dice «papel apoyado en el mostrador»: un labio inferior de 1px más una sombra difusa corta. No hay sombras dentro del papel; dentro, la jerarquía es de rayas y tinta. Al imprimir se eliminan todas las sombras.

### Shadow Vocabulary
- **Hoja** (`box-shadow: 0 1px 0 rgb(8 20 50 / 0.35), 0 10px 24px -12px rgb(4 12 34 / 0.55)`): hojas, navegador de día.
- **Cinta** (`filter: drop-shadow(0 1px 0 rgb(8 20 50 / 0.3)) drop-shadow(0 12px 12px rgb(4 12 34 / 0.32))`): cintas dentadas; se usa `filter` porque la máscara recortaría un `box-shadow`.
- **Labio** (`box-shadow: 0 1px 0 rgb(8 20 50 / 0.35)`): botones sólidos, pestaña activa, placa del logo, segmento activo.
- **Control** (`box-shadow: inset 0 1px 0 rgb(28 28 34 / 0.05)`): entradas.
- **Modal** (`box-shadow: 0 24px 60px -20px rgb(0 0 0 / 0.6)`) con telón `rgb(9 22 52 / 0.72)`.

### Named Rules
**The Papel Sobre Mostrador Rule.** Solo el papel proyecta sombra sobre el campo; nada proyecta sombra sobre el papel salvo el labio de 1px de un botón.

## Shapes

Esquinas casi rectas: 3px en hojas, botones, controles y pestañas; 2px en sellos, teclas y segmentos internos. Las cintas no tienen radio: su borde inferior (o ambos) es un dentado de papel cortado con dientes de 14px hecho con máscara cónica. Los divisores son discontinuos (cabeceras, pies de tabla, rayas de cinta, doble raya antes del total) o punteados (puntos guía); los divisores sólidos solo separan filas de tabla en papel-3. Los sellos llevan borde de 1.5px; la alerta de atención usa borde discontinuo.

## Components

### Buttons
Mecánicos y firmes, como teclas de registradora.
- **Shape:** esquina de 3px; alturas de 32px (sm, 13px), 40px (md, 14px) y 48px (lg, 15px); peso 600.
- **Primario:** azul de sello con texto blanco y labio.
- **Peligro:** tinta roja; **Emitir** (`exito`): tinta negra con texto papel, reservado a acciones que dejan constancia como el cierre Z.
- **Secundario:** papel con borde de control al 70%; hover a blanco y borde tinta-3. **Fantasma:** sin fondo, tinta-2, hover papel-2.
- **Hover / Focus:** transición de color de 150ms; al pulsar baja 1px; foco con contorno de sello de 2px separado 2px; deshabilitado al 45% de opacidad.
- **BotonIcono:** 36px, nombre accesible obligatorio, tono papel o campo.

### Chips
- **Sello (`Insignia`):** rectángulo de 2px con borde de 1.5px y mayúsculas mono estrechas. Tonos: neutro (borde tinta-3), éxito (borde y texto sello), info (relleno sello-claro), salida (borde y texto rojo), alerta (borde rojo discontinuo), peligro (relleno rojo, texto blanco). Siempre con texto; el icono es opcional.
- **Segmentado:** carril papel-2 con borde raya; segmento activo en tinta negra con texto papel.
- **Tecla:** atajo en mono de 10.5px con borde del color actual al 35%.

### Cards / Containers
- **Cinta:** papel sin radio, borde dentado abajo o en ambos extremos, sombra de cinta, título en rótulo centrado con raya discontinua debajo. Para saldos, Reporte X y totales teóricos.
- **Hoja (`Tarjeta`):** papel con esquina de 3px, sombra de hoja, cabecera con rótulo y raya discontinua, relleno de 20px. Para tablas, arqueos, resúmenes y formularios.
- **Shadow Strategy:** ver Elevation & Depth.

### Inputs / Fields
- **Style:** 40px de alto, fondo blanco, borde borde-control, esquina 3px, sombra interior mínima; etiqueta de 13px semibold en tinta-2 y asterisco rojo si es requerido.
- **Focus:** borde sello y anillo de sello al 25%; hover a borde tinta-2.
- **Error / Disabled:** borde rojo y anillo rojo al 20% con mensaje rojo de 12.5px; deshabilitado y solo lectura en papel-2.
- **Montos:** entrada mono alineada a la derecha, 17px semibold, en rojo cuando es salida.

### Navigation
Sobre el campo: enlaces de 14.5px en campo-tinta con icono al 80%, hover campo-2 y texto blanco. La página activa es una pestaña de papel con texto tinta, icono en sello y labio. En móvil, la misma lista a pantalla completa sobre el campo.

### Renglón de cinta (`LineaCinta`)
Etiqueta en tinta-2, puntos guía punteados hasta la cifra alineada a la derecha, signo explícito y tinta roja solo si el monto no es cero. Variante fuerte en semibold y tinta.

### Escala de caja chica (`MedidorCajaChica`)
Riel vertical de 14px: rojo-claro bajo el mínimo, banda de alerta rayada en rojo, sello-claro en el rango correcto y rojo-claro sobre el máximo; marcas mono a la derecha y aguja negra (roja fuera de rango). Es el mismo instrumento en toda la app y siempre va con su sello de estado.

### Tablas
Cabeceras en rótulo de 11.5px tinta-3 con raya discontinua; celdas de 14px, numéricas en cifra de 13px a la derecha; filas separadas por papel-3 con hover blanco; pie con raya discontinua de 1.5px; correlativo `N.º 000000` en tinta-3.

### Estados
`Cargando` es una cinta que se imprime de arriba abajo (`imprimir`, 900ms) con renglones grises; `Vacio` es un rótulo centrado con descripción. `Alerta` usa borde de 1.5px e icono con la tinta del tono.

### Gráficos
Recharts con la paleta fija `COLORES`: serie 1 sello, serie 2 rojo, serie 3 tinta, rejilla papel-3, ejes y ticks en Martian Mono de 10.5px, umbrales como líneas rojas (alerta discontinua) y siempre una vista de tabla gemela.

## Do's and Don'ts

### Do:
- **Do** apoyar toda superficie de trabajo en papel (papel) sobre el campo (campo).
- **Do** usar cinta dentada para lo que responde «cuánto hay» y hoja de 3px para listar o editar.
- **Do** imprimir montos en Martian Mono tabular y reservar el doble ancho para el saldo o total de cada cinta.
- **Do** separar con rayas discontinuas y puntos guía en lugar de bordes sólidos.
- **Do** acompañar cada estado con un sello de texto; el color refuerza, no informa solo.
- **Do** reservar el botón de tinta negra para acciones que dejan constancia (cierre Z).

### Don't:
- **Don't** introducir verde, ámbar u otra tinta: lo correcto es azul de sello y lo que pide atención es rojo.
- **Don't** construir el tablero SaaS de tarjetas blancas iguales con fila de KPIs.
- **Don't** usar radios mayores de 3px ni píldoras.
- **Don't** poner sombras dentro del papel ni `box-shadow` en elementos con borde dentado.
- **Don't** pintar un monto cero en rojo ni con signo.
- **Don't** usar las escalas heredadas `slate`, `red`, `emerald` o `marca` en código nuevo; usar los nombres del mundo.
