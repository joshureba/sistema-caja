import { describe, expect, it } from 'vitest';
import { calcularArqueo, conteoVacio, totalConteo } from './arqueo';
import { DENOMINACIONES_PEN } from './tipos';

/** Conteo real del 10/09/2026 en el Excel (X27 = 4,767.90). */
const conteoExcel = { '200': 0, '100': 20, '50': 25, '20': 5, '10': 101, '5': 1, '2': 80, '1': 110, '0.5': 229, '0.2': 26, '0.1': 132 };

describe('arqueo', () => {
  it('reproduce el total contado del Excel', () => {
    expect(totalConteo(conteoExcel, DENOMINACIONES_PEN)).toBe(4767.9);
  });

  it('marca REVISAR cuando el contado no coincide con el teórico', () => {
    const r = calcularArqueo(conteoExcel, DENOMINACIONES_PEN, 500, 0.01);
    expect(r.total_contado).toBe(4767.9);
    expect(r.diferencia).toBe(4267.9);
    expect(r.estado).toBe('REVISAR');
    expect(r.detalle).toHaveLength(11);
    expect(r.detalle.find((l) => l.denominacion === 0.1)?.subtotal).toBe(13.2);
  });

  it('marca CUADRA dentro de la tolerancia', () => {
    expect(calcularArqueo(conteoExcel, DENOMINACIONES_PEN, 4767.9, 0.01).estado).toBe('CUADRA');
    expect(calcularArqueo(conteoExcel, DENOMINACIONES_PEN, 4767.89, 0.01).estado).toBe('CUADRA');
    expect(calcularArqueo(conteoExcel, DENOMINACIONES_PEN, 4767.88, 0.01).estado).toBe('REVISAR');
  });

  it('ignora cantidades inválidas', () => {
    const conteo = { ...conteoVacio(DENOMINACIONES_PEN), '100': -3, '50': 2.9, '10': Number.NaN };
    expect(totalConteo(conteo, DENOMINACIONES_PEN)).toBe(100);
  });
});
