-- =====================================================================
-- Responsable de cada movimiento e historial de observaciones del arqueo
-- =====================================================================

-- ---------- Responsable del movimiento ----------
-- Quién hizo el movimiento en ventanilla. Los importados del Excel quedan sin responsable.
alter table public.movimientos add column responsable text;

-- Catálogo de responsables, administrable por el supervisor. «Otros» se escribe a mano en el formulario.
alter table public.catalogos drop constraint catalogos_tipo_check;
alter table public.catalogos add constraint catalogos_tipo_check
  check (tipo in ('AREA', 'MEDIO_PAGO', 'CUENTA', 'COMPROBANTE', 'RESPONSABLE'));

insert into public.catalogos (tipo, valor, orden, activo) values
  ('RESPONSABLE', 'BRIAN', 1, true),
  ('RESPONSABLE', 'MILUZKA', 2, true),
  ('RESPONSABLE', 'DIANA', 3, true),
  ('RESPONSABLE', 'NAYSHA', 4, true)
on conflict (tipo, valor) do nothing;

-- ---------- Historial de observaciones del arqueo ----------
-- Cada observación queda registrada con el conteo de ese momento; el campo del formulario se limpia al guardar.
create table public.observaciones_arqueo (
  id bigserial primary key,
  arqueo_id bigint not null references public.arqueos (id) on delete cascade,
  texto text not null check (length(btrim(texto)) > 0),
  total_contado numeric(12,2),
  diferencia numeric(12,2),
  creado_por uuid references public.perfiles (id) default auth.uid(),
  creado_en timestamptz not null default now()
);
create index idx_observaciones_arqueo on public.observaciones_arqueo (arqueo_id, creado_en);

create trigger trg_aud_observaciones_arqueo after insert or update or delete on public.observaciones_arqueo
  for each row execute function public.fn_auditoria();

-- Las observaciones ya escritas en los arqueos pasan a ser la primera entrada de su historial.
insert into public.observaciones_arqueo (arqueo_id, texto, total_contado, diferencia, creado_por, creado_en)
select id, btrim(observacion), total_contado, diferencia, realizado_por, realizado_en
from public.arqueos
where nullif(btrim(observacion), '') is not null;

alter table public.observaciones_arqueo enable row level security;

create policy "observaciones_arqueo: leer" on public.observaciones_arqueo for select to authenticated using (true);
-- Mismas reglas que el arqueo: cajero en jornadas abiertas, supervisor siempre. El historial no se edita.
create policy "observaciones_arqueo: registrar" on public.observaciones_arqueo for insert to authenticated
  with check (
    public.fn_es_supervisor()
    or (public.fn_usuario_activo() and exists (
      select 1 from public.arqueos a join public.jornadas j on j.id = a.jornada_id
      where a.id = arqueo_id and j.estado = 'ABIERTA'
    ))
  );
create policy "observaciones_arqueo: supervisor elimina" on public.observaciones_arqueo for delete to authenticated
  using (public.fn_es_supervisor());
