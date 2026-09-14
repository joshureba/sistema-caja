"""Genera la migración revisable del Excel del 14/09; no ejecuta SQL."""
import json
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent
anteriores = json.loads((raiz / 'src/dominio/fixtures/movimientos-excel-10-09.json').read_text(encoding='utf-8'))
campos_omitidos = {'id', 'jornada_id', 'creado_por', 'creado_en'}
anteriores = [{k: v for k, v in m.items() if k not in campos_omitidos} for m in anteriores]
datos = json.dumps(anteriores, ensure_ascii=False).replace("'", "''")
seed = (raiz / 'supabase/seed.sql').read_text(encoding='utf-8')
sql = """-- Excel del 14/09: 125 movimientos hasta el 13/09 y cierre contado de 6032.90.
-- Respaldo privado antes de actualizar. Se aborta ante registros importados
-- modificados o movimientos manuales que se solapen con los nuevos días.
create schema if not exists respaldo_caja;
revoke all on schema respaldo_caja from public, anon, authenticated;
create table respaldo_caja.antes_20260914 as
select 'movimientos'::text as tabla, to_jsonb(m) as registro from public.movimientos m
union all select 'parametros', to_jsonb(p) from public.parametros p
union all select 'arqueos', to_jsonb(a) from public.arqueos a
union all select 'jornadas', to_jsonb(j) from public.jornadas j;

create temporary table importacion_anterior (registro jsonb) on commit drop;
"""
sql += f"insert into importacion_anterior select value from jsonb_array_elements('{datos}'::jsonb);\n"
sql += """
do $$
begin
  if exists (
    select 1 from public.movimientos m where m.importado
    and not exists (select 1 from importacion_anterior a where to_jsonb(m) @> a.registro)
  ) then
    raise exception 'Hay movimientos importados modificados o de otra fuente. Conciliar antes de actualizar.';
  end if;
  if (select count(*) from public.movimientos where importado) not in (0, 83) then
    raise exception 'La importación anterior está incompleta o duplicada. Conciliar antes de actualizar.';
  end if;
  if exists (select 1 from public.movimientos where not importado and not anulado
    and fecha between '2026-09-11' and '2026-09-13'
    and descripcion <> 'BASE PARA LA CAJA DE RECEPCIÓN') then
    raise exception 'Hay movimientos manuales del 11 al 13/09 que pueden duplicar el Excel. Conciliar antes de actualizar.';
  end if;
end $$;

delete from public.movimientos where importado;
"""
sql += seed
sql += """
-- Última entrega de base: queda registrada una sola vez como salida, no gasto.
insert into public.movimientos (fecha, turno, tipo, descripcion, area, medio_pago,
  monto, caja_retiro, destino, observacion, importado)
select '2026-09-14', 'MAÑANA', 'RETIRO', 'APERTURA FINAL DE CAJA DE FONDO 14/09',
  'ADMINISTRACIÓN', 'EFECTIVO', 500, 'CHICA', 'OTRO',
  'Último traslado autorizado: 6032.90 - 500 = 5532.90 en caja chica. Los 500 son la base de la caja diaria; no se duplican como ingreso.', false
where not exists (select 1 from public.movimientos
  where fecha = '2026-09-14' and descripcion = 'APERTURA FINAL DE CAJA DE FONDO 14/09');

alter table public.movimientos add constraint fondo_solo_ingresos_desde_14_09
check (fecha < '2026-09-14' or not (
  (tipo = 'RETIRO' and caja_retiro = 'DIARIA') or
  (tipo = 'REPOSICION_CAJA_CHICA' and origen = 'CAJA_DIARIA')
));
alter table public.movimientos add constraint chica_solo_salidas_desde_15_09
check (fecha < '2026-09-15' or tipo <> 'REPOSICION_CAJA_CHICA');
"""
(raiz / 'supabase/migrations/20260914000000_actualizar_excel_y_separar_cajas.sql').write_text(sql, encoding='utf-8')
