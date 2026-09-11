import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { formatearSoles } from '@/dominio';

// ---------- Botón ----------
type Variante = 'primario' | 'secundario' | 'peligro' | 'exito' | 'fantasma';

interface PropsBoton extends ComponentProps<'button'> {
  variante?: Variante;
  tamano?: 'sm' | 'md' | 'lg';
  cargando?: boolean;
  icono?: ReactNode;
}

const estilosBoton: Record<Variante, string> = {
  primario: 'bg-marca-800 text-white hover:bg-marca-700 focus-visible:ring-marca-400',
  secundario: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-marca-300',
  peligro: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300',
  exito: 'bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-300',
  fantasma: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-marca-300',
};

const tamanosBoton = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };

export function Boton({ variante = 'primario', tamano = 'md', cargando, icono, className, children, disabled, type = 'button', ...resto }: PropsBoton) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
        estilosBoton[variante],
        tamanosBoton[tamano],
        className,
      )}
      disabled={disabled || cargando}
      {...resto}
    >
      {cargando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icono}
      {children}
    </button>
  );
}

// ---------- Tarjeta ----------
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
    <section className={clsx('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            {titulo && <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>}
            {subtitulo && <p className="mt-0.5 text-sm text-slate-500">{subtitulo}</p>}
          </div>
          {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
        </header>
      )}
      <div className={clsx(!sinRelleno && 'p-5')}>{children}</div>
    </section>
  );
}

// ---------- Insignia ----------
export type Tono = 'neutro' | 'exito' | 'alerta' | 'peligro' | 'info';

const estilosInsignia: Record<Tono, string> = {
  neutro: 'bg-slate-100 text-slate-700 ring-slate-200',
  exito: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  alerta: 'bg-amber-50 text-amber-800 ring-amber-200',
  peligro: 'bg-red-50 text-red-800 ring-red-200',
  info: 'bg-marca-50 text-marca-800 ring-marca-200',
};

export function Insignia({ tono = 'neutro', icono, children, className }: { tono?: Tono; icono?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset', estilosInsignia[tono], className)}>
      {icono}
      {children}
    </span>
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
      <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {etiqueta}
        {requerido && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : ayuda ? <span className="mt-1 block text-xs text-slate-400">{ayuda}</span> : null}
    </label>
  );
}

export const claseControl =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-200 disabled:bg-slate-50 disabled:text-slate-500 aria-[invalid=true]:border-red-500';

export function Entrada({ className, ...resto }: ComponentProps<'input'>) {
  return <input className={clsx(claseControl, className)} {...resto} />;
}

export function Selector({ className, children, ...resto }: ComponentProps<'select'>) {
  return (
    <select className={clsx(claseControl, 'pr-8', className)} {...resto}>
      {children}
    </select>
  );
}

export function AreaTexto({ className, ...resto }: ComponentProps<'textarea'>) {
  return <textarea className={clsx(claseControl, 'h-auto min-h-20 py-2', className)} {...resto} />;
}

// ---------- Alerta ----------
const iconosAlerta: Record<Tono, ReactNode> = {
  neutro: <Info className="size-5 shrink-0" aria-hidden />,
  info: <Info className="size-5 shrink-0" aria-hidden />,
  exito: <CheckCircle2 className="size-5 shrink-0" aria-hidden />,
  alerta: <AlertTriangle className="size-5 shrink-0" aria-hidden />,
  peligro: <XCircle className="size-5 shrink-0" aria-hidden />,
};

const estilosAlerta: Record<Tono, string> = {
  neutro: 'border-slate-200 bg-slate-50 text-slate-700',
  info: 'border-marca-200 bg-marca-50 text-marca-900',
  exito: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  alerta: 'border-amber-200 bg-amber-50 text-amber-900',
  peligro: 'border-red-200 bg-red-50 text-red-900',
};

export function Alerta({ tono = 'info', titulo, children, className }: { tono?: Tono; titulo?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div role={tono === 'peligro' ? 'alert' : 'status'} className={clsx('flex gap-3 rounded-lg border px-4 py-3 text-sm', estilosAlerta[tono], className)}>
      {iconosAlerta[tono]}
      <div className="min-w-0">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={clsx(titulo && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
}

// ---------- Modal ----------
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
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className={clsx('my-auto w-full rounded-xl bg-white shadow-xl', anchosModal[ancho])}>
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-800">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {pie && <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">{pie}</footer>}
      </div>
    </div>
  );
}

// ---------- Estados ----------
export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      {texto}
    </div>
  );
}

export function Vacio({ titulo, descripcion, accion }: { titulo: ReactNode; descripcion?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <p className="text-base font-semibold text-slate-700">{titulo}</p>
      {descripcion && <p className="max-w-md text-sm text-slate-500">{descripcion}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}

// ---------- Dinero ----------
export function Dinero({ valor, signo, className, resaltar }: { valor: number; signo?: boolean; className?: string; resaltar?: boolean }) {
  const color = signo ? (valor < 0 ? 'text-red-700' : valor > 0 ? 'text-emerald-700' : 'text-slate-500') : undefined;
  return (
    <span className={clsx('tabular-nums', color, resaltar && 'font-semibold', className)}>
      {signo && valor > 0 ? '+' : ''}
      {formatearSoles(valor)}
    </span>
  );
}

// ---------- Tabla ----------
export const claseTh = 'px-3 py-2 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase whitespace-nowrap';
export const claseThNum = clsx(claseTh, 'text-right');
export const claseTd = 'px-3 py-2 align-top text-sm text-slate-700';
export const claseTdNum = clsx(claseTd, 'text-right tabular-nums whitespace-nowrap');

export function Tabla({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-slate-200 text-sm">{children}</table>
    </div>
  );
}
