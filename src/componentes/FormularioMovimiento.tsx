import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/auth/AuthProvider';
import { useCatalogos, useGuardarMovimiento, useJornada, useParametros } from '@/datos/consultas';
import {
  DESTINOS_RETIRO,
  ESTADOS_SUSTENTO,
  ETIQUETA_CAJA,
  ETIQUETA_DESTINO,
  ETIQUETA_ORIGEN,
  ETIQUETA_TIPO,
  ORIGENES_REPOSICION,
  TIPOS_MOVIMIENTO,
  TURNOS,
  formatearFecha,
  horaHHmm,
  hoyISO,
  leerMonto,
  turnoParaHora,
  type Movimiento,
  type TipoMovimiento,
  type Turno,
} from '@/dominio';
import { mensajeError } from '@/lib/supabase';
import type { MovimientoInsertar } from '@/lib/tipos-bd';
import { Alerta, AreaTexto, Boton, Campo, Entrada, Modal, Selector } from './ui';

const cadena = z.string().trim().max(200).optional();

const esquema = z
  .object({
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ingresa una fecha válida'),
    turno: z.enum(TURNOS),
    tipo: z.enum(TIPOS_MOVIMIENTO),
    descripcion: z.string().trim().min(3, 'Describe el movimiento (mínimo 3 letras)').max(500),
    area: cadena,
    estado_sustento: z.enum(ESTADOS_SUSTENTO).or(z.literal('')),
    comprobante: cadena,
    serie: cadena,
    numero: cadena,
    ruc_dni: cadena,
    nombre: cadena,
    medio_pago: cadena,
    cuenta: cadena,
    num_operacion: cadena,
    observacion: z.string().trim().max(1000).optional(),
    monto: z.string().optional(),
    monto_digital: z.string().optional(),
    monto_efectivo: z.string().optional(),
    mixto: z.boolean(),
    origen: z.enum(ORIGENES_REPOSICION).or(z.literal('')),
    caja_retiro: z.enum(['DIARIA', 'CHICA']).or(z.literal('')),
    destino: z.enum(DESTINOS_RETIRO).or(z.literal('')),
  })
  .superRefine((v, ctx) => {
    const monto = leerMonto(v.monto ?? '');
    if (v.tipo === 'INGRESO') {
      if (!v.medio_pago) ctx.addIssue({ code: 'custom', path: ['medio_pago'], message: 'Elige el medio de pago' });
      if (v.mixto) {
        if (leerMonto(v.monto_digital ?? '') === null) ctx.addIssue({ code: 'custom', path: ['monto_digital'], message: 'Monto inválido' });
        if (leerMonto(v.monto_efectivo ?? '') === null) ctx.addIssue({ code: 'custom', path: ['monto_efectivo'], message: 'Monto inválido' });
      } else if (monto === null) {
        ctx.addIssue({ code: 'custom', path: ['monto'], message: 'Ingresa el monto' });
      }
      return;
    }
    if (monto === null || monto <= 0) ctx.addIssue({ code: 'custom', path: ['monto'], message: 'Ingresa un monto mayor a cero' });
    if (v.tipo === 'REPOSICION_CAJA_CHICA' && !v.origen) ctx.addIssue({ code: 'custom', path: ['origen'], message: 'Indica de dónde sale el dinero' });
    if (v.tipo === 'RETIRO') {
      if (!v.caja_retiro) ctx.addIssue({ code: 'custom', path: ['caja_retiro'], message: 'Indica de qué caja sale' });
      if (!v.destino) ctx.addIssue({ code: 'custom', path: ['destino'], message: 'Indica el destino' });
    }
  });

type Valores = z.infer<typeof esquema>;

const ESTADO_POR_DEFECTO: Record<TipoMovimiento, Valores['estado_sustento']> = {
  INGRESO: 'CON COMPROBANTE',
  EGRESO: 'SIN COMPROBANTE',
  REPOSICION_CAJA_CHICA: '',
  RETIRO: '',
};

function valoresPorDefecto(movimiento: Movimiento | undefined, turnoAuto: Turno, preset: Partial<Valores>): Valores {
  if (movimiento) {
    const m = movimiento;
    return {
      fecha: m.fecha,
      turno: m.turno,
      tipo: m.tipo,
      descripcion: m.descripcion,
      area: m.area ?? '',
      estado_sustento: m.estado_sustento ?? '',
      comprobante: m.comprobante ?? '',
      serie: m.serie ?? '',
      numero: m.numero ?? '',
      ruc_dni: m.ruc_dni ?? '',
      nombre: m.nombre ?? '',
      medio_pago: m.medio_pago ?? '',
      cuenta: m.cuenta ?? '',
      num_operacion: m.num_operacion ?? '',
      observacion: m.observacion ?? '',
      monto: m.tipo === 'INGRESO' ? String(m.monto_digital > 0 ? m.monto_digital : m.monto_efectivo) : String(m.monto),
      monto_digital: String(m.monto_digital),
      monto_efectivo: String(m.monto_efectivo),
      mixto: m.tipo === 'INGRESO' && m.monto_digital > 0 && m.monto_efectivo > 0,
      origen: m.origen ?? '',
      caja_retiro: m.caja_retiro ?? '',
      destino: m.destino ?? '',
    };
  }
  const tipo = preset.tipo ?? 'INGRESO';
  return {
    fecha: hoyISO(),
    turno: turnoAuto,
    tipo,
    descripcion: '',
    area: '',
    estado_sustento: ESTADO_POR_DEFECTO[tipo],
    comprobante: tipo === 'INGRESO' ? 'BV' : tipo === 'EGRESO' ? 'RE' : '',
    serie: '',
    numero: '',
    ruc_dni: '',
    nombre: '',
    medio_pago: 'EFECTIVO',
    cuenta: '',
    num_operacion: '',
    observacion: '',
    monto: '',
    monto_digital: '',
    monto_efectivo: '',
    mixto: false,
    origen: 'BANCO',
    caja_retiro: 'CHICA',
    destino: 'BANCO',
    ...preset,
  };
}

function limpiar(texto?: string): string | null {
  const t = texto?.trim();
  return t ? t : null;
}

export function aInsertar(v: Valores, jornadaId: number | null): MovimientoInsertar {
  const base: MovimientoInsertar = {
    jornada_id: jornadaId,
    fecha: v.fecha,
    turno: v.turno,
    tipo: v.tipo,
    descripcion: v.descripcion.trim(),
    area: limpiar(v.area),
    estado_sustento: v.estado_sustento || null,
    comprobante: limpiar(v.comprobante),
    serie: limpiar(v.serie)?.toUpperCase() ?? null,
    numero: limpiar(v.numero),
    ruc_dni: limpiar(v.ruc_dni),
    nombre: limpiar(v.nombre)?.toUpperCase() ?? null,
    medio_pago: limpiar(v.medio_pago),
    cuenta: limpiar(v.cuenta),
    num_operacion: limpiar(v.num_operacion),
    observacion: limpiar(v.observacion),
    monto: 0,
    monto_digital: 0,
    monto_efectivo: 0,
    origen: null,
    caja_retiro: null,
    destino: null,
  };
  if (v.tipo === 'INGRESO') {
    if (v.mixto) {
      base.monto_digital = leerMonto(v.monto_digital ?? '') ?? 0;
      base.monto_efectivo = leerMonto(v.monto_efectivo ?? '') ?? 0;
    } else {
      const m = leerMonto(v.monto ?? '') ?? 0;
      if (v.medio_pago === 'EFECTIVO') base.monto_efectivo = m;
      else base.monto_digital = m;
    }
    return base;
  }
  base.monto = leerMonto(v.monto ?? '') ?? 0;
  if (v.tipo === 'REPOSICION_CAJA_CHICA') base.origen = v.origen || null;
  if (v.tipo === 'RETIRO') {
    base.caja_retiro = v.caja_retiro || null;
    base.destino = v.destino || null;
  }
  return base;
}

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onGuardado?: () => void;
  movimiento?: Movimiento;
  /** Valores iniciales para un movimiento nuevo (p. ej. tipo EGRESO desde la caja chica). */
  preset?: Partial<Valores>;
}

export function FormularioMovimiento({ abierto, onCerrar, onGuardado, movimiento, preset }: Props) {
  const { esSupervisor } = useAuth();
  const parametros = useParametros();
  const catalogos = useCatalogos();
  const guardar = useGuardarMovimiento();
  const turnoAuto = turnoParaHora(horaHHmm(), parametros.data?.hora_inicio_noche ?? '17:00');
  const iniciales = useMemo(() => valoresPorDefecto(movimiento, turnoAuto, preset ?? {}), [movimiento, turnoAuto, preset]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ resolver: zodResolver(esquema), defaultValues: iniciales });

  useEffect(() => {
    if (abierto) {
      reset(iniciales);
      guardar.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, iniciales, reset]);

  const tipo = watch('tipo');
  const fecha = watch('fecha');
  const medioPago = watch('medio_pago');
  const mixto = watch('mixto');
  const jornada = useJornada(fecha);
  const jornadaCerrada = jornada.data?.estado === 'CERRADA';
  const bloqueado = jornadaCerrada && !esSupervisor;

  const opciones = (tipoCatalogo: 'AREA' | 'MEDIO_PAGO' | 'CUENTA' | 'COMPROBANTE', actual?: string) => {
    const lista = catalogos.data?.[tipoCatalogo].filter((c) => c.activo || c.valor === actual) ?? [];
    return lista.map((c) => (
      <option key={c.id} value={c.valor}>
        {c.valor}
      </option>
    ));
  };

  function cambiarTipo(nuevo: TipoMovimiento) {
    setValue('tipo', nuevo);
    if (!movimiento) {
      setValue('estado_sustento', ESTADO_POR_DEFECTO[nuevo]);
      setValue('comprobante', nuevo === 'INGRESO' ? 'BV' : nuevo === 'EGRESO' ? 'RE' : '');
      if (nuevo !== 'INGRESO') setValue('mixto', false);
    }
  }

  async function enviar(valores: Valores) {
    try {
      await guardar.mutateAsync({ id: movimiento?.id, valores: aInsertar(valores, jornada.data?.id ?? null) });
      onGuardado?.();
      onCerrar();
    } catch {
      // el error se muestra desde guardar.error
    }
  }

  const esIngreso = tipo === 'INGRESO';
  const esEgreso = tipo === 'EGRESO';
  const conSustento = esIngreso || esEgreso;

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={movimiento ? `Editar movimiento #${movimiento.id}` : 'Nuevo movimiento'} ancho="lg">
      <form onSubmit={handleSubmit(enviar)} className="space-y-5" noValidate>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de movimiento">
          {TIPOS_MOVIMIENTO.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => cambiarTipo(t)}
              aria-pressed={t === tipo}
              className={clsx(
                'rounded-lg border px-3 py-2 text-sm font-semibold transition',
                t === tipo ? 'border-marca-800 bg-marca-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              {ETIQUETA_TIPO[t]}
            </button>
          ))}
        </div>

        {bloqueado && (
          <Alerta tono="alerta" titulo="Jornada cerrada">
            La jornada del {formatearFecha(fecha)} ya está cerrada. Solo un supervisor puede registrar o modificar movimientos en ella.
          </Alerta>
        )}
        {jornadaCerrada && esSupervisor && (
          <Alerta tono="info">La jornada del {formatearFecha(fecha)} está cerrada; el cambio quedará registrado en la auditoría.</Alerta>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Fecha" requerido error={errors.fecha?.message}>
            <Entrada type="date" {...register('fecha')} aria-invalid={Boolean(errors.fecha)} />
          </Campo>
          <Campo etiqueta="Turno" requerido>
            <Selector {...register('turno')}>
              {TURNOS.map((t) => (
                <option key={t} value={t}>
                  {t === 'MAÑANA' ? 'Mañana' : 'Noche'}
                </option>
              ))}
            </Selector>
          </Campo>
          <Campo etiqueta="Área" ayuda={esIngreso ? 'Qué se cobró' : 'Qué área originó el gasto'}>
            <Selector {...register('area')}>
              <option value="">Sin área</option>
              {opciones('AREA', movimiento?.area ?? undefined)}
            </Selector>
          </Campo>
        </div>

        <Campo etiqueta="Descripción" requerido error={errors.descripcion?.message}>
          <Entrada {...register('descripcion')} placeholder={esIngreso ? 'Ej. Pago de matrícula del diplomado…' : 'Ej. Movilidad para trámite…'} aria-invalid={Boolean(errors.descripcion)} />
        </Campo>

        {/* Montos */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {esIngreso && (
              <Campo etiqueta="Medio de pago" requerido error={errors.medio_pago?.message}>
                <Selector {...register('medio_pago')} aria-invalid={Boolean(errors.medio_pago)}>
                  <option value="">Elige…</option>
                  {opciones('MEDIO_PAGO', movimiento?.medio_pago ?? undefined)}
                </Selector>
              </Campo>
            )}
            {esIngreso && mixto ? (
              <>
                <Campo etiqueta="Monto digital" requerido error={errors.monto_digital?.message}>
                  <Entrada inputMode="decimal" placeholder="0.00" {...register('monto_digital')} aria-invalid={Boolean(errors.monto_digital)} />
                </Campo>
                <Campo etiqueta="Monto en efectivo" requerido error={errors.monto_efectivo?.message}>
                  <Entrada inputMode="decimal" placeholder="0.00" {...register('monto_efectivo')} aria-invalid={Boolean(errors.monto_efectivo)} />
                </Campo>
              </>
            ) : (
              <Campo
                etiqueta={esIngreso ? (medioPago === 'EFECTIVO' ? 'Monto en efectivo' : 'Monto digital') : 'Monto'}
                requerido
                error={errors.monto?.message}
                ayuda={esEgreso ? 'Sale de la caja chica' : tipo === 'REPOSICION_CAJA_CHICA' ? 'Entra a la caja chica' : tipo === 'RETIRO' ? 'No cuenta como gasto' : undefined}
              >
                <Entrada inputMode="decimal" placeholder="0.00" {...register('monto')} aria-invalid={Boolean(errors.monto)} />
              </Campo>
            )}
            {esIngreso && (
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
                <input type="checkbox" className="size-4 rounded border-slate-300" {...register('mixto')} />
                Pago mixto (efectivo + digital)
              </label>
            )}
            {tipo === 'REPOSICION_CAJA_CHICA' && (
              <Campo etiqueta="Origen del dinero" requerido error={errors.origen?.message}>
                <Selector {...register('origen')}>
                  {ORIGENES_REPOSICION.map((o) => (
                    <option key={o} value={o}>
                      {ETIQUETA_ORIGEN[o]}
                    </option>
                  ))}
                </Selector>
              </Campo>
            )}
            {tipo === 'RETIRO' && (
              <>
                <Campo etiqueta="Sale de" requerido error={errors.caja_retiro?.message}>
                  <Selector {...register('caja_retiro')}>
                    <option value="CHICA">{ETIQUETA_CAJA.CHICA}</option>
                    <option value="DIARIA">{ETIQUETA_CAJA.DIARIA}</option>
                  </Selector>
                </Campo>
                <Campo etiqueta="Destino" requerido error={errors.destino?.message}>
                  <Selector {...register('destino')}>
                    {DESTINOS_RETIRO.map((d) => (
                      <option key={d} value={d}>
                        {ETIQUETA_DESTINO[d]}
                      </option>
                    ))}
                  </Selector>
                </Campo>
              </>
            )}
            {(esIngreso || tipo === 'REPOSICION_CAJA_CHICA') && (
              <Campo etiqueta="N.º de operación" ayuda="Para pagos digitales o transferencias">
                <Entrada {...register('num_operacion')} />
              </Campo>
            )}
            {esIngreso && (
              <Campo etiqueta="Cuenta">
                <Selector {...register('cuenta')}>
                  <option value="">Sin cuenta</option>
                  {opciones('CUENTA', movimiento?.cuenta ?? undefined)}
                </Selector>
              </Campo>
            )}
          </div>
        </div>

        {conSustento && (
          <div className="grid gap-4 sm:grid-cols-4">
            <Campo etiqueta="Sustento" requerido>
              <Selector {...register('estado_sustento')}>
                {ESTADOS_SUSTENTO.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Selector>
            </Campo>
            <Campo etiqueta="Comprobante">
              <Selector {...register('comprobante')}>
                <option value="">Sin comprobante</option>
                {opciones('COMPROBANTE', movimiento?.comprobante ?? undefined)}
              </Selector>
            </Campo>
            <Campo etiqueta="Serie">
              <Entrada {...register('serie')} placeholder="EB01" />
            </Campo>
            <Campo etiqueta="Número">
              <Entrada {...register('numero')} placeholder="00078919" />
            </Campo>
          </div>
        )}

        {tipo !== 'REPOSICION_CAJA_CHICA' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo etiqueta={esIngreso ? 'RUC / DNI del cliente' : 'DNI de quien recibe'}>
              <Entrada {...register('ruc_dni')} inputMode="numeric" />
            </Campo>
            <Campo etiqueta={esIngreso ? 'Nombre / razón social' : 'Nombre de quien recibe'} className="sm:col-span-2">
              <Entrada {...register('nombre')} />
            </Campo>
          </div>
        )}

        <Campo etiqueta="Observación">
          <AreaTexto {...register('observacion')} rows={2} />
        </Campo>

        {guardar.error ? <Alerta tono="peligro">{mensajeError(guardar.error)}</Alerta> : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={isSubmitting || guardar.isPending} disabled={bloqueado}>
            {movimiento ? 'Guardar cambios' : 'Registrar movimiento'}
          </Boton>
        </div>
      </form>
    </Modal>
  );
}
