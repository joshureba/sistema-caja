import type { KeyboardEvent } from 'react';
import { claveDenominacion, detalleConteo, formatearNumero, formatearSoles, sumar, type Conteo } from '@/dominio';
import { Tabla, claseTd, claseTdNum, claseTh, claseThNum } from './ui';

interface Props {
  denominaciones: number[];
  conteo: Conteo;
  onCambio?: (conteo: Conteo) => void;
  soloLectura?: boolean;
  /** Enter en la última cantidad: pasa al siguiente campo del arqueo. */
  onUltimoEnter?: () => void;
}

/** Enter baja a la siguiente cantidad y Shift+Enter sube, para contar sin soltar el teclado numérico. */
function moverConEnter(e: KeyboardEvent<HTMLInputElement>, onUltimoEnter?: () => void) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const campos = [...(e.currentTarget.closest('table')?.querySelectorAll<HTMLInputElement>('input[data-conteo]') ?? [])];
  const indice = campos.indexOf(e.currentTarget);
  const siguiente = campos[indice + (e.shiftKey ? -1 : 1)];
  if (siguiente) siguiente.focus();
  else if (!e.shiftKey) onUltimoEnter?.();
}

/** Planilla de conteo: cantidad por denominación y subtotal, con el total a doble ancho. */
export function ContadorDenominaciones({ denominaciones, conteo, onCambio, soloLectura, onUltimoEnter }: Props) {
  const detalle = detalleConteo(conteo, denominaciones);
  const total = sumar(...detalle.map((l) => l.subtotal));
  return (
    <Tabla>
      <thead>
        <tr>
          <th className={claseTh}>Denominación</th>
          <th className={claseThNum}>Cantidad</th>
          <th className={claseThNum}>Subtotal</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-papel-3">
        {detalle.map((linea) => {
          const clave = claveDenominacion(linea.denominacion);
          return (
            <tr key={clave} className={linea.cantidad > 0 ? undefined : 'text-tinta-3'}>
              <td className={`${claseTd} py-1.5 align-middle`}>
                <span className="cifra text-[13.5px] font-semibold text-tinta">{formatearSoles(linea.denominacion)}</span>
                <span className="ml-2 text-[12px] text-tinta-3">{linea.denominacion >= 10 ? 'billete' : 'moneda'}</span>
              </td>
              <td className={`${claseTdNum} py-1.5 align-middle`}>
                {soloLectura ? (
                  linea.cantidad
                ) : (
                  <input
                    type="number"
                    data-conteo
                    enterKeyHint="next"
                    onKeyDown={(e) => moverConEnter(e, onUltimoEnter)}
                    min={0}
                    step={1}
                    inputMode="numeric"
                    aria-label={`Cantidad de ${formatearSoles(linea.denominacion)}`}
                    className="cifra h-9 w-20 rounded-[3px] border border-borde-control bg-white px-2 text-right text-[13.5px] text-tinta shadow-control transition-[border-color,box-shadow] duration-150 placeholder:text-tinta-3 hover:border-tinta-2 focus:border-sello focus:ring-2 focus:ring-sello/25 focus:outline-none"
                    value={linea.cantidad || ''}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => onCambio?.({ ...conteo, [clave]: e.target.value === '' ? 0 : Math.max(0, Math.trunc(Number(e.target.value))) })}
                  />
                )}
              </td>
              <td className={`${claseTdNum} py-1.5 align-middle ${linea.subtotal > 0 ? 'text-tinta' : 'text-tinta-3'}`}>{formatearSoles(linea.subtotal)}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td className={`${claseTd} rotulo align-middle text-[12px] text-tinta-2`} colSpan={2}>
            Total contado
          </td>
          <td className={`${claseTd} text-right align-middle`}>
            <span className="cifra-doble text-[18px] whitespace-nowrap">
              <span className="mr-1 text-[0.6em] font-medium">S/</span>
              {formatearNumero(total)}
            </span>
          </td>
        </tr>
      </tfoot>
    </Tabla>
  );
}
