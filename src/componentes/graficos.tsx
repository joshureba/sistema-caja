import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatearSoles, restar } from '@/dominio';
import { Segmentado, Tabla, Tarjeta, claseTdNum, claseTd, claseTh, claseThNum } from './ui';

/** Paleta fija de gráficos del mundo «Cinta de caja»: azul de sello, rojo de cinta y tinta negra. */
export const COLORES = {
  serie1: '#1f4fa3',
  serie2: '#bf2a2a',
  serie3: '#1c1c22',
  bueno: '#1f4fa3',
  alerta: '#bf2a2a',
  critico: '#9e2020',
  grid: '#e2e2da',
  axis: '#a9a9a0',
  muted: '#66666f',
  surface: '#f7f7f3',
};

const FUENTE_CIFRAS = '"Martian Mono Variable", ui-monospace, monospace';

const formatoEje = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });
export const tickSoles = (v: number) => formatoEje.format(v);

const estiloTooltip = { borderRadius: 2, border: '1px solid #cdcdc4', background: COLORES.surface, boxShadow: '0 8px 20px -8px rgba(4,12,34,0.35)', fontSize: 12, fontFamily: FUENTE_CIFRAS };
const estiloTick = { fontSize: 10.5, fill: COLORES.muted, fontFamily: FUENTE_CIFRAS };
const formatoValor = (valor: unknown) => formatearSoles(Number(valor));

const VISTAS = [
  { valor: 'grafico', etiqueta: 'Gráfico' },
  { valor: 'tabla', etiqueta: 'Tabla' },
] as const;

/** Hoja con conmutador gráfico / tabla: toda visualización tiene su tabla gemela. */
export function TarjetaGrafico({ titulo, subtitulo, grafico, tabla, acciones, className }: { titulo: ReactNode; subtitulo?: ReactNode; grafico: ReactNode; tabla: ReactNode; acciones?: ReactNode; className?: string }) {
  const [vista, setVista] = useState<'grafico' | 'tabla'>('grafico');
  return (
    <Tarjeta
      className={className}
      titulo={titulo}
      subtitulo={subtitulo}
      acciones={
        <>
          {acciones}
          <Segmentado className="no-imprimir" etiqueta="Vista" tamano="sm" opciones={VISTAS} valor={vista} onCambio={setVista} />
        </>
      }
      sinRelleno={vista === 'tabla'}
    >
      {vista === 'grafico' ? grafico : tabla}
    </Tarjeta>
  );
}

export interface PuntoIngresoEgreso {
  etiqueta: string;
  ingresos: number;
  egresos: number;
}

export function GraficoIngresosEgresos({ datos, alto = 260 }: { datos: PuntoIngresoEgreso[]; alto?: number }) {
  return (
    <div style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke={COLORES.grid} strokeDasharray="2 3" />
          <XAxis dataKey="etiqueta" tickLine={false} axisLine={{ stroke: COLORES.axis }} tick={estiloTick} minTickGap={12} />
          <YAxis tickLine={false} axisLine={false} tick={estiloTick} tickFormatter={tickSoles} width={60} />
          <Tooltip cursor={{ fill: 'rgba(28,28,34,0.05)' }} formatter={formatoValor} contentStyle={estiloTooltip} />
          <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 12.5 }} />
          <Bar dataKey="ingresos" name="Ingresos" fill={COLORES.serie1} radius={[1, 1, 0, 0]} maxBarSize={22} />
          <Bar dataKey="egresos" name="Egresos caja chica" fill={COLORES.serie2} radius={[1, 1, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TablaIngresosEgresos({ datos }: { datos: PuntoIngresoEgreso[] }) {
  return (
    <Tabla>
      <thead>
        <tr>
          <th className={claseTh}>Período</th>
          <th className={claseThNum}>Ingresos</th>
          <th className={claseThNum}>Egresos</th>
          <th className={claseThNum}>Neto</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-papel-3">
        {datos.map((d) => (
          <tr key={d.etiqueta}>
            <td className={claseTd}>{d.etiqueta}</td>
            <td className={claseTdNum}>{formatearSoles(d.ingresos)}</td>
            <td className={claseTdNum}>{formatearSoles(d.egresos)}</td>
            <td className={claseTdNum}>{formatearSoles(restar(d.ingresos, d.egresos))}</td>
          </tr>
        ))}
      </tbody>
    </Tabla>
  );
}

export interface PuntoSaldo {
  etiqueta: string;
  saldo: number | null;
}

/** Saldo diario de caja chica. Con altura acotada, el encabezado queda fijo al desplazarse. */
export function TablaSaldo({ datos, className }: { datos: PuntoSaldo[]; className?: string }) {
  return (
    <Tabla className={clsx('[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:bg-papel', className)}>
      <thead>
        <tr>
          <th className={claseTh}>Fecha</th>
          <th className={claseThNum}>Saldo caja chica</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-papel-3">
        {datos.map((d) => (
          <tr key={d.etiqueta}>
            <td className={claseTd}>{d.etiqueta}</td>
            <td className={claseTdNum}>{d.saldo === null ? 'Antes del corte' : formatearSoles(d.saldo)}</td>
          </tr>
        ))}
      </tbody>
    </Tabla>
  );
}
