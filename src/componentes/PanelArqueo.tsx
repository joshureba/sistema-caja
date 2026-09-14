import { clsx } from 'clsx';
import { History } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { useObservacionesArqueo, usePerfiles } from '@/datos/consultas';
import { formatearSoles, type Conteo, type ResultadoArqueo } from '@/dominio';
import { aNumero } from '@/lib/normalizar';
import type { ArqueoBD } from '@/lib/tipos-bd';
import { ContadorDenominaciones } from './ContadorDenominaciones';
import { Alerta, AreaTexto, Boton, Campo, Insignia, LineaCinta, Tarjeta } from './ui';

const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

interface Props {
  titulo: ReactNode;
  subtitulo: ReactNode;
  etiquetaTeorico: string;
  denominaciones: number[];
  tolerancia: number;
  conteo: Conteo;
  onCambioConteo: (conteo: Conteo) => void;
  resultado: ResultadoArqueo;
  arqueo: ArqueoBD | undefined;
  /** El conteo en pantalla es el mismo que el guardado. */
  conteoGuardado: boolean;
  puedeEditar: boolean;
  guardando: boolean;
  /** Guarda el conteo y agrega la nota al historial. Si falla, la nota se conserva en el campo. */
  onGuardar: (nota: string) => Promise<void>;
  className?: string;
}

/** Arqueo por denominaciones con observaciones que se acumulan en un historial. */
export function PanelArqueo({ titulo, subtitulo, etiquetaTeorico, denominaciones, tolerancia, conteo, onCambioConteo, resultado, arqueo, conteoGuardado, puedeEditar, guardando, onGuardar, className }: Props) {
  const [nota, setNota] = useState('');
  const campoNota = useRef<HTMLTextAreaElement>(null);
  const botonGuardar = useRef<HTMLButtonElement>(null);
  // Sin arqueo guardado y sin nada contado, todavía no hay diferencia que reclamar.
  const pendiente = !arqueo && resultado.total_contado === 0;
  const hayNota = nota.trim().length > 0;
  const soloNota = conteoGuardado && hayNota;

  async function guardar() {
    try {
      await onGuardar(nota);
      setNota('');
    } catch {
      // el error lo muestra la página; la nota queda para reintentar
    }
  }

  return (
    <Tarjeta titulo={titulo} subtitulo={subtitulo} sinRelleno className={className}>
      <ContadorDenominaciones
        denominaciones={denominaciones}
        conteo={conteo}
        onCambio={onCambioConteo}
        soloLectura={!puedeEditar}
        onUltimoEnter={() => (campoNota.current ?? botonGuardar.current)?.focus()}
      />
      <div className="space-y-3 border-t border-dashed border-raya p-5">
        <dl>
          <LineaCinta etiqueta={etiquetaTeorico} valor={formatearSoles(resultado.total_teorico)} />
          <LineaCinta
            etiqueta="Diferencia"
            valor={pendiente ? '—' : `${resultado.diferencia > 0 ? '+' : ''}${formatearSoles(resultado.diferencia)}`}
            salida={!pendiente && resultado.diferencia < 0}
            fuerte
          />
        </dl>
        <div className="flex items-center justify-between">
          <span className="text-[14px] text-tinta-2">Estado</span>
          {pendiente ? <Insignia tono="neutro">Pendiente de conteo</Insignia> : <Insignia tono={resultado.estado === 'CUADRA' ? 'exito' : 'peligro'}>{resultado.estado}</Insignia>}
        </div>
        {!pendiente && resultado.estado === 'REVISAR' && (
          <Alerta tono="alerta">
            La diferencia supera la tolerancia de {formatearSoles(tolerancia)}. Revisa el conteo y los movimientos; si persiste, deja una observación.
          </Alerta>
        )}
        {puedeEditar && (
          <>
            <Campo etiqueta="Nueva observación" ayuda="Al guardar pasa al historial y el campo queda libre para la siguiente.">
              <AreaTexto ref={campoNota} rows={2} value={nota} onChange={(e) => setNota(e.target.value)} />
            </Campo>
            <div className="no-imprimir flex justify-end">
              <Boton ref={botonGuardar} onClick={() => void guardar()} cargando={guardando} disabled={conteoGuardado && !hayNota}>
                {soloNota ? 'Agregar observación' : arqueo ? 'Actualizar arqueo' : 'Guardar arqueo'}
              </Boton>
            </div>
          </>
        )}
      </div>
      {arqueo && <HistorialObservaciones arqueoId={arqueo.id} />}
    </Tarjeta>
  );
}

export function HistorialObservaciones({ arqueoId, className }: { arqueoId: number; className?: string }) {
  const observaciones = useObservacionesArqueo(arqueoId);
  const perfiles = usePerfiles();
  const nombres = new Map((perfiles.data ?? []).map((p) => [p.id, p.nombre]));
  const lista = observaciones.data ?? [];
  if (!observaciones.isPending && lista.length === 0) return null;

  return (
    <section className={clsx('border-t border-dashed border-raya px-5 py-4', className)} aria-label="Historial de observaciones">
      <h3 className="rotulo flex items-center gap-1.5 text-[12px] text-tinta-2">
        <History className="size-3.5" aria-hidden />
        Historial de observaciones <span className="cifra font-normal text-tinta-3">({lista.length})</span>
      </h3>
      {observaciones.isPending ? (
        <p className="mt-3 text-[13px] text-tinta-3">Cargando historial…</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {lista.map((o) => {
            const diferencia = o.diferencia === null ? null : aNumero(o.diferencia);
            return (
              <li key={o.id} className="border-l border-dotted border-tinta-3/60 pl-3">
                <p className="text-[14px] leading-snug whitespace-pre-wrap text-tinta">{o.texto}</p>
                <p className="mt-1 text-[12px] text-tinta-3">
                  <span className="cifra">{fechaHora(o.creado_en)}</span> · {o.creado_por ? (nombres.get(o.creado_por) ?? 'Usuario') : 'Importación'}
                  {o.total_contado !== null && (
                    <>
                      {' '}
                      · contado <span className="cifra">{formatearSoles(aNumero(o.total_contado))}</span>
                    </>
                  )}
                  {diferencia !== null && (
                    <>
                      {' '}
                      · dif. <span className={clsx('cifra', diferencia < 0 && 'text-rojo')}>{formatearSoles(diferencia)}</span>
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
