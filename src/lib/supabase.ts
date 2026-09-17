import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const claveAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** `false` cuando faltan las variables de entorno (.env). */
export const supabaseConfigurado = Boolean(url && claveAnon);

export const supabase = createClient<Database>(url ?? 'http://127.0.0.1:54321', claveAnon ?? 'sin-configurar', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Convierte un error de Supabase/PostgREST en un mensaje legible en español. */
export function mensajeError(error: unknown): string {
  if (!error) return 'Error desconocido.';
  const e = error as { message?: string; details?: string };
  const texto = e.message ?? String(error);
  if (/fondo_salidas_(solo_gerencia|a_gerencia_o_banco)/.test(texto)) return 'La caja de fondo solo permite salidas hacia gerencia o al banco.';
  if (/chica_solo_salidas_desde_15_09/.test(texto)) return 'Desde el 15/09 la caja chica solo admite salidas; no admite reposiciones.';
  if (/Invalid login credentials/i.test(texto)) return 'Correo o contraseña incorrectos.';
  if (/Email not confirmed/i.test(texto)) return 'El correo aún no está confirmado.';
  if (/row-level security/i.test(texto)) return 'No tienes permiso para realizar esta acción.';
  if (/chk_montos_por_tipo/.test(texto)) return 'Los montos no corresponden al tipo de movimiento.';
  if (/chk_retiro/.test(texto)) return 'Un retiro necesita indicar la caja de origen y el destino.';
  if (/chk_origen_reposicion/.test(texto)) return 'Una reposición necesita indicar de dónde sale el dinero.';
  if (/jornadas_fecha_key/.test(texto)) return 'Ya existe una jornada para esa fecha.';
  if (/arqueos_jornada_id_caja_key/.test(texto)) return 'Ya existe un arqueo de esa caja para la jornada.';
  if (/duplicate key/i.test(texto)) return 'Ya existe un registro con esos datos.';
  if (/Failed to fetch|NetworkError|fetch failed|Load failed/i.test(texto)) return 'No se pudo conectar con el servidor. Revisa la conexión.';
  return texto;
}
