import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { ETIQUETA_ESTADO_CAJA_CHICA, estadoCajaChica, type EstadoCajaChica, type Parametros } from '@/dominio';
import { Insignia, type Tono } from './ui';

const formatoCorto = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });

export const TONO_ESTADO: Record<EstadoCajaChica, Tono> = {
  ANTES_DEL_CORTE: 'neutro',
  BAJO_MINIMO: 'peligro',
  ALERTA: 'alerta',
  OPTIMO: 'exito',
  EXCEDE_MAXIMO: 'peligro',
};

const ICONO_ESTADO: Record<EstadoCajaChica, ReactNode> = {
  ANTES_DEL_CORTE: <Info className="size-3.5" aria-hidden />,
  BAJO_MINIMO: <XCircle className="size-3.5" aria-hidden />,
  ALERTA: <AlertTriangle className="size-3.5" aria-hidden />,
  OPTIMO: <CheckCircle2 className="size-3.5" aria-hidden />,
  EXCEDE_MAXIMO: <XCircle className="size-3.5" aria-hidden />,
};

export function InsigniaEstadoCajaChica({ estado }: { estado: EstadoCajaChica }) {
  return (
    <Insignia tono={TONO_ESTADO[estado]} icono={ICONO_ESTADO[estado]}>
      {ETIQUETA_ESTADO_CAJA_CHICA[estado]}
    </Insignia>
  );
}

/** Medidor del saldo contra el rango mínimo y máximo. El color sigue al estado y siempre va acompañado de etiqueta. */
export function MedidorCajaChica({ saldo, parametros }: { saldo: number | null; parametros: Parametros }) {
  const { caja_chica_min: minimo, caja_chica_max: maximo, caja_chica_alerta: alerta } = parametros;
  const estado = estadoCajaChica(saldo, parametros);
  const tope = Math.max(maximo * 1.15, saldo ?? 0);
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / tope) * 100))}%`;
  const colorRelleno = { ANTES_DEL_CORTE: 'bg-slate-300', BAJO_MINIMO: 'bg-red-500', ALERTA: 'bg-amber-400', OPTIMO: 'bg-emerald-500', EXCEDE_MAXIMO: 'bg-red-500' }[estado];
  return (
    <div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200" role="meter" aria-valuemin={0} aria-valuemax={tope} aria-valuenow={saldo ?? 0} aria-label="Saldo de caja chica frente al rango">
        <div className={clsx('h-full rounded-full transition-all', colorRelleno)} style={{ width: pct(saldo ?? 0) }} />
        <span className="absolute inset-y-0 w-0.5 bg-slate-700" style={{ left: pct(minimo) }} aria-hidden />
        {alerta !== null && <span className="absolute inset-y-0 w-0.5 bg-slate-500" style={{ left: pct(alerta) }} aria-hidden />}
        <span className="absolute inset-y-0 w-0.5 bg-slate-700" style={{ left: pct(maximo) }} aria-hidden />
      </div>
      <div className="relative mt-1 h-4 text-[11px] whitespace-nowrap text-slate-500">
        <span className="absolute -translate-x-1/2" style={{ left: pct(minimo) }}>
          Mín. {formatoCorto.format(minimo)}
        </span>
        <span className="absolute -translate-x-full" style={{ left: pct(maximo) }}>
          Máx. {formatoCorto.format(maximo)}
        </span>
      </div>
    </div>
  );
}
