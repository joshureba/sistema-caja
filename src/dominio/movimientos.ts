import type { Movimiento } from './tipos';
import { redondear, sumar } from './dinero';
import type { FechaISO } from './fechas';

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

/** Orden cronológico: fecha, turno (mañana antes que noche) y luego id. */
export function ordenarCronologico(movimientos: Movimiento[]): Movimiento[] {
  return [...movimientos].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
    if (a.turno !== b.turno) return a.turno === 'MAÑANA' ? -1 : 1;
    return a.id - b.id;
  });
}
