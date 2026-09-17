-- =====================================================================
-- Cambio pedido por el área el 17/09/2026: el efectivo de la caja de fondo
-- también puede salir al banco, además de a gerencia. La caja de fondo sigue
-- sin poder reponer la caja chica (eso solo sale del banco).
-- =====================================================================

alter table public.movimientos drop constraint if exists fondo_salidas_solo_gerencia;

alter table public.movimientos add constraint fondo_salidas_a_gerencia_o_banco
check (fecha < '2026-09-14' or not (
  (tipo = 'RETIRO' and caja_retiro = 'DIARIA' and destino::text not in ('GERENCIA', 'BANCO')) or
  (tipo = 'REPOSICION_CAJA_CHICA' and origen = 'CAJA_DIARIA')
));
