import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { Layout } from '@/componentes/Layout';
import { Alerta, Cargando } from '@/componentes/ui';

const Login = lazy(() => import('@/paginas/Login'));
const Dashboard = lazy(() => import('@/paginas/Dashboard'));
const Movimientos = lazy(() => import('@/paginas/Movimientos'));
const Jornada = lazy(() => import('@/paginas/Jornada'));
const CajaChica = lazy(() => import('@/paginas/CajaChica'));
const Historico = lazy(() => import('@/paginas/Historico'));
const Configuracion = lazy(() => import('@/paginas/Configuracion'));
const Usuarios = lazy(() => import('@/paginas/Usuarios'));

function RequiereSesion({ children }: { children: ReactNode }) {
  const { usuario, perfil, cargando } = useAuth();
  if (cargando) return <Cargando texto="Verificando sesión…" />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (perfil && !perfil.activo) {
    return (
      <div className="mx-auto mt-16 max-w-md">
        <Alerta tono="alerta" titulo="Usuario inactivo">
          Tu usuario está desactivado. Pide a un supervisor que lo reactive.
        </Alerta>
      </div>
    );
  }
  return <>{children}</>;
}

function RequiereSupervisor({ children }: { children: ReactNode }) {
  const { esSupervisor } = useAuth();
  if (!esSupervisor) {
    return (
      <Alerta tono="alerta" titulo="Solo para supervisores">
        Esta sección requiere el rol de supervisor.
      </Alerta>
    );
  }
  return <>{children}</>;
}

const suspender = (nodo: ReactNode) => <Suspense fallback={<Cargando />}>{nodo}</Suspense>;

const enrutador = createBrowserRouter([
  { path: '/login', element: suspender(<Login />) },
  {
    path: '/',
    element: (
      <RequiereSesion>
        <Layout />
      </RequiereSesion>
    ),
    children: [
      { index: true, element: suspender(<Dashboard />) },
      { path: 'movimientos', element: suspender(<Movimientos />) },
      { path: 'jornada', element: suspender(<Jornada />) },
      { path: 'caja-chica', element: suspender(<CajaChica />) },
      { path: 'historico', element: suspender(<Historico />) },
      { path: 'configuracion', element: suspender(<RequiereSupervisor><Configuracion /></RequiereSupervisor>) },
      { path: 'usuarios', element: suspender(<RequiereSupervisor><Usuarios /></RequiereSupervisor>) },
      { path: '*', element: <Alerta tono="neutro" titulo="Página no encontrada">La dirección no existe.</Alerta> },
    ],
  },
]);

export function Rutas() {
  return <RouterProvider router={enrutador} />;
}
