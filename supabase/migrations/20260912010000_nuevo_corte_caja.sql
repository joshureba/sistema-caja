-- =====================================================================
-- Nuevo corte del 11/09/2026: la caja chica arranca con todo el efectivo
-- contado en el Excel (S/ 4,767.90) y entrega S/ 500 una sola vez como base
-- de la caja de recepción. Desde entonces solo baja con egresos.
-- =====================================================================

update public.parametros
set fecha_corte = '2026-09-11', saldo_inicial_caja_chica = 4767.90
where id = 1;

-- El conteo del 10/09 define el fondo: queda como arqueo que cuadra.
update public.arqueos a
set total_teorico = 4767.90, diferencia = 0, estado = 'CUADRA',
    observacion = 'Conteo del Excel: todo el efectivo del área. Define el fondo con el que arranca la caja chica el 11/09/2026.'
from public.jornadas j
where j.id = a.jornada_id and j.fecha = '2026-09-10' and a.caja = 'CHICA';

-- Traslado único de la base a la caja de recepción.
insert into public.movimientos (fecha, turno, tipo, descripcion, area, medio_pago, monto, caja_retiro, destino, observacion, importado)
select '2026-09-11', 'MAÑANA', 'RETIRO', 'BASE PARA LA CAJA DE RECEPCIÓN', 'ADMINISTRACIÓN', 'EFECTIVO', 500, 'CHICA', 'OTRO',
       'Salida única de la caja chica para formar la caja de recepción con S/ 500. No es un gasto.', false
where not exists (select 1 from public.movimientos where fecha = '2026-09-11' and tipo = 'RETIRO' and descripcion = 'BASE PARA LA CAJA DE RECEPCIÓN');
