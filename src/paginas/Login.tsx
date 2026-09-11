import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { Alerta, Boton, Campo, Entrada } from '@/componentes/ui';
import { mensajeError, supabase } from '@/lib/supabase';

export default function Login() {
  const { usuario, cargando } = useAuth();
  const navegar = useNavigate();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!cargando && usuario) return <Navigate to="/" replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave });
    if (err) {
      setError(mensajeError(err));
      setEnviando(false);
      return;
    }
    navegar('/', { replace: true });
  }

  const esLocal = import.meta.env.DEV && /127\.0\.0\.1|localhost/.test(String(import.meta.env.VITE_SUPABASE_URL));

  return (
    <div className="flex min-h-screen items-center justify-center bg-marca-900 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <img src="/icono-192.png" alt="" className="mb-4 size-16" />
        <p className="text-xs font-semibold tracking-widest text-marca-500 uppercase">Sistema de Caja</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-500">Caja diaria y caja chica del área.</p>
        <form onSubmit={enviar} className="mt-6 space-y-4">
          <Campo etiqueta="Correo" requerido>
            <Entrada type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoFocus />
          </Campo>
          <Campo etiqueta="Contraseña" requerido>
            <Entrada type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
          </Campo>
          {error && <Alerta tono="peligro">{error}</Alerta>}
          <Boton type="submit" className="w-full" cargando={enviando}>
            Entrar
          </Boton>
        </form>
        {esLocal && (
          <p className="mt-4 text-xs text-slate-400">
            Entorno local: usa <span className="font-mono">supervisor@caja.local</span> o <span className="font-mono">cajero@caja.local</span> con la contraseña de prueba.
          </p>
        )}
      </div>
    </div>
  );
}
