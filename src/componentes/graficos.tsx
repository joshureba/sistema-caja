import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatearSoles } from '@/dominio';
import { Tabla, Tarjeta, claseTdNum, claseTd, claseTh, claseThNum } from './ui';

export const COLORES = {
  serie1: '#2a78d6',
  serie2: '#eb6834',
  serie3: '#1baf7a',
  bueno: '#0ca30c',
  alerta: '#fab219',
  critico: '#d03b3b',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
  surface: '#fcfcfb',
};

const formatoEje = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });
export const tickSoles = (v: number) => formatoEje.format(v);

const estiloTooltip = { borderRadius: 8, border: '1px solid #e1e0d9', boxShadow: '0 4px 12px rgba(11,11,11,0.08)', fontSize: 12 };
const formatoValor = (valor: unknown) => formatearSoles(Number(valor));

/** Tarjeta con conmutador gráfico / tabla: toda visualización tiene su tabla gemela. */
export function TarjetaGrafico({ titulo, subtitulo, grafico, tabla, acciones }: { titulo: ReactNode; subtitulo?: ReactNode; grafico: ReactNode; tabla: ReactNode; acciones?: ReactNode }) {
  const [vista, setVista] = useState<'grafico' | 'tabla'>('grafico');
  const boton = (v: typeof vista, etiqueta: string) => (
    <button
      type="button"
      onClick={() => setVista(v)}
      aria-pressed={vista === v}
      className={clsx('rounded-md px-2.5 py-1 text-xs font-medium', vista === v ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100')}
    >
      {etiqueta}
    </button>
  );
  return (
    <Tarjeta
      titulo={titulo}
      subtitulo={subtitulo}
      acciones={
        <>
          {acciones}
          <div className="no-imprimir flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="Vista">
            {boton('grafico', 'Gráfico')}
            {boton('tabla', 'Tabla')}
          </div>
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
          <CartesianGrid vertical={false} stroke={COLORES.grid} />
          <XAxis dataKey="etiqueta" tickLine={false} axisLine={{ stroke: COLORES.axis }} tick={{ fontSize: 11, fill: COLORES.muted }} minTickGap={12} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORES.muted }} tickFormatter={tickSoles} width={56} />
          <Tooltip cursor={{ fill: 'rgba(11,11,11,0.04)' }} formatter={formatoValor} contentStyle={estiloTooltip} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="ingresos" name="Ingresos" fill={COLORES.serie1} radius={[4, 4, 0, 0]} maxBarSize={24} />
          <Bar dataKey="egresos" name="Egresos caja chica" fill={COLORES.serie2} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TablaIngresosEgresos({ datos }: { datos: PuntoIngresoEgreso[] }) {
  return (
    <Tabla>
      <thead className="bg-slate-50">
        <tr>
          <th className={claseTh}>Período</th>
          <th className={claseThNum}>Ingresos</th>
          <th className={claseThNum}>Egresos</th>
          <th className={claseThNum}>Neto</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {datos.map((d) => (
          <tr key={d.etiqueta}>
            <td className={claseTd}>{d.etiqueta}</td>
            <td className={claseTdNum}>{formatearSoles(d.ingresos)}</td>
            <td className={claseTdNum}>{formatearSoles(d.egresos)}</td>
            <td className={claseTdNum}>{formatearSoles(d.ingresos - d.egresos)}</td>
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

export function GraficoSaldoCajaChica({ datos, minimo, maximo, alerta, alto = 260 }: { datos: PuntoSaldo[]; minimo: number; maximo: number; alerta: number | null; alto?: number }) {
  const valores = datos.map((d) => d.saldo).filter((v): v is number => v !== null);
  const piso = Math.min(minimo, ...valores) * 0.9;
  const techo = Math.max(maximo, ...valores) * 1.05;
  const dominio: [number, number] = [Math.max(0, Math.floor(piso / 500) * 500), Math.ceil(techo / 500) * 500];
  const etiquetaRef = (texto: string) => ({ value: texto, position: 'insideTopRight' as const, fontSize: 11, fill: COLORES.muted });
  return (
    <div style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={COLORES.grid} />
          <XAxis dataKey="etiqueta" tickLine={false} axisLine={{ stroke: COLORES.axis }} tick={{ fontSize: 11, fill: COLORES.muted }} minTickGap={12} />
          <YAxis domain={dominio} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORES.muted }} tickFormatter={tickSoles} width={56} />
          <Tooltip formatter={formatoValor} contentStyle={estiloTooltip} />
          <ReferenceLine y={maximo} stroke={COLORES.critico} strokeWidth={1} label={etiquetaRef(`Máximo ${tickSoles(maximo)}`)} />
          {alerta !== null && <ReferenceLine y={alerta} stroke={COLORES.alerta} strokeWidth={1} label={etiquetaRef(`Alerta ${tickSoles(alerta)}`)} />}
          <ReferenceLine y={minimo} stroke={COLORES.critico} strokeWidth={1} label={etiquetaRef(`Mínimo ${tickSoles(minimo)}`)} />
          <Line
            type="monotone"
            dataKey="saldo"
            name="Saldo caja chica"
            stroke={COLORES.serie1}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: COLORES.surface }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TablaSaldo({ datos }: { datos: PuntoSaldo[] }) {
  return (
    <Tabla>
      <thead className="bg-slate-50">
        <tr>
          <th className={claseTh}>Fecha</th>
          <th className={claseThNum}>Saldo caja chica</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
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
