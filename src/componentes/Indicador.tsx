import { clsx } from 'clsx';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatearNumero, formatearSoles, redondear } from '@/dominio';

interface PropsIndicador {
  etiqueta: string;
  valor: number;
  formato?: 'soles' | 'entero' | 'decimal';
  /** Diferencia contra el período anterior (mismo formato que `valor`). */
  delta?: number | null;
  deltaEtiqueta?: string;
  /** Si subir es una buena noticia (ingresos) o mala (egresos). */
  subirEsBueno?: boolean;
  nota?: ReactNode;
  icono?: ReactNode;
  className?: string;
}

function formatear(valor: number, formato: PropsIndicador['formato']): string {
  if (formato === 'entero') return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(valor);
  if (formato === 'decimal') return formatearNumero(valor);
  return formatearSoles(valor);
}

export function Indicador({ etiqueta, valor, formato = 'soles', delta, deltaEtiqueta = 'vs. período anterior', subirEsBueno = true, nota, icono, className }: PropsIndicador) {
  const d = delta === null || delta === undefined ? null : redondear(delta);
  const direccion = d === null ? null : d > 0 ? 'sube' : d < 0 ? 'baja' : 'igual';
  const bueno = direccion === 'igual' || direccion === null ? null : (direccion === 'sube') === subirEsBueno;
  return (
    <div className={clsx('rounded-xl border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{etiqueta}</p>
        {icono && <span className="text-slate-400">{icono}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{formatear(valor, formato)}</p>
      {direccion !== null && d !== null && (
        <p className={clsx('mt-1 flex items-center gap-1 text-xs', bueno === null ? 'text-slate-500' : bueno ? 'text-emerald-700' : 'text-red-700')}>
          {direccion === 'sube' ? <ArrowUpRight className="size-3.5" aria-hidden /> : direccion === 'baja' ? <ArrowDownRight className="size-3.5" aria-hidden /> : <Minus className="size-3.5" aria-hidden />}
          <span className="tabular-nums">
            {d > 0 ? '+' : ''}
            {formatear(d, formato)}
          </span>
          <span className="text-slate-400">{deltaEtiqueta}</span>
        </p>
      )}
      {nota && <p className="mt-1 text-xs text-slate-500">{nota}</p>}
    </div>
  );
}
