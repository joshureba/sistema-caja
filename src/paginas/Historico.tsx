import { clsx } from 'clsx';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { InsigniaEstadoCajaChica } from '@/componentes/CajaChicaResumen';
import { Encabezado } from '@/componentes/Layout';
import { GraficoIngresosEgresos, TablaIngresosEgresos, TarjetaGrafico } from '@/componentes/graficos';
import { Boton, Cargando, Tabla, Tarjeta, claseTd, claseTdNum, claseTh, claseThNum } from '@/componentes/ui';
import { useDatosCaja } from '@/datos/consultas';
import { ETIQUETA_ESTADO_CAJA_CHICA, ETIQUETA_PERIODO, PERIODOS, PERIODOS_HISTORICO, formatearFecha, formatearSoles, hoyISO, resumenPorPeriodos, type TipoPeriodo } from '@/dominio';
import { exportarExcel } from '@/lib/exportar';

const DESCRIPCION: Record<TipoPeriodo, string> = {
  DIARIO: 'Últimos 31 días',
  SEMANAL: 'Últimas 12 semanas',
  QUINCENAL: 'Últimas 12 quincenas',
  MENSUAL: 'Últimos 12 meses',
  SEMESTRAL: 'Últimos 6 semestres',
  ANUAL: 'Últimos 5 años',
};

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

  return (
    <>
      <Encabezado
        titulo="Histórico"
        descripcion="Resumen automático por período. Se actualiza con cada movimiento registrado."
        acciones={
          <Boton variante="secundario" icono={<Download className="size-4" />} onClick={exportar}>
            Exportar Excel
          </Boton>
        }
      />

      <div className="no-imprimir mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        {PERIODOS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setTipo(p)}
            aria-pressed={p === tipo}
            className={clsx('rounded-lg px-3 py-1.5 text-sm font-medium transition', p === tipo ? 'bg-marca-800 text-white' : 'text-slate-600 hover:bg-slate-100')}
          >
            {ETIQUETA_PERIODO[p]}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-500">
          {DESCRIPCION[tipo]} · {conDatos.length} con movimientos
        </span>
      </div>

      <div className="space-y-6">
        <TarjetaGrafico titulo="Ingresos y egresos por período" subtitulo={DESCRIPCION[tipo]} grafico={<GraficoIngresosEgresos datos={serie} alto={280} />} tabla={<TablaIngresosEgresos datos={serie} />} />

        <Tarjeta titulo={`Detalle ${ETIQUETA_PERIODO[tipo].toLowerCase()}`} sinRelleno>
          <Tabla>
            <thead className="bg-slate-50">
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
                <th className={claseThNum}>Saldo c. chica</th>
                <th className={claseTh}>Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((f) => (
                <tr key={f.rango.desde} className={f.n_movimientos === 0 ? 'text-slate-400' : ''}>
                  <td className={`${claseTd} whitespace-nowrap`}>{f.etiqueta}</td>
                  <td className={claseTdNum}>{formatearSoles(f.ingresos)}</td>
                  <td className={claseTdNum}>{formatearSoles(f.ingresos_digital)}</td>
                  <td className={claseTdNum}>{formatearSoles(f.ingresos_efectivo)}</td>
                  <td className={claseTdNum}>{formatearSoles(f.egresos)}</td>
                  <td className={claseTdNum}>{formatearSoles(f.retiros)}</td>
                  <td className={clsx(claseTdNum, f.resultado_neto < 0 && 'text-red-700')}>{formatearSoles(f.resultado_neto)}</td>
                  <td className={claseTdNum}>{f.n_movimientos}</td>
                  <td className={claseTdNum}>{f.sin_comprobante}</td>
                  <td className={claseTdNum}>{f.saldo_caja_chica === null ? '—' : formatearSoles(f.saldo_caja_chica)}</td>
                  <td className={claseTd}>
                    <InsigniaEstadoCajaChica estado={f.estado_caja_chica} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold">
                <td className={claseTd}>Total</td>
                <td className={claseTdNum}>{formatearSoles(filas.reduce((a, f) => a + f.ingresos, 0))}</td>
                <td className={claseTdNum}>{formatearSoles(filas.reduce((a, f) => a + f.ingresos_digital, 0))}</td>
                <td className={claseTdNum}>{formatearSoles(filas.reduce((a, f) => a + f.ingresos_efectivo, 0))}</td>
                <td className={claseTdNum}>{formatearSoles(filas.reduce((a, f) => a + f.egresos, 0))}</td>
                <td className={claseTdNum}>{formatearSoles(filas.reduce((a, f) => a + f.retiros, 0))}</td>
                <td className={claseTdNum}>{formatearSoles(filas.reduce((a, f) => a + f.resultado_neto, 0))}</td>
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
