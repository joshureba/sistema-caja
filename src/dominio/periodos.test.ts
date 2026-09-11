import { describe, expect, it } from 'vitest';
import { etiquetaRango, rangoPeriodo, rangosRecientes, turnoParaHora } from './periodos';
import { diaSemana, finDeMes, sumarMeses } from './fechas';

describe('rangoPeriodo (réplica de las fórmulas DESDE/HASTA del Excel)', () => {
  const ref = '2026-09-10'; // jueves

  it('diario', () => {
    expect(rangoPeriodo('DIARIO', ref)).toEqual({ desde: ref, hasta: ref });
  });

  it('semanal empieza en lunes', () => {
    expect(diaSemana(ref)).toBe(4);
    expect(rangoPeriodo('SEMANAL', ref)).toEqual({ desde: '2026-09-07', hasta: '2026-09-13' });
    expect(rangoPeriodo('SEMANAL', '2026-09-13')).toEqual({ desde: '2026-09-07', hasta: '2026-09-13' });
    expect(rangoPeriodo('SEMANAL', '2026-09-14')).toEqual({ desde: '2026-09-14', hasta: '2026-09-20' });
  });

  it('quincenal', () => {
    expect(rangoPeriodo('QUINCENAL', ref)).toEqual({ desde: '2026-09-01', hasta: '2026-09-15' });
    expect(rangoPeriodo('QUINCENAL', '2026-09-16')).toEqual({ desde: '2026-09-16', hasta: '2026-09-30' });
    expect(rangoPeriodo('QUINCENAL', '2028-02-20')).toEqual({ desde: '2028-02-16', hasta: '2028-02-29' });
  });

  it('mensual', () => {
    expect(rangoPeriodo('MENSUAL', ref)).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' });
    expect(finDeMes('2026-02-10')).toBe('2026-02-28');
  });

  it('semestral', () => {
    expect(rangoPeriodo('SEMESTRAL', ref)).toEqual({ desde: '2026-07-01', hasta: '2026-12-31' });
    expect(rangoPeriodo('SEMESTRAL', '2026-03-05')).toEqual({ desde: '2026-01-01', hasta: '2026-06-30' });
  });

  it('anual', () => {
    expect(rangoPeriodo('ANUAL', ref)).toEqual({ desde: '2026-01-01', hasta: '2026-12-31' });
  });

  it('sumarMeses se comporta como EDATE', () => {
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(sumarMeses('2026-07-01', 6)).toBe('2027-01-01');
  });
});

describe('rangosRecientes', () => {
  it('devuelve 12 meses en orden cronológico', () => {
    const rangos = rangosRecientes('MENSUAL', '2026-09-10', 12);
    expect(rangos).toHaveLength(12);
    expect(rangos[0]).toEqual({ desde: '2025-10-01', hasta: '2025-10-31' });
    expect(rangos[11]).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' });
  });

  it('devuelve los últimos 31 días', () => {
    const rangos = rangosRecientes('DIARIO', '2026-09-10', 31);
    expect(rangos[0].desde).toBe('2026-08-11');
    expect(rangos[30].desde).toBe('2026-09-10');
  });

  it('semanas consecutivas sin huecos', () => {
    const rangos = rangosRecientes('SEMANAL', '2026-09-10', 12);
    for (let i = 1; i < rangos.length; i += 1) {
      expect(rangos[i].desde > rangos[i - 1].hasta).toBe(true);
    }
    expect(rangos[0].desde).toBe('2026-06-22');
  });
});

describe('etiquetaRango', () => {
  it('describe cada período en español', () => {
    expect(etiquetaRango('MENSUAL', { desde: '2026-09-01', hasta: '2026-09-30' })).toBe('septiembre 2026');
    expect(etiquetaRango('QUINCENAL', { desde: '2026-09-16', hasta: '2026-09-30' })).toBe('2.ª quincena sep 2026');
    expect(etiquetaRango('SEMESTRAL', { desde: '2026-07-01', hasta: '2026-12-31' })).toBe('2.º semestre 2026');
    expect(etiquetaRango('SEMANAL', { desde: '2026-09-07', hasta: '2026-09-13' })).toBe('07/09 al 13/09');
  });
});

describe('turnoParaHora', () => {
  it('antes de la hora de inicio es mañana; desde esa hora es noche', () => {
    expect(turnoParaHora('16:59', '17:00')).toBe('MAÑANA');
    expect(turnoParaHora('17:00', '17:00:00')).toBe('NOCHE');
    expect(turnoParaHora('08:15', '17:00')).toBe('MAÑANA');
    expect(turnoParaHora('23:30', '17:00')).toBe('NOCHE');
  });
});
