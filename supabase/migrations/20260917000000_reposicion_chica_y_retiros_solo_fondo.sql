-- =====================================================================
-- Cambio de regla pedido por el área el 17/09/2026
-- 1. La caja chica vuelve a admitir reposiciones. Solo desde el banco: la restricción
--    fondo_salidas_solo_gerencia sigue impidiendo reponerla desde la caja de fondo.
-- 2. Los retiros de efectivo solo salen de la caja de fondo; lo que sale de la caja chica
--    se registra como egreso. Rige desde el 16/09 para conservar el retiro de excedente
--    de caja chica registrado el 15/09, que es un movimiento real.
-- =====================================================================

alter table public.movimientos drop constraint if exists chica_solo_salidas_desde_15_09;

alter table public.movimientos add constraint retiros_solo_de_fondo_desde_16_09
check (fecha < '2026-09-16' or tipo <> 'RETIRO' or caja_retiro = 'DIARIA');
