import { Lock, Pencil, Printer, Send, Unlock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { FormularioMovimiento } from '@/componentes/FormularioMovimiento';
import { HistorialObservaciones, PanelArqueo } from '@/componentes/PanelArqueo';
import { InsigniaTipo } from '@/componentes/InsigniaTipo';
import { Encabezado, NavegadorDia } from '@/componentes/Layout';
import { Alerta, AreaTexto, Boton, Campo, Cargando, Cinta, Correlativo, Entrada, Insignia, LineaCinta, Modal, MontoDoble, RayaCinta, Tabla, Tarjeta, claseTd, claseTdNum, claseTh } from '@/componentes/ui';
import { useAbrirJornada, useActualizarJornada, useArqueos, useDatosCaja, useGuardarArqueo, useJornada } from '@/datos/consultas';
import { calcularArqueo, conteoVacio, filtrarRango, formatearFecha, formatearSoles, hoyISO, montoTotal, ordenarCronologico, resumenCajaDiaria, type Conteo } from '@/dominio';
import { aNumero } from '@/lib/normalizar';
import { mensajeError } from '@/lib/supabase';

const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

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
  const [corrigiendo, setCorrigiendo] = useState(false);
  useEffect(() => {
    setConteo(arqueoDiaria ? (arqueoDiaria.conteo as Conteo) : conteoVacio(parametros.denominaciones));
  }, [arqueoDiaria, fecha, parametros.denominaciones]);
  useEffect(() => setCorrigiendo(false), [fecha]);

  const resultado = useMemo(() => calcularArqueo(conteo, parametros.denominaciones, resumen.teorico, parametros.tolerancia_arqueo), [conteo, parametros, resumen.teorico]);

  const [modalAbrir, setModalAbrir] = useState(false);
  const [enviarGerencia, setEnviarGerencia] = useState(false);
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
    const creada = await abrir.mutateAsync({ fecha, responsable_apertura: responsable.trim() || perfil?.nombre || null });
    setModalAbrir(false);
    setMensaje(`Jornada del ${formatearFecha(fecha)} abierta con ${formatearSoles(aNumero(creada.base_caja_diaria))} en caja.`);
  }

  async function guardar(nota: string) {
    if (!jornada.data) return;
    await guardarArqueo.mutateAsync({
      valores: {
        jornada_id: jornada.data.id,
        caja: 'DIARIA',
        conteo,
        total_contado: resultado.total_contado,
        total_teorico: resultado.total_teorico,
        diferencia: resultado.diferencia,
        estado: resultado.estado,
      },
      nota,
      soloNotaDe: arqueoGuardadoCoincide ? arqueoDiaria?.id : undefined,
    });
    setMensaje(arqueoGuardadoCoincide ? 'Observación agregada al historial.' : 'Arqueo de caja diaria guardado. El Reporte X está listo para el cierre.');
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
    setMensaje(`Jornada del ${formatearFecha(fecha)} cerrada (Z).`);
  }

  async function reabrir() {
    if (!jornada.data) return;
    await actualizar.mutateAsync({ id: jornada.data.id, valores: { estado: 'ABIERTA', cierre_en: null, cierre_por: null, responsable_cierre: null } });
    setMensaje('Jornada reabierta.');
  }

  const errorMutacion = abrir.error ?? guardarArqueo.error ?? actualizar.error;
  const estadoNombre = cerrada ? 'Cerrada · Z' : arqueoDiaria ? 'Reporte X listo' : 'Abierta';

  return (
    <>
      <Encabezado
        titulo="Caja de fondo"
        descripcion="Saldo anterior más cobros en efectivo, menos envíos a gerencia. La apertura es automática."
        acciones={
          <>
            <NavegadorDia fecha={fecha} hoy={hoy} onCambio={setFecha} etiqueta="Fecha de la jornada" />
            <Boton variante="secundario" icono={<Send className="size-4" aria-hidden />} onClick={() => setEnviarGerencia(true)} disabled={!puedeEditar}>
              Enviar a gerencia
            </Boton>
            <Boton variante="secundario" icono={<Printer className="size-4" aria-hidden />} onClick={() => window.print()} disabled={!jornada.data}>
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
        <Cinta titulo="Sin jornada abierta" subtitulo={formatearFecha(fecha, 'largo')} className="mx-auto max-w-xl">
          <div className="flex flex-col items-center gap-3 py-3 text-center">
            <p className="text-[13px] text-tinta-3">Abrirá con</p>
            <MontoDoble valor={resumen.saldo_inicial} className="text-[30px]" />
            <p className="max-w-md text-[14px] leading-relaxed text-tinta-2">
              La caja de fondo abre con el saldo anterior, suma los cobros en efectivo y descuenta los envíos a gerencia. Al cerrar se cuenta el efectivo y se compara con el teórico.
            </p>
            {delDia.length > 0 && (
              <Alerta tono="info" className="text-left">
                Ya hay {delDia.length} movimiento{delDia.length === 1 ? '' : 's'} registrado{delDia.length === 1 ? '' : 's'} en esta fecha; al abrir la jornada quedarán vinculados a ella.
              </Alerta>
            )}
            <Boton
              className="mt-2"
              tamano="lg"
              icono={<Unlock className="size-4" aria-hidden />}
              onClick={() => {
                setResponsable(perfil?.nombre ?? '');
                setModalAbrir(true);
              }}
            >
              Abrir jornada del {formatearFecha(fecha, 'diaMes')}
            </Boton>
          </div>
        </Cinta>
      ) : (
        <div className="space-y-6">
          <Tarjeta>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[19px] font-semibold text-tinta first-letter:uppercase">{formatearFecha(fecha, 'largo')}</h2>
                  <Insignia tono={cerrada ? 'neutro' : arqueoDiaria ? 'info' : 'exito'} icono={cerrada ? <Lock className="size-3" aria-hidden /> : <Unlock className="size-3" aria-hidden />}>
                    {estadoNombre}
                  </Insignia>
                </div>
                <p className="mt-1.5 text-[13.5px] text-tinta-3">
                  Apertura: <span className="text-tinta-2">{jornada.data.responsable_apertura ?? '—'}</span> · <span className="cifra">{hora(jornada.data.apertura_en)}</span>
                  {cerrada && jornada.data.cierre_en && (
                    <>
                      {' '}
                      · Cierre: <span className="text-tinta-2">{jornada.data.responsable_cierre ?? '—'}</span> · <span className="cifra">{hora(jornada.data.cierre_en)}</span>
                    </>
                  )}
                </p>
                {jornada.data.observacion && <p className="mt-1 text-[14px] text-tinta-2">Observación: {jornada.data.observacion}</p>}
              </div>
              <div className="no-imprimir flex flex-wrap items-center gap-3">
                {abierta && !arqueoDiaria && <p className="text-[13px] text-tinta-3">Guarda el arqueo para emitir el cierre.</p>}
                {abierta && (
                  <Boton
                    variante="exito"
                    icono={<Lock className="size-4" aria-hidden />}
                    onClick={() => {
                      setObservacionCierre(jornada.data?.observacion ?? '');
                      setModalCerrar(true);
                    }}
                    disabled={!arqueoDiaria}
                  >
                    Cerrar jornada
                  </Boton>
                )}
                {cerrada && esSupervisor && (
                  <Boton variante="secundario" icono={<Unlock className="size-4" aria-hidden />} onClick={() => void reabrir()} cargando={actualizar.isPending}>
                    Reabrir
                  </Boton>
                )}
              </div>
            </div>
          </Tarjeta>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <Cinta titulo="Efectivo teórico" subtitulo="Lo que debe haber en la caja de recepción al cierre">
              <dl>
                <LineaCinta
                  etiqueta={resumen.antes_del_corte ? 'Base para vuelto' : fecha === parametros.fecha_corte ? 'Base inicial (sale de la caja chica)' : 'Efectivo con que abrió'}
                  monto={resumen.saldo_inicial}
                />
                <LineaCinta etiqueta={`Cobros en efectivo (${resumen.n_ingresos})`} monto={resumen.ingresos_efectivo} signo="+" />
              </dl>
              <RayaCinta doble className="my-3" />
              <div className="flex items-end justify-between gap-3">
                <span className="rotulo text-[12px] text-tinta-2">Total teórico</span>
                <MontoDoble valor={resumen.teorico} className="text-[26px]" />
              </div>
              <p className="mt-4 text-[13px] leading-snug text-tinta-3">
                Los cobros digitales del día suman <span className="cifra text-tinta-2">{formatearSoles(resumen.ingresos_digital)}</span> y no pasan por la caja física.
              </p>
            </Cinta>

            {cerrada && !corrigiendo ? (
              <Cinta titulo="Reporte Z · cierre" subtitulo={jornada.data.cierre_en ? <>Emitido a las <span className="cifra">{hora(jornada.data.cierre_en)}</span></> : 'Jornada cerrada'} bordes="ambos">
                {arqueoDiaria ? (
                  <>
                    <dl>
                      <LineaCinta etiqueta="Efectivo contado" monto={aNumero(arqueoDiaria.total_contado)} />
                      <LineaCinta etiqueta="Efectivo teórico" monto={aNumero(arqueoDiaria.total_teorico)} />
                    </dl>
                    <RayaCinta doble className="my-3" />
                    <div className="flex items-end justify-between gap-3">
                      <span className="rotulo text-[12px] text-tinta-2">Diferencia</span>
                      <MontoDoble valor={aNumero(arqueoDiaria.diferencia)} className="text-[26px]" />
                    </div>
                    <div className="mt-3 flex justify-center">
                      <Insignia tono={arqueoDiaria.estado === 'CUADRA' ? 'exito' : 'peligro'}>{arqueoDiaria.estado}</Insignia>
                    </div>
                  </>
                ) : (
                  <p className="py-4 text-center text-[14px] text-tinta-2">Sin arqueo registrado para esta jornada.</p>
                )}
                <RayaCinta className="my-3" />
                <dl>
                  <LineaCinta etiqueta="Cerró" valor={<span className="font-sans">{jornada.data.responsable_cierre ?? '—'}</span>} />
                </dl>
                {jornada.data.observacion && <p className="mt-2 text-[13.5px] leading-snug text-tinta-2">{jornada.data.observacion}</p>}
                {arqueoDiaria && <HistorialObservaciones arqueoId={arqueoDiaria.id} className="-mx-5 mt-3" />}
                {esSupervisor && (
                  <div className="no-imprimir mt-auto flex justify-center pt-4">
                    <Boton variante="secundario" tamano="sm" icono={<Pencil className="size-3.5" aria-hidden />} onClick={() => setCorrigiendo(true)}>
                      Corregir arqueo
                    </Boton>
                  </div>
                )}
              </Cinta>
            ) : (
              <PanelArqueo
                titulo="Arqueo de caja diaria"
                subtitulo={arqueoDiaria ? `Guardado ${new Date(arqueoDiaria.realizado_en).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}` : 'Cuenta billetes y monedas · Enter pasa a la siguiente'}
                etiquetaTeorico="Efectivo teórico"
                denominaciones={parametros.denominaciones}
                tolerancia={parametros.tolerancia_arqueo}
                conteo={conteo}
                onCambioConteo={setConteo}
                resultado={resultado}
                arqueo={arqueoDiaria}
                conteoGuardado={arqueoGuardadoCoincide}
                puedeEditar={puedeEditar}
                guardando={guardarArqueo.isPending}
                onGuardar={guardar}
              />
            )}
          </div>

          <Tarjeta
            titulo={`Movimientos del día (${delDia.length})`}
            sinRelleno
            acciones={
              <Link to="/movimientos" className="rounded-[2px] px-2 py-1 text-[13.5px] font-semibold text-sello hover:bg-sello-claro">
                Ir a movimientos
              </Link>
            }
          >
            {delDia.length === 0 ? (
              <p className="px-5 py-6 text-[14px] text-tinta-3">Aún no hay movimientos en esta fecha.</p>
            ) : (
              <Tabla>
                <thead>
                  <tr>
                    <th className={claseTh}>N.º</th>
                    <th className={claseTh}>Turno</th>
                    <th className={claseTh}>Tipo</th>
                    <th className={claseTh}>Descripción</th>
                    <th className={claseTh}>Medio</th>
                    <th className={`${claseTh} text-right`}>Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-papel-3">
                  {delDia.map((m) => (
                    <tr key={m.id}>
                      <td className={`${claseTd} whitespace-nowrap`}>
                        <Correlativo numero={m.id} />
                      </td>
                      <td className={claseTd}>{m.turno === 'MAÑANA' ? 'Mañana' : 'Noche'}</td>
                      <td className={claseTd}>
                        <InsigniaTipo tipo={m.tipo} />
                      </td>
                      <td className={`${claseTd}`}>
                        <span className="block max-w-[22rem] truncate" title={m.descripcion}>
                          {m.descripcion}
                        </span>
                        {m.nombre && <span className="block text-[12.5px] text-tinta-3">{m.nombre}</span>}
                      </td>
                      <td className={claseTd}>{m.medio_pago ?? '—'}</td>
                      <td className={`${claseTdNum} font-semibold ${m.tipo === 'INGRESO' ? '' : 'text-rojo'}`}>
                        {m.tipo === 'INGRESO' ? '' : '−'}
                        {formatearSoles(montoTotal(m))}
                      </td>
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
          <div className="rounded-[3px] border border-dashed border-tinta-3/40 bg-papel-2 p-4 text-center">
            <p className="text-[13px] text-tinta-3">Efectivo con el que abre la caja</p>
            <MontoDoble valor={resumen.saldo_inicial} className="mt-1 text-[26px]" />
            <p className="mt-2 text-[12.5px] text-tinta-3">Es el arrastre del cierre anterior; no se reinicia a la base.</p>
          </div>
          <Campo etiqueta="Responsable de apertura">
            <Entrada value={responsable} onChange={(e) => setResponsable(e.target.value)} data-autofoco />
          </Campo>
        </div>
      </Modal>

      <Modal
        abierto={modalCerrar}
        titulo={`Cierre de la jornada del ${formatearFecha(fecha)}`}
        onCerrar={() => setModalCerrar(false)}
        ancho="sm"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModalCerrar(false)}>
              Volver
            </Boton>
            <Boton
              variante="exito"
              icono={<Lock className="size-4" aria-hidden />}
              onClick={() => void confirmarCierre()}
              cargando={actualizar.isPending}
              disabled={!arqueoGuardadoCoincide || (resultado.estado === 'REVISAR' && observacionCierre.trim().length < 3)}
            >
              Emitir cierre Z
            </Boton>
          </>
        }
      >
        <div className="space-y-4 text-[14px]">
          {/* Reporte X: vista previa del cierre antes de emitir el Z irreversible */}
          <div className="rounded-[3px] border border-dashed border-tinta-3/40 bg-white px-4 py-3">
            <p className="rotulo text-center text-[12px] text-tinta">Reporte X · vista previa</p>
            <RayaCinta className="my-2" />
            <dl>
              <LineaCinta etiqueta="Efectivo contado" valor={formatearSoles(resultado.total_contado)} />
              <LineaCinta etiqueta="Efectivo teórico" valor={formatearSoles(resultado.total_teorico)} />
            </dl>
            <RayaCinta doble className="my-2" />
            <div className="flex items-end justify-between gap-3">
              <span className="rotulo text-[12px] text-tinta-2">Diferencia</span>
              <MontoDoble valor={resultado.diferencia} className="text-[22px]" />
            </div>
            <div className="mt-2 flex justify-center">
              <Insignia tono={resultado.estado === 'CUADRA' ? 'exito' : 'peligro'}>{resultado.estado}</Insignia>
            </div>
          </div>
          {!arqueoGuardadoCoincide && <Alerta tono="alerta">El arqueo guardado no coincide con el conteo en pantalla. Guarda el arqueo antes de cerrar.</Alerta>}
          {resultado.estado === 'REVISAR' && <Alerta tono="peligro">La caja no cuadra. Explica la diferencia para poder cerrar; un supervisor la revisará en la auditoría.</Alerta>}
          <Campo etiqueta="Observación de cierre" requerido={resultado.estado === 'REVISAR'}>
            <AreaTexto rows={3} value={observacionCierre} onChange={(e) => setObservacionCierre(e.target.value)} />
          </Campo>
          <p className="text-[12.5px] leading-snug text-tinta-3">El Z cierra la jornada. El saldo de los movimientos, descontados los envíos a gerencia, continúa al día siguiente; el conteo sirve para comprobarlo, no reemplaza el saldo ni registra un ingreso.</p>
        </div>
      </Modal>
      <FormularioMovimiento abierto={enviarGerencia} onCerrar={() => setEnviarGerencia(false)} preset={{ fecha, tipo: 'RETIRO', caja_retiro: 'DIARIA', destino: 'GERENCIA', descripcion: 'ENVÍO DE CAJA DE FONDO A GERENCIA' }} />
    </>
  );
}
