"""
Convierte el libro CAJA ACTUALIZADA (.xlsm, modelo doble caja) en:
  - supabase/seed.sql                            -> parámetros, catálogos, jornadas y movimientos limpios
  - src/dominio/fixtures/movimientos-excel.json  -> fixture para las pruebas del dominio

Uso:  python scripts/importar_excel.py ["ruta\\al\\archivo.xlsm"]
"""
import sys, json, datetime, pathlib, math
import openpyxl

ORIGEN = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
RAIZ = pathlib.Path(__file__).resolve().parent.parent
SEED = RAIZ / "supabase" / "seed.sql"
FIXTURE = RAIZ / "src" / "dominio" / "fixtures" / "movimientos-excel.json"
HOJA = "CAJA DIARIA"

PARAMETROS = {
    "caja_chica_min": 3000, "caja_chica_max": 5000, "caja_chica_alerta": 3500,
    "base_caja_diaria": 500, "saldo_inicial_caja_chica": 6032.90, "fecha_corte": "2026-09-14",
    "tolerancia_arqueo": 0.01, "hora_inicio_noche": "17:00",
}
INACTIVOS = {("COMPROBANTE", "SIN RE")}  # ya no se elige; el histórico lo conserva
CATALOGOS = {
    "AREA": ["DIPLOMADOS", "CURSOS Y CONGRESOS", "ADMINISTRACIÓN", "OTROS"],
    "MEDIO_PAGO": ["EFECTIVO", "NIUBIZ", "YAPE", "PLIN", "TRANSFERENCIA", "OTRO"],
    "CUENTA": ["CONSORCIO", "HUGO", "LUIS RIVERO", "MARIAFE"],
    "COMPROBANTE": ["BV", "FACT", "RE", "SIN RE", "SIN RI"],
}
CORTE_EXCEL = "2026-09-06"  # fecha en que el Excel empezó a descontar retiros de la caja chica
ESTADOS = {"CON COMPROBANTE", "SIN COMPROBANTE", "PENDIENTE"}
TURNOS = {"MAÑANA", "NOCHE"}
SIN_DATO = {"NO SE HACE", "NO APLICA", "N/A", "-", "--"}


def texto(v):
    if v is None:
        return None
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    s = " ".join(str(v).split()).strip()
    return s or None


def mayus(v):
    s = texto(v)
    return s.upper() if s else None


def numero(v):
    if v is None or v == "":
        return 0.0
    try:
        n = float(v)
        if not math.isfinite(n) or n < 0:
            raise ValueError(f"Monto inválido: {v!r}")
        return round(n, 2)
    except (TypeError, ValueError):
        raise ValueError(f"Monto inválido: {v!r}") from None


def fecha_iso(v):
    if isinstance(v, datetime.datetime):
        v = v.date()
    if not isinstance(v, datetime.date):
        raise ValueError(f"fecha inválida: {v!r}")
    if v.year == 2025:  # error de digitación conocido en el libro temporal
        v = v.replace(year=2026)
    return v.isoformat()


def sql(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return f"{v:.2f}"
    return "'" + str(v).replace("'", "''") + "'"


def leer_movimientos():
    wb = openpyxl.load_workbook(ORIGEN, data_only=True, keep_vba=True)
    ws = wb[HOJA]
    movimientos, avisos = [], []
    encabezados = [r for r in range(1, 31) if mayus(ws.cell(r, 2).value) == "FECHA" and mayus(ws.cell(r, 4).value) == "MOVIMIENTO"]
    if not encabezados:
        raise ValueError("No se encontró el encabezado del registro continuo")
    for fila in range(max(encabezados) + 1, ws.max_row + 1):
        def c(col, fila=fila):
            return ws.cell(row=fila, column=col).value
        tipo_excel = mayus(c(4))
        if not tipo_excel:
            continue
        notas = []
        caja_retiro = None
        fecha = fecha_iso(c(2))
        if c(2).year == 2025:
            notas.append("año original 2025 corregido a 2026 (error conocido del libro)")
        turno = mayus(c(3)) or "MAÑANA"
        if turno not in TURNOS:
            notas.append(f"turno original '{turno}'")
            turno = "MAÑANA"
        estado = mayus(c(5))
        if estado not in ESTADOS:
            if estado:
                notas.append(f"estado sustento original '{estado}'")
            estado = None
        comprobante = mayus(c(6))
        serie = texto(c(7))
        numero_comp = texto(c(8))
        if serie and serie.upper() in SIN_DATO:
            serie = None
        if numero_comp and numero_comp.upper() in SIN_DATO:
            numero_comp = None
        ruc_dni = texto(c(9))
        nombre = texto(c(10))
        area = mayus(c(11))
        descripcion = texto(c(12)) or "(sin descripción)"
        medio_pago = mayus(c(13))
        cuenta = mayus(c(14))
        num_operacion = texto(c(15))
        p, q, r, s = numero(c(16)), numero(c(17)), numero(c(18)), numero(c(19))
        observacion = texto(c(20))

        if tipo_excel == "INGRESO":
            tipo = "INGRESO"
            digital, efectivo, monto = p, q, 0.0
            if digital == 0 and efectivo == 0 and r > 0:
                if medio_pago == "EFECTIVO":
                    efectivo = r
                else:
                    digital = r
                notas.append("monto tomado de la columna TOTAL")
            if digital == 0 and efectivo == 0:
                notas.append("ingreso con monto 0 en el Excel")
            if not medio_pago:
                medio_pago = "EFECTIVO" if efectivo > 0 and digital == 0 else "NIUBIZ"
                notas.append(f"medio de pago inferido: {medio_pago}")
        elif tipo_excel == "EGRESO":
            digital, efectivo, monto = 0.0, 0.0, (s or r or q)
            d = descripcion.upper()
            if "RETIRO" in d and ("EXCEDENTE" in d or "EXDENTE" in d):
                tipo = "RETIRO"
                # Antes del corte había una sola caja; desde el corte el Excel descontaba estos retiros de la caja chica.
                caja_retiro = "CHICA" if fecha >= CORTE_EXCEL else "DIARIA"
                notas.append(f"registrado en el Excel como EGRESO; es un retiro de excedente (sale de caja {caja_retiro.lower()}), no un gasto")
            else:
                tipo = "EGRESO"
            if not medio_pago:
                medio_pago = "EFECTIVO"
        elif "REPOSICI" in tipo_excel:
            tipo = "REPOSICION_CAJA_CHICA"
            digital, efectivo, monto = 0.0, 0.0, (q or r)
            if not medio_pago:
                medio_pago = "EFECTIVO"
        else:
            raise ValueError(f"fila {fila}: tipo desconocido {tipo_excel!r}")

        if tipo != "INGRESO" and monto <= 0:
            raise ValueError(f"fila {fila}: {tipo} sin monto")
        if not area:
            area = "OTROS"
            notas.append("área vacía en el Excel, asignada a OTROS")

        if notas:
            texto_notas = "Importación: " + "; ".join(notas)
            observacion = f"{observacion} | {texto_notas}" if observacion else texto_notas

        movimientos.append({
            "fila_excel": fila, "fecha": fecha, "turno": turno, "tipo": tipo,
            "estado_sustento": estado, "comprobante": comprobante, "serie": serie, "numero": numero_comp,
            "ruc_dni": ruc_dni, "nombre": nombre, "area": area, "descripcion": descripcion,
            "medio_pago": medio_pago, "cuenta": cuenta, "num_operacion": num_operacion,
            "monto_digital": digital, "monto_efectivo": efectivo, "monto": monto,
            "origen": "BANCO" if tipo == "REPOSICION_CAJA_CHICA" else None,
            "caja_retiro": caja_retiro,
            "destino": "OTRO" if tipo == "RETIRO" else None,
            "observacion": observacion, "notas": notas,
        })
    return movimientos, avisos


def leer_conteo():
    """Conteo de billetes y monedas del arqueo del Excel (columnas V:W desde la fila 15)."""
    wb = openpyxl.load_workbook(ORIGEN, data_only=True, keep_vba=True)
    ws = wb[HOJA]
    conteo = {}
    for fila in range(13, 26):
        denominacion = ws.cell(row=fila, column=27).value or ws.cell(row=fila, column=22).value
        cantidad = ws.cell(row=fila, column=23).value
        if isinstance(denominacion, (int, float)) and denominacion > 0:
            conteo[str(int(denominacion)) if float(denominacion).is_integer() else str(denominacion)] = int(numero(cantidad))
    return conteo


COLUMNAS = ["fecha", "turno", "tipo", "estado_sustento", "comprobante", "serie", "numero", "ruc_dni", "nombre", "area",
            "descripcion", "medio_pago", "cuenta", "num_operacion", "monto_digital", "monto_efectivo", "monto",
            "origen", "caja_retiro", "destino", "observacion"]


def escribir_seed(movs):
    p = PARAMETROS
    lineas = ["-- Generado por scripts/importar_excel.py a partir del libro Excel del área.",
              "-- Idempotente: si ya existen movimientos importados no vuelve a insertarlos.", ""]
    lineas.append("insert into public.parametros (id, caja_chica_min, caja_chica_max, caja_chica_alerta, base_caja_diaria, saldo_inicial_caja_chica, fecha_corte, tolerancia_arqueo, hora_inicio_noche)")
    lineas.append(f"values (1, {p['caja_chica_min']}, {p['caja_chica_max']}, {p['caja_chica_alerta']}, {p['base_caja_diaria']}, {p['saldo_inicial_caja_chica']}, '{p['fecha_corte']}', {p['tolerancia_arqueo']}, '{p['hora_inicio_noche']}')")
    lineas.append("on conflict (id) do update set caja_chica_min = excluded.caja_chica_min, caja_chica_max = excluded.caja_chica_max, caja_chica_alerta = excluded.caja_chica_alerta, base_caja_diaria = excluded.base_caja_diaria, saldo_inicial_caja_chica = excluded.saldo_inicial_caja_chica, fecha_corte = excluded.fecha_corte, tolerancia_arqueo = excluded.tolerancia_arqueo, hora_inicio_noche = excluded.hora_inicio_noche;")
    lineas.append("")
    valores = []
    for tipo, items in CATALOGOS.items():
        for i, v in enumerate(items, 1):
            valores.append(f"  ('{tipo}', {sql(v)}, {i}, {sql((tipo, v) not in INACTIVOS)})")
    lineas.append("insert into public.catalogos (tipo, valor, orden, activo) values")
    lineas.append(",\n".join(valores) + "\non conflict (tipo, valor) do nothing;")
    lineas.append("")
    fechas = sorted({m["fecha"] for m in movs})
    lineas.append("insert into public.jornadas (fecha, estado, base_caja_diaria, importada, observacion) values")
    lineas.append(",\n".join(
        f"  ('{f}', 'CERRADA', {p['base_caja_diaria']}, true, 'Importada desde el Excel (sin arqueo registrado)')" for f in fechas))
    lineas.append("on conflict (fecha) do nothing;")
    lineas.append("")
    lineas.append("insert into public.movimientos (jornada_id, " + ", ".join(COLUMNAS) + ", importado)")
    lineas.append("select j.id, v.fecha::date, v.turno::public.turno_caja, v.tipo::public.tipo_movimiento, "
                  "v.estado_sustento::public.estado_sustento, v.comprobante, v.serie, v.numero, v.ruc_dni, v.nombre, v.area, "
                  "v.descripcion, v.medio_pago, v.cuenta, v.num_operacion, v.monto_digital, v.monto_efectivo, v.monto, "
                  "v.origen::public.origen_reposicion, v.caja_retiro::public.tipo_caja, v.destino::public.destino_retiro, v.observacion, true")
    lineas.append("from (values")
    filas = ["  (" + str(i) + ", " + ", ".join(sql(m[c]) for c in COLUMNAS) + ")" for i, m in enumerate(movs, 1)]
    lineas.append(",\n".join(filas))
    lineas.append(") as v(orden, " + ", ".join(COLUMNAS) + ")")
    lineas.append("join public.jornadas j on j.fecha = v.fecha::date")
    lineas.append("where not exists (select 1 from public.movimientos where importado)")
    lineas.append("order by v.orden;")
    lineas.append("")
    conteo = leer_conteo()
    if conteo:
        ws = openpyxl.load_workbook(ORIGEN, data_only=True)[HOJA]
        ultima = fecha_iso(ws['B4'].value)
        total = round(sum(float(d) * c for d, c in conteo.items()), 2)
        teorico = numero(ws['J8'].value)
        diferencia = round(total - teorico, 2)
        estado = 'CUADRA' if abs(diferencia) <= PARAMETROS['tolerancia_arqueo'] else 'REVISAR'
        lineas.append("-- Conteo del arqueo del Excel: todo el efectivo junto, aún sin separar la base de la caja diaria.")
        lineas.append("insert into public.arqueos (jornada_id, caja, conteo, total_contado, total_teorico, diferencia, estado, observacion)")
        lineas.append(f"select j.id, 'CHICA', {sql(json.dumps(conteo))}::jsonb, {total:.2f}, {teorico:.2f}, {diferencia:.2f}, '{estado}',")
        lineas.append("       'Conteo del Excel al 13/09/2026. Saldo inicial de caja chica al 14/09; el fondo diario es independiente.'")
        lineas.append("from public.jornadas j")
        lineas.append(f"where j.fecha = '{ultima}'")
        lineas.append("on conflict (jornada_id, caja) do nothing;")
        lineas.append("")
    SEED.parent.mkdir(parents=True, exist_ok=True)
    SEED.write_text("\n".join(lineas), encoding="utf-8")


def escribir_fixture(movs):
    salida = []
    for i, m in enumerate(movs, 1):
        d = {k: v for k, v in m.items() if k not in ("fila_excel", "notas")}
        d.update({"id": i, "jornada_id": None, "anulado": False, "importado": True,
                  "creado_por": None, "creado_en": "2026-09-11T00:00:00Z"})
        salida.append(d)
    FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE.write_text(json.dumps(salida, ensure_ascii=False, indent=1), encoding="utf-8")


def main():
    if ORIGEN is None:
        raise SystemExit('Uso: python scripts/importar_excel.py "ruta/al/libro.xlsm"')
    movs, avisos = leer_movimientos()
    ws = openpyxl.load_workbook(ORIGEN, data_only=True)[HOJA]
    fecha_cierre = fecha_iso(ws['B4'].value)
    conteo = leer_conteo()
    contado = round(sum(float(d) * c for d, c in conteo.items()), 2)
    if not conteo or contado != numero(ws['M8'].value):
        raise ValueError('El conteo por denominaciones no coincide con el efectivo contado del Excel')
    if fecha_cierre != '2026-09-13' or contado != 6032.90:
        raise ValueError('Este corte fue autorizado para el cierre 13/09 por 6032.90. Definir un nuevo corte antes de importar otro libro.')
    escribir_seed(movs)
    escribir_fixture(movs)
    print(f"Origen: {ORIGEN}")
    print(f"Movimientos importados: {len(movs)}  (fechas {min(m['fecha'] for m in movs)} a {max(m['fecha'] for m in movs)})")
    por_tipo = {}
    for m in movs:
        por_tipo[m["tipo"]] = por_tipo.get(m["tipo"], 0) + 1
    print("Por tipo:", por_tipo)

    def tot(k, t=None):
        return round(sum(m[k] for m in movs if t is None or m["tipo"] == t), 2)
    print(f"Ingresos: digital {tot('monto_digital')}  efectivo {tot('monto_efectivo')}  total {round(tot('monto_digital') + tot('monto_efectivo'), 2)}")
    print(f"Egresos {tot('monto', 'EGRESO')}  Retiros {tot('monto', 'RETIRO')}  Reposiciones {tot('monto', 'REPOSICION_CAJA_CHICA')}")
    print("Filas con ajustes de importación:")
    for m in movs:
        if m["notas"]:
            print(f"  fila {m['fila_excel']:>3} {m['fecha']} {m['tipo']:<20} {m['descripcion'][:45]!r}: {'; '.join(m['notas'])}")
    for a in avisos:
        print("AVISO:", a)
    print(f"Escrito: {SEED}\nEscrito: {FIXTURE}")


if __name__ == "__main__":
    main()
