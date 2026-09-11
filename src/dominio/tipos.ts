/**
 * Tipos del dominio de caja. Sin dependencias de React ni de Supabase.
 */

export const TIPOS_MOVIMIENTO = ['INGRESO', 'EGRESO', 'REPOSICION_CAJA_CHICA', 'RETIRO'] as const;
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

export const ETIQUETA_TIPO: Record<TipoMovimiento, string> = {
  INGRESO: 'Ingreso',
  EGRESO: 'Egreso',
  REPOSICION_CAJA_CHICA: 'Reposición caja chica',
  RETIRO: 'Retiro de efectivo',
};

export type TipoCaja = 'DIARIA' | 'CHICA';
export const ETIQUETA_CAJA: Record<TipoCaja, string> = { DIARIA: 'Caja diaria', CHICA: 'Caja chica' };

export const TURNOS = ['MAÑANA', 'NOCHE'] as const;
export type Turno = (typeof TURNOS)[number];

export const ESTADOS_SUSTENTO = ['CON COMPROBANTE', 'SIN COMPROBANTE', 'PENDIENTE'] as const;
export type EstadoSustento = (typeof ESTADOS_SUSTENTO)[number];

export const ORIGENES_REPOSICION = ['BANCO', 'CAJA_DIARIA'] as const;
export type OrigenReposicion = (typeof ORIGENES_REPOSICION)[number];
export const ETIQUETA_ORIGEN: Record<OrigenReposicion, string> = { BANCO: 'Banco', CAJA_DIARIA: 'Caja diaria' };

export const DESTINOS_RETIRO = ['BANCO', 'OTRO'] as const;
export type DestinoRetiro = (typeof DESTINOS_RETIRO)[number];
export const ETIQUETA_DESTINO: Record<DestinoRetiro, string> = { BANCO: 'Banco', OTRO: 'Otro' };

export const PERIODOS = ['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'SEMESTRAL', 'ANUAL'] as const;
export type TipoPeriodo = (typeof PERIODOS)[number];

export type EstadoCajaChica = 'ANTES_DEL_CORTE' | 'BAJO_MINIMO' | 'ALERTA' | 'OPTIMO' | 'EXCEDE_MAXIMO';
export type EstadoArqueo = 'CUADRA' | 'REVISAR';
export type EstadoJornada = 'ABIERTA' | 'CERRADA';

export interface Movimiento {
  id: number;
  jornada_id: number | null;
  /** Fecha en formato ISO 'YYYY-MM-DD'. */
  fecha: string;
  turno: Turno;
  tipo: TipoMovimiento;
  estado_sustento: EstadoSustento | null;
  comprobante: string | null;
  serie: string | null;
  numero: string | null;
  ruc_dni: string | null;
  nombre: string | null;
  area: string | null;
  descripcion: string;
  medio_pago: string | null;
  cuenta: string | null;
  num_operacion: string | null;
  /** Solo para INGRESO. */
  monto_digital: number;
  /** Solo para INGRESO. */
  monto_efectivo: number;
  /** Para EGRESO, REPOSICION_CAJA_CHICA y RETIRO. */
  monto: number;
  /** Solo REPOSICION_CAJA_CHICA: de dónde sale el dinero. */
  origen: OrigenReposicion | null;
  /** Solo RETIRO: de qué caja sale el efectivo. */
  caja_retiro: TipoCaja | null;
  /** Solo RETIRO: a dónde va el efectivo. */
  destino: DestinoRetiro | null;
  observacion: string | null;
  anulado: boolean;
  importado: boolean;
  creado_por: string | null;
  creado_en: string;
}

export interface Parametros {
  caja_chica_min: number;
  caja_chica_max: number;
  /** Umbral ámbar: saldo por encima del mínimo pero cerca de él. `null` desactiva la banda. */
  caja_chica_alerta: number | null;
  base_caja_diaria: number;
  saldo_inicial_caja_chica: number;
  /** Fecha ISO desde la cual se lleva el saldo de caja chica. */
  fecha_corte: string;
  tolerancia_arqueo: number;
  /** 'HH:mm' (se admite 'HH:mm:ss'). */
  hora_inicio_noche: string;
  denominaciones: number[];
}

export const DENOMINACIONES_PEN = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1];

export const PARAMETROS_POR_DEFECTO: Parametros = {
  caja_chica_min: 3000,
  caja_chica_max: 5000,
  caja_chica_alerta: 3500,
  base_caja_diaria: 500,
  saldo_inicial_caja_chica: 5000,
  fecha_corte: '2026-09-06',
  tolerancia_arqueo: 0.01,
  hora_inicio_noche: '17:00',
  denominaciones: DENOMINACIONES_PEN,
};
