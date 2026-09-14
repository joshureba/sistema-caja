import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { Alerta, Boton, Campo, Entrada, RayaCinta } from '@/componentes/ui';
import { formatearFecha, hoyISO } from '@/dominio';
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
    <div className="flex min-h-screen items-center justify-center bg-campo p-4">
      <div className="w-full max-w-[380px] sombra-cinta">
        <div className="dentado-ambos bg-papel px-8 [animation:imprimir_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="pt-6 text-center">
            <img src="/logo-rebagliati.png" alt="Rebagliati Diplomados" className="mx-auto h-14 w-auto" />
            <h1 className="mt-4 text-[22px] font-semibold text-tinta">Sistema de Caja</h1>
            <p className="cifra mt-1 text-[12px] text-tinta-3">{formatearFecha(hoyISO(), 'largo')}</p>
          </div>
          <RayaCinta className="my-5" />
          <form onSubmit={enviar} className="space-y-4">
            <Campo etiqueta="Correo">
              <Entrada type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoFocus />
            </Campo>
            <Campo etiqueta="Contraseña">
              <Entrada type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
            </Campo>
            {error && <Alerta tono="peligro">{error}</Alerta>}
            <Boton type="submit" tamano="lg" className="w-full" cargando={enviando}>
              Entrar
            </Boton>
          </form>
          <RayaCinta doble className="mt-6 mb-4" />
          <p className="pb-6 text-center text-[12.5px] leading-relaxed text-tinta-3">
            {esLocal ? (
              <>
                Entorno local: <span className="cifra text-tinta-2">supervisor@caja.local</span> o <span className="cifra text-tinta-2">cajero@caja.local</span> con la contraseña de prueba.
              </>
            ) : (
              'Caja diaria y caja chica del área. Si no puedes entrar, pide a un supervisor que revise tu usuario.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
