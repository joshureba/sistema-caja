import { clsx } from 'clsx';
import { ArrowLeftRight, ChevronLeft, ChevronRight, History, LayoutDashboard, LogOut, Menu, PiggyBank, Plus, Settings, Users, Wallet, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { useJornada } from '@/datos/consultas';
import { formatearFecha, hoyISO, sumarDias } from '@/dominio';
import { FormularioMovimiento } from './FormularioMovimiento';
import { Tecla } from './ui';

const enlaces = [
  { a: '/', etiqueta: 'Dashboard', Icono: LayoutDashboard, fin: true },
  { a: '/movimientos', etiqueta: 'Movimientos', Icono: ArrowLeftRight },
  { a: '/jornada', etiqueta: 'Caja de fondo', Icono: Wallet },
  { a: '/caja-chica', etiqueta: 'Caja chica', Icono: PiggyBank },
  { a: '/historico', etiqueta: 'Histórico', Icono: History },
  { a: '/configuracion', etiqueta: 'Configuración', Icono: Settings, soloSupervisor: true },
  { a: '/usuarios', etiqueta: 'Usuarios', Icono: Users, soloSupervisor: true },
];

export function Layout() {
  const { perfil, esSupervisor, cerrarSesion } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [registrar, setRegistrar] = useState(false);
  const { pathname } = useLocation();
  const hoy = hoyISO();
  const jornadaHoy = useJornada(hoy);

  useEffect(() => setAbierto(false), [pathname]);

  // Alt+N abre el registro desde cualquier pantalla.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setRegistrar(true);
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  const estadoJornada = jornadaHoy.isPending ? null : !jornadaHoy.data ? 'SIN ABRIR' : jornadaHoy.data.estado === 'ABIERTA' ? 'ABIERTA' : 'CERRADA · Z';

  const botonRegistrar = (
    <button
      type="button"
      onClick={() => setRegistrar(true)}
      className="group flex w-full cursor-pointer items-center gap-2.5 rounded-[3px] bg-papel px-3 py-2.5 text-left text-[14px] font-semibold text-tinta shadow-[0_1px_0_rgb(0_0_0/0.35)] transition-[background-color,transform] duration-150 hover:bg-white active:translate-y-px"
    >
      <span className="flex size-6 items-center justify-center rounded-[2px] bg-sello text-white">
        <Plus className="size-4" strokeWidth={2.5} aria-hidden />
      </span>
      <span className="flex-1">Registrar</span>
      <Tecla className="text-tinta-3">Alt+N</Tecla>
    </button>
  );

  const navegacion = (
    <nav className="flex flex-col gap-0.5" aria-label="Principal">
      {enlaces
        .filter((e) => !e.soloSupervisor || esSupervisor)
        .map(({ a, etiqueta, Icono, fin }) => (
          <NavLink
            key={a}
            to={a}
            end={fin}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-[3px] px-3 py-2 text-[14.5px] font-medium transition-colors duration-150',
                isActive ? 'bg-papel text-tinta shadow-[0_1px_0_rgb(0_0_0/0.3)]' : 'text-campo-tinta hover:bg-campo-2 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icono className={clsx('size-[18px] shrink-0', isActive ? 'text-sello' : 'opacity-80')} aria-hidden />
                {etiqueta}
              </>
            )}
          </NavLink>
        ))}
    </nav>
  );

  const bloqueJornada = (
    <div className="rounded-[3px] border border-dashed border-campo-tinta/35 px-3 py-2.5">
      <p className="text-[12px] text-campo-tinta">Jornada de hoy · <span className="cifra">{formatearFecha(hoy, 'diaMes')}</span></p>
      <p className={clsx('cifra mt-1 text-[13px] font-semibold tracking-wide', estadoJornada === 'ABIERTA' ? 'text-white' : 'text-campo-tinta')}>
        {estadoJornada ?? '…'}
      </p>
    </div>
  );

  const bloqueUsuario = (
    <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-4">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-white">{perfil?.nombre ?? 'Usuario'}</p>
        <p className="text-[12.5px] text-campo-tinta">{esSupervisor ? 'Supervisor' : 'Cajero'}</p>
      </div>
      <button
        type="button"
        onClick={() => void cerrarSesion()}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] px-2 py-1.5 text-[13px] text-campo-tinta transition-colors duration-150 hover:bg-campo-2 hover:text-white"
      >
        <LogOut className="size-4" aria-hidden />
        Salir
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Barra lateral (escritorio), sobre el mismo campo azul que el mostrador */}
      <aside className="no-imprimir hidden w-60 shrink-0 flex-col gap-5 border-r border-white/10 px-4 py-5 lg:fixed lg:inset-y-0 lg:flex lg:overflow-y-auto">
        <div>
          <div className="rounded-[3px] bg-white px-3 py-2 shadow-[0_1px_0_rgb(0_0_0/0.35)]">
            <img src="/logo-rebagliati.png" alt="Rebagliati Diplomados" className="mx-auto h-10 w-auto" />
          </div>
          <p className="mt-3 text-[15px] font-semibold text-white">Sistema de Caja</p>
        </div>
        {botonRegistrar}
        {navegacion}
        <div className="mt-auto space-y-4">
          {bloqueJornada}
          {bloqueUsuario}
        </div>
      </aside>

      {/* Barra superior (móvil y tablet) */}
      <div className="no-imprimir sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-campo px-4 py-2.5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <img src="/logo-rebagliati.png" alt="" className="h-8 w-auto rounded-[2px] bg-white px-1.5 py-0.5" />
          <p className="font-semibold text-white">Sistema de Caja</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setRegistrar(true)} className="inline-flex size-10 cursor-pointer items-center justify-center rounded-[3px] bg-papel text-sello" aria-label="Registrar movimiento">
            <Plus className="size-5" strokeWidth={2.5} aria-hidden />
          </button>
          <button type="button" onClick={() => setAbierto((v) => !v)} className="inline-flex size-10 cursor-pointer items-center justify-center rounded-[3px] text-white hover:bg-campo-2" aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={abierto}>
            {abierto ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </div>
      {abierto && (
        <div className="no-imprimir fixed inset-x-0 top-[57px] bottom-0 z-30 flex flex-col gap-5 overflow-y-auto bg-campo px-4 py-5 lg:hidden">
          {navegacion}
          <div className="mt-auto space-y-4">
            {bloqueJornada}
            {bloqueUsuario}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 lg:pl-60">
        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <Outlet />
        </div>
      </main>

      <FormularioMovimiento abierto={registrar} onCerrar={() => setRegistrar(false)} />
    </div>
  );
}

/** Cabecera de página sobre el campo azul. */
export function Encabezado({ titulo, descripcion, acciones }: { titulo: ReactNode; descripcion?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.01em] text-balance text-white [font-stretch:92%]">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-[70ch] text-[14.5px] text-campo-tinta">{descripcion}</p>}
      </div>
      {acciones && <div className="no-imprimir flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}

/** Grupo de navegación por día (anterior, fecha, siguiente, hoy) sobre una tira de papel. */
export function NavegadorDia({ fecha, hoy, onCambio, etiqueta = 'Fecha' }: { fecha: string; hoy: string; onCambio: (fecha: string) => void; etiqueta?: string }) {
  return (
    <div className="flex items-center gap-1 rounded-[3px] bg-papel p-1 shadow-hoja">
      <button type="button" onClick={() => onCambio(sumarDias(fecha, -1))} className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[2px] text-tinta-2 hover:bg-papel-2 hover:text-tinta" aria-label="Día anterior">
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <input
        type="date"
        value={fecha}
        max={hoy}
        onChange={(e) => e.target.value && onCambio(e.target.value)}
        aria-label={etiqueta}
        className="cifra h-8 w-38 rounded-[2px] border border-transparent bg-transparent px-2 text-[13px] text-tinta hover:border-raya focus:border-sello focus:outline-none"
      />
      <button type="button" onClick={() => onCambio(sumarDias(fecha, 1))} disabled={fecha >= hoy} className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[2px] text-tinta-2 hover:bg-papel-2 hover:text-tinta disabled:cursor-not-allowed disabled:opacity-35" aria-label="Día siguiente">
        <ChevronRight className="size-5" aria-hidden />
      </button>
      <button type="button" onClick={() => onCambio(hoy)} disabled={fecha === hoy} className="h-8 cursor-pointer rounded-[2px] px-2.5 text-[13px] font-semibold text-sello hover:bg-sello-claro disabled:cursor-default disabled:text-tinta-3 disabled:hover:bg-transparent">
        Hoy
      </button>
    </div>
  );
}
