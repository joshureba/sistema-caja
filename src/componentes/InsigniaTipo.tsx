import { ETIQUETA_TIPO, type EstadoSustento, type TipoMovimiento } from '@/dominio';
import { Insignia, type Tono } from './ui';

// Tinta bicolor: lo que sale de una caja va en rojo; lo que entra, en azul de sello.
const TONO_TIPO: Record<TipoMovimiento, Tono> = {
  INGRESO: 'exito',
  EGRESO: 'salida',
  REPOSICION_CAJA_CHICA: 'info',
  RETIRO: 'neutro',
};

export function InsigniaTipo({ tipo }: { tipo: TipoMovimiento }) {
  return <Insignia tono={TONO_TIPO[tipo]}>{ETIQUETA_TIPO[tipo]}</Insignia>;
}

const TONO_SUSTENTO: Record<EstadoSustento, Tono> = {
  'CON COMPROBANTE': 'neutro',
  'SIN COMPROBANTE': 'alerta',
  PENDIENTE: 'peligro',
};

export function InsigniaSustento({ estado }: { estado: EstadoSustento | null }) {
  if (!estado) return <span className="text-tinta-3">—</span>;
  return <Insignia tono={TONO_SUSTENTO[estado]}>{estado === 'CON COMPROBANTE' ? 'Con comp.' : estado === 'SIN COMPROBANTE' ? 'Sin comp.' : 'Pendiente'}</Insignia>;
}
