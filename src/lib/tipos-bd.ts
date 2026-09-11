import type { Database, Tables, TablesInsert, TablesUpdate } from './database.types';

export type MovimientoBD = Tables<'movimientos'>;
export type MovimientoInsertar = TablesInsert<'movimientos'>;
export type MovimientoActualizar = TablesUpdate<'movimientos'>;
export type JornadaBD = Tables<'jornadas'>;
export type JornadaInsertar = TablesInsert<'jornadas'>;
export type JornadaActualizar = TablesUpdate<'jornadas'>;
export type ArqueoBD = Tables<'arqueos'>;
export type ArqueoInsertar = TablesInsert<'arqueos'>;
export type PerfilBD = Tables<'perfiles'>;
export type PerfilActualizar = TablesUpdate<'perfiles'>;
export type ParametrosBD = Tables<'parametros'>;
export type ParametrosActualizar = TablesUpdate<'parametros'>;
export type CatalogoBD = Tables<'catalogos'>;
export type CatalogoInsertar = TablesInsert<'catalogos'>;
export type AuditoriaBD = Tables<'auditoria'>;

export type RolUsuario = Database['public']['Enums']['rol_usuario'];

export const TIPOS_CATALOGO = ['AREA', 'MEDIO_PAGO', 'CUENTA', 'COMPROBANTE'] as const;
export type TipoCatalogo = (typeof TIPOS_CATALOGO)[number];
export const ETIQUETA_CATALOGO: Record<TipoCatalogo, string> = {
  AREA: 'Áreas',
  MEDIO_PAGO: 'Medios de pago',
  CUENTA: 'Cuentas',
  COMPROBANTE: 'Tipos de comprobante',
};
export type CatalogosPorTipo = Record<TipoCatalogo, CatalogoBD[]>;
