import { clsx } from 'clsx';
import { ArrowLeftRight, History, LayoutDashboard, LogOut, Menu, PiggyBank, Settings, Users, Wallet, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { Insignia } from './ui';

const enlaces = [
  { a: '/', etiqueta: 'Dashboard', Icono: LayoutDashboard, fin: true },
  { a: '/movimientos', etiqueta: 'Movimientos', Icono: ArrowLeftRight },
  { a: '/jornada', etiqueta: 'Caja diaria', Icono: Wallet },
  { a: '/caja-chica', etiqueta: 'Caja chica', Icono: PiggyBank },
  { a: '/historico', etiqueta: 'Histórico', Icono: History },
  { a: '/configuracion', etiqueta: 'Configuración', Icono: Settings, soloSupervisor: true },
  { a: '/usuarios', etiqueta: 'Usuarios', Icono: Users, soloSupervisor: true },
];

export function Layout() {
  const { perfil, esSupervisor, cerrarSesion } = useAuth();
  const [abierto, setAbierto] = useState(false);

  const navegacion = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Principal">
      {enlaces
        .filter((e) => !e.soloSupervisor || esSupervisor)
        .map(({ a, etiqueta, Icono, fin }) => (
          <NavLink
            key={a}
            to={a}
            end={fin}
            onClick={() => setAbierto(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive ? 'bg-white/15 text-white' : 'text-marca-100 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icono className="size-5 shrink-0" aria-hidden />
            {etiqueta}
          </NavLink>
        ))}
    </nav>
  );

  const bloqueUsuario = (
    <div className="border-t border-white/10 px-4 py-4">
      <p className="truncate text-sm font-semibold text-white">{perfil?.nombre ?? 'Usuario'}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <Insignia tono={esSupervisor ? 'info' : 'neutro'}>{esSupervisor ? 'Supervisor' : 'Cajero'}</Insignia>
        <button type="button" onClick={() => void cerrarSesion()} className="inline-flex items-center gap-1 text-xs text-marca-100 hover:text-white">
          <LogOut className="size-4" aria-hidden />
          Salir
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Barra lateral (escritorio) */}
      <aside className="no-imprimir hidden w-64 shrink-0 flex-col bg-marca-800 lg:fixed lg:inset-y-0 lg:flex">
        <div className="px-5 py-5">
          <p className="text-lg font-bold text-white">Sistema de Caja</p>
          <p className="text-xs text-marca-200">Caja diaria y caja chica</p>
        </div>
        {navegacion}
        {bloqueUsuario}
      </aside>

      {/* Barra superior (móvil) */}
      <div className="no-imprimir sticky top-0 z-40 flex items-center justify-between bg-marca-800 px-4 py-3 lg:hidden">
        <p className="font-bold text-white">Sistema de Caja</p>
        <button type="button" onClick={() => setAbierto((v) => !v)} className="rounded-md p-1 text-white" aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}>
          {abierto ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {abierto && (
        <div className="no-imprimir fixed inset-0 z-30 flex flex-col bg-marca-800 pt-16 lg:hidden">
          {navegacion}
          {bloqueUsuario}
        </div>
      )}

      <main className="min-w-0 flex-1 lg:pl-64">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function Encabezado({ titulo, descripcion, acciones }: { titulo: ReactNode; descripcion?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {acciones && <div className="no-imprimir flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}
