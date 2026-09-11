import type { EstadoArqueo } from './tipos';
import { aCentimos, multiplicar, redondear, restar, sumar } from './dinero';

/** Conteo por denominación. La clave es la denominación como texto: '200', '0.5'. */
export type Conteo = Record<string, number>;

export interface LineaArqueo {
  denominacion: number;
  cantidad: number;
  subtotal: number;
}

export interface ResultadoArqueo {
  detalle: LineaArqueo[];
  total_contado: number;
  total_teorico: number;
  diferencia: number;
  estado: EstadoArqueo;
}

export function claveDenominacion(denominacion: number): string {
  return String(denominacion);
}

export function conteoVacio(denominaciones: number[]): Conteo {
  const conteo: Conteo = {};
  for (const d of denominaciones) conteo[claveDenominacion(d)] = 0;
  return conteo;
}

/** Cantidad entera no negativa; cualquier valor inválido cuenta como 0. */
export function cantidadValida(valor: unknown): number {
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

export function detalleConteo(conteo: Conteo, denominaciones: number[]): LineaArqueo[] {
  return denominaciones.map((denominacion) => {
    const cantidad = cantidadValida(conteo[claveDenominacion(denominacion)]);
    return { denominacion, cantidad, subtotal: multiplicar(denominacion, cantidad) };
  });
}

export function totalConteo(conteo: Conteo, denominaciones: number[]): number {
  return sumar(...detalleConteo(conteo, denominaciones).map((l) => l.subtotal));
}

export function estadoArqueo(diferencia: number, tolerancia: number): EstadoArqueo {
  return Math.abs(aCentimos(diferencia)) <= aCentimos(tolerancia) ? 'CUADRA' : 'REVISAR';
}

export function calcularArqueo(conteo: Conteo, denominaciones: number[], totalTeorico: number, tolerancia: number): ResultadoArqueo {
  const detalle = detalleConteo(conteo, denominaciones);
  const total_contado = sumar(...detalle.map((l) => l.subtotal));
  const diferencia = restar(total_contado, totalTeorico);
  return {
    detalle,
    total_contado,
    total_teorico: redondear(totalTeorico),
    diferencia,
    estado: estadoArqueo(diferencia, tolerancia),
  };
}
