import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';
import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { formatearNumero, formatearSoles } from '@/dominio';

// ---------- Botón ----------
type Variante = 'primario' | 'secundario' | 'peligro' | 'exito' | 'fantasma';

interface PropsBoton extends ComponentProps<'button'> {
  variante?: Variante;
  tamano?: 'sm' | 'md' | 'lg';
  cargando?: boolean;
  icono?: ReactNode;
}

const estilosBoton: Record<Variante, string> = {
  primario: 'bg-sello text-white hover:bg-sello-2 shadow-[0_1px_0_rgb(8_20_50/0.35)]',
  secundario: 'border border-borde-control/70 bg-papel text-tinta hover:bg-white hover:border-tinta-3',
  peligro: 'bg-rojo text-white hover:bg-rojo-2 shadow-[0_1px_0_rgb(60_10_10/0.35)]',
  // «Emitir»: tinta negra, para acciones que dejan constancia (cierre Z).
  exito: 'bg-tinta text-papel hover:bg-black shadow-[0_1px_0_rgb(0_0_0/0.4)]',
  fantasma: 'bg-transparent text-tinta-2 hover:bg-papel-2 hover:text-tinta',
};

const tamanosBoton = { sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-[14px]', lg: 'h-12 px-6 text-[15px]' };

export function Boton({ variante = 'primario', tamano = 'md', cargando, icono, className, children, disabled, type = 'button', ...resto }: PropsBoton) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[3px] font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0',
        estilosBoton[variante],
        tamanosBoton[tamano],
        className,
      )}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icono}
      {children}
    </button>
  );
}

/** Botón de solo icono con nombre accesible obligatorio. */
export function BotonIcono({ etiqueta, className, children, tono = 'papel', ...resto }: ComponentProps<'button'> & { etiqueta: string; tono?: 'papel' | 'campo' }) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      className={clsx(
        'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[3px] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        tono === 'campo' ? 'text-campo-tinta hover:bg-campo-2 hover:text-white' : 'text-tinta-2 hover:bg-papel-2 hover:text-tinta',
        className,
      )}
      {...resto}
    >
      {children}
    </button>
  );
}

// ---------- Hoja (panel de papel) ----------
export function Tarjeta({
  titulo,
  subtitulo,
  acciones,
  children,
  className,
  sinRelleno,
}: {
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
  sinRelleno?: boolean;
}) {
  return (
    <section className={clsx('rounded-[3px] bg-papel shadow-hoja', className)}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-dashed border-raya px-5 py-3.5">
          <div className="min-w-0">
            {titulo && <h2 className="rotulo text-[13px] text-tinta">{titulo}</h2>}
            {subtitulo && <p className="mt-0.5 text-[13px] text-tinta-3">{subtitulo}</p>}
          </div>
          {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
        </header>
      )}
      <div className={clsx(!sinRelleno && 'p-5')}>{children}</div>
    </section>
  );
}

// ---------- Cinta (papel térmico con borde dentado) ----------
export function Cinta({
  titulo,
  subtitulo,
  children,
  className,
  bordes = 'abajo',
  alineacion = 'centro',
}: {
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  children: ReactNode;
  className?: string;
  bordes?: 'abajo' | 'ambos';
  alineacion?: 'centro' | 'izquierda';
}) {
  return (
    <section className={clsx('sombra-cinta', className)}>
      <div className={clsx('flex h-full flex-col bg-papel', bordes === 'abajo' ? 'dentado-abajo' : 'dentado-ambos')}>
        {titulo && (
          <header className={clsx('px-5 pt-4', alineacion === 'centro' ? 'text-center' : 'text-left')}>
            <h2 className="rotulo text-[13px] text-tinta">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-[12.5px] text-tinta-3">{subtitulo}</p>}
            <RayaCinta className="mt-3" />
          </header>
        )}
        <div className="flex flex-1 flex-col px-5 pt-3 pb-2">{children}</div>
      </div>
    </section>
  );
}

export function RayaCinta({ className, doble }: { className?: string; doble?: boolean }) {
  return <div role="presentation" className={clsx('border-dashed border-tinta-3/45', doble ? 'h-1 border-y' : 'border-t', className)} />;
}

/**
 * Renglón con puntos guía: «Etiqueta ........ S/ 0.00». Va dentro de un <dl>.
 * Con `monto`, el signo y la tinta roja solo se imprimen cuando el monto no es cero.
 */
export function LineaCinta({
  etiqueta,
  valor: valorTexto,
  monto,
  signo: signoPedido,
  fuerte,
  salida: salidaPedida,
  className,
}: {
  etiqueta: ReactNode;
  valor?: ReactNode;
  monto?: number | null;
  signo?: '+' | '−';
  fuerte?: boolean;
  salida?: boolean;
  className?: string;
}) {
  const conMonto = monto !== undefined;
  const cero = conMonto && (monto === null || monto === 0);
  const valor = conMonto ? (monto === null ? '—' : formatearSoles(monto)) : valorTexto;
  const signo = cero ? undefined : signoPedido;
  const salida = cero ? false : salidaPedida;
  return (
    <div className={clsx('flex items-baseline gap-2 py-[5px] text-[14px]', fuerte && 'font-semibold', className)}>
      <dt className="flex min-w-0 flex-1 items-baseline gap-2 text-tinta-2 after:min-w-6 after:flex-1 after:translate-y-[-4px] after:border-b after:border-dotted after:border-tinta-3/60 after:content-['']">
        <span className={clsx('min-w-0', fuerte && 'text-tinta')}>{etiqueta}</span>
      </dt>
      <dd className={clsx('cifra shrink-0 text-[13.5px]', salida ? 'text-rojo' : 'text-tinta')}>
        {signo && <span className="mr-0.5">{signo}</span>}
        {valor}
      </dd>
    </div>
  );
}

/** Monto grande a doble ancho con el símbolo S/ reducido. */
export function MontoDoble({ valor, className, salida }: { valor: number | null; className?: string; salida?: boolean }) {
  if (valor === null) return <span className={clsx('cifra-doble text-tinta-3', className)}>—</span>;
  return (
    <span className={clsx('cifra-doble inline-flex items-baseline gap-[0.18em] whitespace-nowrap', salida || valor < 0 ? 'text-rojo' : 'text-tinta', className)} aria-label={formatearSoles(valor)}>
      <span className="text-[0.5em] font-medium tracking-normal" aria-hidden>
        S/
      </span>
      <span aria-hidden>{formatearNumero(valor)}</span>
    </span>
  );
}

/** Correlativo como en la registradora: N.º 000125. */
export function Correlativo({ numero, className }: { numero: number; className?: string }) {
  return <span className={clsx('cifra text-[12px] text-tinta-3', className)}>N.º {String(numero).padStart(6, '0')}</span>;
}

export function Tecla({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={clsx('cifra rounded-[2px] border border-current/35 px-1 py-px text-[10.5px] leading-none font-medium', className)}>{children}</kbd>;
}

// ---------- Sello (insignia de estado) ----------
export type Tono = 'neutro' | 'exito' | 'alerta' | 'peligro' | 'info' | 'salida';

const estilosInsignia: Record<Tono, string> = {
  neutro: 'border-tinta-3/60 text-tinta-2',
  exito: 'border-sello text-sello',
  info: 'border-sello/50 bg-sello-claro text-sello-2',
  salida: 'border-rojo/70 text-rojo',
  alerta: 'border-dashed border-rojo text-rojo',
  peligro: 'border-rojo bg-rojo text-white',
};

export function Insignia({ tono = 'neutro', icono, children, className }: { tono?: Tono; icono?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-[2px] border-[1.5px] px-1.5 py-[3px] font-mono text-[10.5px] leading-none font-semibold tracking-[0.02em] whitespace-nowrap uppercase [font-stretch:75%]',
        estilosInsignia[tono],
        className,
      )}
    >
      {icono}
      {children}
    </span>
  );
}

// ---------- Selector segmentado ----------
export function Segmentado<T extends string>({
  opciones,
  valor,
  onCambio,
  etiqueta,
  tamano = 'md',
  className,
}: {
  opciones: readonly { valor: T; etiqueta: ReactNode }[];
  valor: T;
  onCambio: (valor: T) => void;
  etiqueta: string;
  tamano?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div role="group" aria-label={etiqueta} className={clsx('inline-flex flex-wrap gap-0.5 rounded-[3px] border border-raya bg-papel-2 p-0.5', className)}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onCambio(o.valor)}
          aria-pressed={o.valor === valor}
          className={clsx(
            'cursor-pointer rounded-[2px] font-semibold transition-colors duration-150',
            tamano === 'sm' ? 'px-2.5 py-1 text-[12.5px]' : 'px-3 py-1.5 text-[13.5px]',
            o.valor === valor ? 'bg-tinta text-papel shadow-[0_1px_0_rgb(0_0_0/0.3)]' : 'text-tinta-2 hover:bg-papel hover:text-tinta',
          )}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

// ---------- Formularios ----------
export function Campo({
  etiqueta,
  error,
  ayuda,
  requerido,
  children,
  className,
}: {
  etiqueta: ReactNode;
  error?: string;
  ayuda?: ReactNode;
  requerido?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-tinta-2">
        {etiqueta}
        {requerido && (
          <span className="text-rojo" aria-hidden>
            {' '}
            *
          </span>
        )}
      </span>
      {children}
      {error ? (
        <span className="mt-1 flex items-center gap-1 text-[12.5px] font-medium text-rojo">
          <XCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </span>
      ) : ayuda ? (
        <span className="mt-1 block text-[12.5px] text-tinta-3">{ayuda}</span>
      ) : null}
    </label>
  );
}

export const claseControl =
  'h-10 w-full rounded-[3px] border border-borde-control bg-white px-3 text-[14px] text-tinta shadow-control transition-[border-color,box-shadow] duration-150 placeholder:text-tinta-3 hover:border-tinta-2 focus:border-sello focus:ring-2 focus:ring-sello/25 focus:outline-none disabled:bg-papel-2 disabled:text-tinta-3 read-only:bg-papel-2 aria-[invalid=true]:border-rojo aria-[invalid=true]:ring-rojo/20';

export function Entrada({ className, ...resto }: ComponentProps<'input'>) {
  return <input className={clsx(claseControl, className)} {...resto} />;
}

export function Selector({ className, children, ...resto }: ComponentProps<'select'>) {
  return (
    <select className={clsx(claseControl, 'cursor-pointer pr-8', className)} {...resto}>
      {children}
    </select>
  );
}

export function AreaTexto({ className, ...resto }: ComponentProps<'textarea'>) {
  return <textarea className={clsx(claseControl, 'h-auto min-h-20 py-2 leading-relaxed', className)} {...resto} />;
}

export function Casilla({ etiqueta, className, ...resto }: ComponentProps<'input'> & { etiqueta: ReactNode }) {
  return (
    <label className={clsx('inline-flex cursor-pointer items-center gap-2 text-[14px] text-tinta-2', className)}>
      <input type="checkbox" className="size-4 cursor-pointer rounded-[2px] border-borde-control accent-sello" {...resto} />
      {etiqueta}
    </label>
  );
}

// ---------- Alerta ----------
const iconosAlerta: Record<Exclude<Tono, 'salida'>, ReactNode> = {
  neutro: <Info className="size-5 shrink-0 text-tinta-3" aria-hidden />,
  info: <Info className="size-5 shrink-0 text-sello" aria-hidden />,
  exito: <CheckCircle2 className="size-5 shrink-0 text-sello" aria-hidden />,
  alerta: <AlertTriangle className="size-5 shrink-0 text-rojo" aria-hidden />,
  peligro: <XCircle className="size-5 shrink-0 text-rojo" aria-hidden />,
};

const estilosAlerta: Record<Exclude<Tono, 'salida'>, string> = {
  neutro: 'border-raya bg-papel text-tinta-2',
  info: 'border-sello/30 bg-sello-claro text-tinta',
  exito: 'border-sello/30 bg-papel text-tinta',
  alerta: 'border-dashed border-rojo/70 bg-papel text-tinta',
  peligro: 'border-rojo/40 bg-rojo-claro text-red-900',
};

export function Alerta({ tono = 'info', titulo, children, className }: { tono?: Exclude<Tono, 'salida'>; titulo?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div role={tono === 'peligro' ? 'alert' : 'status'} className={clsx('flex gap-3 rounded-[3px] border-[1.5px] px-4 py-3 text-[14px] leading-snug', estilosAlerta[tono], className)}>
      {iconosAlerta[tono]}
      <div className="min-w-0">
        {titulo && <p className="font-semibold text-tinta">{titulo}</p>}
        {children && <div className={clsx(titulo && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
}

// ---------- Modal (diálogo nativo: foco atrapado, Esc y retorno de foco) ----------
const anchosModal = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' };

export function Modal({
  abierto,
  titulo,
  onCerrar,
  children,
  pie,
  ancho = 'md',
}: {
  abierto: boolean;
  titulo: ReactNode;
  onCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: keyof typeof anchosModal;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) {
      dialogo.showModal();
      dialogo.querySelector<HTMLElement>('[data-autofoco]')?.focus();
    }
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      className={clsx('m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-[3px] bg-papel p-0 text-tinta shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)]', anchosModal[ancho])}
    >
      {abierto && (
        <div>
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-dashed border-raya bg-papel px-5 py-3.5">
            <h2 className="text-[17px] font-semibold text-tinta">{titulo}</h2>
            <BotonIcono etiqueta="Cerrar" onClick={onCerrar}>
              <X className="size-5" aria-hidden />
            </BotonIcono>
          </header>
          <div className="px-5 py-4">{children}</div>
          {pie && <footer className="sticky bottom-0 z-10 flex flex-wrap justify-end gap-2 border-t border-dashed border-raya bg-papel px-5 py-3.5">{pie}</footer>}
        </div>
      )}
    </dialog>
  );
}

// ---------- Estados ----------
/** Carga como cinta que se imprime: renglones de papel en lugar de un spinner suelto. */
export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="mx-auto w-full max-w-sm py-10" role="status" aria-live="polite">
      <div className="sombra-cinta">
        <div className="dentado-abajo bg-papel px-5 pt-5 [animation:imprimir_900ms_cubic-bezier(0.16,1,0.3,1)_both]">
          <p className="rotulo text-center text-[12px] text-tinta-3">{texto}</p>
          <div className="mt-4 space-y-2.5 pb-2" aria-hidden>
            {[78, 64, 86, 52].map((ancho, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-2.5 animate-pulse rounded-[1px] bg-papel-3" style={{ width: `${ancho - 30}%` }} />
                <div className="h-px flex-1 border-b border-dotted border-tinta-3/40" />
                <div className="h-2.5 w-14 animate-pulse rounded-[1px] bg-papel-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Vacio({ titulo, descripcion, accion }: { titulo: ReactNode; descripcion?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
      <p className="rotulo text-[13px] text-tinta-2">{titulo}</p>
      {descripcion && <p className="max-w-md text-[14px] text-tinta-3">{descripcion}</p>}
      {accion && <div className="mt-3">{accion}</div>}
    </div>
  );
}

// ---------- Dinero ----------
export function Dinero({ valor, signo, className, resaltar }: { valor: number; signo?: boolean; className?: string; resaltar?: boolean }) {
  const color = signo ? (valor < 0 ? 'text-rojo' : valor > 0 ? 'text-tinta' : 'text-tinta-3') : undefined;
  return (
    <span className={clsx('cifra', color, resaltar && 'font-semibold', className)}>
      {signo && valor > 0 ? '+' : ''}
      {formatearSoles(valor)}
    </span>
  );
}

// ---------- Tabla ----------
export const claseTh = 'rotulo px-3 py-2.5 text-left text-[11.5px] text-tinta-3 whitespace-nowrap border-b border-dashed border-raya';
export const claseThNum = clsx(claseTh, 'text-right');
// Sin color propio: la celda hereda la tinta de la hoja y así `text-rojo` o `text-tinta-3` pueden sobrescribirla.
export const claseTd = 'px-3 py-2.5 align-top text-[14px]';
export const claseTdNum = clsx(claseTd, 'cifra text-right text-[13px] whitespace-nowrap');

export function Tabla({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('relative overflow-x-auto', className)}>
      <table className="min-w-full text-[14px] [&_tbody]:divide-papel-3 [&_tfoot_tr]:border-t-[1.5px] [&_tfoot_tr]:border-dashed [&_tfoot_tr]:border-tinta-3/45">{children}</table>
    </div>
  );
}
