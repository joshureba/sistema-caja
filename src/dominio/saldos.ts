import type { EstadoCajaChica, Movimiento, Parametros } from './tipos';
import { redondear, sumar } from './dinero';
import { sumarDias, type FechaISO } from './fechas';
import { efectoCajaChica, efectoCajaDiaria, filtrarRango, soloActivos } from './movimientos';

/**
 * Saldo de la caja chica al cierre de `hasta`.
 * `null` si la fecha es anterior a la fecha de corte (no se lleva control antes).
 */
export function saldoCajaChica(movimientos: Movimiento[], parametros: Parametros, hasta: FechaISO): number | null {
  if (hasta < parametros.fecha_corte) return null;
  let saldo = redondear(parametros.saldo_inicial_caja_chica);
  for (const m of soloActivos(movimientos)) {
    if (m.fecha >= parametros.fecha_corte && m.fecha <= hasta) {
      saldo = sumar(saldo, efectoCajaChica(m));
    }
  }
  return saldo;
}

/** Saldo con el que la caja chica inicia el día `fecha`. */
export function saldoCajaChicaInicio(movimientos: Movimiento[], parametros: Parametros, fecha: FechaISO): number | null {
  if (fecha < parametros.fecha_corte) return null;
  if (fecha === parametros.fecha_corte) return redondear(parametros.saldo_inicial_caja_chica);
  return saldoCajaChica(movimientos, parametros, sumarDias(fecha, -1));
}

export function estadoCajaChica(saldo: number | null, parametros: Parametros): EstadoCajaChica {
  if (saldo === null) return 'ANTES_DEL_CORTE';
  if (saldo < parametros.caja_chica_min) return 'BAJO_MINIMO';
  if (saldo > parametros.caja_chica_max) return 'EXCEDE_MAXIMO';
  if (parametros.caja_chica_alerta !== null && saldo < parametros.caja_chica_alerta) return 'ALERTA';
  return 'OPTIMO';
}

export const ETIQUETA_ESTADO_CAJA_CHICA: Record<EstadoCajaChica, string> = {
  ANTES_DEL_CORTE: 'Antes del corte',
  BAJO_MINIMO: 'Bajo mínimo',
  ALERTA: 'Cerca del mínimo',
  OPTIMO: 'Óptimo',
  EXCEDE_MAXIMO: 'Excede máximo',
};

export interface ResumenCajaDiaria {
  fecha: FechaISO;
  base: number;
  ingresos_efectivo: number;
  ingresos_digital: number;
  n_ingresos: number;
  traslados_a_caja_chica: number;
  retiros: number;
  /** Efectivo que debería haber en la caja diaria al cierre. */
  teorico: number;
}

export function resumenCajaDiaria(movimientos: Movimiento[], fecha: FechaISO, base: number): ResumenCajaDiaria {
  const lista = filtrarRango(movimientos, fecha, fecha);
  let ingresos_efectivo = 0;
  let ingresos_digital = 0;
  let n_ingresos = 0;
  let traslados = 0;
  let retiros = 0;
  let teorico = redondear(base);
  for (const m of lista) {
    if (m.tipo === 'INGRESO') {
      ingresos_efectivo = sumar(ingresos_efectivo, m.monto_efectivo);
      ingresos_digital = sumar(ingresos_digital, m.monto_digital);
      n_ingresos += 1;
    } else if (m.tipo === 'REPOSICION_CAJA_CHICA' && m.origen === 'CAJA_DIARIA') {
      traslados = sumar(traslados, m.monto);
    } else if (m.tipo === 'RETIRO' && m.caja_retiro === 'DIARIA') {
      retiros = sumar(retiros, m.monto);
    }
    teorico = sumar(teorico, efectoCajaDiaria(m));
  }
  return { fecha, base: redondear(base), ingresos_efectivo, ingresos_digital, n_ingresos, traslados_a_caja_chica: traslados, retiros, teorico };
}

export interface ResumenCajaChicaDia {
  fecha: FechaISO;
  saldo_inicial: number | null;
  reposiciones: number;
  egresos: number;
  n_egresos: number;
  /** Retiros de efectivo que salieron de la caja chica (no son gastos). */
  retiros: number;
  saldo_final: number | null;
  estado: EstadoCajaChica;
}

export function resumenCajaChicaDia(movimientos: Movimiento[], parametros: Parametros, fecha: FechaISO): ResumenCajaChicaDia {
  const lista = filtrarRango(movimientos, fecha, fecha);
  let reposiciones = 0;
  let egresos = 0;
  let n_egresos = 0;
  let retiros = 0;
  for (const m of lista) {
    if (m.tipo === 'EGRESO') {
      egresos = sumar(egresos, m.monto);
      n_egresos += 1;
    } else if (m.tipo === 'REPOSICION_CAJA_CHICA') {
      reposiciones = sumar(reposiciones, m.monto);
    } else if (m.tipo === 'RETIRO' && m.caja_retiro === 'CHICA') {
      retiros = sumar(retiros, m.monto);
    }
  }
  const saldo_final = saldoCajaChica(movimientos, parametros, fecha);
  return {
    fecha,
    saldo_inicial: saldoCajaChicaInicio(movimientos, parametros, fecha),
    reposiciones,
    egresos,
    n_egresos,
    retiros,
    saldo_final,
    estado: estadoCajaChica(saldo_final, parametros),
  };
}
