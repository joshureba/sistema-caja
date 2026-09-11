import { Download, Pencil, Plus, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { FormularioMovimiento } from '@/componentes/FormularioMovimiento';
import { InsigniaSustento, InsigniaTipo } from '@/componentes/InsigniaTipo';
import { Encabezado } from '@/componentes/Layout';
import { Alerta, AreaTexto, Boton, Campo, Cargando, Entrada, Modal, Selector, Tabla, Tarjeta, Vacio, claseTd, claseTdNum, claseTh, claseThNum } from '@/componentes/ui';
import { useAnularMovimiento, useCatalogos, useDatosCaja, useJornadas } from '@/datos/consultas';
import {
  ESTADOS_SUSTENTO,
  ETIQUETA_CAJA,
  ETIQUETA_DESTINO,
  ETIQUETA_ORIGEN,
  ETIQUETA_TIPO,
  TIPOS_MOVIMIENTO,
  TURNOS,
  finDeMes,
  formatearFecha,
  formatearSoles,
  hoyISO,
  inicioDeMes,
  montoTotal,
  ordenarCronologico,
  sumar,
  type Movimiento,
} from '@/dominio';
import { exportarExcel } from '@/lib/exportar';
import { mensajeError } from '@/lib/supabase';

interface Filtros {
  desde: string;
  hasta: string;
  tipo: string;
  turno: string;
  area: string;
  medio: string;
  sustento: string;
  texto: string;
  anulados: boolean;
}

export default function Movimientos() {
  const { esSupervisor, usuario } = useAuth();
  const { movimientos, cargando, error } = useDatosCaja();
  const catalogos = useCatalogos();
  const hoy = hoyISO();
  const [filtros, setFiltros] = useState<Filtros>({ desde: inicioDeMes(hoy), hasta: finDeMes(hoy), tipo: '', turno: '', area: '', medio: '', sustento: '', texto: '', anulados: false });
  const jornadas = useJornadas(filtros.desde);
  const [nuevo, setNuevo] = useState(false);
  const [editando, setEditando] = useState<Movimiento | undefined>();
  const [anulando, setAnulando] = useState<Movimiento | undefined>();
  const [motivo, setMotivo] = useState('');
  const anular = useAnularMovimiento();

  const estadoJornada = useMemo(() => {
    const mapa = new Map<string, 'ABIERTA' | 'CERRADA'>();
    for (const j of jornadas.data ?? []) mapa.set(j.fecha, j.estado);
    return mapa;
  }, [jornadas.data]);

  const filtrados = useMemo(() => {
    const texto = filtros.texto.trim().toLowerCase();
    const lista = movimientos.filter((m) => {
      if (m.fecha < filtros.desde || m.fecha > filtros.hasta) return false;
      if (!filtros.anulados && m.anulado) return false;
      if (filtros.tipo && m.tipo !== filtros.tipo) return false;
      if (filtros.turno && m.turno !== filtros.turno) return false;
      if (filtros.area && m.area !== filtros.area) return false;
      if (filtros.medio && m.medio_pago !== filtros.medio) return false;
      if (filtros.sustento && m.estado_sustento !== filtros.sustento) return false;
      if (texto) {
        const pajar = [m.descripcion, m.nombre, m.numero, m.serie, m.ruc_dni, m.num_operacion, m.observacion, String(m.id)].join(' ').toLowerCase();
        if (!pajar.includes(texto)) return false;
      }
      return true;
    });
    return ordenarCronologico(lista).reverse();
  }, [movimientos, filtros]);

  const totales = useMemo(() => {
    const t = { digital: 0, efectivo: 0, egresos: 0, reposiciones: 0, retiros: 0 };
    for (const m of filtrados) {
      if (m.anulado) continue;
      if (m.tipo === 'INGRESO') {
        t.digital = sumar(t.digital, m.monto_digital);
        t.efectivo = sumar(t.efectivo, m.monto_efectivo);
      } else if (m.tipo === 'EGRESO') t.egresos = sumar(t.egresos, m.monto);
      else if (m.tipo === 'REPOSICION_CAJA_CHICA') t.reposiciones = sumar(t.reposiciones, m.monto);
      else t.retiros = sumar(t.retiros, m.monto);
    }
    return t;
  }, [filtrados]);

  const puedeEditar = (m: Movimiento) => !m.anulado && (esSupervisor || (estadoJornada.get(m.fecha) ?? 'ABIERTA') === 'ABIERTA');

  function exportar() {
    exportarExcel(`movimientos_${filtros.desde}_${filtros.hasta}`, [
      {
        nombre: 'Movimientos',
        filas: [...filtrados].reverse().map((m) => ({
          ID: m.id,
          Fecha: formatearFecha(m.fecha),
          Turno: m.turno,
          Tipo: ETIQUETA_TIPO[m.tipo],
          Sustento: m.estado_sustento ?? '',
          Comprobante: m.comprobante ?? '',
          Serie: m.serie ?? '',
          Número: m.numero ?? '',
          'RUC / DNI': m.ruc_dni ?? '',
          Nombre: m.nombre ?? '',
          Área: m.area ?? '',
          Descripción: m.descripcion,
          'Medio de pago': m.medio_pago ?? '',
          Cuenta: m.cuenta ?? '',
          'N° operación': m.num_operacion ?? '',
          'Ingreso digital': m.tipo === 'INGRESO' ? m.monto_digital : '',
          'Ingreso efectivo': m.tipo === 'INGRESO' ? m.monto_efectivo : '',
          Egreso: m.tipo === 'EGRESO' ? m.monto : '',
          Reposición: m.tipo === 'REPOSICION_CAJA_CHICA' ? m.monto : '',
          Retiro: m.tipo === 'RETIRO' ? m.monto : '',
          'Origen / caja': m.origen ? ETIQUETA_ORIGEN[m.origen] : m.caja_retiro ? ETIQUETA_CAJA[m.caja_retiro] : '',
          Destino: m.destino ? ETIQUETA_DESTINO[m.destino] : '',
          Observación: m.observacion ?? '',
          Anulado: m.anulado ? 'SÍ' : '',
        })),
        anchos: [6, 11, 9, 20, 16, 12, 8, 10, 12, 30, 20, 50, 14, 12, 14, 14, 14, 12, 12, 12, 14, 10, 40, 8],
      },
    ]);
  }

  async function confirmarAnulacion() {
    if (!anulando || !usuario || motivo.trim().length < 3) return;
    await anular.mutateAsync({ id: anulando.id, motivo: motivo.trim(), usuarioId: usuario.id });
    setAnulando(undefined);
    setMotivo('');
  }

  const cambiar = (parcial: Partial<Filtros>) => setFiltros((f) => ({ ...f, ...parcial }));

  return (
    <>
      <Encabezado
        titulo="Movimientos"
        descripcion="Registro continuo de ingresos, egresos, reposiciones y retiros."
        acciones={
          <>
            <Boton variante="secundario" icono={<Download className="size-4" />} onClick={exportar} disabled={!filtrados.length}>
              Exportar Excel
            </Boton>
            <Boton icono={<Plus className="size-4" />} onClick={() => setNuevo(true)}>
              Nuevo movimiento
            </Boton>
          </>
        }
      />
      {error ? <Alerta tono="peligro" className="mb-4">{mensajeError(error)}</Alerta> : null}

      <Tarjeta className="no-imprimir mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Campo etiqueta="Desde">
            <Entrada type="date" value={filtros.desde} onChange={(e) => e.target.value && cambiar({ desde: e.target.value })} />
          </Campo>
          <Campo etiqueta="Hasta">
            <Entrada type="date" value={filtros.hasta} onChange={(e) => e.target.value && cambiar({ hasta: e.target.value })} />
          </Campo>
          <Campo etiqueta="Tipo">
            <Selector value={filtros.tipo} onChange={(e) => cambiar({ tipo: e.target.value })}>
              <option value="">Todos</option>
              {TIPOS_MOVIMIENTO.map((t) => (
                <option key={t} value={t}>
                  {ETIQUETA_TIPO[t]}
                </option>
              ))}
            </Selector>
          </Campo>
          <Campo etiqueta="Turno">
            <Selector value={filtros.turno} onChange={(e) => cambiar({ turno: e.target.value })}>
              <option value="">Todos</option>
              {TURNOS.map((t) => (
                <option key={t} value={t}>
                  {t === 'MAÑANA' ? 'Mañana' : 'Noche'}
                </option>
              ))}
            </Selector>
          </Campo>
          <Campo etiqueta="Área">
            <Selector value={filtros.area} onChange={(e) => cambiar({ area: e.target.value })}>
              <option value="">Todas</option>
              {catalogos.data?.AREA.map((c) => (
                <option key={c.id} value={c.valor}>
                  {c.valor}
                </option>
              ))}
            </Selector>
          </Campo>
          <Campo etiqueta="Medio de pago">
            <Selector value={filtros.medio} onChange={(e) => cambiar({ medio: e.target.value })}>
              <option value="">Todos</option>
              {catalogos.data?.MEDIO_PAGO.map((c) => (
                <option key={c.id} value={c.valor}>
                  {c.valor}
                </option>
              ))}
            </Selector>
          </Campo>
          <Campo etiqueta="Sustento">
            <Selector value={filtros.sustento} onChange={(e) => cambiar({ sustento: e.target.value })}>
              <option value="">Todos</option>
              {ESTADOS_SUSTENTO.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Selector>
          </Campo>
          <Campo etiqueta="Buscar">
            <Entrada type="search" placeholder="Descripción, nombre, n.º…" value={filtros.texto} onChange={(e) => cambiar({ texto: e.target.value })} />
          </Campo>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" className="size-4 rounded border-slate-300" checked={filtros.anulados} onChange={(e) => cambiar({ anulados: e.target.checked })} />
          Mostrar anulados
        </label>
      </Tarjeta>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Resumen etiqueta="Ingresos digitales" valor={totales.digital} />
        <Resumen etiqueta="Ingresos en efectivo" valor={totales.efectivo} />
        <Resumen etiqueta="Egresos" valor={totales.egresos} />
        <Resumen etiqueta="Reposiciones" valor={totales.reposiciones} />
        <Resumen etiqueta="Retiros" valor={totales.retiros} />
      </div>

      <Tarjeta sinRelleno titulo={`${filtrados.length} movimiento${filtrados.length === 1 ? '' : 's'}`} subtitulo={`${formatearFecha(filtros.desde)} al ${formatearFecha(filtros.hasta)}`}>
        {cargando ? (
          <Cargando />
        ) : filtrados.length === 0 ? (
          <Vacio titulo="Sin movimientos con esos filtros" descripcion="Cambia el rango de fechas o registra el primer movimiento del período." accion={<Boton onClick={() => setNuevo(true)}>Nuevo movimiento</Boton>} />
        ) : (
          <Tabla>
            <thead className="bg-slate-50">
              <tr>
                <th className={claseTh}>Fecha</th>
                <th className={claseTh}>Tipo</th>
                <th className={claseTh}>Comprobante</th>
                <th className={claseTh}>Nombre</th>
                <th className={claseTh}>Descripción</th>
                <th className={claseTh}>Área</th>
                <th className={`${claseTh} hidden 2xl:table-cell`}>Medio</th>
                <th className={claseThNum}>Importe</th>
                <th className={claseTh}>Sustento</th>
                <th className={`${claseTh} no-imprimir`}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.slice(0, 500).map((m) => (
                <tr key={m.id} className={m.anulado ? 'bg-slate-50 text-slate-400 line-through' : 'hover:bg-slate-50'}>
                  <td className={`${claseTd} whitespace-nowrap`}>
                    {formatearFecha(m.fecha)}
                    <span className="block text-xs text-slate-400">{m.turno === 'MAÑANA' ? 'Mañana' : 'Noche'}</span>
                  </td>
                  <td className={claseTd}>
                    <InsigniaTipo tipo={m.tipo} />
                    {m.tipo === 'RETIRO' && m.caja_retiro && <span className="block text-xs text-slate-400">de {ETIQUETA_CAJA[m.caja_retiro].toLowerCase()}</span>}
                    {m.tipo === 'REPOSICION_CAJA_CHICA' && m.origen && <span className="block text-xs text-slate-400">desde {ETIQUETA_ORIGEN[m.origen].toLowerCase()}</span>}
                  </td>
                  <td className={`${claseTd} whitespace-nowrap`}>
                    {m.comprobante ?? '—'}
                    {(m.serie || m.numero) && <span className="block text-xs text-slate-400">{[m.serie, m.numero].filter(Boolean).join('-')}</span>}
                  </td>
                  <td className={`${claseTd} max-w-40`}>
                    <span className="block truncate" title={m.nombre ?? ''}>
                      {m.nombre ?? '—'}
                    </span>
                    {m.ruc_dni && <span className="block text-xs text-slate-400">{m.ruc_dni}</span>}
                  </td>
                  <td className={`${claseTd} max-w-56`}>
                    <span className="block truncate" title={m.descripcion}>
                      {m.descripcion}
                    </span>
                    {m.anulado && <span className="block text-xs text-red-500 no-underline">Anulado</span>}
                  </td>
                  <td className={claseTd}>{m.area ?? '—'}</td>
                  <td className={`${claseTd} hidden 2xl:table-cell`}>{m.medio_pago ?? '—'}</td>
                  <td className={`${claseTdNum} font-semibold`}>
                    {formatearSoles(montoTotal(m))}
                    {m.tipo === 'INGRESO' && m.monto_digital > 0 && m.monto_efectivo > 0 && (
                      <span className="block text-xs font-normal text-slate-400">
                        {formatearSoles(m.monto_digital)} dig. + {formatearSoles(m.monto_efectivo)} ef.
                      </span>
                    )}
                  </td>
                  <td className={claseTd}>{m.tipo === 'INGRESO' || m.tipo === 'EGRESO' ? <InsigniaSustento estado={m.estado_sustento} /> : <span className="text-slate-300">—</span>}</td>
                  <td className={`${claseTd} no-imprimir whitespace-nowrap`}>
                    {puedeEditar(m) && (
                      <>
                        <button type="button" onClick={() => setEditando(m)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-marca-700" aria-label={`Editar movimiento ${m.id}`}>
                          <Pencil className="size-4" />
                        </button>
                        <button type="button" onClick={() => setAnulando(m)} className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" aria-label={`Anular movimiento ${m.id}`}>
                          <XCircle className="size-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
        {filtrados.length > 500 && <p className="px-5 py-3 text-xs text-slate-500">Se muestran los primeros 500. Ajusta los filtros o exporta a Excel para ver todo.</p>}
      </Tarjeta>

      <FormularioMovimiento abierto={nuevo} onCerrar={() => setNuevo(false)} />
      <FormularioMovimiento abierto={Boolean(editando)} movimiento={editando} onCerrar={() => setEditando(undefined)} />

      <Modal
        abierto={Boolean(anulando)}
        titulo={`Anular movimiento #${anulando?.id ?? ''}`}
        onCerrar={() => setAnulando(undefined)}
        ancho="sm"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setAnulando(undefined)}>
              Cancelar
            </Boton>
            <Boton variante="peligro" onClick={() => void confirmarAnulacion()} cargando={anular.isPending} disabled={motivo.trim().length < 3}>
              Anular
            </Boton>
          </>
        }
      >
        {anulando && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              El movimiento no se borra: queda marcado como anulado, deja de sumar en los saldos y se conserva en la auditoría.
            </p>
            <p className="rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-semibold">{anulando.descripcion}</span>
              <br />
              {formatearFecha(anulando.fecha)} · {ETIQUETA_TIPO[anulando.tipo]} · {formatearSoles(montoTotal(anulando))}
            </p>
            <Campo etiqueta="Motivo" requerido>
              <AreaTexto value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Ej. Se registró dos veces" />
            </Campo>
            {anular.error ? <Alerta tono="peligro">{mensajeError(anular.error)}</Alerta> : null}
          </div>
        )}
      </Modal>
    </>
  );
}

function Resumen({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{etiqueta}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{formatearSoles(valor)}</p>
    </div>
  );
}
