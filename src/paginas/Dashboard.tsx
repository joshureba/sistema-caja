import { clsx } from 'clsx';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { InsigniaEstadoCajaChica, MedidorCajaChica } from '@/componentes/CajaChicaResumen';
import { Encabezado } from '@/componentes/Layout';
import { SelectorPeriodo } from '@/componentes/SelectorPeriodo';
import { TablaSaldo, type PuntoSaldo } from '@/componentes/graficos';
import { Alerta, Cargando, Cinta, Insignia, LineaCinta, MontoDoble, RayaCinta, Tabla, Tarjeta, claseTd, claseTdNum, claseTh, claseThNum } from '@/componentes/ui';
import { useDatosCaja, useJornada } from '@/datos/consultas';
import {
  ETIQUETA_PERIODO,
  estadoCajaChica,
  formatearFecha,
  formatearSoles,
  hoyISO,
  movimientosDesdeCorte,
  rangoAnterior,
  rangoPeriodo,
  restar,
  resumenFondoAcumulado,
  resumenPeriodo,
  saldoCajaChica,
  serieDiaria,
  sumar,
  sumarDias,
  type TipoPeriodo,
} from '@/dominio';
import { mensajeError } from '@/lib/supabase';

const formatoPct = new Intl.NumberFormat('es-PE', { style: 'percent', maximumFractionDigits: 0 });

export default function Dashboard() {
  const { movimientos: todosLosMovimientos, parametros, cargando, error } = useDatosCaja();
  const hoy = hoyISO();
  const movimientos = useMemo(() => movimientosDesdeCorte(todosLosMovimientos, parametros.fecha_corte, hoy), [todosLosMovimientos, parametros.fecha_corte, hoy]);
  const [tipo, setTipo] = useState<TipoPeriodo>('MENSUAL');
  const [fechaRef, setFechaRef] = useState(hoy);
  const jornadaHoy = useJornada(hoy);

  const rango = useMemo(() => rangoPeriodo(tipo, fechaRef), [tipo, fechaRef]);
  const anterior = useMemo(() => rangoAnterior(tipo, rango), [tipo, rango]);
  const compararAnterior = anterior.desde >= parametros.fecha_corte && rango.hasta <= hoy;
  const resumen = useMemo(() => resumenPeriodo(movimientos, rango.desde, rango.hasta), [movimientos, rango]);
  const resumenAnterior = useMemo(() => resumenPeriodo(movimientos, anterior.desde, anterior.hasta), [movimientos, anterior]);
  const resumenHoy = useMemo(() => resumenPeriodo(movimientos, hoy, hoy), [movimientos, hoy]);

  // Saldo de caja chica al cierre del período (o a hoy si el período aún no termina).
  const fechaSaldo = rango.hasta < hoy ? rango.hasta : hoy;
  const saldo = useMemo(() => saldoCajaChica(movimientos, parametros, fechaSaldo), [movimientos, parametros, fechaSaldo]);
  const estado = estadoCajaChica(saldo, parametros);
  const fondo = useMemo(() => resumenFondoAcumulado(movimientos, parametros, fechaSaldo), [movimientos, parametros, fechaSaldo]);
  const saldoFondo = fondo.saldo;
  const resumenChica = useMemo(() => resumenPeriodo(movimientos.filter((m) => m.tipo !== 'RETIRO' || m.caja_retiro === 'CHICA'), rango.desde, rango.hasta), [movimientos, rango]);

  // Curva del saldo: el período seleccionado, o los últimos 31 días si el período es muy corto.
  const serieSaldo = useMemo<PuntoSaldo[]>(() => {
    const desdeBase = rango.desde < parametros.fecha_corte ? parametros.fecha_corte : rango.desde;
    const desde = fechaSaldo < sumarDias(desdeBase, 6) ? sumarDias(fechaSaldo, -30) : desdeBase;
    const inicio = desde < parametros.fecha_corte ? parametros.fecha_corte : desde;
    if (inicio > fechaSaldo) return [];
    return serieDiaria(movimientos, parametros, inicio, fechaSaldo).map((d) => ({ etiqueta: formatearFecha(d.fecha, 'diaMes'), saldo: d.saldo_caja_chica }));
  }, [movimientos, parametros, rango.desde, fechaSaldo]);

  if (cargando) return <Cargando texto="Imprimiendo la caja…" />;

  const totalTurnos = sumar(...resumen.por_turno.map((t) => t.ingresos));
  const delta = (actual: number, previo: number) => (compararAnterior ? restar(actual, previo) : undefined);
  const textoRango = rango.desde === rango.hasta ? formatearFecha(rango.desde) : `${formatearFecha(rango.desde)} al ${formatearFecha(rango.hasta)}`;

  const estadoJornada = jornadaHoy.data ? (
    <Insignia tono={jornadaHoy.data.estado === 'ABIERTA' ? 'exito' : 'neutro'}>{jornadaHoy.data.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada · Z'}</Insignia>
  ) : jornadaHoy.isPending ? (
    <span className="cifra text-[12px] text-tinta-3">…</span>
  ) : (
    <Link to="/jornada" className="text-[13px] font-semibold text-sello hover:underline">
      Sin abrir · abrir
    </Link>
  );

  return (
    <>
      <Encabezado
        titulo="Dashboard"
        descripcion={
          <>
            Operaciones desde el <span className="cifra text-white">{formatearFecha(parametros.fecha_corte)}</span>. Los S/ 500 de apertura no son ingresos.{' '}
            <Link to="/historico" className="font-semibold text-white underline decoration-white/40 hover:decoration-white">
              Ver histórico anterior
            </Link>
          </>
        }
      />
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

        {/* Las dos cajas y el Reporte X del día */}
        <div className="grid items-stretch gap-x-6 gap-y-7 lg:grid-cols-2 xl:grid-cols-3">
          <Cinta titulo="Caja de fondo" subtitulo={<>Saldo al <span className="cifra">{formatearFecha(fechaSaldo)}</span></>}>
            <div className="flex min-h-[112px] flex-col items-start justify-center gap-2 py-1">
              <MontoDoble valor={saldoFondo} className="text-[30px]" />
              <Insignia tono={saldoFondo === null ? 'neutro' : 'info'}>{saldoFondo === null ? 'Antes del corte' : 'Saldo con arrastre'}</Insignia>
            </div>
            <dl className="mt-3">
              <LineaCinta etiqueta="Disponible en fondo" monto={saldoFondo} />
              <LineaCinta etiqueta="Enviado a gerencia" monto={saldoFondo === null ? null : fondo.envios} signo="−" salida />
              <RayaCinta className="my-2" />
              <LineaCinta etiqueta="Efectivo del período" monto={resumen.ingresos_efectivo} />
              <LineaCinta etiqueta="Cobros del período" valor={resumen.n_ingresos} />
            </dl>
            <p className="mt-3 text-[12.5px] leading-snug text-tinta-3">
              {saldoFondo === null ? `El control empieza el ${formatearFecha(parametros.fecha_corte)}.` : 'Saldo anterior + efectivo − envíos a gerencia; continúa al día siguiente. Lo digital va aparte.'}
            </p>
            <EnlaceCinta a="/jornada">Ir a caja de fondo</EnlaceCinta>
          </Cinta>

          <Cinta titulo="Caja chica" subtitulo={<>Saldo al <span className="cifra">{formatearFecha(fechaSaldo)}</span></>}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1">
              <div className="flex min-w-0 flex-col items-start gap-2">
                <MontoDoble valor={saldo} className="text-[30px]" />
                <InsigniaEstadoCajaChica estado={estado} />
              </div>
              <MedidorCajaChica saldo={saldo} parametros={parametros} alto={112} />
            </div>
            <dl className="mt-3">
              <LineaCinta etiqueta="Egresos" monto={resumen.egresos} signo="−" salida />
              <LineaCinta etiqueta="Reposiciones" monto={resumen.reposiciones} signo="+" />
              <LineaCinta etiqueta="Retiros" monto={resumenChica.retiros} signo="−" salida />
            </dl>
            <p className="mt-3 text-[12.5px] leading-snug text-tinta-3">
              {saldo === null ? `El control empieza el ${formatearFecha(parametros.fecha_corte)}.` : `Rango permitido de ${formatearSoles(parametros.caja_chica_min)} a ${formatearSoles(parametros.caja_chica_max)}.`}
            </p>
            <EnlaceCinta a="/caja-chica">Ir a caja chica</EnlaceCinta>
          </Cinta>

          <Cinta titulo="Reporte X · hoy" subtitulo={formatearFecha(hoy, 'largo')} className="lg:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between gap-3 py-1.5 text-[14px]">
              <span className="text-tinta-2">Jornada</span>
              {estadoJornada}
            </div>
            <dl>
              <LineaCinta etiqueta={`Cobros (${resumenHoy.n_ingresos})`} monto={resumenHoy.ingresos} fuerte />
              <LineaCinta etiqueta={<span className="pl-3">Digital</span>} monto={resumenHoy.ingresos_digital} />
              <LineaCinta etiqueta={<span className="pl-3">Efectivo</span>} monto={resumenHoy.ingresos_efectivo} />
              <LineaCinta etiqueta={`Egresos caja chica (${resumenHoy.n_egresos})`} monto={resumenHoy.egresos} signo="−" salida />
              <LineaCinta etiqueta="Retiros" monto={resumenHoy.retiros} signo="−" salida />
              <RayaCinta className="my-2" />
              <LineaCinta etiqueta="Sin comprobante" valor={<Contador n={resumenHoy.sin_comprobante} />} />
              <LineaCinta etiqueta="Pendientes de sustento" valor={<Contador n={resumenHoy.pendientes} />} />
            </dl>
            {resumenHoy.por_medio_pago.length > 0 && (
              <>
                <RayaCinta doble className="mt-3 mb-2" />
                <dl>
                  {resumenHoy.por_medio_pago.map((c) => (
                    <LineaCinta key={c.clave} etiqueta={`${c.clave} (${c.n})`} valor={formatearSoles(c.importe)} />
                  ))}
                </dl>
              </>
            )}
            {resumenHoy.n_movimientos === 0 && <p className="mt-3 text-center text-[13px] text-tinta-3">Aún no hay movimientos hoy.</p>}
            <EnlaceCinta a="/movimientos">Ver movimientos</EnlaceCinta>
          </Cinta>
        </div>

        {/* Libro del período: renglones con puntos guía, no una fila de indicadores */}
        <Tarjeta titulo="Resumen del período" subtitulo={<>{ETIQUETA_PERIODO[tipo]} · <span className="cifra text-[12.5px]">{textoRango}</span></>}>
          <div className="grid gap-x-10 gap-y-5 lg:grid-cols-2">
            <div>
              <h3 className="rotulo text-[12px] text-tinta-3">Entradas</h3>
              <dl className="mt-1">
                <LineaCinta etiqueta={<>Digital (Niubiz) <Parte valor={resumen.ingresos_digital} total={resumen.ingresos} /></>} monto={resumen.ingresos_digital} />
                <LineaCinta etiqueta={<>Efectivo <Parte valor={resumen.ingresos_efectivo} total={resumen.ingresos} /></>} monto={resumen.ingresos_efectivo} />
                <RayaCinta doble className="my-1.5" />
                <LineaCinta etiqueta={`Total ingresos (${resumen.n_ingresos} cobros)`} monto={resumen.ingresos} fuerte />
              </dl>
            </div>
            <div>
              <h3 className="rotulo text-[12px] text-tinta-3">Salidas y control</h3>
              <dl className="mt-1">
                <LineaCinta etiqueta="Egresos de caja chica" monto={resumen.egresos} signo="−" salida />
                <LineaCinta etiqueta="Retiros de efectivo" monto={resumen.retiros} signo="−" salida />
                <LineaCinta etiqueta="Movimientos" valor={resumen.n_movimientos} />
                <LineaCinta etiqueta="Sin comprobante · pendientes" valor={<><Contador n={resumen.sin_comprobante} /> · <Contador n={resumen.pendientes} /></>} />
              </dl>
            </div>
          </div>
          {compararAnterior && (
            <p className="mt-4 border-t border-dashed border-raya pt-3 text-[13px] text-tinta-3">
              Frente al período anterior: ingresos <Variacion valor={delta(resumen.ingresos, resumenAnterior.ingresos) ?? 0} />, egresos{' '}
              <Variacion valor={delta(resumen.egresos, resumenAnterior.egresos) ?? 0} subirEsMalo />, movimientos{' '}
              <span className="cifra text-tinta-2">{resumen.n_movimientos - resumenAnterior.n_movimientos > 0 ? '+' : ''}{resumen.n_movimientos - resumenAnterior.n_movimientos}</span>.
            </p>
          )}
        </Tarjeta>

        <div className="grid gap-6 lg:grid-cols-3">
          <Tarjeta
            className="lg:col-span-2"
            titulo="Saldo de caja chica"
            subtitulo={`Rango permitido: ${formatearSoles(parametros.caja_chica_min)} a ${formatearSoles(parametros.caja_chica_max)}`}
            sinRelleno
          >
            {serieSaldo.length ? (
              <TablaSaldo datos={serieSaldo} className="max-h-[22rem] overflow-y-auto" />
            ) : (
              <p className="px-5 py-10 text-center text-[14px] text-tinta-3">Sin datos de caja chica en este período.</p>
            )}
          </Tarjeta>

          <Tarjeta titulo="Ingresos por canal" subtitulo="Período seleccionado">
            {resumen.por_medio_pago.length === 0 ? (
              <p className="py-6 text-center text-[14px] text-tinta-3">Sin cobros en el período.</p>
            ) : (
              <ul className="space-y-3.5">
                {resumen.por_medio_pago.map((c) => {
                  const parte = resumen.ingresos ? c.importe / resumen.ingresos : 0;
                  return (
                    <li key={c.clave}>
                      <div className="flex items-baseline justify-between gap-3 text-[14px]">
                        <span className="font-medium text-tinta">
                          {c.clave} <span className="cifra text-[12px] font-normal text-tinta-3">({c.n})</span>
                        </span>
                        <span className="cifra text-[13.5px]">{formatearSoles(c.importe)}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-papel-3">
                          <div className="h-full bg-sello" style={{ width: `${Math.round(parte * 100)}%` }} />
                        </div>
                        <span className="cifra w-10 text-right text-[11.5px] text-tinta-3">{formatoPct.format(parte)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Tarjeta>
        </div>

        <Tarjeta titulo="Ventas por turno" sinRelleno>
          <Tabla>
            <thead>
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
            <tbody className="divide-y divide-papel-3">
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
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className={`${claseTd} rotulo text-[12px]`}>Total</td>
                <td className={claseTdNum}>{formatearSoles(totalTurnos)}</td>
                <td className={claseTdNum}>{formatearSoles(resumen.ingresos_digital)}</td>
                <td className={claseTdNum}>{formatearSoles(resumen.ingresos_efectivo)}</td>
                <td className={claseTdNum}>{resumen.n_ingresos}</td>
                <td className={claseTdNum}>{formatearSoles(resumen.ticket_promedio)}</td>
                <td className={claseTdNum}>{resumen.ingresos ? '100 %' : '—'}</td>
              </tr>
            </tfoot>
          </Tabla>
        </Tarjeta>

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

function EnlaceCinta({ a, children }: { a: string; children: ReactNode }) {
  return (
    <div className="mt-auto pt-4 text-center">
      <Link to={a} className="group inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[13.5px] font-semibold text-sello hover:bg-sello-claro">
        {children}
        <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </div>
  );
}

function Parte({ valor, total }: { valor: number; total: number }) {
  if (!total) return null;
  return <span className="cifra text-[11.5px] text-tinta-3">{formatoPct.format(valor / total)}</span>;
}

function Variacion({ valor, subirEsMalo }: { valor: number; subirEsMalo?: boolean }) {
  const malo = subirEsMalo ? valor > 0 : valor < 0;
  return (
    <span className={clsx('cifra', valor === 0 ? 'text-tinta-2' : malo ? 'text-rojo' : 'text-sello')}>
      {valor > 0 ? '+' : ''}
      {formatearSoles(valor)}
    </span>
  );
}

function Contador({ n }: { n: number }) {
  return <span className={n > 0 ? 'font-semibold text-rojo' : undefined}>{n}</span>;
}

function TablaAreas({ filas, total }: { filas: { clave: string; importe: number; n: number }[]; total: number }) {
  if (!filas.length) return <p className="px-5 py-6 text-[14px] text-tinta-3">Sin movimientos en el período.</p>;
  return (
    <Tabla>
      <thead>
        <tr>
          <th className={claseTh}>Área</th>
          <th className={claseThNum}>Importe</th>
          <th className={claseThNum}>Mov.</th>
          <th className={claseThNum}>%</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-papel-3">
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
