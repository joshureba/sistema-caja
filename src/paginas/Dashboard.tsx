import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Hash, Receipt, Scale, Smartphone, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { InsigniaEstadoCajaChica, MedidorCajaChica } from '@/componentes/CajaChicaResumen';
import { Encabezado } from '@/componentes/Layout';
import { Indicador } from '@/componentes/Indicador';
import { SelectorPeriodo } from '@/componentes/SelectorPeriodo';
import { GraficoIngresosEgresos, GraficoSaldoCajaChica, TablaIngresosEgresos, TablaSaldo, TarjetaGrafico, type PuntoIngresoEgreso, type PuntoSaldo } from '@/componentes/graficos';
import { Alerta, Cargando, Insignia, Tabla, Tarjeta, claseTd, claseTdNum, claseTh, claseThNum } from '@/componentes/ui';
import { useDatosCaja, useJornada } from '@/datos/consultas';
import {
  ETIQUETA_ESTADO_CAJA_CHICA,
  estadoCajaChica,
  etiquetaRango,
  formatearFecha,
  formatearSoles,
  hoyISO,
  rangoAnterior,
  rangoPeriodo,
  rangosRecientes,
  resumenPeriodo,
  saldoCajaChica,
  serieDiaria,
  sumarDias,
  type TipoPeriodo,
} from '@/dominio';
import { mensajeError } from '@/lib/supabase';

const formatoPct = new Intl.NumberFormat('es-PE', { style: 'percent', maximumFractionDigits: 0 });

export default function Dashboard() {
  const { movimientos, parametros, cargando, error } = useDatosCaja();
  const hoy = hoyISO();
  const [tipo, setTipo] = useState<TipoPeriodo>('MENSUAL');
  const [fechaRef, setFechaRef] = useState(hoy);
  const jornadaHoy = useJornada(hoy);

  const rango = useMemo(() => rangoPeriodo(tipo, fechaRef), [tipo, fechaRef]);
  const anterior = useMemo(() => rangoAnterior(tipo, rango), [tipo, rango]);
  const resumen = useMemo(() => resumenPeriodo(movimientos, rango.desde, rango.hasta), [movimientos, rango]);
  const resumenAnterior = useMemo(() => resumenPeriodo(movimientos, anterior.desde, anterior.hasta), [movimientos, anterior]);

  // Saldo de caja chica al cierre del período (o a hoy si el período aún no termina).
  const fechaSaldo = rango.hasta < hoy ? rango.hasta : hoy;
  const saldo = useMemo(() => saldoCajaChica(movimientos, parametros, fechaSaldo), [movimientos, parametros, fechaSaldo]);
  const estado = estadoCajaChica(saldo, parametros);

  // Serie de ingresos y egresos: por día hasta dos meses, por mes para períodos largos.
  const serieIngresos = useMemo<PuntoIngresoEgreso[]>(() => {
    const dias = serieDiaria(movimientos, parametros, rango.desde, rango.hasta);
    if (dias.length <= 62) return dias.map((d) => ({ etiqueta: formatearFecha(d.fecha, 'diaMes'), ingresos: d.ingresos, egresos: d.egresos }));
    const meses = rangosRecientes('MENSUAL', rango.hasta, Math.ceil(dias.length / 28) + 1).filter((m) => m.hasta >= rango.desde && m.desde <= rango.hasta);
    return meses.map((m) => {
      const r = resumenPeriodo(movimientos, m.desde < rango.desde ? rango.desde : m.desde, m.hasta > rango.hasta ? rango.hasta : m.hasta);
      return { etiqueta: etiquetaRango('MENSUAL', m), ingresos: r.ingresos, egresos: r.egresos };
    });
  }, [movimientos, parametros, rango]);

  // Curva del saldo: el período seleccionado, o los últimos 31 días si el período es muy corto.
  const serieSaldo = useMemo<PuntoSaldo[]>(() => {
    const desdeBase = rango.desde < parametros.fecha_corte ? parametros.fecha_corte : rango.desde;
    const desde = fechaSaldo < sumarDias(desdeBase, 6) ? sumarDias(fechaSaldo, -30) : desdeBase;
    const inicio = desde < parametros.fecha_corte ? parametros.fecha_corte : desde;
    if (inicio > fechaSaldo) return [];
    return serieDiaria(movimientos, parametros, inicio, fechaSaldo).map((d) => ({ etiqueta: formatearFecha(d.fecha, 'diaMes'), saldo: d.saldo_caja_chica }));
  }, [movimientos, parametros, rango.desde, fechaSaldo]);

  if (cargando) return <Cargando texto="Cargando la caja…" />;

  const salidasCajaChica = resumen.egresos;
  const totalTurnos = resumen.por_turno.reduce((acc, t) => acc + t.ingresos, 0);

  return (
    <>
      <Encabezado titulo="Dashboard" descripcion="Ingresos, egresos y control de la caja chica." />
      {error ? <Alerta tono="peligro" className="mb-4">{mensajeError(error)}</Alerta> : null}

      <div className="space-y-6">
        <SelectorPeriodo
          tipo={tipo}
          fechaRef={fechaRef}
          onCambio={(t, f) => {
            setTipo(t);
            setFechaRef(f);
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Indicador etiqueta="Ingresos totales" valor={resumen.ingresos} delta={resumen.ingresos - resumenAnterior.ingresos} icono={<ArrowUpCircle className="size-5" />} />
          <Indicador etiqueta="Egresos caja chica" valor={salidasCajaChica} delta={salidasCajaChica - resumenAnterior.egresos} subirEsBueno={false} icono={<ArrowDownCircle className="size-5" />} />
          <Indicador etiqueta="Resultado neto" valor={resumen.resultado_neto} delta={resumen.resultado_neto - resumenAnterior.resultado_neto} icono={<Scale className="size-5" />} nota="Ingresos menos egresos. Los retiros y reposiciones son traslados." />
          <Indicador etiqueta="Movimientos" valor={resumen.n_movimientos} formato="entero" delta={resumen.n_movimientos - resumenAnterior.n_movimientos} icono={<Hash className="size-5" />} />
          <Indicador etiqueta="Ingresos digitales" valor={resumen.ingresos_digital} icono={<Smartphone className="size-5" />} nota={resumen.ingresos ? `${formatoPct.format(resumen.ingresos_digital / resumen.ingresos)} del total` : undefined} />
          <Indicador etiqueta="Ingresos en efectivo" valor={resumen.ingresos_efectivo} icono={<Wallet className="size-5" />} nota={resumen.ingresos ? `${formatoPct.format(resumen.ingresos_efectivo / resumen.ingresos)} del total` : undefined} />
          <Indicador etiqueta="Ticket promedio" valor={resumen.ticket_promedio} delta={resumen.ticket_promedio - resumenAnterior.ticket_promedio} icono={<Receipt className="size-5" />} nota={`${resumen.n_ingresos} cobros`} />
          <Indicador etiqueta="Sin comprobante" valor={resumen.sin_comprobante} formato="entero" subirEsBueno={false} icono={<AlertTriangle className="size-5" />} nota={`${resumen.pendientes} pendientes de sustento`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Tarjeta titulo="Caja chica" subtitulo={`Saldo al ${formatearFecha(fechaSaldo)}`} className="lg:col-span-1">
            <p className="text-4xl font-semibold text-slate-900">{saldo === null ? '—' : formatearSoles(saldo)}</p>
            <div className="mt-2">
              <InsigniaEstadoCajaChica estado={estado} />
            </div>
            <div className="mt-5">
              <MedidorCajaChica saldo={saldo} parametros={parametros} />
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Egresos</dt>
                <dd className="font-semibold tabular-nums">{formatearSoles(resumen.egresos)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Reposiciones</dt>
                <dd className="font-semibold tabular-nums">{formatearSoles(resumen.reposiciones)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Retiros</dt>
                <dd className="font-semibold tabular-nums">{formatearSoles(resumen.retiros)}</dd>
              </div>
            </dl>
            {saldo === null && <p className="mt-4 text-xs text-slate-500">El control de caja chica empieza el {formatearFecha(parametros.fecha_corte)}.</p>}
            <Link to="/caja-chica" className="mt-4 inline-block text-sm font-semibold text-marca-700 hover:underline">
              Ir a caja chica
            </Link>
          </Tarjeta>

          <div className="lg:col-span-2">
            <TarjetaGrafico
              titulo="Ingresos y egresos"
              subtitulo={serieIngresos.length && serieIngresos.length <= 62 && rango.desde !== rango.hasta ? 'Por día' : rango.desde === rango.hasta ? 'Del día' : 'Por mes'}
              grafico={<GraficoIngresosEgresos datos={serieIngresos} />}
              tabla={<TablaIngresosEgresos datos={serieIngresos} />}
            />
          </div>
        </div>

        <TarjetaGrafico
          titulo="Saldo de caja chica"
          subtitulo={`Rango permitido: ${formatearSoles(parametros.caja_chica_min)} a ${formatearSoles(parametros.caja_chica_max)}`}
          grafico={
            serieSaldo.length ? (
              <GraficoSaldoCajaChica datos={serieSaldo} minimo={parametros.caja_chica_min} maximo={parametros.caja_chica_max} alerta={parametros.caja_chica_alerta} />
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">Sin datos de caja chica en este período.</p>
            )
          }
          tabla={<TablaSaldo datos={serieSaldo} />}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Tarjeta titulo="Ventas por turno" className="lg:col-span-2" sinRelleno>
            <Tabla>
              <thead className="bg-slate-50">
                <tr>
                  <th className={claseTh}>Turno</th>
                  <th className={claseThNum}>Ventas</th>
                  <th className={claseThNum}>Digital</th>
                  <th className={claseThNum}>Efectivo</th>
                  <th className={claseThNum}>Cobros</th>
                  <th className={claseThNum}>Ticket prom.</th>
                  <th className={claseThNum}>Participación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumen.por_turno.map((t) => (
                  <tr key={t.turno}>
                    <td className={claseTd}>{t.turno === 'MAÑANA' ? 'Mañana' : 'Noche'}</td>
                    <td className={claseTdNum}>{formatearSoles(t.ingresos)}</td>
                    <td className={claseTdNum}>{formatearSoles(t.digital)}</td>
                    <td className={claseTdNum}>{formatearSoles(t.efectivo)}</td>
                    <td className={claseTdNum}>{t.n_ingresos}</td>
                    <td className={claseTdNum}>{formatearSoles(t.ticket_promedio)}</td>
                    <td className={claseTdNum}>{formatoPct.format(t.participacion)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className={claseTd}>Total</td>
                  <td className={claseTdNum}>{formatearSoles(totalTurnos)}</td>
                  <td className={claseTdNum}>{formatearSoles(resumen.ingresos_digital)}</td>
                  <td className={claseTdNum}>{formatearSoles(resumen.ingresos_efectivo)}</td>
                  <td className={claseTdNum}>{resumen.n_ingresos}</td>
                  <td className={claseTdNum}>{formatearSoles(resumen.ticket_promedio)}</td>
                  <td className={claseTdNum}>{resumen.ingresos ? '100 %' : '—'}</td>
                </tr>
              </tbody>
            </Tabla>
          </Tarjeta>

          <Tarjeta titulo="Control operativo">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Jornada de hoy</span>
                {jornadaHoy.data ? (
                  <Insignia tono={jornadaHoy.data.estado === 'ABIERTA' ? 'exito' : 'neutro'}>{jornadaHoy.data.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada'}</Insignia>
                ) : (
                  <Link to="/jornada" className="font-semibold text-marca-700 hover:underline">
                    Sin abrir
                  </Link>
                )}
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Caja chica</span>
                <span className="font-medium">{ETIQUETA_ESTADO_CAJA_CHICA[estado]}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Sin comprobante</span>
                <span className="font-medium tabular-nums">{resumen.sin_comprobante}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Pendientes de sustento</span>
                <span className="font-medium tabular-nums">{resumen.pendientes}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Retiros de efectivo</span>
                <span className="font-medium tabular-nums">{formatearSoles(resumen.retiros)}</span>
              </li>
            </ul>
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Ingresos por canal</p>
              {resumen.por_medio_pago.length === 0 && <p className="text-sm text-slate-400">Sin cobros en el período.</p>}
              {resumen.por_medio_pago.map((c) => (
                <div key={c.clave} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-600">{c.clave}</span>
                  <span className="tabular-nums">
                    {formatearSoles(c.importe)} <span className="text-slate-400">({c.n})</span>
                  </span>
                </div>
              ))}
            </div>
          </Tarjeta>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Tarjeta titulo="Ingresos por área" sinRelleno>
            <TablaAreas filas={resumen.por_area_ingresos} total={resumen.ingresos} />
          </Tarjeta>
          <Tarjeta titulo="Egresos por área" sinRelleno>
            <TablaAreas filas={resumen.por_area_egresos} total={resumen.egresos} />
          </Tarjeta>
        </div>
      </div>
    </>
  );
}

function TablaAreas({ filas, total }: { filas: { clave: string; importe: number; n: number }[]; total: number }) {
  if (!filas.length) return <p className="px-5 py-6 text-sm text-slate-400">Sin movimientos en el período.</p>;
  return (
    <Tabla>
      <thead className="bg-slate-50">
        <tr>
          <th className={claseTh}>Área</th>
          <th className={claseThNum}>Importe</th>
          <th className={claseThNum}>Mov.</th>
          <th className={claseThNum}>%</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {filas.map((f) => (
          <tr key={f.clave}>
            <td className={claseTd}>{f.clave}</td>
            <td className={claseTdNum}>{formatearSoles(f.importe)}</td>
            <td className={claseTdNum}>{f.n}</td>
            <td className={claseTdNum}>{total ? formatoPct.format(f.importe / total) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </Tabla>
  );
}
