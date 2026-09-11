/**
 * Aritmética de dinero en céntimos para evitar los errores de coma flotante
 * (el Excel mostraba 5293.400000000001).
 */

export function aCentimos(valor: number): number {
  if (!Number.isFinite(valor)) return 0;
  return Math.round(Number((valor * 100).toFixed(4)));
}

export function deCentimos(centimos: number): number {
  return centimos / 100;
}

export function redondear(valor: number): number {
  return deCentimos(aCentimos(valor));
}

export function sumar(...valores: number[]): number {
  return deCentimos(valores.reduce((acumulado, v) => acumulado + aCentimos(v), 0));
}

export function restar(a: number, b: number): number {
  return deCentimos(aCentimos(a) - aCentimos(b));
}

export function multiplicar(valor: number, cantidad: number): number {
  return deCentimos(Math.round(aCentimos(valor) * cantidad));
}

export function esMontoValido(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;
}

const formatoSoles = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatoNumero = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "S/ 1,234.50" */
export function formatearSoles(valor: number): string {
  return formatoSoles.format(redondear(valor));
}

/** "1,234.50" sin símbolo. */
export function formatearNumero(valor: number): string {
  return formatoNumero.format(redondear(valor));
}

/** Convierte un texto de formulario ("1,234.50", "1234,5") a número; `null` si no es válido. */
export function leerMonto(texto: string | number | null | undefined): number | null {
  if (typeof texto === 'number') return Number.isFinite(texto) ? redondear(texto) : null;
  if (!texto) return null;
  const limpio = texto.replace(/[^\d.,-]/g, '');
  if (!limpio) return null;
  const normalizado = limpio.includes(',') && !limpio.includes('.') ? limpio.replace(',', '.') : limpio.replace(/,/g, '');
  const n = Number(normalizado);
  return Number.isFinite(n) ? redondear(n) : null;
}
