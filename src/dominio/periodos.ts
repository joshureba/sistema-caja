import type { TipoPeriodo, Turno } from './tipos';
import {
  crearFecha,
  desdeISO,
  diaSemana,
  finDeMes,
  formatearFecha,
  inicioDeMes,
  nombreMes,
  sumarDias,
  sumarMeses,
  type FechaISO,
} from './fechas';

export interface RangoFechas {
  desde: FechaISO;
  hasta: FechaISO;
}

export const ETIQUETA_PERIODO: Record<TipoPeriodo, string> = {
  DIARIO: 'Diario',
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

/** Cantidad de períodos que muestra el histórico (réplica de la hoja HISTÓRICO). */
export const PERIODOS_HISTORICO: Record<TipoPeriodo, number> = {
  DIARIO: 31,
  SEMANAL: 12,
  QUINCENAL: 12,
  MENSUAL: 12,
  SEMESTRAL: 6,
  ANUAL: 5,
};

/**
 * Rango que contiene a la fecha de referencia. Réplica exacta de las fórmulas
 * DESDE/HASTA del dashboard en Excel.
 */
export function rangoPeriodo(tipo: TipoPeriodo, fechaRef: FechaISO): RangoFechas {
  const f = desdeISO(fechaRef);
  const anio = f.getFullYear();
  const mes = f.getMonth() + 1;
  const dia = f.getDate();
  switch (tipo) {
    case 'DIARIO':
      return { desde: fechaRef, hasta: fechaRef };
    case 'SEMANAL': {
      const desde = sumarDias(fechaRef, 1 - diaSemana(fechaRef));
      return { desde, hasta: sumarDias(desde, 6) };
    }
    case 'QUINCENAL':
      return dia <= 15
        ? { desde: crearFecha(anio, mes, 1), hasta: crearFecha(anio, mes, 15) }
        : { desde: crearFecha(anio, mes, 16), hasta: finDeMes(fechaRef) };
    case 'MENSUAL':
      return { desde: inicioDeMes(fechaRef), hasta: finDeMes(fechaRef) };
    case 'SEMESTRAL': {
      const desde = crearFecha(anio, mes <= 6 ? 1 : 7, 1);
      return { desde, hasta: sumarDias(sumarMeses(desde, 6), -1) };
    }
    case 'ANUAL':
      return { desde: crearFecha(anio, 1, 1), hasta: crearFecha(anio, 12, 31) };
  }
}

export function rangoAnterior(tipo: TipoPeriodo, rango: RangoFechas): RangoFechas {
  return rangoPeriodo(tipo, sumarDias(rango.desde, -1));
}

export function rangoSiguiente(tipo: TipoPeriodo, rango: RangoFechas): RangoFechas {
  return rangoPeriodo(tipo, sumarDias(rango.hasta, 1));
}

/** Los últimos `cantidad` períodos que terminan en el que contiene a `fechaRef`, del más antiguo al más reciente. */
export function rangosRecientes(tipo: TipoPeriodo, fechaRef: FechaISO, cantidad: number): RangoFechas[] {
  const lista: RangoFechas[] = [];
  let rango = rangoPeriodo(tipo, fechaRef);
  for (let i = 0; i < cantidad; i += 1) {
    lista.unshift(rango);
    rango = rangoAnterior(tipo, rango);
  }
  return lista;
}

export function etiquetaRango(tipo: TipoPeriodo, rango: RangoFechas): string {
  const f = desdeISO(rango.desde);
  const anio = f.getFullYear();
  switch (tipo) {
    case 'DIARIO':
      return formatearFecha(rango.desde);
    case 'SEMANAL':
      return `${formatearFecha(rango.desde, 'diaMes')} al ${formatearFecha(rango.hasta, 'diaMes')}`;
    case 'QUINCENAL':
      return `${f.getDate() === 1 ? '1.ª' : '2.ª'} quincena ${nombreMes(rango.desde).slice(0, 3)} ${anio}`;
    case 'MENSUAL':
      return `${nombreMes(rango.desde)} ${anio}`;
    case 'SEMESTRAL':
      return `${f.getMonth() === 0 ? '1.er' : '2.º'} semestre ${anio}`;
    case 'ANUAL':
      return String(anio);
  }
}

/** Turno según la hora del día ('HH:mm'). Desde la hora de inicio de noche, inclusive, es NOCHE. */
export function turnoParaHora(hora: string, inicioNoche: string): Turno {
  return hora.slice(0, 5) >= inicioNoche.slice(0, 5) ? 'NOCHE' : 'MAÑANA';
}
