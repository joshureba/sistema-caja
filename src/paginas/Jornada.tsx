import { ChevronLeft, ChevronRight, Lock, Printer, Unlock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { ContadorDenominaciones } from '@/componentes/ContadorDenominaciones';
import { InsigniaTipo } from '@/componentes/InsigniaTipo';
import { Encabezado } from '@/componentes/Layout';
import { Alerta, AreaTexto, Boton, Campo, Cargando, Entrada, Insignia, Modal, Tabla, Tarjeta, claseTd, claseTdNum, claseTh, claseThNum } from '@/componentes/ui';
import { useAbrirJornada, useActualizarJornada, useArqueos, useDatosCaja, useGuardarArqueo, useJornada } from '@/datos/consultas';
import {
  calcularArqueo,
  conteoVacio,
  filtrarRango,
  formatearFecha,
  formatearSoles,
  hoyISO,
  montoTotal,
  ordenarCronologico,
  resumenCajaDiaria,
  sumarDias,
  type Conteo,
} from '@/dominio';
import { aNumero } from '@/lib/normalizar';
import { mensajeError } from '@/lib/supabase';

export default function Jornada() {
  const { perfil, usuario, esSupervisor } = useAuth();
  const { movimientos, parametros, cargando } = useDatosCaja();
  const hoy = hoyISO();
  const [fecha, setFecha] = useState(hoy);
  const jornada = useJornada(fecha);
  const arqueos = useArqueos(jornada.data?.id);
  const abrir = useAbrirJornada();
  const actualizar = useActualizarJornada();
  const guardarArqueo = useGuardarArqueo();

  const resumen = useMemo(() => resumenCajaDiaria(movimientos, parametros, fecha), [movimientos, parametros, fecha]);
  const delDia = useMemo(() => ordenarCronologico(filtrarRango(movimientos, fecha, fecha)), [movimientos, fecha]);
  const arqueoDiaria = arqueos.data?.find((a) => a.caja === 'DIARIA');

  const [conteo, setConteo] = useState<Conteo>(() => conteoVacio(parametros.denominaciones));
  const [observacionArqueo, setObservacionArqueo] = useState('');
  useEffect(() => {
    setConteo(arqueoDiaria ? (arqueoDiaria.conteo as Conteo) : conteoVacio(parametros.denominaciones));
    setObservacionArqueo(arqueoDiaria?.observacion ?? '');
  }, [arqueoDiaria, fecha, parametros.denominaciones]);

  const resultado = useMemo(() => calcularArqueo(conteo, parametros.denominaciones, resumen.teorico, parametros.tolerancia_arqueo), [conteo, parametros, resumen.teorico]);

  const [modalAbrir, setModalAbrir] = useState(false);
  const [responsable, setResponsable] = useState(perfil?.nombre ?? '');
  const [modalCerrar, setModalCerrar] = useState(false);
  const [observacionCierre, setObservacionCierre] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const abierta = jornada.data?.estado === 'ABIERTA';
  const cerrada = jornada.data?.estado === 'CERRADA';
  const puedeEditar = Boolean(jornada.data) && (abierta || esSupervisor);
  const arqueoGuardadoCoincide =
    Boolean(arqueoDiaria) && aNumero(arqueoDiaria?.total_contado) === resultado.total_contado && aNumero(arqueoDiaria?.total_teorico) === resultado.total_teorico;

  async function confirmarApertura() {
    const b = resumen.saldo_inicial;
    await abrir.mutateAsync({ fecha, base_caja_diaria: b, responsable_apertura: responsable.trim() || perfil?.nombre || null });
    setModalAbrir(false);
    setMensaje(`Jornada del ${formatearFecha(fecha)} abierta con ${formatearSoles(b)} en caja.`);
  }

  async function guardar() {
    if (!jornada.data) return;
    await guardarArqueo.mutateAsync({
      jornada_id: jornada.data.id,
      caja: 'DIARIA',
      conteo,
      total_contado: resultado.total_contado,
      total_teorico: resultado.total_teorico,
      diferencia: resultado.diferencia,
      estado: resultado.estado,
      observacion: observacionArqueo.trim() || null,
    });
    setMensaje('Arqueo de caja diaria guardado.');
  }

  async function confirmarCierre() {
    if (!jornada.data || !usuario) return;
    await actualizar.mutateAsync({
      id: jornada.data.id,
      valores: {
        estado: 'CERRADA',
        cierre_en: new Date().toISOString(),
        cierre_por: usuario.id,
        responsable_cierre: perfil?.nombre ?? null,
        observacion: observacionCierre.trim() || jornada.data.observacion,
      },
    });
    setModalCerrar(false);
    setMensaje(`Jornada del ${formatearFecha(fecha)} cerrada.`);
  }

  async function reabrir() {
    if (!jornada.data) return;
    await actualizar.mutateAsync({ id: jornada.data.id, valores: { estado: 'ABIERTA', cierre_en: null, cierre_por: null, responsable_cierre: null } });
    setMensaje('Jornada reabierta.');
  }

  const errorMutacion = abrir.error ?? guardarArqueo.error ?? actualizar.error;

  return (
    <>
      <Encabezado
        titulo="Caja diaria"
        descripcion="Apertura, arqueo del efectivo y cierre de la jornada."
        acciones={
          <>
            <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFecha(sumarDias(fecha, -1))} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Día anterior">
              <ChevronLeft className="size-5" />
            </button>
            <Entrada type="date" value={fecha} max={hoy} onChange={(e) => e.target.value && setFecha(e.target.value)} className="w-40! shrink-0" aria-label="Fecha de la jornada" />
            <button type="button" onClick={() => setFecha(sumarDias(fecha, 1))} disabled={fecha >= hoy} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40" aria-label="Día siguiente">
              <ChevronRight className="size-5" />
            </button>
            <Boton variante="secundario" onClick={() => setFecha(hoy)} disabled={fecha === hoy}>
              Hoy
            </Boton>
            </div>
            <Boton variante="secundario" icono={<Printer className="size-4" />} onClick={() => window.print()} disabled={!jornada.data}>
              Imprimir
            </Boton>
          </>
        }
      />

      {mensaje && (
        <Alerta tono="exito" className="mb-4">
          {mensaje}
        </Alerta>
      )}
      {errorMutacion ? <Alerta tono="peligro" className="mb-4">{mensajeError(errorMutacion)}</Alerta> : null}

      {cargando || jornada.isPending ? (
        <Cargando />
      ) : !jornada.data ? (
        <Tarjeta>
          <div className="flex flex-col items-start gap-3">
            <h2 className="text-lg font-semibold">
              {formatearFecha(fecha, 'largo')}: sin jornada abierta
            </h2>
            <p className="max-w-2xl text-sm text-slate-600">
              La caja de recepción abre con el efectivo con que cerró el día anterior ({formatearSoles(resumen.saldo_inicial)}) y solo crece con el efectivo de los cobros. Al cerrar se cuenta el
              efectivo y se compara con el teórico.
            </p>
            {delDia.length > 0 && (
              <Alerta tono="info">
                Ya hay {delDia.length} movimiento{delDia.length === 1 ? '' : 's'} registrado{delDia.length === 1 ? '' : 's'} en esta fecha; al abrir la jornada quedarán vinculados a ella.
              </Alerta>
            )}
            <Boton
              icono={<Unlock className="size-4" />}
              onClick={() => {
                setResponsable(perfil?.nombre ?? '');
                setModalAbrir(true);
              }}
            >
              Abrir jornada del {formatearFecha(fecha)}
            </Boton>
          </div>
        </Tarjeta>
      ) : (
        <div className="space-y-6">
          <Tarjeta>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{formatearFecha(fecha, 'largo')}</h2>
                  <Insignia tono={abierta ? 'exito' : 'neutro'} icono={abierta ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}>
                    {abierta ? 'Abierta' : 'Cerrada'}
                  </Insignia>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Apertura: {jornada.data.responsable_apertura ?? '—'} · {new Date(jornada.data.apertura_en).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  {cerrada && jornada.data.cierre_en && (
                    <>
                      {' '}
                      · Cierre: {jornada.data.responsable_cierre ?? '—'} · {new Date(jornada.data.cierre_en).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </>
                  )}
                </p>
                {jornada.data.observacion && <p className="mt-1 text-sm text-slate-600">Observación: {jornada.data.observacion}</p>}
              </div>
              <div className="no-imprimir flex flex-wrap gap-2">
                {abierta && (
                  <Boton
                    variante="exito"
                    icono={<Lock className="size-4" />}
                    onClick={() => {
                      setObservacionCierre(jornada.data?.observacion ?? '');
                      setModalCerrar(true);
                    }}
                    disabled={!arqueoDiaria}
                    title={!arqueoDiaria ? 'Guarda primero el arqueo de la caja diaria' : undefined}
                  >
                    Cerrar jornada
                  </Boton>
                )}
                {cerrada && esSupervisor && (
                  <Boton variante="secundario" icono={<Unlock className="size-4" />} onClick={() => void reabrir()} cargando={actualizar.isPending}>
                    Reabrir
                  </Boton>
                )}
              </div>
            </div>
          </Tarjeta>

          <div className="grid gap-6 lg:grid-cols-2">
            <Tarjeta titulo="Efectivo teórico" subtitulo="Lo que debería haber en la caja de recepción al cierre">
              <dl className="divide-y divide-slate-100 text-sm">
                <Fila etiqueta={resumen.antes_del_corte ? 'Base para vuelto' : fecha === parametros.fecha_corte ? 'Base inicial (sale de la caja chica)' : 'Efectivo con que abrió (arrastre)'} valor={resumen.saldo_inicial} />
                <Fila etiqueta={`Ingresos en efectivo (${resumen.n_ingresos} cobros)`} valor={resumen.ingresos_efectivo} signo="+" />
                <Fila etiqueta="Trasladado a caja chica" valor={resumen.traslados_a_caja_chica} signo="−" />
                <Fila etiqueta="Retiros de la caja diaria" valor={resumen.retiros} signo="−" />
                <div className="flex items-center justify-between py-3 text-base font-semibold">
                  <dt>Efectivo teórico</dt>
                  <dd className="tabular-nums">{formatearSoles(resumen.teorico)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-slate-500">Los cobros digitales del día suman {formatearSoles(resumen.ingresos_digital)} y no pasan por la caja física.</p>
            </Tarjeta>

            <Tarjeta
              titulo="Arqueo de caja diaria"
              subtitulo={arqueoDiaria ? `Guardado ${new Date(arqueoDiaria.realizado_en).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}` : 'Cuenta billetes y monedas'}
              sinRelleno
            >
              <ContadorDenominaciones denominaciones={parametros.denominaciones} conteo={conteo} onCambio={setConteo} soloLectura={!puedeEditar} />
              <div className="space-y-3 border-t border-slate-100 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Efectivo teórico</span>
                  <span className="tabular-nums">{formatearSoles(resultado.total_teorico)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Diferencia</span>
                  <span className={`font-semibold tabular-nums ${resultado.diferencia === 0 ? 'text-slate-800' : resultado.diferencia > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {resultado.diferencia > 0 ? '+' : ''}
                    {formatearSoles(resultado.diferencia)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Estado</span>
                  <Insignia tono={resultado.estado === 'CUADRA' ? 'exito' : 'peligro'}>{resultado.estado}</Insignia>
                </div>
                {resultado.estado === 'REVISAR' && (
                  <Alerta tono="alerta">
                    La diferencia supera la tolerancia de {formatearSoles(parametros.tolerancia_arqueo)}. Revisa el conteo y los movimientos; si persiste, deja una observación antes de cerrar.
                  </Alerta>
                )}
                {puedeEditar && (
                  <>
                    <Campo etiqueta="Observación del arqueo">
                      <AreaTexto rows={2} value={observacionArqueo} onChange={(e) => setObservacionArqueo(e.target.value)} />
                    </Campo>
                    <div className="no-imprimir flex justify-end">
                      <Boton onClick={() => void guardar()} cargando={guardarArqueo.isPending} disabled={arqueoGuardadoCoincide && (arqueoDiaria?.observacion ?? '') === observacionArqueo.trim()}>
                        {arqueoDiaria ? 'Actualizar arqueo' : 'Guardar arqueo'}
                      </Boton>
                    </div>
                  </>
                )}
              </div>
            </Tarjeta>
          </div>

          <Tarjeta
            titulo={`Movimientos del día (${delDia.length})`}
            sinRelleno
            acciones={
              <Link to="/movimientos" className="text-sm font-semibold text-marca-700 hover:underline">
                Ir a movimientos
              </Link>
            }
          >
            {delDia.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">Aún no hay movimientos en esta fecha.</p>
            ) : (
              <Tabla>
                <thead className="bg-slate-50">
                  <tr>
                    <th className={claseTh}>Turno</th>
                    <th className={claseTh}>Tipo</th>
                    <th className={claseTh}>Descripción</th>
                    <th className={claseTh}>Medio</th>
                    <th className={claseThNum}>Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {delDia.map((m) => (
                    <tr key={m.id}>
                      <td className={claseTd}>{m.turno === 'MAÑANA' ? 'Mañana' : 'Noche'}</td>
                      <td className={claseTd}>
                        <InsigniaTipo tipo={m.tipo} />
                      </td>
                      <td className={`${claseTd} max-w-96`}>
                        <span className="block truncate" title={m.descripcion}>
                          {m.descripcion}
                        </span>
                        {m.nombre && <span className="block text-xs text-slate-400">{m.nombre}</span>}
                      </td>
                      <td className={claseTd}>{m.medio_pago ?? '—'}</td>
                      <td className={`${claseTdNum} font-semibold`}>{formatearSoles(montoTotal(m))}</td>
                    </tr>
                  ))}
                </tbody>
              </Tabla>
            )}
          </Tarjeta>
        </div>
      )}

      <Modal
        abierto={modalAbrir}
        titulo={`Abrir jornada del ${formatearFecha(fecha)}`}
        onCerrar={() => setModalAbrir(false)}
        ancho="sm"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModalAbrir(false)}>
              Cancelar
            </Boton>
            <Boton onClick={() => void confirmarApertura()} cargando={abrir.isPending}>
              Abrir jornada
            </Boton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="text-slate-600">Efectivo con el que abre la caja</p>
            <p className="text-lg font-semibold tabular-nums">{formatearSoles(resumen.saldo_inicial)}</p>
            <p className="mt-1 text-xs text-slate-500">Es el arrastre del cierre anterior; no se reinicia a la base.</p>
          </div>
          <Campo etiqueta="Responsable de apertura">
            <Entrada value={responsable} onChange={(e) => setResponsable(e.target.value)} />
          </Campo>
        </div>
      </Modal>

      <Modal
        abierto={modalCerrar}
        titulo={`Cerrar jornada del ${formatearFecha(fecha)}`}
        onCerrar={() => setModalCerrar(false)}
        ancho="sm"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModalCerrar(false)}>
              Cancelar
            </Boton>
            <Boton variante="exito" onClick={() => void confirmarCierre()} cargando={actualizar.isPending} disabled={resultado.estado === 'REVISAR' && observacionCierre.trim().length < 3}>
              Confirmar cierre
            </Boton>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt className="text-slate-600">Efectivo contado</dt>
              <dd className="tabular-nums">{formatearSoles(resultado.total_contado)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Efectivo teórico</dt>
              <dd className="tabular-nums">{formatearSoles(resultado.total_teorico)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Diferencia</dt>
              <dd className="tabular-nums">{formatearSoles(resultado.diferencia)}</dd>
            </div>
          </dl>
          {!arqueoGuardadoCoincide && <Alerta tono="alerta">El arqueo guardado no coincide con el conteo en pantalla. Guarda el arqueo antes de cerrar.</Alerta>}
          {resultado.estado === 'REVISAR' && <Alerta tono="peligro">La caja no cuadra. Explica la diferencia para poder cerrar; un supervisor la revisará en la auditoría.</Alerta>}
          <Campo etiqueta="Observación de cierre" requerido={resultado.estado === 'REVISAR'}>
            <AreaTexto rows={3} value={observacionCierre} onChange={(e) => setObservacionCierre(e.target.value)} />
          </Campo>
          <p className="text-xs text-slate-500">El efectivo contado pasa como saldo inicial del día siguiente. Un cajero ya no podrá editar los movimientos del día.</p>
        </div>
      </Modal>
    </>
  );
}

function Fila({ etiqueta, valor, signo }: { etiqueta: string; valor: number; signo?: '+' | '−' }) {
  return (
    <div className="flex items-center justify-between py-2">
      <dt className="text-slate-600">{etiqueta}</dt>
      <dd className="tabular-nums">
        {signo && <span className="mr-1 text-slate-400">{signo}</span>}
        {formatearSoles(valor)}
      </dd>
    </div>
  );
}
