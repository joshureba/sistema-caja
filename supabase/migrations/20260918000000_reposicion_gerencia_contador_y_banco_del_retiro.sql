-- =====================================================================
-- Cambios pedidos por el área el 18/09/2026
-- 1. La caja chica también se repone con el efectivo que entrega gerencia o el
--    contador. Solo la reposición por transferencia del banco lleva n.º de
--    operación; las otras son entregas en mano.
-- 2. Cuando el retiro de la caja de fondo va al banco, se anota en cuál.
--    La lista de bancos es un catálogo para que la supervisora pueda ampliarla.
-- =====================================================================

alter type public.origen_reposicion add value if not exists 'GERENCIA';
alter type public.origen_reposicion add value if not exists 'CONTADOR';

alter table public.movimientos add column if not exists banco text;
comment on column public.movimientos.banco is 'Banco del retiro cuando el destino es BANCO; null en los demás movimientos.';

alter table public.movimientos add constraint chk_banco_solo_al_banco
check (banco is null or (tipo = 'RETIRO' and destino::text = 'BANCO'));

alter table public.catalogos drop constraint catalogos_tipo_check;
alter table public.catalogos add constraint catalogos_tipo_check
check (tipo = any (array['AREA', 'MEDIO_PAGO', 'CUENTA', 'COMPROBANTE', 'RESPONSABLE', 'BANCO']));

insert into public.catalogos (tipo, valor, orden) values
  ('BANCO', 'BCP', 1),
  ('BANCO', 'BBVA', 2),
  ('BANCO', 'BANCO DE LA NACIÓN', 3)
on conflict (tipo, valor) do nothing;
