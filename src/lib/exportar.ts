import * as XLSX from 'xlsx';

export interface HojaExcel {
  nombre: string;
  filas: Record<string, unknown>[];
  /** Ancho de columnas en caracteres, en el mismo orden que las claves de la primera fila. */
  anchos?: number[];
}

/** Descarga un libro .xlsx con una hoja por cada elemento de `hojas`. */
export function exportarExcel(nombreArchivo: string, hojas: HojaExcel[]): void {
  const libro = XLSX.utils.book_new();
  for (const hoja of hojas) {
    const ws = XLSX.utils.json_to_sheet(hoja.filas.length ? hoja.filas : [{ Aviso: 'Sin datos' }]);
    if (hoja.anchos) ws['!cols'] = hoja.anchos.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(libro, ws, hoja.nombre.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
  }
  XLSX.writeFile(libro, nombreArchivo.endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`);
}
