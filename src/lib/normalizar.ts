import { DENOMINACIONES_PEN, type Movimiento, type Parametros } from '@/dominio';
import type { MovimientoBD, ParametrosBD } from './tipos-bd';

/** PostgREST devuelve los numeric como número; esta conversión protege ante cadenas o nulos. */
export function aNumero(valor: unknown): number {
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : 0;
}

export function aMovimiento(fila: MovimientoBD): Movimiento {
  return {
    id: fila.id,
    jornada_id: fila.jornada_id,
    fecha: fila.fecha,
    turno: fila.turno,
    tipo: fila.tipo,
    estado_sustento: fila.estado_sustento,
    comprobante: fila.comprobante,
    serie: fila.serie,
    numero: fila.numero,
    ruc_dni: fila.ruc_dni,
    nombre: fila.nombre,
    area: fila.area,
    descripcion: fila.descripcion,
    medio_pago: fila.medio_pago,
    cuenta: fila.cuenta,
    num_operacion: fila.num_operacion,
    monto_digital: aNumero(fila.monto_digital),
    monto_efectivo: aNumero(fila.monto_efectivo),
    monto: aNumero(fila.monto),
    origen: fila.origen,
    caja_retiro: fila.caja_retiro,
    destino: fila.destino,
    observacion: fila.observacion,
    responsable: fila.responsable,
    anulado: fila.anulado,
    importado: fila.importado,
    creado_por: fila.creado_por,
    creado_en: fila.creado_en,
  };
}

export function aParametros(fila: ParametrosBD): Parametros {
  const denominaciones = (fila.denominaciones ?? [])
    .map(aNumero)
    .filter((d) => d > 0)
    .sort((a, b) => b - a);
  return {
    caja_chica_min: aNumero(fila.caja_chica_min),
    caja_chica_max: aNumero(fila.caja_chica_max),
    caja_chica_alerta: fila.caja_chica_alerta === null ? null : aNumero(fila.caja_chica_alerta),
    base_caja_diaria: aNumero(fila.base_caja_diaria),
    saldo_inicial_caja_chica: aNumero(fila.saldo_inicial_caja_chica),
    fecha_corte: fila.fecha_corte,
    tolerancia_arqueo: aNumero(fila.tolerancia_arqueo),
    hora_inicio_noche: String(fila.hora_inicio_noche).slice(0, 5),
    denominaciones: denominaciones.length ? denominaciones : DENOMINACIONES_PEN,
  };
}
