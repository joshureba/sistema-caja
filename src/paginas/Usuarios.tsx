import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { Encabezado } from '@/componentes/Layout';
import { Alerta, Boton, Cargando, Entrada, Insignia, Selector, Tabla, Tarjeta, claseTd, claseTh } from '@/componentes/ui';
import { useActualizarPerfil, usePerfiles } from '@/datos/consultas';
import { mensajeError } from '@/lib/supabase';
import type { PerfilBD, RolUsuario } from '@/lib/tipos-bd';

export default function Usuarios() {
  const perfiles = usePerfiles();
  return (
    <>
      <Encabezado titulo="Usuarios" descripcion="Roles y estado de las personas que usan la caja." />
      <div className="space-y-6">
        <Alerta tono="info" titulo="Cómo dar acceso a una persona nueva">
          Las cuentas se crean desde el panel de Supabase (Authentication → Users → Add user) con su correo y una contraseña temporal. Al crearla, el sistema le asigna el rol
          de cajero automáticamente; aquí puedes cambiarlo a supervisor, corregir el nombre o desactivarla.
        </Alerta>
        <Tarjeta sinRelleno>
          {perfiles.isPending ? (
            <Cargando />
          ) : perfiles.error ? (
            <Alerta tono="peligro">{mensajeError(perfiles.error)}</Alerta>
          ) : (
            <Tabla>
              <thead className="bg-slate-50">
                <tr>
                  <th className={claseTh}>Nombre</th>
                  <th className={claseTh}>DNI</th>
                  <th className={claseTh}>Rol</th>
                  <th className={claseTh}>Estado</th>
                  <th className={claseTh}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {perfiles.data?.map((p) => (
                  <FilaPerfil key={p.id} perfil={p} />
                ))}
              </tbody>
            </Tabla>
          )}
        </Tarjeta>
      </div>
    </>
  );
}

function FilaPerfil({ perfil }: { perfil: PerfilBD }) {
  const { usuario, recargarPerfil } = useAuth();
  const actualizar = useActualizarPerfil();
  const [nombre, setNombre] = useState(perfil.nombre);
  const [dni, setDni] = useState(perfil.dni ?? '');
  const [rol, setRol] = useState<RolUsuario>(perfil.rol);
  const [activo, setActivo] = useState(perfil.activo);
  const esYo = usuario?.id === perfil.id;
  const cambiado = nombre.trim() !== perfil.nombre || dni.trim() !== (perfil.dni ?? '') || rol !== perfil.rol || activo !== perfil.activo;

  async function guardar() {
    await actualizar.mutateAsync({ id: perfil.id, valores: { nombre: nombre.trim() || perfil.nombre, dni: dni.trim() || null, rol, activo } });
    if (esYo) await recargarPerfil();
  }

  return (
    <tr>
      <td className={claseTd}>
        <Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} className="min-w-48" aria-label={`Nombre de ${perfil.nombre}`} />
        {esYo && <span className="mt-1 block text-xs text-slate-400">Tu usuario</span>}
      </td>
      <td className={claseTd}>
        <Entrada value={dni} onChange={(e) => setDni(e.target.value)} className="w-32" inputMode="numeric" aria-label={`DNI de ${perfil.nombre}`} />
      </td>
      <td className={claseTd}>
        <Selector value={rol} onChange={(e) => setRol(e.target.value as RolUsuario)} disabled={esYo} className="w-36" aria-label={`Rol de ${perfil.nombre}`}>
          <option value="cajero">Cajero</option>
          <option value="supervisor">Supervisor</option>
        </Selector>
      </td>
      <td className={claseTd}>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 rounded border-slate-300" checked={activo} disabled={esYo} onChange={(e) => setActivo(e.target.checked)} />
          {activo ? <Insignia tono="exito">Activo</Insignia> : <Insignia tono="neutro">Inactivo</Insignia>}
        </label>
      </td>
      <td className={`${claseTd} whitespace-nowrap`}>
        <Boton tamano="sm" onClick={() => void guardar()} disabled={!cambiado} cargando={actualizar.isPending}>
          Guardar
        </Boton>
        {actualizar.error ? <p className="mt-1 text-xs text-red-600">{mensajeError(actualizar.error)}</p> : null}
      </td>
    </tr>
  );
}
