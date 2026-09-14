import { clsx } from 'clsx';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { InsigniaEstadoCajaChica } from '@/componentes/CajaChicaResumen';
import { Encabezado } from '@/componentes/Layout';
import { GraficoIngresosEgresos, TablaIngresosEgresos, TarjetaGrafico } from '@/componentes/graficos';
import { Boton, Cargando, Segmentado, Tabla, Tarjeta, claseTd, claseTdNum, claseTh, claseThNum } from '@/componentes/ui';
import { useDatosCaja } from '@/datos/consultas';
import { ETIQUETA_ESTADO_CAJA_CHICA, ETIQUETA_PERIODO, PERIODOS, PERIODOS_HISTORICO, formatearFecha, formatearSoles, hoyISO, resumenPorPeriodos, sumar, type TipoPeriodo } from '@/dominio';
import { exportarExcel } from '@/lib/exportar';

const DESCRIPCION: Record<TipoPeriodo, string> = {
  DIARIO: 'Últimos 31 días',
  SEMANAL: 'Últimas 12 semanas',
  QUINCENAL: 'Últimas 12 quincenas',
  MENSUAL: 'Últimos 12 meses',
  SEMESTRAL: 'Últimos 6 semestres',
  ANUAL: 'Últimos 5 años',
};

const OPCIONES = PERIODOS.map((p) => ({ valor: p, etiqueta: ETIQUETA_PERIODO[p] }));

export default function Historico() {
  const { movimientos, parametros, cargando } = useDatosCaja();
  const [tipo, setTipo] = useState<TipoPeriodo>('DIARIO');
  const filas = useMemo(() => resumenPorPeriodos(movimientos, parametros, tipo, PERIODOS_HISTORICO[tipo], hoyISO()), [movimientos, parametros, tipo]);
  const conDatos = filas.filter((f) => f.n_movimientos > 0);
  const serie = filas.map((f) => ({ etiqueta: tipo === 'DIARIO' ? formatearFecha(f.rango.desde, 'diaMes') : f.etiqueta, ingresos: f.ingresos, egresos: f.egresos }));

  function exportar() {
    exportarExcel(`historico_${tipo.toLowerCase()}_${hoyISO()}`, [
      {
        nombre: `Histórico ${ETIQUETA_PERIODO[tipo]}`,
        filas: filas.map((f) => ({
          Período: f.etiqueta,
          Desde: f.rango.desde,
          Hasta: f.rango.hasta,
          Ingresos: f.ingresos,
          'Digital / POS': f.ingresos_digital,
          Efectivo: f.ingresos_efectivo,
          'Egresos caja chica': f.egresos,
          Reposiciones: f.reposiciones,
          Retiros: f.retiros,
          'Resultado neto': f.resultado_neto,
          Movimientos: f.n_movimientos,
          'Sin comprobante': f.sin_comprobante,
          Pendientes: f.pendientes,
          'Saldo caja chica': f.saldo_caja_chica ?? '',
          'Estado caja chica': ETIQUETA_ESTADO_CAJA_CHICA[f.estado_caja_chica],
        })),
        anchos: [24, 12, 12, 14, 14, 14, 16, 14, 12, 14, 12, 14, 12, 16, 18],
      },
    ]);
  }

  if (cargando) return <Cargando />;

  const total = (campo: 'ingresos' | 'ingresos_digital' | 'ingresos_efectivo' | 'egresos' | 'retiros' | 'resultado_neto') => sumar(...filas.map((f) => f[campo]));
  const totalNeto = total('resultado_neto');

  return (
    <>
      <Encabezado
        titulo="Histórico"
        descripcion="Resumen automático por período. Se actualiza con cada movimiento registrado."
        acciones={
          <Boton variante="secundario" icono={<Download className="size-4" aria-hidden />} onClick={exportar}>
            Exportar Excel
          </Boton>
        }
      />

      <div className="no-imprimir mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[3px] bg-papel px-3 py-2.5 shadow-hoja">
        <Segmentado etiqueta="Agrupar por" opciones={OPCIONES} valor={tipo} onCambio={setTipo} />
        <span className="ml-auto text-[13.5px] text-tinta-2">
          {DESCRIPCION[tipo]} · <span className="cifra">{conDatos.length}</span> con movimientos
        </span>
      </div>

      <div className="space-y-6">
        <TarjetaGrafico titulo="Ingresos y egresos por período" subtitulo={DESCRIPCION[tipo]} grafico={<GraficoIngresosEgresos datos={serie} alto={280} />} tabla={<TablaIngresosEgresos datos={serie} />} />

        <Tarjeta titulo={`Detalle ${ETIQUETA_PERIODO[tipo].toLowerCase()}`} sinRelleno>
          {/* Tabla de 11 columnas: relleno compacto para que entre completa a 1440 con Digital y Efectivo. */}
          <Tabla className="[&_td]:px-2 [&_td.cifra]:text-[12.5px] [&_th]:px-2">

            <thead>
              <tr>
                <th className={claseTh}>Período</th>
                <th className={claseThNum}>Ingresos</th>
                <th className={claseThNum}>Digital</th>
                <th className={claseThNum}>Efectivo</th>
                <th className={claseThNum}>Egresos</th>
                <th className={claseThNum}>Retiros</th>
                <th className={claseThNum}>Neto</th>
                <th className={claseThNum}>Mov.</th>
                <th className={claseThNum}>Sin comp.</th>
                <th className={claseThNum}>C. chica</th>
                <th className={claseTh}>Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-papel-3">
              {filas.map((f) => (
                <tr key={f.rango.desde} className={f.n_movimientos === 0 ? '[&_td]:text-tinta-3' : 'transition-colors duration-100 hover:bg-white'}>
                  <td className={`${claseTd} whitespace-nowrap`}>{f.etiqueta}</td>
                  <td className={claseTdNum}>{formatearSoles(f.ingresos)}</td>
                  <td className={claseTdNum}>{formatearSoles(f.ingresos_digital)}</td>
                  <td className={claseTdNum}>{formatearSoles(f.ingresos_efectivo)}</td>
                  <td className={clsx(claseTdNum, f.egresos > 0 && 'text-rojo')}><Salida valor={f.egresos} /></td>
                  <td className={clsx(claseTdNum, f.retiros > 0 && 'text-rojo')}><Salida valor={f.retiros} /></td>
                  <td className={clsx(claseTdNum, f.resultado_neto < 0 && 'text-rojo')}><Neto valor={f.resultado_neto} /></td>
                  <td className={claseTdNum}>{f.n_movimientos}</td>
                  <td className={claseTdNum}>{f.sin_comprobante}</td>
                  <td className={claseTdNum}>{f.saldo_caja_chica === null ? '—' : formatearSoles(f.saldo_caja_chica)}</td>
                  <td className={claseTd}>
                    {/* Antes del corte no hay control de caja chica: texto discreto en lugar de un sello por fila. */}
                    {f.estado_caja_chica === 'ANTES_DEL_CORTE' ? <span className="text-[12.5px] whitespace-nowrap text-tinta-3">Antes del corte</span> : <InsigniaEstadoCajaChica estado={f.estado_caja_chica} />}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className={`${claseTd} rotulo text-[12px]`}>Total</td>
                <td className={claseTdNum}>{formatearSoles(total('ingresos'))}</td>
                <td className={claseTdNum}>{formatearSoles(total('ingresos_digital'))}</td>
                <td className={claseTdNum}>{formatearSoles(total('ingresos_efectivo'))}</td>
                <td className={clsx(claseTdNum, 'text-rojo')}><Salida valor={total('egresos')} /></td>
                <td className={clsx(claseTdNum, 'text-rojo')}><Salida valor={total('retiros')} /></td>
                <td className={clsx(claseTdNum, totalNeto < 0 && 'text-rojo')}><Neto valor={totalNeto} /></td>
                <td className={claseTdNum}>{filas.reduce((a, f) => a + f.n_movimientos, 0)}</td>
                <td className={claseTdNum}>{filas.reduce((a, f) => a + f.sin_comprobante, 0)}</td>
                <td className={claseTdNum} colSpan={2} />
              </tr>
            </tfoot>
          </Tabla>
        </Tarjeta>
      </div>
    </>
  );
}

/** Salida de caja en tinta roja con signo; en cero queda neutra. */
function Salida({ valor }: { valor: number }) {
  if (!valor) return <span className="text-tinta-3">{formatearSoles(0)}</span>;
  return <>−{formatearSoles(valor)}</>;
}

function Neto({ valor }: { valor: number }) {
  return valor < 0 ? <>−{formatearSoles(Math.abs(valor))}</> : <>{formatearSoles(valor)}</>;
}
