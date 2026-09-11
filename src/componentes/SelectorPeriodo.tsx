import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ETIQUETA_PERIODO, PERIODOS, formatearFecha, hoyISO, rangoAnterior, rangoPeriodo, rangoSiguiente, type TipoPeriodo } from '@/dominio';
import { Entrada } from './ui';

interface Props {
  tipo: TipoPeriodo;
  fechaRef: string;
  onCambio: (tipo: TipoPeriodo, fechaRef: string) => void;
}

/** Una sola fila de filtros que gobierna todo lo que está debajo. */
export function SelectorPeriodo({ tipo, fechaRef, onCambio }: Props) {
  const rango = rangoPeriodo(tipo, fechaRef);
  return (
    <div className="no-imprimir flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Tipo de período">
        {PERIODOS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onCambio(p, fechaRef)}
            aria-pressed={p === tipo}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              p === tipo ? 'bg-marca-800 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {ETIQUETA_PERIODO[p]}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button type="button" onClick={() => onCambio(tipo, rangoAnterior(tipo, rango).desde)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Período anterior">
          <ChevronLeft className="size-5" />
        </button>
        <Entrada type="date" value={fechaRef} onChange={(e) => e.target.value && onCambio(tipo, e.target.value)} className="w-40! shrink-0" aria-label="Fecha de referencia" />
        <button type="button" onClick={() => onCambio(tipo, rangoSiguiente(tipo, rango).desde)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Período siguiente">
          <ChevronRight className="size-5" />
        </button>
        <button type="button" onClick={() => onCambio(tipo, hoyISO())} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          Hoy
        </button>
      </div>
      <p className="w-full text-sm text-slate-500 sm:w-auto">
        {rango.desde === rango.hasta ? formatearFecha(rango.desde, 'largo') : `${formatearFecha(rango.desde)} al ${formatearFecha(rango.hasta)}`}
      </p>
    </div>
  );
}
