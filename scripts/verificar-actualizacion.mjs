// Lectura de control del proyecto enlazado. Las credenciales nunca se imprimen.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const ref = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
const claves = JSON.parse(execFileSync(process.execPath, ['node_modules/supabase/dist/supabase.js', 'projects', 'api-keys', '--project-ref', ref, '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const clave = claves.find((k) => k.name === 'service_role')?.api_key;
if (!clave) throw new Error('No se obtuvo la credencial de verificación');
const db = createClient(`https://${ref}.supabase.co`, clave, { auth: { persistSession: false } });
const resultados = await Promise.all([
  db.from('parametros').select('fecha_corte,saldo_inicial_caja_chica,base_caja_diaria').eq('id', 1).single(),
  db.from('movimientos').select('id', { count: 'exact', head: true }).eq('importado', true),
  db.rpc('fn_saldo_caja_chica', { p_hasta: '2026-09-14' }),
  db.from('movimientos').select('tipo,monto,monto_efectivo,monto_digital,caja_retiro,origen,anulado').gte('fecha', '2026-09-14'),
]);
for (const r of resultados) if (r.error) throw new Error(r.error.message);
console.log(JSON.stringify({ parametros: resultados[0].data, importados: resultados[1].count, saldo_chica_14: resultados[2].data, movimientos_desde_corte: resultados[3].data }, null, 2));
