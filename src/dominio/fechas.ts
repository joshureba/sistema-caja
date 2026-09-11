/**
 * Fechas como texto ISO 'YYYY-MM-DD' interpretadas en hora local.
 * Así se evitan los corrimientos de un día por zona horaria.
 */

export type FechaISO = string;

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function esFechaISO(valor: unknown): valor is FechaISO {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  return aISO(desdeISO(valor)) === valor;
}

export function aISO(fecha: Date): FechaISO {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function desdeISO(iso: FechaISO): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Crea una fecha tolerando desbordes (día 0 = último día del mes anterior). */
export function crearFecha(anio: number, mes: number, dia: number): FechaISO {
  return aISO(new Date(anio, mes - 1, dia));
}

export function hoyISO(ahora: Date = new Date()): FechaISO {
  return aISO(ahora);
}

export function sumarDias(iso: FechaISO, dias: number): FechaISO {
  const f = desdeISO(iso);
  f.setDate(f.getDate() + dias);
  return aISO(f);
}

/** Equivale a EDATE de Excel: mismo día n meses después, recortado al fin de mes. */
export function sumarMeses(iso: FechaISO, meses: number): FechaISO {
  const f = desdeISO(iso);
  const dia = f.getDate();
  f.setDate(1);
  f.setMonth(f.getMonth() + meses);
  const ultimo = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate();
  f.setDate(Math.min(dia, ultimo));
  return aISO(f);
}

export function inicioDeMes(iso: FechaISO): FechaISO {
  const f = desdeISO(iso);
  return crearFecha(f.getFullYear(), f.getMonth() + 1, 1);
}

export function finDeMes(iso: FechaISO): FechaISO {
  const f = desdeISO(iso);
  return crearFecha(f.getFullYear(), f.getMonth() + 2, 0);
}

/** 1 = lunes ... 7 = domingo (como WEEKDAY(fecha, 2) en Excel). */
export function diaSemana(iso: FechaISO): number {
  const js = desdeISO(iso).getDay();
  return js === 0 ? 7 : js;
}

export function nombreMes(iso: FechaISO): string {
  return MESES[desdeISO(iso).getMonth()];
}

export function formatearFecha(iso: FechaISO, estilo: 'corto' | 'largo' | 'diaMes' = 'corto'): string {
  const f = desdeISO(iso);
  const dd = String(f.getDate()).padStart(2, '0');
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  if (estilo === 'diaMes') return `${dd}/${mm}`;
  if (estilo === 'largo') return `${DIAS_SEMANA[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`;
  return `${dd}/${mm}/${f.getFullYear()}`;
}

export function horaHHmm(ahora: Date = new Date()): string {
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
}

export function compararFechas(a: FechaISO, b: FechaISO): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
