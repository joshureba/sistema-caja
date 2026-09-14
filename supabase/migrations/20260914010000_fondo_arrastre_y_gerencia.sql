-- El fondo conserva su saldo y permite envíos a gerencia, sin afectar caja chica.
alter type public.destino_retiro add value if not exists 'GERENCIA';
alter table public.movimientos drop constraint fondo_solo_ingresos_desde_14_09;
alter table public.movimientos add constraint fondo_salidas_solo_gerencia
check (fecha < '2026-09-14' or not (
  (tipo = 'RETIRO' and caja_retiro = 'DIARIA' and destino::text <> 'GERENCIA') or
  (tipo = 'REPOSICION_CAJA_CHICA' and origen = 'CAJA_DIARIA')
));

-- Apertura contable: base del corte + cobros anteriores - envíos anteriores.
-- No usa un monto enviado desde el navegador ni reinicia la base cada día.
create or replace function public.fn_apertura_fondo_automatica()
returns trigger language plpgsql security definer set search_path = public as $$
declare p public.parametros%rowtype;
begin
  select * into strict p from public.parametros where id = 1;
  if new.fecha >= p.fecha_corte then
    new.base_caja_diaria := p.base_caja_diaria + coalesce((
      select sum(case
        when tipo = 'INGRESO' then monto_efectivo
        when tipo = 'RETIRO' and caja_retiro = 'DIARIA' then -monto
        when tipo = 'REPOSICION_CAJA_CHICA' and origen = 'CAJA_DIARIA' then -monto
        else 0 end)
      from public.movimientos where not anulado and fecha >= p.fecha_corte and fecha < new.fecha
    ), 0);
  end if;
  return new;
end $$;
alter table public.jornadas alter column base_caja_diaria set default 0;
create trigger trg_apertura_fondo_automatica before insert or update of fecha, base_caja_diaria
on public.jornadas for each row execute function public.fn_apertura_fondo_automatica();

create or replace function public.fn_proteger_base_fondo()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.base_caja_diaria is distinct from old.base_caja_diaria then
    raise exception 'La base de apertura del fondo no es editable. El saldo continúa con los ingresos y envíos a gerencia.';
  end if;
  return new;
end $$;
create trigger trg_proteger_base_fondo before update of base_caja_diaria
on public.parametros for each row execute function public.fn_proteger_base_fondo();
