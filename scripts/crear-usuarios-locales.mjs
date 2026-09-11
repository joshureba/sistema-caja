// Crea usuarios de prueba en el Supabase LOCAL. Se niega a correr contra un proyecto remoto.
import { execSync } from 'node:child_process';

const salida = execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const leer = (clave) => salida.match(new RegExp(`^${clave}="?([^"\r\n]+)"?`, 'm'))?.[1];
const API_URL = leer('API_URL');
const SECRETA = leer('SERVICE_ROLE_KEY') ?? leer('SECRET_KEY');
if (!API_URL || !SECRETA) {
  console.error('No se pudo leer la configuración local de Supabase. ¿Está corriendo `npm run db:start`?');
  process.exit(1);
}
if (!/127\.0\.0\.1|localhost/.test(API_URL)) {
  console.error('Este script solo se usa con el entorno local.');
  process.exit(1);
}

const usuarios = [
  { email: 'supervisor@caja.local', password: 'caja12345', nombre: 'Supervisora Demo', rol: 'supervisor', dni: '00000001' },
  { email: 'cajero@caja.local', password: 'caja12345', nombre: 'Cajero Demo', rol: 'cajero', dni: '00000002' },
];

for (const u of usuarios) {
  const respuesta = await fetch(`${API_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: SECRETA, Authorization: `Bearer ${SECRETA}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { nombre: u.nombre, rol: u.rol, dni: u.dni },
    }),
  });
  const json = await respuesta.json();
  console.log(respuesta.status, u.email, json.id ?? json.msg ?? json.message ?? JSON.stringify(json));
}
console.log('Contraseña de ambos usuarios: caja12345');
