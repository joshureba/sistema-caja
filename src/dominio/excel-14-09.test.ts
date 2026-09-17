import { describe, expect, it } from 'vitest';
import fixture from './fixtures/movimientos-excel.json';
import { PARAMETROS_POR_DEFECTO as p, type Movimiento } from './tipos';
import { esRetiroDeCajaChica, esSalidaDelFondo, movimientosDesdeCorte } from './movimientos';
import { resumenPeriodo } from './resumen';
import { saldoCajaChica, saldoCajaDiaria, resumenCajaDiaria, resumenFondoAcumulado } from './saldos';
import { totalConteo } from './arqueo';

const movimientos = fixture as Movimiento[];
const base: Movimiento = { ...movimientos[0], id: 126, fecha: '2026-09-14', tipo: 'RETIRO', monto: 500,
  monto_digital: 0, monto_efectivo: 0, caja_retiro: 'CHICA', destino: 'OTRO', importado: false };

describe('Excel temporal del 14/09 y separación definitiva', () => {
  it('el dashboard no incorpora los ingresos históricos ni la base de apertura', () => {
    const activos = movimientosDesdeCorte([...movimientos, base], p.fecha_corte, '2026-09-14');
    const r = resumenPeriodo(activos, '2026-09-01', '2026-09-30');
    expect(r.ingresos).toBe(0);
    expect(r.egresos).toBe(0);
    expect(r.retiros).toBe(500);
    expect(r.n_movimientos).toBe(1);
    expect(resumenPeriodo(movimientos, '2026-09-01', '2026-09-13').ingresos).toBe(8800.8);
  });
  it('los ingresos nuevos se desglosan sin restar gastos ni incluir anulados o futuros', () => {
    const ingreso = { ...movimientos[0], fecha: '2026-09-14', monto_digital: 200, monto_efectivo: 100 };
    const lista = [...movimientos, base, ingreso,
      { ...base, tipo: 'EGRESO' as const, monto: 50 },
      { ...ingreso, anulado: true }, { ...ingreso, fecha: '2026-09-15' }];
    const activos = movimientosDesdeCorte(lista, p.fecha_corte, '2026-09-14');
    const r = resumenPeriodo(activos, '2026-09-01', '2026-09-30');
    expect(r.ingresos).toBe(300);
    expect(r.ingresos_digital).toBe(200);
    expect(r.ingresos_efectivo).toBe(100);
    expect(r.egresos).toBe(50);
    expect(r.por_turno[0].ingresos).toBe(300);
    expect(resumenPeriodo(activos, '2026-09-01', '2026-09-13').n_movimientos).toBe(0);
  });
  it('lee los 125 registros, incluidos los dos primeros, y las correcciones del libro', () => {
    expect(movimientos).toHaveLength(125);
    expect(movimientos[0].numero).toBe('78919');
    expect(movimientos[1].numero).toBe('78922');
    const r = resumenPeriodo(movimientos, '2026-09-01', '2026-09-13');
    expect(r.ingresos_digital).toBe(5084);
    expect(r.ingresos_efectivo).toBe(3716.8);
    expect(r.ingresos).toBe(8800.8);
    expect(r.egresos).toBe(2191.5);
    expect(r.retiros).toBe(3311.9);
  });
  it('reconcilia el conteo con el cierre del 13/09', () => {
    expect(totalConteo({200: 0, 100: 31, 50: 30, 20: 1, 10: 105, 5: 0, 2: 64, 1: 102, '0.5': 229, '0.2': 26, '0.1': 132}, p.denominaciones)).toBe(6032.9);
    const r = resumenPeriodo(movimientos, '2026-09-13', '2026-09-13');
    expect(r.ingresos_efectivo).toBe(605);
    expect(r.egresos).toBe(50);
  });
  it('descuenta la última base una vez y no arrastra de nuevo los movimientos históricos', () => {
    const lista = [...movimientos, base];
    expect(saldoCajaChica(lista, p, '2026-09-14')).toBe(5532.9);
    expect(saldoCajaDiaria(lista, p, '2026-09-14')).toBe(500);
    expect(saldoCajaChica(lista, p, '2026-09-15')).toBe(5532.9);
    expect(saldoCajaDiaria(lista, p, '2026-09-15')).toBe(500);
  });
  it('los gastos solo bajan chica y el efectivo nuevo solo aumenta fondo', () => {
    const lista = [...movimientos, base,
      { ...base, id: 127, fecha: '2026-09-15', tipo: 'EGRESO' as const, monto: 50, caja_retiro: null },
      { ...movimientos[0], id: 128, fecha: '2026-09-15', monto_efectivo: 100, monto_digital: 200 }];
    expect(saldoCajaChica(lista, p, '2026-09-15')).toBe(5482.9);
    expect(saldoCajaDiaria(lista, p, '2026-09-15')).toBe(600);
  });
  it('identifica las salidas prohibidas del fondo conservando el histórico', () => {
    expect(esSalidaDelFondo({ ...base, caja_retiro: 'DIARIA' })).toBe(true);
    expect(esSalidaDelFondo({ ...base, caja_retiro: 'DIARIA', fecha: '2026-09-13' })).toBe(false);
    expect(esSalidaDelFondo(base)).toBe(false);
    expect(esSalidaDelFondo({ ...base, tipo: 'REPOSICION_CAJA_CHICA', origen: 'CAJA_DIARIA' })).toBe(true);
    expect(esSalidaDelFondo({ ...base, caja_retiro: 'DIARIA', destino: 'GERENCIA' })).toBe(false);
    // Regla del 17/09: el fondo también puede enviar efectivo al banco.
    expect(esSalidaDelFondo({ ...base, caja_retiro: 'DIARIA', destino: 'BANCO' })).toBe(false);
    expect(esSalidaDelFondo({ ...base, caja_retiro: 'DIARIA', destino: 'OTRO' })).toBe(true);
  });
  // Regla del 17/09: los retiros solo salen del fondo desde el 16/09 (el retiro de excedente de caja chica
  // del 15/09 es real y se conserva) y la caja chica vuelve a reponerse desde el banco.
  it('solo el fondo admite retiros desde el 16/09 y la reposición de caja chica vuelve a sumar', () => {
    expect(esRetiroDeCajaChica({ ...base, fecha: '2026-09-16' })).toBe(true);
    expect(esRetiroDeCajaChica({ ...base, fecha: '2026-09-15' })).toBe(false);
    expect(esRetiroDeCajaChica({ ...base, fecha: '2026-09-16', caja_retiro: 'DIARIA' })).toBe(false);
    expect(esRetiroDeCajaChica({ ...base, fecha: '2026-09-16', tipo: 'EGRESO', caja_retiro: null })).toBe(false);
    const reposicion: Movimiento = { ...base, id: 129, fecha: '2026-09-17', tipo: 'REPOSICION_CAJA_CHICA', monto: 300, caja_retiro: null, destino: null, origen: 'BANCO' };
    expect(esSalidaDelFondo(reposicion)).toBe(false);
    expect(saldoCajaChica([...movimientos, base, reposicion], p, '2026-09-17')).toBe(5832.9);
    expect(saldoCajaDiaria([...movimientos, base, reposicion], p, '2026-09-17')).toBe(500);
  });
  it('arrastra el saldo luego de enviar a gerencia y no descuenta de caja chica', () => {
    const cobro: Movimiento = { ...movimientos[0], fecha: '2026-09-15', monto_efectivo: 300, monto_digital: 150 };
    const envio: Movimiento = { ...base, fecha: '2026-09-15', monto: 600, caja_retiro: 'DIARIA', destino: 'GERENCIA' };
    const lista = [...movimientos, base, cobro, envio];
    expect(resumenCajaDiaria(lista, p, '2026-09-15').saldo_inicial).toBe(500);
    expect(resumenCajaDiaria(lista, p, '2026-09-15').teorico).toBe(200);
    expect(resumenCajaDiaria(lista, p, '2026-09-16').saldo_inicial).toBe(200);
    expect(resumenCajaDiaria(lista, p, '2026-09-18').saldo_inicial).toBe(200);
    expect(saldoCajaChica(lista, p, '2026-09-16')).toBe(5532.9);
    expect(resumenFondoAcumulado(lista, p, '2026-09-16')).toEqual({ saldo: 200, ingresos: 300, envios: 600, total_recibido: 800 });
    expect(saldoCajaDiaria([...lista.slice(0, -1), { ...envio, anulado: true }], p, '2026-09-16')).toBe(800);
  });
});
