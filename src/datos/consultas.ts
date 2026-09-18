import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { aMovimiento, aParametros } from '@/lib/normalizar';
import { PARAMETROS_POR_DEFECTO, type Movimiento, type Parametros } from '@/dominio';
import type {
  ArqueoBD,
  ArqueoInsertar,
  AuditoriaBD,
  CatalogoBD,
  CatalogoInsertar,
  CatalogosPorTipo,
  JornadaActualizar,
  JornadaBD,
  JornadaInsertar,
  MovimientoActualizar,
  MovimientoBD,
  MovimientoInsertar,
  ObservacionArqueoBD,
  ParametrosActualizar,
  PerfilActualizar,
  PerfilBD,
  TipoCatalogo,
} from '@/lib/tipos-bd';

export const claves = {
  movimientos: ['movimientos'] as const,
  parametros: ['parametros'] as const,
  catalogos: ['catalogos'] as const,
  jornadas: ['jornadas'] as const,
  arqueos: ['arqueos'] as const,
  observaciones: ['observaciones_arqueo'] as const,
  perfiles: ['perfiles'] as const,
  auditoria: ['auditoria'] as const,
};

async function lanzar<T>(consulta: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await consulta;
  if (error) throw error;
  return data as T;
}

// ---------- Lecturas ----------

export function useParametros() {
  return useQuery({
    queryKey: claves.parametros,
    queryFn: async () => aParametros(await lanzar(supabase.from('parametros').select('*').eq('id', 1).single())),
    staleTime: 5 * 60_000,
  });
}

export function useCatalogos() {
  return useQuery({
    queryKey: claves.catalogos,
    queryFn: async () => {
      const filas = await lanzar<CatalogoBD[]>(supabase.from('catalogos').select('*').order('tipo').order('orden').order('valor'));
      const porTipo: CatalogosPorTipo = { RESPONSABLE: [], AREA: [], MEDIO_PAGO: [], CUENTA: [], COMPROBANTE: [], BANCO: [] };
      for (const fila of filas) {
        const tipo = fila.tipo as TipoCatalogo;
        if (tipo in porTipo) porTipo[tipo].push(fila);
      }
      return porTipo;
    },
    staleTime: 5 * 60_000,
  });
}

/** Trae todos los movimientos (paginando de 1,000 en 1,000, el máximo por petición). */
export function useMovimientos() {
  return useQuery({
    queryKey: claves.movimientos,
    queryFn: async () => {
      const todas: MovimientoBD[] = [];
      const pagina = 1000;
      for (let desde = 0; ; desde += pagina) {
        const filas = await lanzar<MovimientoBD[]>(
          supabase.from('movimientos').select('*').order('fecha').order('id').range(desde, desde + pagina - 1),
        );
        todas.push(...filas);
        if (filas.length < pagina) break;
      }
      return todas.map(aMovimiento);
    },
    staleTime: 30_000,
  });
}

export interface DatosCaja {
  movimientos: Movimiento[];
  parametros: Parametros;
  cargando: boolean;
  error: unknown;
}

/** Movimientos + parámetros: la base de todos los cálculos del dominio. */
export function useDatosCaja(): DatosCaja {
  const movimientos = useMovimientos();
  const parametros = useParametros();
  return {
    movimientos: movimientos.data ?? [],
    parametros: parametros.data ?? PARAMETROS_POR_DEFECTO,
    cargando: movimientos.isPending || parametros.isPending,
    error: movimientos.error ?? parametros.error,
  };
}

export function useJornada(fecha: string) {
  return useQuery({
    queryKey: [...claves.jornadas, fecha],
    queryFn: () => lanzar<JornadaBD | null>(supabase.from('jornadas').select('*').eq('fecha', fecha).maybeSingle()),
  });
}

export function useJornadas(desde: string) {
  return useQuery({
    queryKey: [...claves.jornadas, 'desde', desde],
    queryFn: () => lanzar<JornadaBD[]>(supabase.from('jornadas').select('*').gte('fecha', desde).order('fecha', { ascending: false })),
  });
}

export function useArqueos(jornadaId: number | null | undefined) {
  return useQuery({
    queryKey: [...claves.arqueos, jornadaId ?? 0],
    queryFn: () => lanzar<ArqueoBD[]>(supabase.from('arqueos').select('*').eq('jornada_id', jornadaId!)),
    enabled: jornadaId !== null && jornadaId !== undefined,
  });
}

/** Historial de observaciones de un arqueo, de la más reciente a la más antigua. */
export function useObservacionesArqueo(arqueoId: number | null | undefined) {
  return useQuery({
    queryKey: [...claves.observaciones, arqueoId ?? 0],
    queryFn: () =>
      lanzar<ObservacionArqueoBD[]>(supabase.from('observaciones_arqueo').select('*').eq('arqueo_id', arqueoId!).order('creado_en', { ascending: false })),
    enabled: arqueoId !== null && arqueoId !== undefined,
  });
}

export function usePerfiles() {
  return useQuery({
    queryKey: claves.perfiles,
    queryFn: () => lanzar<PerfilBD[]>(supabase.from('perfiles').select('*').order('nombre')),
  });
}

export function useAuditoria(limite = 200) {
  return useQuery({
    queryKey: [...claves.auditoria, limite],
    queryFn: () => lanzar<AuditoriaBD[]>(supabase.from('auditoria').select('*').order('fecha', { ascending: false }).limit(limite)),
  });
}

// ---------- Escrituras ----------

function useInvalidar() {
  const qc = useQueryClient();
  return (...listas: readonly (readonly string[])[]) => {
    for (const clave of listas) qc.invalidateQueries({ queryKey: clave });
  };
}

export function useGuardarMovimiento() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (entrada: { id?: number; valores: MovimientoInsertar }) => {
      if (entrada.id) {
        return lanzar<MovimientoBD>(
          supabase.from('movimientos').update(entrada.valores as MovimientoActualizar).eq('id', entrada.id).select().single(),
        );
      }
      return lanzar<MovimientoBD>(supabase.from('movimientos').insert(entrada.valores).select().single());
    },
    onSuccess: () => invalidar(claves.movimientos, claves.auditoria),
  });
}

export function useAnularMovimiento() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (entrada: { id: number; motivo: string; usuarioId: string }) =>
      lanzar<MovimientoBD>(
        supabase
          .from('movimientos')
          .update({ anulado: true, anulado_motivo: entrada.motivo, anulado_por: entrada.usuarioId, anulado_en: new Date().toISOString() })
          .eq('id', entrada.id)
          .select()
          .single(),
      ),
    onSuccess: () => invalidar(claves.movimientos, claves.auditoria),
  });
}

export function useAbrirJornada() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (valores: JornadaInsertar) => {
      const jornada = await lanzar<JornadaBD>(supabase.from('jornadas').insert(valores).select().single());
      // Vincula los movimientos registrados antes de abrir la jornada.
      await lanzar(supabase.from('movimientos').update({ jornada_id: jornada.id }).eq('fecha', jornada.fecha).is('jornada_id', null));
      return jornada;
    },
    onSuccess: () => invalidar(claves.jornadas, claves.movimientos, claves.auditoria),
  });
}

export function useActualizarJornada() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (entrada: { id: number; valores: JornadaActualizar }) =>
      lanzar<JornadaBD>(supabase.from('jornadas').update(entrada.valores).eq('id', entrada.id).select().single()),
    onSuccess: () => invalidar(claves.jornadas, claves.auditoria),
  });
}

/**
 * Guarda el conteo del arqueo y, si hay nota, la agrega al historial de observaciones.
 * Con `soloNotaDe` el conteo no cambió: solo se registra la nota en ese arqueo.
 */
export function useGuardarArqueo() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (entrada: { valores: Omit<ArqueoInsertar, 'observacion'>; nota?: string | null; soloNotaDe?: number }) => {
      const arqueoId =
        entrada.soloNotaDe ?? (await lanzar<ArqueoBD>(supabase.from('arqueos').upsert(entrada.valores, { onConflict: 'jornada_id,caja' }).select().single())).id;
      const nota = entrada.nota?.trim();
      if (nota) {
        await lanzar(
          supabase
            .from('observaciones_arqueo')
            .insert({ arqueo_id: arqueoId, texto: nota, total_contado: entrada.valores.total_contado, diferencia: entrada.valores.diferencia })
            .select()
            .single(),
        );
      }
      return arqueoId;
    },
    onSuccess: () => invalidar(claves.arqueos, claves.observaciones, claves.jornadas, claves.auditoria),
  });
}

export function useActualizarParametros() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (valores: ParametrosActualizar) => lanzar(supabase.from('parametros').update(valores).eq('id', 1).select().single()),
    onSuccess: () => invalidar(claves.parametros, claves.auditoria),
  });
}

export function useGuardarCatalogo() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (entrada: { id?: number; valores: CatalogoInsertar }) => {
      if (entrada.id) return lanzar<CatalogoBD>(supabase.from('catalogos').update(entrada.valores).eq('id', entrada.id).select().single());
      return lanzar<CatalogoBD>(supabase.from('catalogos').insert(entrada.valores).select().single());
    },
    onSuccess: () => invalidar(claves.catalogos, claves.auditoria),
  });
}

export function useActualizarPerfil() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (entrada: { id: string; valores: PerfilActualizar }) =>
      lanzar<PerfilBD>(supabase.from('perfiles').update(entrada.valores).eq('id', entrada.id).select().single()),
    onSuccess: () => invalidar(claves.perfiles, claves.auditoria),
  });
}
