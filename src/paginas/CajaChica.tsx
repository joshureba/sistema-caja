import { ArrowUpRight, Banknote, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { InsigniaEstadoCajaChica, MedidorCajaChica } from '@/componentes/CajaChicaResumen';
import { FormularioMovimiento } from '@/componentes/FormularioMovimiento';
import { InsigniaSustento, InsigniaTipo } from '@/componentes/InsigniaTipo';
import { Encabezado, NavegadorDia } from '@/componentes/Layout';
import { PanelArqueo } from '@/componentes/PanelArqueo';
import { Alerta, Boton, Cargando, Cinta, Correlativo, LineaCinta, MontoDoble, RayaCinta, Tabla, Tarjeta, claseTd, claseTdNum, claseTh } from '@/componentes/ui';
import { useArqueos, useDatosCaja, useGuardarArqueo, useJornada } from '@/datos/consultas';
import {
  calcularArqueo,
  FECHA_CAJA_CHICA_SOLO_EGRESOS,
  conteoVacio,
  filtrarRango,
  formatearFecha,
  formatearSoles,
  hoyISO,
  montoTotal,
  ordenarCronologico,
  restar,
  resumenCajaChicaDia,
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

  const arqueoChica = arqueos.data?.find((a) => a.caja === 'CHICA');
  const [conteo, setConteo] = useState<Conteo>(() => conteoVacio(parametros.denominaciones));
  useEffect(() => {
    setConteo(arqueoChica ? (arqueoChica.conteo as Conteo) : conteoVacio(parametros.denominaciones));
  }, [arqueoChica, fecha, parametros.denominaciones]);
  const resultado = useMemo(() => calcularArqueo(conteo, parametros.denominaciones, dia.saldo_final ?? 0, parametros.tolerancia_arqueo), [conteo, parametros, dia.saldo_final]);
  const puedeArquear = Boolean(jornada.data) && (jornada.data?.estado === 'ABIERTA' || esSupervisor);
  const conteoGuardado = Boolean(arqueoChica) && aNumero(arqueoChica?.total_contado) === resultado.total_contado && aNumero(arqueoChica?.total_teorico) === resultado.total_teorico;

  async function guardar(nota: string) {
    if (!jornada.data) return;
    await guardarArqueo.mutateAsync({
      valores: {
        jornada_id: jornada.data.id,
        caja: 'CHICA',
        conteo,
        total_contado: resultado.total_contado,
        total_teorico: resultado.total_teorico,
        diferencia: resultado.diferencia,
        estado: resultado.estado,
      },
      nota,
      soloNotaDe: conteoGuardado ? arqueoChica?.id : undefined,
    });
    setMensaje(conteoGuardado ? 'Observación agregada al historial.' : 'Arqueo de caja chica guardado.');
  }

  const faltante = dia.saldo_final !== null && dia.saldo_final < parametros.caja_chica_min ? restar(parametros.caja_chica_max, dia.saldo_final) : null;
  const excedente = dia.saldo_final !== null && dia.saldo_final > parametros.caja_chica_max ? restar(dia.saldo_final, parametros.caja_chica_max) : null;
  const soloSalidas = fecha >= FECHA_CAJA_CHICA_SOLO_EGRESOS;

  if (cargando) return <Cargando texto="Imprimiendo la caja chica…" />;

  return (
    <>
      <Encabezado
        titulo="Caja chica"
        descripcion={
          <>
            Fondo para gastos del área. Debe mantenerse entre <span className="cifra text-white">{formatearSoles(parametros.caja_chica_min)}</span> y <span className="cifra text-white">{formatearSoles(parametros.caja_chica_max)}</span>.
          </>
        }
        acciones={<NavegadorDia fecha={fecha} hoy={hoy} onCambio={setFecha} />}
      />

      {mensaje && (
        <Alerta tono="exito" className="mb-4">
          {mensaje}
        </Alerta>
      )}
      {guardarArqueo.error ? <Alerta tono="peligro" className="mb-4">{mensajeError(guardarArqueo.error)}</Alerta> : null}
      {faltante !== null && (
        <Alerta tono="peligro" titulo="Caja chica bajo el mínimo" className="mb-4">
          Faltan {formatearSoles(restar(parametros.caja_chica_min, dia.saldo_final ?? 0))} para llegar al mínimo. {soloSalidas ? 'Desde el 15/09 esta caja solo registra salidas.' : `Una reposición de ${formatearSoles(faltante)} la deja en el máximo.`}
        </Alerta>
      )}
      {excedente !== null && (
        <Alerta tono="alerta" titulo="Caja chica sobre el máximo" className="mb-4">
          Hay {formatearSoles(excedente)} por encima del máximo permitido. Registra un retiro hacia el banco.
        </Alerta>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Cinta titulo="Saldo de caja chica" subtitulo={<>Al cierre del <span className="cifra">{formatearFecha(fecha)}</span></>}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1">
            <div className="flex min-w-0 flex-col items-start gap-2">
              <MontoDoble valor={dia.saldo_final} className="text-[30px]" />
              <InsigniaEstadoCajaChica estado={dia.estado} />
            </div>
            <MedidorCajaChica saldo={dia.saldo_final} parametros={parametros} alto={132} />
          </div>
          <dl className="mt-3">
            <LineaCinta etiqueta="Saldo inicial" monto={dia.saldo_inicial} />
            <LineaCinta etiqueta="Reposiciones" monto={dia.reposiciones} signo="+" />
            <LineaCinta etiqueta={`Egresos (${dia.n_egresos})`} monto={dia.egresos} signo="−" salida />
            <LineaCinta etiqueta="Retiros" monto={dia.retiros} signo="−" salida />
            <RayaCinta doble className="my-2" />
            <LineaCinta etiqueta="Saldo final" monto={dia.saldo_final} fuerte />
          </dl>
          {dia.saldo_final === null && (
            <p className="mt-3 text-[12.5px] text-tinta-3">
              El control empieza el {formatearFecha(parametros.fecha_corte)} con {formatearSoles(parametros.saldo_inicial_caja_chica)}.
            </p>
          )}
          <div className="no-imprimir mt-5 grid gap-2 pb-2">
            <Boton variante="peligro" icono={<ArrowUpRight className="size-4" aria-hidden />} onClick={() => setFormulario('EGRESO')}>
              Registrar egreso
            </Boton>
            <div className="grid grid-cols-2 gap-2">
              {!soloSalidas && (
                <Boton variante="secundario" icono={<RefreshCw className="size-4" aria-hidden />} onClick={() => setFormulario('REPOSICION_CAJA_CHICA')}>
                  Reposición
                </Boton>
              )}
              <Boton variante="secundario" icono={<Banknote className="size-4" aria-hidden />} onClick={() => setFormulario('RETIRO')} className={soloSalidas ? 'col-span-2' : undefined}>
                Retiro
              </Boton>
            </div>
          </div>
        </Cinta>

        <PanelArqueo
          titulo="Arqueo de caja chica"
          subtitulo={
            !jornada.data ? (
              <>
                Abre la jornada del {formatearFecha(fecha)} en{' '}
                <Link to="/jornada" className="font-semibold text-sello hover:underline">
                  caja de fondo
                </Link>{' '}
                para registrar el arqueo.
              </>
            ) : arqueoChica ? (
              `Guardado ${new Date(arqueoChica.realizado_en).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}`
            ) : (
              'Cuenta el efectivo del fondo · Enter pasa a la siguiente'
            )
          }
          etiquetaTeorico="Saldo teórico"
          denominaciones={parametros.denominaciones}
          tolerancia={parametros.tolerancia_arqueo}
          conteo={conteo}
          onCambioConteo={setConteo}
          resultado={resultado}
          arqueo={arqueoChica}
          conteoGuardado={conteoGuardado}
          puedeEditar={puedeArquear}
          guardando={guardarArqueo.isPending}
          onGuardar={guardar}
        />
      </div>

      <Tarjeta className="mt-6" titulo={`Salidas y entradas del ${formatearFecha(fecha)}`} subtitulo={`${movimientosDia.length} movimiento${movimientosDia.length === 1 ? '' : 's'} de caja chica`} sinRelleno>
        {movimientosDia.length === 0 ? (
          <p className="px-5 py-6 text-[14px] text-tinta-3">Sin egresos, reposiciones ni retiros en esta fecha.</p>
        ) : (
          <Tabla>
            <thead>
              <tr>
                <th className={claseTh}>Tipo · N.º</th>
                <th className={claseTh}>Descripción</th>
                <th className={claseTh}>Responsable</th>
                <th className={claseTh}>Sustento</th>
                <th className={`${claseTh} text-right`}>Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-papel-3">
              {movimientosDia.map((m) => (
                <tr key={m.id}>
                  <td className={`${claseTd} whitespace-nowrap`}>
                    <InsigniaTipo tipo={m.tipo} />
                    <Correlativo numero={m.id} className="mt-1 block text-[11.5px]" />
                  </td>
                  <td className={claseTd}>
                    <span className="block max-w-[28rem] truncate" title={m.descripcion}>
                      {m.descripcion}
                    </span>
                    {m.nombre && <span className="block text-[12.5px] text-tinta-3">{m.nombre}</span>}
                  </td>
                  <td className={`${claseTd} text-[13px]`}>{m.responsable ?? <span className="text-tinta-3">—</span>}</td>
                  <td className={claseTd}>{m.tipo === 'EGRESO' ? <InsigniaSustento estado={m.estado_sustento} /> : <span className="text-tinta-3">—</span>}</td>
                  <td className={`${claseTdNum} font-semibold ${m.tipo === 'REPOSICION_CAJA_CHICA' ? '' : 'text-rojo'}`}>
                    {m.tipo === 'REPOSICION_CAJA_CHICA' ? '+' : '−'}
                    {formatearSoles(montoTotal(m))}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>

      <FormularioMovimiento abierto={formulario !== null} onCerrar={() => setFormulario(null)} preset={formulario ? { tipo: formulario, fecha } : undefined} />
    </>
  );
}
