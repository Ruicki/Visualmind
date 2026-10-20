import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { csvCell, toCsv } from '../services/csv.js';

describe('csvCell', () => {
  it('neutraliza textos que Excel interpretaría como fórmula', () => {
    for (const bad of ['=SUMA(A1)', '+1', '-2+3', '@cmd']) {
      expect(csvCell(bad).replace(/^"|"$/g, '').startsWith("'")).toBe(true);
    }
  });

  it('deja los números tal cual', () => {
    expect(csvCell(-12.5)).toBe('-12.5');
  });

  it('entre comillas cuando hay comas, comillas o saltos de línea', () => {
    expect(csvCell('Calle 50, Obarrio')).toBe('"Calle 50, Obarrio"');
    expect(csvCell('dijo "hola"')).toBe('"dijo ""hola"""');
  });

  it('cada fila tiene tantas columnas como encabezados (propiedad)', () => {
    fc.assert(fc.property(fc.array(fc.array(fc.string(), { minLength: 3, maxLength: 3 }), { maxLength: 20 }), (rows) => {
      const csv = toCsv(['a', 'b', 'c'], rows);
      expect(csv.startsWith('﻿a,b,c\r\n')).toBe(true);
      // Cuenta filas sin romper por saltos dentro de comillas
      let inQuotes = false, lines = 0;
      for (const ch of csv.slice(1)) {
        if (ch === '"') inQuotes = !inQuotes;
        if (ch === '\n' && !inQuotes) lines++;
      }
      expect(lines).toBe(rows.length + 1);
    }));
  });
});
