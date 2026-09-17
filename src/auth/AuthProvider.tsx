import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { PerfilBD } from '@/lib/tipos-bd';

interface ContextoAuth {
  usuario: User | null;
  perfil: PerfilBD | null;
  /** `true` mientras se resuelve la sesión inicial o se carga el perfil. */
  cargando: boolean;
  esSupervisor: boolean;
  /** Cuenta de solo lectura: ve la caja pero no registra ni modifica nada. */
  esLector: boolean;
  /** Puede registrar y editar (cajero o supervisor activo). La autorización real está en RLS. */
  puedeOperar: boolean;
  recargarPerfil: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilBD | null>(null);
  const [sesionResuelta, setSesionResuelta] = useState(false);
  const [perfilCargando, setPerfilCargando] = useState(false);

  useEffect(() => {
    let activo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSesion(data.session);
      setSesionResuelta(true);
    });
    // Solo se actualiza estado aquí: llamar a Supabase dentro de este callback puede bloquearse.
    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSesion(nueva);
      setSesionResuelta(true);
      if (!nueva) setPerfil(null);
    });
    return () => {
      activo = false;
      suscripcion.subscription.unsubscribe();
    };
  }, []);

  const usuarioId = sesion?.user.id ?? null;

  const cargarPerfil = useCallback(async (id: string) => {
    const { data } = await supabase.from('perfiles').select('*').eq('id', id).maybeSingle();
    return data ?? null;
  }, []);

  useEffect(() => {
    if (!usuarioId) return;
    let activo = true;
    setPerfilCargando(true);
    cargarPerfil(usuarioId).then((p) => {
      if (!activo) return;
      setPerfil(p);
      setPerfilCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [usuarioId, cargarPerfil]);

  const valor = useMemo<ContextoAuth>(
    () => ({
      usuario: sesion?.user ?? null,
      perfil,
      cargando: !sesionResuelta || (usuarioId !== null && perfilCargando),
      esSupervisor: perfil?.rol === 'supervisor' && perfil.activo,
      esLector: perfil?.rol === 'lector',
      puedeOperar: Boolean(perfil?.activo) && (perfil?.rol === 'cajero' || perfil?.rol === 'supervisor'),
      recargarPerfil: async () => {
        if (usuarioId) setPerfil(await cargarPerfil(usuarioId));
      },
      cerrarSesion: async () => {
        await supabase.auth.signOut();
      },
    }),
    [sesion, perfil, sesionResuelta, perfilCargando, usuarioId, cargarPerfil],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): ContextoAuth {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
