import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Encabezado } from '@/componentes/Layout';
import { Alerta, Boton, Campo, Cargando, Entrada, Insignia, Tabla, Tarjeta, claseTd, claseTh } from '@/componentes/ui';
import { useActualizarParametros, useAuditoria, useCatalogos, useGuardarCatalogo, useParametros, usePerfiles } from '@/datos/consultas';
import { formatearSoles, leerMonto } from '@/dominio';
import { mensajeError } from '@/lib/supabase';
import { ETIQUETA_CATALOGO, TIPOS_CATALOGO, type AuditoriaBD, type TipoCatalogo } from '@/lib/tipos-bd';

type Pestana = 'parametros' | 'catalogos' | 'auditoria';

export default function Configuracion() {
  const [pestana, setPestana] = useState<Pestana>('parametros');
  const boton = (p: Pestana, etiqueta: string) => (
    <button type="button" onClick={() => setPestana(p)} aria-pressed={pestana === p} className={clsx('rounded-lg px-3 py-1.5 text-sm font-medium', pestana === p ? 'bg-marca-800 text-white' : 'text-slate-600 hover:bg-slate-100')}>
      {etiqueta}
    </button>
  );
  return (
    <>
      <Encabezado titulo="Configuración" descripcion="Parámetros de las cajas, listas de valores y registro de cambios." />
      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        {boton('parametros', 'Parámetros')}
        {boton('catalogos', 'Catálogos')}
        {boton('auditoria', 'Auditoría')}
      </div>
      {pestana === 'parametros' && <Parametros />}
      {pestana === 'catalogos' && <Catalogos />}
      {pestana === 'auditoria' && <Auditoria />}
    </>
  );
}

function Parametros() {
  const parametros = useParametros();
  const actualizar = useActualizarParametros();
  const [valores, setValores] = useState({ min: '', max: '', alerta: '', base: '', saldoInicial: '', fechaCorte: '', tolerancia: '', horaNoche: '' });
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const p = parametros.data;
    if (!p) return;
    setValores({
      min: String(p.caja_chica_min),
      max: String(p.caja_chica_max),
      alerta: p.caja_chica_alerta === null ? '' : String(p.caja_chica_alerta),
      base: String(p.base_caja_diaria),
      saldoInicial: String(p.saldo_inicial_caja_chica),
      fechaCorte: p.fecha_corte,
      tolerancia: String(p.tolerancia_arqueo),
      horaNoche: p.hora_inicio_noche,
    });
  }, [parametros.data]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardado(false);
    const min = leerMonto(valores.min);
    const max = leerMonto(valores.max);
    const alerta = valores.alerta.trim() ? leerMonto(valores.alerta) : null;
    const base = leerMonto(valores.base);
    const saldoInicial = leerMonto(valores.saldoInicial);
    const tolerancia = leerMonto(valores.tolerancia);
    if (min === null || max === null || base === null || saldoInicial === null || tolerancia === null) return setError('Revisa los montos: deben ser números.');
    if (min >= max) return setError('El mínimo debe ser menor que el máximo.');
    if (alerta !== null && (alerta < min || alerta > max)) return setError('El umbral de alerta debe estar entre el mínimo y el máximo (o quedar vacío).');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valores.fechaCorte)) return setError('La fecha de corte no es válida.');
    if (!/^\d{2}:\d{2}$/.test(valores.horaNoche)) return setError('La hora de inicio del turno noche debe tener el formato HH:MM.');
    try {
      await actualizar.mutateAsync({
        caja_chica_min: min,
        caja_chica_max: max,
        caja_chica_alerta: alerta,
        base_caja_diaria: base,
        saldo_inicial_caja_chica: saldoInicial,
        fecha_corte: valores.fechaCorte,
        tolerancia_arqueo: tolerancia,
        hora_inicio_noche: valores.horaNoche,
      });
      setGuardado(true);
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  if (parametros.isPending) return <Cargando />;
  const cambiar = (clave: keyof typeof valores, valor: string) => setValores((v) => ({ ...v, [clave]: valor }));

  return (
    <form onSubmit={enviar} className="grid gap-6 lg:grid-cols-2">
      <Tarjeta titulo="Caja chica" subtitulo="Rango permitido del fondo y punto de partida del control">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Mínimo (S/)" requerido>
            <Entrada inputMode="decimal" value={valores.min} onChange={(e) => cambiar('min', e.target.value)} />
          </Campo>
          <Campo etiqueta="Máximo (S/)" requerido>
            <Entrada inputMode="decimal" value={valores.max} onChange={(e) => cambiar('max', e.target.value)} />
          </Campo>
          <Campo etiqueta="Umbral de alerta (S/)" ayuda="Ámbar al bajar de este valor. Vacío para desactivarlo.">
            <Entrada inputMode="decimal" value={valores.alerta} onChange={(e) => cambiar('alerta', e.target.value)} />
          </Campo>
          <Campo etiqueta="Fecha de corte" requerido ayuda="Desde cuándo se lleva el saldo">
            <Entrada type="date" value={valores.fechaCorte} onChange={(e) => cambiar('fechaCorte', e.target.value)} />
          </Campo>
          <Campo etiqueta="Saldo inicial al corte (S/)" requerido>
            <Entrada inputMode="decimal" value={valores.saldoInicial} onChange={(e) => cambiar('saldoInicial', e.target.value)} />
          </Campo>
        </div>
      </Tarjeta>
      <Tarjeta titulo="Caja diaria y arqueo" subtitulo="Base para vuelto, tolerancia y turnos">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Base caja diaria (S/)" requerido ayuda="Efectivo con el que abre cada jornada">
            <Entrada inputMode="decimal" value={valores.base} onChange={(e) => cambiar('base', e.target.value)} />
          </Campo>
          <Campo etiqueta="Tolerancia de arqueo (S/)" requerido ayuda="Diferencia máxima para que CUADRE">
            <Entrada inputMode="decimal" value={valores.tolerancia} onChange={(e) => cambiar('tolerancia', e.target.value)} />
          </Campo>
          <Campo etiqueta="Inicio del turno noche" requerido>
            <Entrada type="time" value={valores.horaNoche} onChange={(e) => cambiar('horaNoche', e.target.value)} />
          </Campo>
          <div className="self-end text-sm text-slate-500">Denominaciones: {parametros.data?.denominaciones.map((d) => formatearSoles(d)).join(', ')}</div>
        </div>
      </Tarjeta>
      <div className="space-y-3 lg:col-span-2">
        {error && <Alerta tono="peligro">{error}</Alerta>}
        {guardado && <Alerta tono="exito">Parámetros guardados. Los saldos se recalculan al instante.</Alerta>}
        <div className="flex justify-end">
          <Boton type="submit" cargando={actualizar.isPending}>
            Guardar parámetros
          </Boton>
        </div>
      </div>
    </form>
  );
}

function Catalogos() {
  const catalogos = useCatalogos();
  const guardar = useGuardarCatalogo();
  const [nuevos, setNuevos] = useState<Record<TipoCatalogo, string>>({ AREA: '', MEDIO_PAGO: '', CUENTA: '', COMPROBANTE: '' });

  async function agregar(tipo: TipoCatalogo) {
    const valor = nuevos[tipo].trim().toUpperCase();
    if (!valor) return;
    const orden = (catalogos.data?.[tipo].length ?? 0) + 1;
    await guardar.mutateAsync({ valores: { tipo, valor, orden } });
    setNuevos((n) => ({ ...n, [tipo]: '' }));
  }

  if (catalogos.isPending) return <Cargando />;
  return (
    <div className="space-y-4">
      {guardar.error ? <Alerta tono="peligro">{mensajeError(guardar.error)}</Alerta> : null}
      <Alerta tono="info">Los valores desactivados dejan de ofrecerse en los formularios, pero los movimientos antiguos los conservan.</Alerta>
      <div className="grid gap-6 lg:grid-cols-2">
        {TIPOS_CATALOGO.map((tipo) => (
          <Tarjeta key={tipo} titulo={ETIQUETA_CATALOGO[tipo]} sinRelleno>
            <ul className="divide-y divide-slate-100">
              {catalogos.data?.[tipo].map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <span className={clsx(!c.activo && 'text-slate-400 line-through')}>{c.valor}</span>
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <input type="checkbox" className="size-4 rounded border-slate-300" checked={c.activo} onChange={(e) => guardar.mutate({ id: c.id, valores: { tipo: c.tipo, valor: c.valor, activo: e.target.checked } })} />
                    Activo
                  </label>
                </li>
              ))}
            </ul>
            <form
              className="flex gap-2 border-t border-slate-100 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void agregar(tipo);
              }}
            >
              <Entrada placeholder="Nuevo valor" value={nuevos[tipo]} onChange={(e) => setNuevos((n) => ({ ...n, [tipo]: e.target.value }))} />
              <Boton type="submit" variante="secundario" icono={<Plus className="size-4" />} cargando={guardar.isPending}>
                Agregar
              </Boton>
            </form>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}

function describir(a: AuditoriaBD): string {
  const registro = (a.despues ?? a.antes) as Record<string, unknown> | null;
  if (!registro) return '';
  if (a.tabla === 'movimientos') {
    const monto = Number(registro.monto) || Number(registro.monto_digital) + Number(registro.monto_efectivo) || 0;
    return `${String(registro.tipo ?? '')} · ${String(registro.descripcion ?? '')} · ${formatearSoles(monto)}${registro.anulado ? ' · ANULADO' : ''}`;
  }
  if (a.tabla === 'jornadas') return `Jornada ${String(registro.fecha ?? '')} · ${String(registro.estado ?? '')}`;
  if (a.tabla === 'arqueos') return `Arqueo caja ${String(registro.caja ?? '')} · contado ${formatearSoles(Number(registro.total_contado) || 0)} · ${String(registro.estado ?? '')}`;
  if (a.tabla === 'parametros') return `Mín ${String(registro.caja_chica_min)} · Máx ${String(registro.caja_chica_max)} · Base ${String(registro.base_caja_diaria)}`;
  if (a.tabla === 'catalogos') return `${String(registro.tipo ?? '')} · ${String(registro.valor ?? '')} · ${registro.activo ? 'activo' : 'inactivo'}`;
  if (a.tabla === 'perfiles') return `${String(registro.nombre ?? '')} · ${String(registro.rol ?? '')} · ${registro.activo ? 'activo' : 'inactivo'}`;
  return '';
}

const ETIQUETA_ACCION: Record<string, string> = { INSERT: 'Alta', UPDATE: 'Cambio', DELETE: 'Baja' };

function Auditoria() {
  const auditoria = useAuditoria(150);
  const perfiles = usePerfiles();
  const nombres = new Map((perfiles.data ?? []).map((p) => [p.id, p.nombre]));
  if (auditoria.isPending) return <Cargando />;
  if (auditoria.error) return <Alerta tono="peligro">{mensajeError(auditoria.error)}</Alerta>;
  return (
    <Tarjeta titulo="Últimos cambios" subtitulo="Quién hizo qué y cuándo. Los datos importados del Excel no tienen usuario." sinRelleno>
      <Tabla>
        <thead className="bg-slate-50">
          <tr>
            <th className={claseTh}>Fecha</th>
            <th className={claseTh}>Tabla</th>
            <th className={claseTh}>Acción</th>
            <th className={claseTh}>Usuario</th>
            <th className={claseTh}>Detalle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {auditoria.data?.map((a) => (
            <tr key={a.id}>
              <td className={`${claseTd} whitespace-nowrap`}>{new Date(a.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</td>
              <td className={claseTd}>{a.tabla}</td>
              <td className={claseTd}>
                <Insignia tono={a.accion === 'INSERT' ? 'exito' : a.accion === 'DELETE' ? 'peligro' : 'info'}>{ETIQUETA_ACCION[a.accion] ?? a.accion}</Insignia>
              </td>
              <td className={claseTd}>{a.usuario_id ? (nombres.get(a.usuario_id) ?? a.usuario_id.slice(0, 8)) : <span className="text-slate-400">Importación</span>}</td>
              <td className={`${claseTd} max-w-md truncate`} title={describir(a)}>
                {describir(a)}
              </td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </Tarjeta>
  );
}
