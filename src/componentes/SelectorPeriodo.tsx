import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ETIQUETA_PERIODO, PERIODOS, formatearFecha, hoyISO, rangoAnterior, rangoPeriodo, rangoSiguiente, type TipoPeriodo } from '@/dominio';
import { Boton, BotonIcono, Entrada, Segmentado } from './ui';

interface Props {
  tipo: TipoPeriodo;
  fechaRef: string;
  onCambio: (tipo: TipoPeriodo, fechaRef: string) => void;
}

const OPCIONES = PERIODOS.map((p) => ({ valor: p, etiqueta: ETIQUETA_PERIODO[p] }));

/** Una sola tira de filtros que gobierna todo lo que está debajo. */
export function SelectorPeriodo({ tipo, fechaRef, onCambio }: Props) {
  const rango = rangoPeriodo(tipo, fechaRef);
  return (
    <div className="no-imprimir flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[3px] bg-papel px-3 py-2.5 shadow-hoja">
      <Segmentado etiqueta="Tipo de período" opciones={OPCIONES} valor={tipo} onCambio={(p) => onCambio(p, fechaRef)} />
      <p className="cifra text-[13px] text-tinta-2" aria-live="polite">
        {rango.desde === rango.hasta ? formatearFecha(rango.desde) : `${formatearFecha(rango.desde)} → ${formatearFecha(rango.hasta)}`}
      </p>
      <div className="ml-auto flex items-center gap-1">
        <BotonIcono etiqueta="Período anterior" onClick={() => onCambio(tipo, rangoAnterior(tipo, rango).desde)}>
          <ChevronLeft className="size-5" aria-hidden />
        </BotonIcono>
        <Entrada type="date" value={fechaRef} onChange={(e) => e.target.value && onCambio(tipo, e.target.value)} className="cifra w-40! shrink-0 text-[13px]" aria-label="Fecha de referencia" />
        <BotonIcono etiqueta="Período siguiente" onClick={() => onCambio(tipo, rangoSiguiente(tipo, rango).desde)}>
          <ChevronRight className="size-5" aria-hidden />
        </BotonIcono>
        <Boton variante="secundario" tamano="md" onClick={() => onCambio(tipo, hoyISO())} className="ml-1">
          Hoy
        </Boton>
      </div>
    </div>
  );
}
