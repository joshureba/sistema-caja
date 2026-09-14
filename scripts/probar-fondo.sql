-- Prueba transaccional: no conserva jornadas, movimientos ni auditoría de prueba.
begin;
do $$
declare esperado numeric; apertura numeric; bloqueado boolean := false;
begin
  if exists (select 1 from public.jornadas where fecha in ('2099-01-01','2099-01-02')) then
    raise exception 'Las fechas de prueba están ocupadas';
  end if;
  select p.base_caja_diaria + coalesce((select sum(case
    when m.tipo = 'INGRESO' then m.monto_efectivo
    when m.tipo = 'RETIRO' and m.caja_retiro = 'DIARIA' then -m.monto
    when m.tipo = 'REPOSICION_CAJA_CHICA' and m.origen = 'CAJA_DIARIA' then -m.monto
    else 0 end) from public.movimientos m where not m.anulado and m.fecha >= p.fecha_corte and m.fecha < '2099-01-01'),0)
    into esperado from public.parametros p where p.id = 1;
  insert into public.jornadas (id,fecha,base_caja_diaria) values (-990001,'2099-01-01',999999)
    returning base_caja_diaria into apertura;
  if apertura <> esperado then raise exception 'Aceptó una apertura manual'; end if;
  insert into public.movimientos (id,fecha,turno,tipo,descripcion,monto_efectivo,monto_digital)
    values (-990001,'2099-01-01','MAÑANA','INGRESO','PRUEBA TRANSACCIONAL',300,150);
  insert into public.movimientos (id,fecha,turno,tipo,descripcion,monto,caja_retiro,destino)
    values (-990002,'2099-01-01','MAÑANA','RETIRO','PRUEBA TRANSACCIONAL',600,'DIARIA','GERENCIA');
  insert into public.jornadas (id,fecha) values (-990002,'2099-01-02') returning base_caja_diaria into apertura;
  if apertura <> esperado - 300 then raise exception 'No arrastró el envío a gerencia'; end if;
  update public.jornadas set base_caja_diaria = 123456 where id = -990002 returning base_caja_diaria into apertura;
  if apertura <> esperado - 300 then raise exception 'Permitió alterar la apertura'; end if;
  begin
    update public.parametros set base_caja_diaria = base_caja_diaria + 1 where id = 1;
  exception when raise_exception then bloqueado := true;
  end;
  if not bloqueado then raise exception 'Permitió cambiar la base inicial'; end if;
  bloqueado := false;
  begin
    insert into public.movimientos (id,fecha,turno,tipo,descripcion,monto,caja_retiro,destino)
      values (-990003,'2099-01-01','MAÑANA','RETIRO','PRUEBA TRANSACCIONAL',10,'DIARIA','BANCO');
  exception when check_violation then bloqueado := true;
  end;
  if not bloqueado then raise exception 'Permitió un destino distinto de gerencia'; end if;
end $$;
rollback;
select 'Apertura automática, arrastre, envío a gerencia y restricciones verificados; datos de prueba revertidos' as resultado;
