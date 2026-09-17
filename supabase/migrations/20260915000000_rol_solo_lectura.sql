-- =====================================================================
-- Rol de solo lectura: ve todo lo que ve un cajero, pero no registra ni modifica nada
-- =====================================================================

alter type public.rol_usuario add value if not exists 'lector';

-- fn_usuario_activo() solo se usa en políticas de escritura (jornadas, movimientos, arqueos y
-- observaciones). Desde ahora exige además un rol que opere la caja, así el lector queda fuera
-- de todas ellas; las lecturas siguen abiertas a cualquier usuario autenticado.
-- Se compara como texto porque el valor nuevo del enum no puede usarse en la misma transacción.
create or replace function public.fn_usuario_activo()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select activo and rol::text in ('cajero', 'supervisor') from public.perfiles where id = auth.uid()), false)
$$;
