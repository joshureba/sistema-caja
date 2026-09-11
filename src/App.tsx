import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/AuthProvider';
import { Alerta } from '@/componentes/ui';
import { supabaseConfigurado } from '@/lib/supabase';
import { Rutas } from '@/rutas';

const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true },
  },
});

export default function App() {
  if (!supabaseConfigurado) {
    return (
      <div className="mx-auto mt-16 max-w-lg p-4">
        <Alerta tono="peligro" titulo="Falta la configuración de Supabase">
          Crea un archivo <span className="font-mono">.env</span> con <span className="font-mono">VITE_SUPABASE_URL</span> y{' '}
          <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> (mira <span className="font-mono">.env.example</span>) y vuelve a iniciar la aplicación.
        </Alerta>
      </div>
    );
  }
  return (
    <QueryClientProvider client={clienteConsultas}>
      <AuthProvider>
        <Rutas />
      </AuthProvider>
    </QueryClientProvider>
  );
}
