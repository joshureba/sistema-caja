import { clsx } from 'clsx';
import { ChevronDown, Download, Pencil, Plus, Search, X, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { FormularioMovimiento } from '@/componentes/FormularioMovimiento';
import { InsigniaSustento, InsigniaTipo } from '@/componentes/InsigniaTipo';
import { Encabezado } from '@/componentes/Layout';
import { Alerta, AreaTexto, Boton, BotonIcono, Campo, Cargando, Casilla, Correlativo, Entrada, Insignia, LineaCinta, Modal, Selector, Tabla, Tarjeta, Vacio, claseTd, claseTdNum, claseTh, claseThNum } from '@/componentes/ui';
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
          Responsable: m.responsable ?? '',
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
        anchos: [6, 11, 9, 20, 16, 12, 8, 10, 12, 30, 20, 50, 14, 12, 14, 16, 14, 14, 12, 12, 12, 14, 10, 40, 8],
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
  const filtrosActivos = [filtros.tipo, filtros.turno, filtros.area, filtros.medio, filtros.sustento, filtros.texto.trim(), filtros.anulados].filter(Boolean).length;
  const hayFiltros = filtrosActivos > 0;
  const [verFiltros, setVerFiltros] = useState(false);

  return (
    <>
      <Encabezado
        titulo="Movimientos"
        descripcion="Registro continuo de ingresos, egresos, reposiciones y retiros."
        acciones={
          <>
            <Boton variante="secundario" icono={<Download className="size-4" aria-hidden />} onClick={exportar} disabled={!filtrados.length}>
              Exportar Excel
            </Boton>
            <Boton icono={<Plus className="size-4" aria-hidden />} onClick={() => setNuevo(true)}>
              Nuevo movimiento
            </Boton>
          </>
        }
      />
      {error ? <Alerta tono="peligro" className="mb-4">{mensajeError(error)}</Alerta> : null}

      <Tarjeta className="no-imprimir mb-5">
        {/* En pantallas chicas los filtros se pliegan para que los movimientos aparezcan primero. */}
        <button
          type="button"
          onClick={() => setVerFiltros((v) => !v)}
          aria-expanded={verFiltros}
          className="-m-1 flex w-[calc(100%+0.5rem)] cursor-pointer items-center justify-between rounded-[3px] p-1 text-left lg:hidden"
        >
          <span className="rotulo text-[13px] text-tinta">
            Filtros {filtrosActivos > 0 && <span className="cifra ml-1 text-sello">({filtrosActivos})</span>}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-tinta-2">
            <span className="cifra">{formatearFecha(filtros.desde, 'diaMes')} → {formatearFecha(filtros.hasta, 'diaMes')}</span>
            <ChevronDown className={clsx('size-4 transition-transform duration-150', verFiltros && 'rotate-180')} aria-hidden />
          </span>
        </button>
        <div className={clsx('gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-4 2xl:grid-cols-[160px_160px_repeat(5,minmax(0,1fr))_minmax(0,1.5fr)]', verFiltros ? 'mt-4 grid lg:mt-0' : 'hidden')}>
          <Campo etiqueta="Desde">
            <Entrada type="date" value={filtros.desde} onChange={(e) => e.target.value && cambiar({ desde: e.target.value })} className="cifra text-[13px]" />
          </Campo>
          <Campo etiqueta="Hasta">
            <Entrada type="date" value={filtros.hasta} onChange={(e) => e.target.value && cambiar({ hasta: e.target.value })} className="cifra text-[13px]" />
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
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tinta-3" aria-hidden />
              <Entrada type="search" placeholder="Descripción, nombre, n.º…" value={filtros.texto} onChange={(e) => cambiar({ texto: e.target.value })} className="pl-9" />
            </div>
          </Campo>
        </div>
        <div className={clsx('mt-3 flex-wrap items-center justify-between gap-3 lg:flex', verFiltros ? 'flex' : 'hidden')}>
          <Casilla etiqueta="Mostrar anulados" checked={filtros.anulados} onChange={(e) => cambiar({ anulados: e.target.checked })} />
          {hayFiltros && (
            <Boton variante="fantasma" tamano="sm" icono={<X className="size-4" aria-hidden />} onClick={() => setFiltros((f) => ({ ...f, tipo: '', turno: '', area: '', medio: '', sustento: '', texto: '', anulados: false }))}>
              Quitar filtros
            </Boton>
          )}
        </div>
      </Tarjeta>

      {/* Totales del filtro como renglones de libro */}
      <Tarjeta className="mb-5" titulo="Totales del filtro">
        <div className="grid gap-x-10 gap-y-2 lg:grid-cols-2">
          <dl>
            <LineaCinta etiqueta="Ingresos digitales" monto={totales.digital} />
            <LineaCinta etiqueta="Ingresos en efectivo" monto={totales.efectivo} />
            <LineaCinta etiqueta="Reposiciones de caja chica" monto={totales.reposiciones} signo="+" />
          </dl>
          <dl>
            <LineaCinta etiqueta="Egresos de caja chica" monto={totales.egresos} signo="−" salida />
            <LineaCinta etiqueta="Retiros" monto={totales.retiros} signo="−" salida />
          </dl>
        </div>
      </Tarjeta>

      <Tarjeta sinRelleno titulo={`${filtrados.length} movimiento${filtrados.length === 1 ? '' : 's'}`} subtitulo={<span className="cifra text-[12.5px]">{formatearFecha(filtros.desde)} al {formatearFecha(filtros.hasta)}</span>}>
        {cargando ? (
          <Cargando />
        ) : filtrados.length === 0 ? (
          <Vacio titulo="Sin movimientos con esos filtros" descripcion="Cambia el rango de fechas o registra el primer movimiento del período." accion={<Boton onClick={() => setNuevo(true)}>Nuevo movimiento</Boton>} />
        ) : (
          <>
          <div className="hidden md:block">
          <Tabla>
            <thead>
              <tr>
                <th className={claseTh}>Fecha · N.º</th>
                <th className={claseTh}>Tipo</th>
                <th className={claseTh}>Descripción · Nombre</th>
                <th className={`${claseTh} hidden 2xl:table-cell`}>Comprobante</th>
                <th className={claseTh}>Área</th>
                <th className={`${claseTh} hidden 2xl:table-cell`}>Medio</th>
                <th className={claseThNum}>Importe</th>
                <th className={claseTh}>Sustento</th>
                <th className={`${claseTh} no-imprimir`}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-papel-3">
              {filtrados.slice(0, 500).map((m) => {
                const sale = m.tipo !== 'INGRESO' && m.tipo !== 'REPOSICION_CAJA_CHICA';
                return (
                  <tr key={m.id} className={m.anulado ? 'bg-papel-2 text-tinta-3 [&_td]:text-tinta-3' : 'transition-colors duration-100 hover:bg-white'}>
                    <td className={`${claseTd} whitespace-nowrap`}>
                      <span className="cifra block text-[13px]">{formatearFecha(m.fecha)}</span>
                      <span className="block text-[11.5px] text-tinta-3">
                        <Correlativo numero={m.id} className="text-[11.5px]" /> · {m.turno === 'MAÑANA' ? 'Mañana' : 'Noche'}
                      </span>
                      {m.responsable && <span className="block max-w-[9rem] truncate text-[11.5px] text-tinta-2" title={m.responsable}>Resp. {m.responsable}</span>}
                    </td>
                    <td className={claseTd}>
                      <InsigniaTipo tipo={m.tipo} />
                      {m.tipo === 'RETIRO' && m.caja_retiro && <span className="mt-1 block text-[12px] text-tinta-3">de {ETIQUETA_CAJA[m.caja_retiro].toLowerCase()}</span>}
                      {m.tipo === 'REPOSICION_CAJA_CHICA' && m.origen && <span className="mt-1 block text-[12px] text-tinta-3">desde {ETIQUETA_ORIGEN[m.origen].toLowerCase()}</span>}
                      {(m.comprobante || m.serie || m.numero) && (
                        <span className="cifra mt-1 block text-[11.5px] whitespace-nowrap text-tinta-3 2xl:hidden">{[m.comprobante, [m.serie, m.numero].filter(Boolean).join('-')].filter(Boolean).join(' ')}</span>
                      )}
                    </td>
                    <td className={claseTd}>
                      <span className={clsx('block max-w-[16rem] truncate 2xl:max-w-[22rem]', m.anulado && 'line-through')} title={m.descripcion}>
                        {m.descripcion}
                      </span>
                      {(m.nombre || m.ruc_dni) && (
                        <span className="block max-w-[16rem] truncate text-[12.5px] text-tinta-3 2xl:max-w-[22rem]" title={m.nombre ?? ''}>
                          {m.nombre ?? '—'}
                          {m.ruc_dni && <span className="cifra"> · {m.ruc_dni}</span>}
                        </span>
                      )}
                      {m.anulado && (
                        <Insignia tono="peligro" className="mt-1">
                          Anulado
                        </Insignia>
                      )}
                    </td>
                    <td className={`${claseTd} hidden whitespace-nowrap 2xl:table-cell`}>
                      {m.comprobante ?? '—'}
                      {(m.serie || m.numero) && <span className="cifra block text-[12px] text-tinta-3">{[m.serie, m.numero].filter(Boolean).join('-')}</span>}
                    </td>
                    <td className={`${claseTd} text-[13px]`}>{m.area ?? '—'}</td>
                    <td className={`${claseTd} hidden 2xl:table-cell`}>{m.medio_pago ?? '—'}</td>
                    <td className={clsx(claseTdNum, 'font-semibold', sale && !m.anulado && 'text-rojo', m.anulado && 'line-through')}>
                      {sale ? '−' : ''}
                      {formatearSoles(montoTotal(m))}
                      {m.tipo === 'INGRESO' && m.monto_digital > 0 && m.monto_efectivo > 0 && (
                        <span className="block text-[11.5px] font-normal text-tinta-3">
                          {formatearSoles(m.monto_digital)} dig. + {formatearSoles(m.monto_efectivo)} ef.
                        </span>
                      )}
                    </td>
                    <td className={claseTd}>{m.tipo === 'INGRESO' || m.tipo === 'EGRESO' ? <InsigniaSustento estado={m.estado_sustento} /> : <span className="text-tinta-3">—</span>}</td>
                    <td className={`${claseTd} no-imprimir py-1.5 whitespace-nowrap`}>
                      {puedeEditar(m) && (
                        <div className="flex gap-0.5">
                          <BotonIcono etiqueta={`Editar movimiento ${m.id}`} onClick={() => setEditando(m)}>
                            <Pencil className="size-4" aria-hidden />
                          </BotonIcono>
                          <BotonIcono etiqueta={`Anular movimiento ${m.id}`} onClick={() => setAnulando(m)} className="hover:bg-rojo-claro hover:text-rojo">
                            <XCircle className="size-4" aria-hidden />
                          </BotonIcono>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Tabla>
          </div>
          <ol className="divide-y divide-dashed divide-raya md:hidden">
            {filtrados.slice(0, 500).map((m) => {
              const sale = m.tipo !== 'INGRESO' && m.tipo !== 'REPOSICION_CAJA_CHICA';
              return (
                <li key={m.id} className={clsx('px-4 py-3', m.anulado && 'bg-papel-2')}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[12px] text-tinta-3">
                      <span className="cifra text-tinta-2">{formatearFecha(m.fecha)}</span> · <Correlativo numero={m.id} className="text-[12px]" />
                    </p>
                    <p className={clsx('cifra shrink-0 text-[15px] font-semibold', sale && !m.anulado ? 'text-rojo' : 'text-tinta', m.anulado && 'line-through')}>
                      {sale ? '−' : ''}
                      {formatearSoles(montoTotal(m))}
                    </p>
                  </div>
                  <p className={clsx('mt-1 text-[14px] leading-snug text-tinta', m.anulado && 'text-tinta-3 line-through')}>{m.descripcion}</p>
                  {(m.nombre || m.responsable) && (
                    <p className="mt-0.5 truncate text-[12.5px] text-tinta-3">
                      {m.nombre}
                      {m.nombre && m.responsable && ' · '}
                      {m.responsable && <>Resp. {m.responsable}</>}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <InsigniaTipo tipo={m.tipo} />
                    {(m.tipo === 'INGRESO' || m.tipo === 'EGRESO') && <InsigniaSustento estado={m.estado_sustento} />}
                    {m.anulado && <Insignia tono="peligro">Anulado</Insignia>}
                    {puedeEditar(m) && (
                      <span className="no-imprimir ml-auto flex gap-0.5">
                        <BotonIcono etiqueta={`Editar movimiento ${m.id}`} onClick={() => setEditando(m)}>
                          <Pencil className="size-4" aria-hidden />
                        </BotonIcono>
                        <BotonIcono etiqueta={`Anular movimiento ${m.id}`} onClick={() => setAnulando(m)} className="hover:bg-rojo-claro hover:text-rojo">
                          <XCircle className="size-4" aria-hidden />
                        </BotonIcono>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          </>
        )}
        {filtrados.length > 500 && <p className="border-t border-dashed border-raya px-5 py-3 text-[13px] text-tinta-3">Se muestran los primeros 500. Ajusta los filtros o exporta a Excel para ver todo.</p>}
      </Tarjeta>

      <FormularioMovimiento abierto={nuevo} onCerrar={() => setNuevo(false)} />
      <FormularioMovimiento abierto={Boolean(editando)} movimiento={editando} onCerrar={() => setEditando(undefined)} />

      <Modal
        abierto={Boolean(anulando)}
        titulo={`Anular movimiento N.º ${String(anulando?.id ?? '').padStart(6, '0')}`}
        onCerrar={() => setAnulando(undefined)}
        ancho="sm"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setAnulando(undefined)}>
              Cancelar
            </Boton>
            <Boton variante="peligro" onClick={() => void confirmarAnulacion()} cargando={anular.isPending} disabled={motivo.trim().length < 3}>
              Anular movimiento
            </Boton>
          </>
        }
      >
        {anulando && (
          <div className="space-y-3">
            <p className="text-[14px] leading-relaxed text-tinta-2">El movimiento no se borra: queda marcado como anulado, deja de sumar en los saldos y se conserva en la auditoría.</p>
            <div className="rounded-[3px] border border-dashed border-tinta-3/40 bg-white px-4 py-3">
              <p className="font-semibold text-tinta">{anulando.descripcion}</p>
              <p className="cifra mt-1 text-[12.5px] text-tinta-3">
                {formatearFecha(anulando.fecha)} · {ETIQUETA_TIPO[anulando.tipo]} · {formatearSoles(montoTotal(anulando))}
              </p>
            </div>
            <Campo etiqueta="Motivo" requerido>
              <AreaTexto value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Ej. Se registró dos veces" data-autofoco />
            </Campo>
            {anular.error ? <Alerta tono="peligro">{mensajeError(anular.error)}</Alerta> : null}
          </div>
        )}
      </Modal>
    </>
  );
}

