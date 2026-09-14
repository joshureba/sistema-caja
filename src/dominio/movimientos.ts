import type { Movimiento } from './tipos';
import { redondear, sumar } from './dinero';
import type { FechaISO } from './fechas';

export const FECHA_FONDO_SOLO_INGRESOS = '2026-09-14';
export const FECHA_CAJA_CHICA_SOLO_EGRESOS = '2026-09-15';

export function esSalidaDelFondo(m: Pick<Movimiento, 'fecha' | 'tipo' | 'origen' | 'caja_retiro' | 'destino'>): boolean {
  return m.fecha >= FECHA_FONDO_SOLO_INGRESOS && (
    (m.tipo === 'RETIRO' && m.caja_retiro === 'DIARIA' && m.destino !== 'GERENCIA') ||
    (m.tipo === 'REPOSICION_CAJA_CHICA' && m.origen === 'CAJA_DIARIA')
  );
}

/** Importe del movimiento: para INGRESO es digital + efectivo; para el resto es `monto`. */
export function montoTotal(m: Movimiento): number {
  return m.tipo === 'INGRESO' ? sumar(m.monto_digital, m.monto_efectivo) : redondear(m.monto);
}

/** Cuánto cambia el efectivo de la caja diaria por este movimiento (positivo entra, negativo sale). */
export function efectoCajaDiaria(m: Movimiento): number {
  switch (m.tipo) {
    case 'INGRESO':
      return redondear(m.monto_efectivo);
    case 'REPOSICION_CAJA_CHICA':
      return m.origen === 'CAJA_DIARIA' ? -redondear(m.monto) : 0;
    case 'RETIRO':
      return m.caja_retiro === 'DIARIA' ? -redondear(m.monto) : 0;
    default:
      return 0;
  }
}

/** Cuánto cambia el saldo de la caja chica por este movimiento. */
export function efectoCajaChica(m: Movimiento): number {
  switch (m.tipo) {
    case 'EGRESO':
      return -redondear(m.monto);
    case 'REPOSICION_CAJA_CHICA':
      return redondear(m.monto);
    case 'RETIRO':
      return m.caja_retiro === 'CHICA' ? -redondear(m.monto) : 0;
    default:
      return 0;
  }
}

export function soloActivos(movimientos: Movimiento[]): Movimiento[] {
  return movimientos.filter((m) => !m.anulado);
}

export function enRango(m: Movimiento, desde: FechaISO, hasta: FechaISO): boolean {
  return m.fecha >= desde && m.fecha <= hasta;
}

/** Movimientos no anulados dentro del rango de fechas (inclusive). */
export function filtrarRango(movimientos: Movimiento[], desde: FechaISO, hasta: FechaISO): Movimiento[] {
  return movimientos.filter((m) => !m.anulado && enRango(m, desde, hasta));
}

/** Operaciones de las cajas separadas; el histórico previo al corte no integra el dashboard. */
export function movimientosDesdeCorte(movimientos: Movimiento[], fechaCorte: FechaISO, hasta: FechaISO): Movimiento[] {
  return filtrarRango(movimientos, fechaCorte, hasta);
}

/** Orden cronológico: fecha, turno (mañana antes que noche) y luego id. */
export function ordenarCronologico(movimientos: Movimiento[]): Movimiento[] {
  return [...movimientos].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
    if (a.turno !== b.turno) return a.turno === 'MAÑANA' ? -1 : 1;
    return a.id - b.id;
  });
}
