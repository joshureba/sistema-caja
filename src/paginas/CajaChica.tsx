import { ArrowDownCircle, ArrowUpCircle, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { InsigniaEstadoCajaChica, MedidorCajaChica } from '@/componentes/CajaChicaResumen';
import { ContadorDenominaciones } from '@/componentes/ContadorDenominaciones';
import { FormularioMovimiento } from '@/componentes/FormularioMovimiento';
import { InsigniaTipo } from '@/componentes/InsigniaTipo';
import { Encabezado } from '@/componentes/Layout';
import { GraficoSaldoCajaChica, TablaSaldo, TarjetaGrafico, type PuntoSaldo } from '@/componentes/graficos';
import { Alerta, AreaTexto, Boton, Campo, Cargando, Entrada, Insignia, Tabla, Tarjeta, claseTd, claseTdNum, claseTh, claseThNum } from '@/componentes/ui';
import { useArqueos, useDatosCaja, useGuardarArqueo, useJornada } from '@/datos/consultas';
import {
  calcularArqueo,
  conteoVacio,
  filtrarRango,
  formatearFecha,
  formatearSoles,
  hoyISO,
  montoTotal,
  ordenarCronologico,
  restar,
  resumenCajaChicaDia,
  serieDiaria,
  sumarDias,
  type Conteo,
  type TipoMovimiento,
} from '@/dominio';
import { aNumero } from '@/lib/normalizar';
import { mensajeError } from '@/lib/supabase';

export default function CajaChica() {
  const { esSupervisor } = useAuth();
  const { movimientos, parametros, cargando } = useDatosCaja();
  const hoy = hoyISO();
  const [fecha, setFecha] = useState(hoy);
  const jornada = useJornada(fecha);
  const arqueos = useArqueos(jornada.data?.id);
  const guardarArqueo = useGuardarArqueo();
  const [formulario, setFormulario] = useState<TipoMovimiento | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const dia = useMemo(() => resumenCajaChicaDia(movimientos, parametros, fecha), [movimientos, parametros, fecha]);
  const movimientosDia = useMemo(
    () => ordenarCronologico(filtrarRango(movimientos, fecha, fecha).filter((m) => m.tipo === 'EGRESO' || m.tipo === 'REPOSICION_CAJA_CHICA' || (m.tipo === 'RETIRO' && m.caja_retiro === 'CHICA'))),
    [movimientos, fecha],
  );
  const serie = useMemo<PuntoSaldo[]>(() => {
    const desde = sumarDias(fecha, -30) < parametros.fecha_corte ? parametros.fecha_corte : sumarDias(fecha, -30);
    if (desde > fecha) return [];
    return serieDiaria(movimientos, parametros, desde, fecha).map((d) => ({ etiqueta: formatearFecha(d.fecha, 'diaMes'), saldo: d.saldo_caja_chica }));
  }, [movimientos, parametros, fecha]);

  const arqueoChica = arqueos.data?.find((a) => a.caja === 'CHICA');
  const [conteo, setConteo] = useState<Conteo>(() => conteoVacio(parametros.denominaciones));
  const [observacion, setObservacion] = useState('');
  useEffect(() => {
    setConteo(arqueoChica ? (arqueoChica.conteo as Conteo) : conteoVacio(parametros.denominaciones));
    setObservacion(arqueoChica?.observacion ?? '');
  }, [arqueoChica, fecha, parametros.denominaciones]);
  const resultado = useMemo(() => calcularArqueo(conteo, parametros.denominaciones, dia.saldo_final ?? 0, parametros.tolerancia_arqueo), [conteo, parametros, dia.saldo_final]);
  const puedeArquear = Boolean(jornada.data) && (jornada.data?.estado === 'ABIERTA' || esSupervisor);

  async function guardar() {
    if (!jornada.data) return;
    await guardarArqueo.mutateAsync({
      jornada_id: jornada.data.id,
      caja: 'CHICA',
      conteo,
      total_contado: resultado.total_contado,
      total_teorico: resultado.total_teorico,
      diferencia: resultado.diferencia,
      estado: resultado.estado,
      observacion: observacion.trim() || null,
    });
    setMensaje('Arqueo de caja chica guardado.');
  }

  const faltante = dia.saldo_final !== null && dia.saldo_final < parametros.caja_chica_min ? restar(parametros.caja_chica_max, dia.saldo_final) : null;
  const excedente = dia.saldo_final !== null && dia.saldo_final > parametros.caja_chica_max ? restar(dia.saldo_final, parametros.caja_chica_max) : null;

  if (cargando) return <Cargando texto="Cargando la caja chica…" />;

  return (
    <>
      <Encabezado
        titulo="Caja chica"
        descripcion={`Fondo para gastos del área. Debe mantenerse entre ${formatearSoles(parametros.caja_chica_min)} y ${formatearSoles(parametros.caja_chica_max)}.`}
        acciones={
          <>
            <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFecha(sumarDias(fecha, -1))} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Día anterior">
              <ChevronLeft className="size-5" />
            </button>
            <Entrada type="date" value={fecha} max={hoy} onChange={(e) => e.target.value && setFecha(e.target.value)} className="w-40! shrink-0" aria-label="Fecha" />
            <button type="button" onClick={() => setFecha(sumarDias(fecha, 1))} disabled={fecha >= hoy} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40" aria-label="Día siguiente">
              <ChevronRight className="size-5" />
            </button>
            <Boton variante="secundario" onClick={() => setFecha(hoy)} disabled={fecha === hoy}>
              Hoy
            </Boton>
            </div>
          </>
        }
      />

      {mensaje && (
        <Alerta tono="exito" className="mb-4">
          {mensaje}
        </Alerta>
      )}
      {guardarArqueo.error ? <Alerta tono="peligro" className="mb-4">{mensajeError(guardarArqueo.error)}</Alerta> : null}
      {faltante !== null && (
        <Alerta tono="peligro" titulo="Caja chica bajo el mínimo" className="mb-4">
          Faltan {formatearSoles(restar(parametros.caja_chica_min, dia.saldo_final ?? 0))} para llegar al mínimo. Una reposición de {formatearSoles(faltante)} la deja en el máximo.
        </Alerta>
      )}
      {excedente !== null && (
        <Alerta tono="alerta" titulo="Caja chica sobre el máximo" className="mb-4">
          Hay {formatearSoles(excedente)} por encima del máximo permitido. Registra un retiro hacia el banco.
        </Alerta>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta titulo="Saldo" subtitulo={`Al cierre del ${formatearFecha(fecha)}`}>
          <p className="text-4xl font-semibold text-slate-900">{dia.saldo_final === null ? '—' : formatearSoles(dia.saldo_final)}</p>
          <div className="mt-2">
            <InsigniaEstadoCajaChica estado={dia.estado} />
          </div>
          <div className="mt-5">
            <MedidorCajaChica saldo={dia.saldo_final} parametros={parametros} />
          </div>
          <dl className="mt-6 divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-slate-600">Saldo inicial del día</dt>
              <dd className="tabular-nums">{dia.saldo_inicial === null ? '—' : formatearSoles(dia.saldo_inicial)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-600">Reposiciones</dt>
              <dd className="tabular-nums text-emerald-700">+{formatearSoles(dia.reposiciones)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-600">Egresos ({dia.n_egresos})</dt>
              <dd className="tabular-nums text-red-700">−{formatearSoles(dia.egresos)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-600">Retiros al banco</dt>
              <dd className="tabular-nums text-red-700">−{formatearSoles(dia.retiros)}</dd>
            </div>
            <div className="flex justify-between py-2 font-semibold">
              <dt>Saldo final</dt>
              <dd className="tabular-nums">{dia.saldo_final === null ? '—' : formatearSoles(dia.saldo_final)}</dd>
            </div>
          </dl>
          {dia.saldo_final === null && <p className="mt-3 text-xs text-slate-500">El control empieza el {formatearFecha(parametros.fecha_corte)} con {formatearSoles(parametros.saldo_inicial_caja_chica)}.</p>}
          <div className="no-imprimir mt-6 grid gap-2">
            <Boton variante="secundario" icono={<ArrowDownCircle className="size-4" />} onClick={() => setFormulario('EGRESO')}>
              Registrar egreso
            </Boton>
            <Boton variante="secundario" icono={<ArrowUpCircle className="size-4" />} onClick={() => setFormulario('REPOSICION_CAJA_CHICA')}>
              Registrar reposición
            </Boton>
            <Boton variante="secundario" icono={<Banknote className="size-4" />} onClick={() => setFormulario('RETIRO')}>
              Registrar retiro
            </Boton>
          </div>
        </Tarjeta>

        <div className="lg:col-span-2">
          <TarjetaGrafico
            titulo="Evolución del saldo"
            subtitulo="Últimos 31 días"
            grafico={
              serie.length ? (
                <GraficoSaldoCajaChica datos={serie} minimo={parametros.caja_chica_min} maximo={parametros.caja_chica_max} alerta={parametros.caja_chica_alerta} />
              ) : (
                <p className="py-10 text-center text-sm text-slate-500">Sin datos antes de la fecha de corte.</p>
              )
            }
            tabla={<TablaSaldo datos={serie} />}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Tarjeta titulo={`Movimientos de caja chica del ${formatearFecha(fecha)}`} sinRelleno>
          {movimientosDia.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">Sin egresos, reposiciones ni retiros en esta fecha.</p>
          ) : (
            <Tabla>
              <thead className="bg-slate-50">
                <tr>
                  <th className={claseTh}>Tipo</th>
                  <th className={claseTh}>Descripción</th>
                  <th className={claseTh}>Sustento</th>
                  <th className={claseThNum}>Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientosDia.map((m) => (
                  <tr key={m.id}>
                    <td className={claseTd}>
                      <InsigniaTipo tipo={m.tipo} />
                    </td>
                    <td className={`${claseTd} max-w-80`}>
                      <span className="block truncate" title={m.descripcion}>
                        {m.descripcion}
                      </span>
                      {m.nombre && <span className="block text-xs text-slate-400">{m.nombre}</span>}
                    </td>
                    <td className={claseTd}>{m.estado_sustento ?? '—'}</td>
                    <td className={`${claseTdNum} font-semibold`}>
                      {m.tipo === 'REPOSICION_CAJA_CHICA' ? '+' : '−'}
                      {formatearSoles(montoTotal(m))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Arqueo de caja chica"
          subtitulo={
            !jornada.data ? (
              <>
                Abre la jornada del {formatearFecha(fecha)} en{' '}
                <Link to="/jornada" className="font-semibold text-marca-700 hover:underline">
                  caja diaria
                </Link>{' '}
                para registrar el arqueo.
              </>
            ) : arqueoChica ? (
              `Guardado ${new Date(arqueoChica.realizado_en).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}`
            ) : (
              'Cuenta el efectivo del fondo'
            )
          }
          sinRelleno
        >
          <ContadorDenominaciones denominaciones={parametros.denominaciones} conteo={conteo} onCambio={setConteo} soloLectura={!puedeArquear} />
          <div className="space-y-3 border-t border-slate-100 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Saldo teórico</span>
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
            {puedeArquear && (
              <>
                <Campo etiqueta="Observación">
                  <AreaTexto rows={2} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
                </Campo>
                <div className="no-imprimir flex justify-end">
                  <Boton onClick={() => void guardar()} cargando={guardarArqueo.isPending} disabled={aNumero(arqueoChica?.total_contado) === resultado.total_contado && Boolean(arqueoChica) && (arqueoChica?.observacion ?? '') === observacion.trim()}>
                    {arqueoChica ? 'Actualizar arqueo' : 'Guardar arqueo'}
                  </Boton>
                </div>
              </>
            )}
          </div>
        </Tarjeta>
      </div>

      <FormularioMovimiento abierto={formulario !== null} onCerrar={() => setFormulario(null)} preset={formulario ? { tipo: formulario, fecha } : undefined} />
    </>
  );
}
