import { claveDenominacion, detalleConteo, formatearSoles, sumar, type Conteo } from '@/dominio';
import { Tabla, claseTd, claseTdNum, claseTh, claseThNum } from './ui';

interface Props {
  denominaciones: number[];
  conteo: Conteo;
  onCambio?: (conteo: Conteo) => void;
  soloLectura?: boolean;
}

/** Contador de billetes y monedas: cantidad por denominación y subtotal. */
export function ContadorDenominaciones({ denominaciones, conteo, onCambio, soloLectura }: Props) {
  const detalle = detalleConteo(conteo, denominaciones);
  const total = sumar(...detalle.map((l) => l.subtotal));
  return (
    <Tabla>
      <thead className="bg-slate-50">
        <tr>
          <th className={claseTh}>Denominación</th>
          <th className={claseThNum}>Cantidad</th>
          <th className={claseThNum}>Subtotal</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {detalle.map((linea) => {
          const clave = claveDenominacion(linea.denominacion);
          return (
            <tr key={clave}>
              <td className={claseTd}>
                <span className="font-medium">{formatearSoles(linea.denominacion)}</span>
                <span className="ml-2 text-xs text-slate-400">{linea.denominacion >= 10 ? 'billete' : 'moneda'}</span>
              </td>
              <td className={claseTdNum}>
                {soloLectura ? (
                  linea.cantidad
                ) : (
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    aria-label={`Cantidad de ${formatearSoles(linea.denominacion)}`}
                    className="h-9 w-24 rounded-lg border border-slate-300 px-2 text-right text-sm tabular-nums focus:border-marca-500 focus:ring-2 focus:ring-marca-200 focus:outline-none"
                    value={linea.cantidad || ''}
                    placeholder="0"
                    onChange={(e) => onCambio?.({ ...conteo, [clave]: e.target.value === '' ? 0 : Math.max(0, Math.trunc(Number(e.target.value))) })}
                  />
                )}
              </td>
              <td className={claseTdNum}>{formatearSoles(linea.subtotal)}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="bg-slate-50 font-semibold">
          <td className={claseTd} colSpan={2}>
            Total contado
          </td>
          <td className={claseTdNum}>{formatearSoles(total)}</td>
        </tr>
      </tfoot>
    </Tabla>
  );
}
