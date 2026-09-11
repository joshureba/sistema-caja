import { describe, expect, it } from 'vitest';
import { aCentimos, formatearSoles, leerMonto, multiplicar, restar, sumar } from './dinero';

describe('dinero', () => {
  it('suma sin errores de coma flotante', () => {
    expect(sumar(0.1, 0.2)).toBe(0.3);
    expect(sumar(5293.4, 0)).toBe(5293.4);
    expect(sumar(4850.8, 190)).toBe(5040.8);
  });

  it('resta y multiplica en céntimos', () => {
    expect(restar(1, 0.9)).toBe(0.1);
    expect(restar(4767.9, 500)).toBe(4267.9);
    expect(multiplicar(0.1, 132)).toBe(13.2);
    expect(multiplicar(0.5, 229)).toBe(114.5);
  });

  it('convierte a céntimos', () => {
    expect(aCentimos(4767.9)).toBe(476790);
    expect(aCentimos(0.01)).toBe(1);
    expect(aCentimos(Number.NaN)).toBe(0);
  });

  it('formatea en soles', () => {
    const texto = formatearSoles(1234.5);
    expect(texto).toContain('1,234.50');
    expect(texto).toContain('S/');
  });

  it('lee montos escritos por el usuario', () => {
    expect(leerMonto('1,234.50')).toBe(1234.5);
    expect(leerMonto('1234,5')).toBe(1234.5);
    expect(leerMonto('S/ 20')).toBe(20);
    expect(leerMonto('')).toBeNull();
    expect(leerMonto('abc')).toBeNull();
  });
});
