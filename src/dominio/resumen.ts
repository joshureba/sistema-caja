import type { EstadoCajaChica, Movimiento, Parametros, TipoPeriodo, Turno } from './tipos';
import { TURNOS } from './tipos';
import { redondear, restar, sumar } from './dinero';
import { sumarDias, type FechaISO } from './fechas';
import { filtrarRango, montoTotal } from './movimientos';
import { etiquetaRango, rangosRecientes, type RangoFechas } from './periodos';
import { estadoCajaChica, saldoCajaChica } from './saldos';

export interface ResumenTurno {
  turno: Turno;
  ingresos: number;
  digital: number;
  efectivo: number;
  n_ingresos: number;
  ticket_promedio: number;
  /** Fracción 0..1 de los ingresos del período. */
  participacion: number;
}

export interface ImporteAgrupado {
  clave: string;
  importe: number;
  n: number;
}

export interface ResumenPeriodo {
  desde: FechaISO;
  hasta: FechaISO;
  ingresos: number;
  ingresos_digital: number;
  ingresos_efectivo: number;
  egresos: number;
  reposiciones: number;
  retiros: number;
  /** ingresos − egresos (los retiros y reposiciones son traslados, no resultado). */
  resultado_neto: number;
  n_movimientos: number;
  n_ingresos: number;
  n_egresos: number;
  ticket_promedio: number;
  sin_comprobante: number;
  pendientes: number;
  por_turno: ResumenTurno[];
  por_medio_pago: ImporteAgrupado[];
  por_area_ingresos: ImporteAgrupado[];
  por_area_egresos: ImporteAgrupado[];
}

function acumular(mapa: Map<string, ImporteAgrupado>, clave: string, importe: number): void {
  const actual = mapa.get(clave) ?? { clave, importe: 0, n: 0 };
  actual.importe = sumar(actual.importe, importe);
  actual.n += 1;
  mapa.set(clave, actual);
}

function ordenarPorImporte(mapa: Map<string, ImporteAgrupado>): ImporteAgrupado[] {
  return [...mapa.values()].sort((a, b) => b.importe - a.importe);
}

export function resumenPeriodo(movimientos: Movimiento[], desde: FechaISO, hasta: FechaISO): ResumenPeriodo {
  const lista = filtrarRango(movimientos, desde, hasta);
  let ingresos_digital = 0;
  let ingresos_efectivo = 0;
  let egresos = 0;
  let reposiciones = 0;
  let retiros = 0;
  let n_ingresos = 0;
  let n_egresos = 0;
  let sin_comprobante = 0;
  let pendientes = 0;
  const turnos = new Map<Turno, { ingresos: number; digital: number; efectivo: number; n_ingresos: number }>();
  for (const t of TURNOS) turnos.set(t, { ingresos: 0, digital: 0, efectivo: 0, n_ingresos: 0 });
  const medios = new Map<string, ImporteAgrupado>();
  const areasIngresos = new Map<string, ImporteAgrupado>();
  const areasEgresos = new Map<string, ImporteAgrupado>();

  for (const m of lista) {
    if (m.estado_sustento === 'SIN COMPROBANTE') sin_comprobante += 1;
    if (m.estado_sustento === 'PENDIENTE') pendientes += 1;
    switch (m.tipo) {
      case 'INGRESO': {
        const total = montoTotal(m);
        ingresos_digital = sumar(ingresos_digital, m.monto_digital);
        ingresos_efectivo = sumar(ingresos_efectivo, m.monto_efectivo);
        n_ingresos += 1;
        const t = turnos.get(m.turno) ?? turnos.get('MAÑANA')!;
        t.ingresos = sumar(t.ingresos, total);
        t.digital = sumar(t.digital, m.monto_digital);
        t.efectivo = sumar(t.efectivo, m.monto_efectivo);
        t.n_ingresos += 1;
        acumular(medios, m.medio_pago ?? 'SIN MEDIO', total);
        acumular(areasIngresos, m.area ?? 'SIN ÁREA', total);
        break;
      }
      case 'EGRESO':
        egresos = sumar(egresos, m.monto);
        n_egresos += 1;
        acumular(areasEgresos, m.area ?? 'SIN ÁREA', m.monto);
        break;
      case 'REPOSICION_CAJA_CHICA':
        reposiciones = sumar(reposiciones, m.monto);
        break;
      case 'RETIRO':
        retiros = sumar(retiros, m.monto);
        break;
    }
  }

  const ingresos = sumar(ingresos_digital, ingresos_efectivo);
  const por_turno: ResumenTurno[] = TURNOS.map((turno) => {
    const t = turnos.get(turno)!;
    return {
      turno,
      ...t,
      ticket_promedio: t.n_ingresos ? redondear(t.ingresos / t.n_ingresos) : 0,
      participacion: ingresos ? t.ingresos / ingresos : 0,
    };
  });

  return {
    desde,
    hasta,
    ingresos,
    ingresos_digital,
    ingresos_efectivo,
    egresos,
    reposiciones,
    retiros,
    resultado_neto: restar(ingresos, egresos),
    n_movimientos: lista.length,
    n_ingresos,
    n_egresos,
    ticket_promedio: n_ingresos ? redondear(ingresos / n_ingresos) : 0,
    sin_comprobante,
    pendientes,
    por_turno,
    por_medio_pago: ordenarPorImporte(medios),
    por_area_ingresos: ordenarPorImporte(areasIngresos),
    por_area_egresos: ordenarPorImporte(areasEgresos),
  };
}

export interface FilaDiaria extends ResumenPeriodo {
  fecha: FechaISO;
  saldo_caja_chica: number | null;
  estado_caja_chica: EstadoCajaChica;
}

/** Una fila por día calendario entre `desde` y `hasta`, con el saldo de caja chica al cierre de cada día. */
export function serieDiaria(movimientos: Movimiento[], parametros: Parametros, desde: FechaISO, hasta: FechaISO): FilaDiaria[] {
  const filas: FilaDiaria[] = [];
  if (desde > hasta) return filas;
  for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
    const resumen = resumenPeriodo(movimientos, fecha, fecha);
    const saldo = saldoCajaChica(movimientos, parametros, fecha);
    filas.push({ ...resumen, fecha, saldo_caja_chica: saldo, estado_caja_chica: estadoCajaChica(saldo, parametros) });
  }
  return filas;
}

export interface FilaPeriodo extends ResumenPeriodo {
  etiqueta: string;
  rango: RangoFechas;
  saldo_caja_chica: number | null;
  estado_caja_chica: EstadoCajaChica;
}

/** Resumen de los últimos `cantidad` períodos (histórico), del más antiguo al más reciente. */
export function resumenPorPeriodos(
  movimientos: Movimiento[],
  parametros: Parametros,
  tipo: TipoPeriodo,
  cantidad: number,
  fechaRef: FechaISO,
): FilaPeriodo[] {
  return rangosRecientes(tipo, fechaRef, cantidad).map((rango) => {
    const resumen = resumenPeriodo(movimientos, rango.desde, rango.hasta);
    const saldo = saldoCajaChica(movimientos, parametros, rango.hasta);
    return {
      ...resumen,
      etiqueta: etiquetaRango(tipo, rango),
      rango,
      saldo_caja_chica: saldo,
      estado_caja_chica: estadoCajaChica(saldo, parametros),
    };
  });
}

/** Última fecha con movimientos registrados (la "fecha de referencia" del Excel), o `null`. */
export function ultimaFechaConMovimientos(movimientos: Movimiento[]): FechaISO | null {
  let ultima: FechaISO | null = null;
  for (const m of movimientos) {
    if (!m.anulado && (ultima === null || m.fecha > ultima)) ultima = m.fecha;
  }
  return ultima;
}
