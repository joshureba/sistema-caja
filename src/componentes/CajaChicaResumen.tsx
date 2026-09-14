import { clsx } from 'clsx';
import { AlertTriangle, Check, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { ETIQUETA_ESTADO_CAJA_CHICA, estadoCajaChica, formatearSoles, type EstadoCajaChica, type Parametros } from '@/dominio';
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
  ANTES_DEL_CORTE: <Info className="size-3" aria-hidden />,
  BAJO_MINIMO: <XCircle className="size-3" aria-hidden />,
  ALERTA: <AlertTriangle className="size-3" aria-hidden />,
  OPTIMO: <Check className="size-3" strokeWidth={3} aria-hidden />,
  EXCEDE_MAXIMO: <XCircle className="size-3" aria-hidden />,
};

export function InsigniaEstadoCajaChica({ estado }: { estado: EstadoCajaChica }) {
  return (
    <Insignia tono={TONO_ESTADO[estado]} icono={ICONO_ESTADO[estado]}>
      {ETIQUETA_ESTADO_CAJA_CHICA[estado]}
    </Insignia>
  );
}

/**
 * Escala vertical del saldo de caja chica: el mismo instrumento en toda la app.
 * De abajo arriba: bajo mínimo, banda de alerta, rango correcto y exceso. El estado siempre va con texto.
 */
export function MedidorCajaChica({ saldo, parametros, alto = 184, className }: { saldo: number | null; parametros: Parametros; alto?: number; className?: string }) {
  const { caja_chica_min: minimo, caja_chica_max: maximo, caja_chica_alerta: alerta } = parametros;
  const estado = estadoCajaChica(saldo, parametros);
  const tope = Math.max(maximo * 1.15, (saldo ?? 0) * 1.05);
  const pos = (v: number) => Math.min(100, Math.max(0, (v / tope) * 100));
  const umbral = alerta !== null && alerta > minimo ? alerta : minimo;
  // Etiquetas separadas al menos ~14px para que no se monten.
  const separacion = (18 / alto) * 100;
  const mostrarAlerta = alerta !== null && pos(alerta) - pos(minimo) >= separacion && pos(maximo) - pos(alerta) >= separacion;
  const fuera = estado === 'BAJO_MINIMO' || estado === 'EXCEDE_MAXIMO';

  const marcas: { valor: number; texto: string; clase: string }[] = [
    { valor: maximo, texto: `Máx. ${formatoCorto.format(maximo)}`, clase: 'text-tinta-2' },
    ...(mostrarAlerta && alerta !== null ? [{ valor: alerta, texto: `Alerta ${formatoCorto.format(alerta)}`, clase: 'text-rojo' }] : []),
    { valor: minimo, texto: `Mín. ${formatoCorto.format(minimo)}`, clase: 'text-tinta-2' },
  ];

  return (
    <div
      className={clsx('relative flex gap-2', className)}
      style={{ height: alto }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={tope}
      aria-valuenow={saldo ?? 0}
      aria-valuetext={saldo === null ? 'Sin saldo antes del corte' : `${formatearSoles(saldo)}, ${ETIQUETA_ESTADO_CAJA_CHICA[estado]}`}
      aria-label="Saldo de caja chica frente al rango permitido"
    >
      {/* Riel */}
      <div className="relative w-3.5 shrink-0 overflow-hidden rounded-[2px] border border-tinta-3/50 bg-papel-2">
        <div className="absolute inset-x-0 bottom-0 bg-rojo-claro" style={{ height: `${pos(minimo)}%` }} />
        {umbral > minimo && (
          <div
            className="absolute inset-x-0 bg-[repeating-linear-gradient(135deg,rgb(191_42_42/0.35)_0_3px,transparent_3px_6px)]"
            style={{ bottom: `${pos(minimo)}%`, height: `${pos(umbral) - pos(minimo)}%` }}
          />
        )}
        <div className="absolute inset-x-0 bg-sello-claro" style={{ bottom: `${pos(umbral)}%`, height: `${pos(maximo) - pos(umbral)}%` }} />
        <div className="absolute inset-x-0 bg-rojo-claro" style={{ bottom: `${pos(maximo)}%`, top: 0 }} />
      </div>

      {/* Marcas del rango */}
      <div className="relative min-w-[5.5rem] flex-1" aria-hidden>
        {marcas.map((m) => (
          <div key={m.texto} className="absolute left-0 flex w-full items-center gap-1" style={{ bottom: `calc(${pos(m.valor)}% - 0.5px)`, transform: 'translateY(50%)' }}>
            <span className="h-px w-2 bg-tinta-3" />
            <span className={clsx('cifra text-[10.5px] whitespace-nowrap', m.clase)}>{m.texto}</span>
          </div>
        ))}
      </div>

      {/* Aguja del saldo */}
      {saldo !== null && (
        <div className="pointer-events-none absolute left-0 flex items-center" style={{ bottom: `${pos(saldo)}%`, transform: 'translateY(50%)' }} aria-hidden>
          <span className={clsx('h-[3px] w-5 -ml-1', fuera ? 'bg-rojo' : 'bg-tinta')} />
          <span className={clsx('size-0 border-y-[5px] border-l-[7px] border-y-transparent', fuera ? 'border-l-rojo' : 'border-l-tinta')} />
        </div>
      )}
    </div>
  );
}
