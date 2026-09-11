-- =====================================================================
-- Sistema de Caja: esquema inicial (caja diaria + caja chica)
-- =====================================================================

-- ---------- Tipos ----------
create type public.rol_usuario as enum ('cajero', 'supervisor');
create type public.tipo_movimiento as enum ('INGRESO', 'EGRESO', 'REPOSICION_CAJA_CHICA', 'RETIRO');
create type public.turno_caja as enum ('MAÑANA', 'NOCHE');
create type public.estado_sustento as enum ('CON COMPROBANTE', 'SIN COMPROBANTE', 'PENDIENTE');
create type public.estado_jornada as enum ('ABIERTA', 'CERRADA');
create type public.tipo_caja as enum ('DIARIA', 'CHICA');
create type public.estado_arqueo as enum ('CUADRA', 'REVISAR');
create type public.origen_reposicion as enum ('BANCO', 'CAJA_DIARIA');
create type public.destino_retiro as enum ('BANCO', 'OTRO');

-- ---------- Perfiles (uno por usuario de Auth) ----------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  dni text,
  rol public.rol_usuario not null default 'cajero',
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz,
  actualizado_por uuid
);

create or replace function public.fn_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, dni, rol)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'dni',
    coalesce((new.raw_user_meta_data ->> 'rol')::public.rol_usuario, 'cajero')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger trg_nuevo_usuario
after insert on auth.users
for each row execute function public.fn_nuevo_usuario();

-- ---------- Funciones de rol ----------
create or replace function public.fn_es_supervisor()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select rol = 'supervisor' from public.perfiles where id = auth.uid() and activo), false)
$$;

create or replace function public.fn_usuario_activo()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select activo from public.perfiles where id = auth.uid()), false)
$$;

-- ---------- Parámetros (fila única) ----------
create table public.parametros (
  id integer primary key default 1 check (id = 1),
  caja_chica_min numeric(12,2) not null default 3000,
  caja_chica_max numeric(12,2) not null default 5000,
  caja_chica_alerta numeric(12,2) default 3500,
  base_caja_diaria numeric(12,2) not null default 500,
  saldo_inicial_caja_chica numeric(12,2) not null default 5000,
  fecha_corte date not null default '2026-09-06',
  tolerancia_arqueo numeric(12,2) not null default 0.01,
  hora_inicio_noche time not null default '17:00',
  denominaciones numeric[] not null default '{200,100,50,20,10,5,2,1,0.5,0.2,0.1}',
  actualizado_en timestamptz,
  actualizado_por uuid references public.perfiles (id),
  constraint chk_rango_caja_chica check (caja_chica_min < caja_chica_max),
  constraint chk_alerta_en_rango check (caja_chica_alerta is null or (caja_chica_alerta >= caja_chica_min and caja_chica_alerta <= caja_chica_max))
);
insert into public.parametros (id) values (1);

-- ---------- Catálogos ----------
create table public.catalogos (
  id serial primary key,
  tipo text not null check (tipo in ('AREA', 'MEDIO_PAGO', 'CUENTA', 'COMPROBANTE')),
  valor text not null,
  orden integer not null default 0,
  activo boolean not null default true,
  unique (tipo, valor)
);

-- ---------- Jornadas (una por fecha) ----------
create table public.jornadas (
  id bigserial primary key,
  fecha date not null unique,
  estado public.estado_jornada not null default 'ABIERTA',
  base_caja_diaria numeric(12,2) not null,
  responsable_apertura text,
  apertura_por uuid references public.perfiles (id) default auth.uid(),
  apertura_en timestamptz not null default now(),
  responsable_cierre text,
  cierre_por uuid references public.perfiles (id),
  cierre_en timestamptz,
  observacion text,
  importada boolean not null default false,
  actualizado_en timestamptz,
  actualizado_por uuid references public.perfiles (id)
);

-- ---------- Movimientos (registro continuo) ----------
create table public.movimientos (
  id bigserial primary key,
  jornada_id bigint references public.jornadas (id),
  fecha date not null,
  turno public.turno_caja not null,
  tipo public.tipo_movimiento not null,
  estado_sustento public.estado_sustento,
  comprobante text,
  serie text,
  numero text,
  ruc_dni text,
  nombre text,
  area text,
  descripcion text not null,
  medio_pago text,
  cuenta text,
  num_operacion text,
  monto_digital numeric(12,2) not null default 0 check (monto_digital >= 0),
  monto_efectivo numeric(12,2) not null default 0 check (monto_efectivo >= 0),
  monto numeric(12,2) not null default 0 check (monto >= 0),
  origen public.origen_reposicion,
  caja_retiro public.tipo_caja,
  destino public.destino_retiro,
  observacion text,
  anulado boolean not null default false,
  anulado_motivo text,
  anulado_por uuid references public.perfiles (id),
  anulado_en timestamptz,
  importado boolean not null default false,
  creado_por uuid references public.perfiles (id) default auth.uid(),
  creado_en timestamptz not null default now(),
  actualizado_por uuid references public.perfiles (id),
  actualizado_en timestamptz,
  constraint chk_montos_por_tipo check (
    (tipo = 'INGRESO' and monto = 0)
    or (tipo <> 'INGRESO' and monto > 0 and monto_digital = 0 and monto_efectivo = 0)
  ),
  constraint chk_origen_reposicion check (tipo <> 'REPOSICION_CAJA_CHICA' or origen is not null),
  constraint chk_retiro check (tipo <> 'RETIRO' or (caja_retiro is not null and destino is not null))
);
create index idx_movimientos_fecha on public.movimientos (fecha);
create index idx_movimientos_tipo_fecha on public.movimientos (tipo, fecha);
create index idx_movimientos_jornada on public.movimientos (jornada_id);

-- ---------- Arqueos (conteo por denominación) ----------
create table public.arqueos (
  id bigserial primary key,
  jornada_id bigint not null references public.jornadas (id) on delete cascade,
  caja public.tipo_caja not null,
  conteo jsonb not null default '{}'::jsonb,
  total_contado numeric(12,2) not null,
  total_teorico numeric(12,2) not null,
  diferencia numeric(12,2) not null,
  estado public.estado_arqueo not null,
  observacion text,
  realizado_por uuid references public.perfiles (id) default auth.uid(),
  realizado_en timestamptz not null default now(),
  unique (jornada_id, caja)
);

-- ---------- Auditoría ----------
create table public.auditoria (
  id bigserial primary key,
  tabla text not null,
  registro_id text not null,
  accion text not null,
  usuario_id uuid,
  antes jsonb,
  despues jsonb,
  fecha timestamptz not null default now()
);
create index idx_auditoria_tabla_registro on public.auditoria (tabla, registro_id);

create or replace function public.fn_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_id text;
begin
  if tg_op = 'DELETE' then
    v_id := to_jsonb(old) ->> 'id';
  else
    v_id := to_jsonb(new) ->> 'id';
  end if;
  insert into public.auditoria (tabla, registro_id, accion, usuario_id, antes, despues)
  values (
    tg_table_name, v_id, tg_op, auth.uid(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger trg_aud_movimientos after insert or update or delete on public.movimientos for each row execute function public.fn_auditoria();
create trigger trg_aud_jornadas after insert or update or delete on public.jornadas for each row execute function public.fn_auditoria();
create trigger trg_aud_arqueos after insert or update or delete on public.arqueos for each row execute function public.fn_auditoria();
create trigger trg_aud_parametros after update on public.parametros for each row execute function public.fn_auditoria();
create trigger trg_aud_catalogos after insert or update or delete on public.catalogos for each row execute function public.fn_auditoria();
create trigger trg_aud_perfiles after update on public.perfiles for each row execute function public.fn_auditoria();

-- ---------- Marca de actualización ----------
create or replace function public.fn_marcar_actualizacion()
returns trigger language plpgsql as $$
begin
  new := jsonb_populate_record(new, jsonb_build_object('actualizado_en', now(), 'actualizado_por', auth.uid()));
  return new;
end $$;

create trigger trg_upd_movimientos before update on public.movimientos for each row execute function public.fn_marcar_actualizacion();
create trigger trg_upd_jornadas before update on public.jornadas for each row execute function public.fn_marcar_actualizacion();
create trigger trg_upd_perfiles before update on public.perfiles for each row execute function public.fn_marcar_actualizacion();
create trigger trg_upd_parametros before update on public.parametros for each row execute function public.fn_marcar_actualizacion();

-- ---------- Reglas de jornada ----------
-- Una fecha sin jornada registrada se considera abierta (permite registrar antes de abrirla formalmente).
create or replace function public.fn_jornada_abierta(p_fecha date)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select estado = 'ABIERTA' from public.jornadas where fecha = p_fecha), true)
$$;

-- ---------- Vista de resumen diario ----------
create or replace view public.v_resumen_diario with (security_invoker = true) as
select
  fecha,
  sum(case when tipo = 'INGRESO' then monto_digital + monto_efectivo else 0 end) as ingresos,
  sum(case when tipo = 'INGRESO' then monto_digital else 0 end) as ingresos_digital,
  sum(case when tipo = 'INGRESO' then monto_efectivo else 0 end) as ingresos_efectivo,
  sum(case when tipo = 'EGRESO' then monto else 0 end) as egresos,
  sum(case when tipo = 'REPOSICION_CAJA_CHICA' then monto else 0 end) as reposiciones,
  sum(case when tipo = 'RETIRO' then monto else 0 end) as retiros,
  sum(case when tipo = 'RETIRO' and caja_retiro = 'CHICA' then monto else 0 end) as retiros_caja_chica,
  count(*) as n_movimientos,
  count(*) filter (where estado_sustento = 'SIN COMPROBANTE') as sin_comprobante,
  count(*) filter (where estado_sustento = 'PENDIENTE') as pendientes
from public.movimientos
where not anulado
group by fecha;

-- ---------- Saldo de caja chica a una fecha ----------
create or replace function public.fn_saldo_caja_chica(p_hasta date default current_date)
returns numeric language sql stable security invoker set search_path = public as $$
  select case
    when p_hasta < p.fecha_corte then null
    else p.saldo_inicial_caja_chica + coalesce((
      select sum(case
        when m.tipo = 'REPOSICION_CAJA_CHICA' then m.monto
        when m.tipo = 'EGRESO' then -m.monto
        when m.tipo = 'RETIRO' and m.caja_retiro = 'CHICA' then -m.monto
        else 0 end)
      from public.movimientos m
      where not m.anulado and m.fecha >= p.fecha_corte and m.fecha <= p_hasta
    ), 0)
  end
  from public.parametros p
  where p.id = 1
$$;

-- ---------- Seguridad a nivel de fila ----------
alter table public.perfiles enable row level security;
alter table public.parametros enable row level security;
alter table public.catalogos enable row level security;
alter table public.jornadas enable row level security;
alter table public.movimientos enable row level security;
alter table public.arqueos enable row level security;
alter table public.auditoria enable row level security;

-- perfiles
create policy "perfiles: leer" on public.perfiles for select to authenticated using (true);
create policy "perfiles: supervisor edita" on public.perfiles for update to authenticated
  using (public.fn_es_supervisor()) with check (public.fn_es_supervisor());

-- parametros
create policy "parametros: leer" on public.parametros for select to authenticated using (true);
create policy "parametros: supervisor edita" on public.parametros for update to authenticated
  using (public.fn_es_supervisor()) with check (public.fn_es_supervisor());

-- catalogos
create policy "catalogos: leer" on public.catalogos for select to authenticated using (true);
create policy "catalogos: supervisor administra" on public.catalogos for all to authenticated
  using (public.fn_es_supervisor()) with check (public.fn_es_supervisor());

-- jornadas
create policy "jornadas: leer" on public.jornadas for select to authenticated using (true);
create policy "jornadas: abrir" on public.jornadas for insert to authenticated
  with check (public.fn_usuario_activo());
create policy "jornadas: actualizar" on public.jornadas for update to authenticated
  using (public.fn_es_supervisor() or (public.fn_usuario_activo() and estado = 'ABIERTA'))
  with check (public.fn_es_supervisor() or public.fn_usuario_activo());
create policy "jornadas: supervisor elimina" on public.jornadas for delete to authenticated
  using (public.fn_es_supervisor());

-- movimientos
create policy "movimientos: leer" on public.movimientos for select to authenticated using (true);
create policy "movimientos: registrar" on public.movimientos for insert to authenticated
  with check (public.fn_es_supervisor() or (public.fn_usuario_activo() and public.fn_jornada_abierta(fecha)));
create policy "movimientos: editar" on public.movimientos for update to authenticated
  using (public.fn_es_supervisor() or (public.fn_usuario_activo() and public.fn_jornada_abierta(fecha)))
  with check (public.fn_es_supervisor() or (public.fn_usuario_activo() and public.fn_jornada_abierta(fecha)));
create policy "movimientos: supervisor elimina" on public.movimientos for delete to authenticated
  using (public.fn_es_supervisor());

-- arqueos
create policy "arqueos: leer" on public.arqueos for select to authenticated using (true);
create policy "arqueos: registrar" on public.arqueos for insert to authenticated
  with check (public.fn_es_supervisor() or (public.fn_usuario_activo() and exists (select 1 from public.jornadas j where j.id = jornada_id and j.estado = 'ABIERTA')));
create policy "arqueos: actualizar" on public.arqueos for update to authenticated
  using (public.fn_es_supervisor() or (public.fn_usuario_activo() and exists (select 1 from public.jornadas j where j.id = jornada_id and j.estado = 'ABIERTA')))
  with check (public.fn_es_supervisor() or public.fn_usuario_activo());
create policy "arqueos: supervisor elimina" on public.arqueos for delete to authenticated
  using (public.fn_es_supervisor());

-- auditoria (solo lectura para supervisores; las inserciones las hace el trigger)
create policy "auditoria: supervisor lee" on public.auditoria for select to authenticated
  using (public.fn_es_supervisor());
