/**
 * @file csv.js
 * @description Generación de CSV para exportar a Excel/Google Sheets.
 */

/** Escapa un valor para CSV. Los textos que empiezan con = + - @ se neutralizan para que Excel no los ejecute como fórmula. */
export function csvCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Arma un CSV (con BOM para que Excel respete tildes) a partir de encabezados y filas. */
export function toCsv(headers, rows) {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) lines.push(row.map(csvCell).join(','));
  return '﻿' + lines.join('\r\n') + '\r\n';
}
