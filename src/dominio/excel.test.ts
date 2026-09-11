/**
 * Pruebas de regresión contra los valores que calculaba el Excel del área
 * (celdas en caché del libro CAJA ACTUALIZADA 10-09) usando los 83 movimientos importados.
 */
import { describe, expect, it } from 'vitest';
import fixture from './fixtures/movimientos-excel.json';
import type { Movimiento } from './tipos';
import { PARAMETROS_POR_DEFECTO } from './tipos';
import { resumenCajaChicaDia, resumenCajaDiaria, saldoCajaChica, estadoCajaChica } from './saldos';
import { resumenPeriodo, resumenPorPeriodos, serieDiaria, ultimaFechaConMovimientos } from './resumen';
import { restar, sumar } from './dinero';

const movimientos = fixture as unknown as Movimiento[];
const parametros = PARAMETROS_POR_DEFECTO;

describe('importación del Excel', () => {
  it('trae los 83 movimientos del 01 al 10 de septiembre de 2026', () => {
    expect(movimientos).toHaveLength(83);
    expect(ultimaFechaConMovimientos(movimientos)).toBe('2026-09-10');
    expect(movimientos.every((m) => m.fecha >= '2026-09-01' && m.fecha <= '2026-09-10')).toBe(true);
  });
});

describe('dashboard mensual (septiembre 2026)', () => {
  const r = resumenPeriodo(movimientos, '2026-09-01', '2026-09-30');

  it('ingresos totales, digital y efectivo coinciden con el Excel', () => {
    expect(r.ingresos).toBe(5040.8);
    expect(r.ingresos_digital).toBe(2799);
    expect(r.ingresos_efectivo).toBe(2241.8);
    expect(r.n_movimientos).toBe(83);
  });

  it('separa los retiros de excedente de los egresos reales', () => {
    // El Excel sumaba 5,293.40 como "egresos": 1,981.50 de gastos + 3,311.90 de retiros de excedente (04/09 y 08/09).
    expect(r.egresos).toBe(1981.5);
    expect(r.retiros).toBe(3311.9);
    expect(sumar(r.egresos, r.retiros)).toBe(5293.4);
    expect(r.resultado_neto).toBe(3059.3);
  });

  it('cuenta los sustentos como el Excel', () => {
    expect(r.sin_comprobante).toBe(24);
    expect(r.pendientes).toBe(0);
  });

  it('reparte los ingresos por turno', () => {
    const [manana, noche] = r.por_turno;
    expect(manana.turno).toBe('MAÑANA');
    expect(noche.turno).toBe('NOCHE');
    expect(manana.ingresos + noche.ingresos).toBeCloseTo(5040.8, 2);
    expect(manana.participacion + noche.participacion).toBeCloseTo(1, 6);
    expect(manana.n_ingresos + noche.n_ingresos).toBe(r.n_ingresos);
  });
});

describe('histórico diario (hoja HISTÓRICO del Excel)', () => {
  const esperado: Record<string, [number, number]> = {
    '2026-09-01': [570, 260],
    '2026-09-02': [605, 70],
    '2026-09-03': [1518.8, 1050],
    '2026-09-04': [437, 2458.7],
    '2026-09-05': [935, 50],
    '2026-09-06': [510, 100],
    '2026-09-07': [235, 50],
    '2026-09-08': [0, 982.6],
    '2026-09-09': [60, 35.8],
    '2026-09-10': [170, 236.3],
  };

  it('ingresos y salidas de cada día', () => {
    const serie = serieDiaria(movimientos, parametros, '2026-09-01', '2026-09-10');
    expect(serie).toHaveLength(10);
    for (const fila of serie) {
      const [ingresos, salidas] = esperado[fila.fecha];
      expect(fila.ingresos, fila.fecha).toBe(ingresos);
      expect(fila.egresos + fila.retiros, fila.fecha).toBeCloseTo(salidas, 2);
    }
  });

  it('el 06/09 tuvo 15 ingresos: 100 digital y 410 efectivo', () => {
    const dia = resumenPeriodo(movimientos, '2026-09-06', '2026-09-06');
    expect(dia.n_ingresos).toBe(15);
    expect(dia.ingresos_digital).toBe(100);
    expect(dia.ingresos_efectivo).toBe(410);
  });
});

describe('saldo de caja chica (desde el corte del 06/09 con S/ 5,000)', () => {
  it('coincide día a día con el Excel', () => {
    expect(saldoCajaChica(movimientos, parametros, '2026-09-05')).toBeNull();
    expect(saldoCajaChica(movimientos, parametros, '2026-09-06')).toBe(4900);
    expect(saldoCajaChica(movimientos, parametros, '2026-09-07')).toBe(4850);
    expect(saldoCajaChica(movimientos, parametros, '2026-09-08')).toBe(3867.4);
    expect(saldoCajaChica(movimientos, parametros, '2026-09-09')).toBe(3831.6);
    expect(saldoCajaChica(movimientos, parametros, '2026-09-10')).toBe(3595.3);
  });

  it('clasifica el estado según el rango 3,000 a 5,000', () => {
    expect(estadoCajaChica(3595.3, parametros)).toBe('OPTIMO');
    expect(estadoCajaChica(3400, parametros)).toBe('ALERTA');
    expect(estadoCajaChica(2999.99, parametros)).toBe('BAJO_MINIMO');
    expect(estadoCajaChica(5000.01, parametros)).toBe('EXCEDE_MAXIMO');
    expect(estadoCajaChica(null, parametros)).toBe('ANTES_DEL_CORTE');
    expect(estadoCajaChica(3400, { ...parametros, caja_chica_alerta: null })).toBe('OPTIMO');
  });

  it('resume el día de la caja chica', () => {
    // El 08/09 salieron S/ 982.60 de la caja chica: 20 de gasto y 962.60 de retiro de excedente.
    const dia = resumenCajaChicaDia(movimientos, parametros, '2026-09-08');
    expect(dia.saldo_inicial).toBe(4850);
    expect(dia.egresos).toBe(20);
    expect(dia.retiros).toBe(962.6);
    expect(dia.saldo_final).toBe(3867.4);
    expect(dia.estado).toBe('OPTIMO');
    expect(resumenCajaChicaDia(movimientos, parametros, '2026-09-06').saldo_inicial).toBe(5000);
    expect(resumenCajaChicaDia(movimientos, parametros, '2026-09-05').estado).toBe('ANTES_DEL_CORTE');
  });
});

describe('caja diaria', () => {
  it('efectivo teórico = base + efectivo del día − traslados − retiros', () => {
    expect(resumenCajaDiaria(movimientos, '2026-09-10', 500).teorico).toBe(500);
    expect(resumenCajaDiaria(movimientos, '2026-09-06', 500).teorico).toBe(910);
    // El 04/09 (antes del corte) el retiro de 2,349.30 salió de la única caja que existía: la diaria.
    const dia4 = resumenCajaDiaria(movimientos, '2026-09-04', 500);
    expect(dia4.retiros).toBe(2349.3);
    expect(dia4.teorico).toBe(restar(sumar(500, dia4.ingresos_efectivo), 2349.3));
    // El 08/09 el retiro salió de la caja chica, así que no toca la caja diaria.
    expect(resumenCajaDiaria(movimientos, '2026-09-08', 500).retiros).toBe(0);
  });
});

describe('histórico por períodos', () => {
  it('arma 12 meses y el último es septiembre 2026', () => {
    const filas = resumenPorPeriodos(movimientos, parametros, 'MENSUAL', 12, '2026-09-10');
    expect(filas).toHaveLength(12);
    expect(filas[11].etiqueta).toBe('septiembre 2026');
    expect(filas[11].ingresos).toBe(5040.8);
    expect(filas[10].ingresos).toBe(0);
  });
});
