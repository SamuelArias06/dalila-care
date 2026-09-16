/**
 * Acceso a Google Sheets.
 *
 * Es la única capa que sabe que los datos viven en una hoja de cálculo. Todo lo
 * demás habla con estas funciones, así que cambiar de almacenamiento algún día
 * sería reescribir este archivo y nada más.
 *
 * Decisiones:
 *  · Las columnas se leen por NOMBRE de cabecera, nunca por posición. Añadir una
 *    columna, o reordenarlas a mano en la hoja, no rompe nada.
 *  · Nunca se borra una fila: `deletedAt` marca y el dato permanece.
 *  · Todo texto pasa por `sheetSafe`, que evita que una nota escrita como
 *    `=IMPORTXML(...)` se ejecute como fórmula.
 */

import { BOOL_FIELDS, HEADERS, JSON_FIELDS, NUMBER_FIELDS, PROP, SHEETS } from './config.js';
import { sheetSafe, sheetUnsafe } from '@dalila/shared';

export type Row = Record<string, unknown>;

let cachedSs: GoogleAppsScript.Spreadsheet.Spreadsheet | null = null;

export function getSpreadsheetId(): string {
  const id = PropertiesService.getScriptProperties().getProperty(PROP.sheetId);
  if (!id) throw new Error('NOT_CONFIGURED');
  return id;
}

export function ss(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  if (!cachedSs) cachedSs = SpreadsheetApp.openById(getSpreadsheetId());
  return cachedSs;
}

export function resetCache(): void {
  cachedSs = null;
}

export function sheet(name: string): GoogleAppsScript.Spreadsheet.Sheet {
  const s = ss().getSheetByName(name);
  if (!s) throw new Error(`Hoja no encontrada: ${name}`);
  return s;
}

/** Crea la hoja con sus cabeceras si no existe. Idempotente. */
export function ensureSheet(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  name: string,
  headers: string[],
): GoogleAppsScript.Spreadsheet.Sheet {
  let s = spreadsheet.getSheetByName(name);
  if (!s) {
    s = spreadsheet.insertSheet(name);
  }
  const lastCol = Math.max(1, s.getLastColumn());
  const existing = (s.getRange(1, 1, 1, lastCol).getValues()[0] ?? []).map((v) => String(v ?? '').trim());
  const present = existing.filter((h) => h.length > 0);

  if (present.length === 0) {
    s.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    // Añade sólo las cabeceras nuevas, al final. Nunca reordena ni borra: una
    // hoja que alguien tocó a mano debe seguir funcionando.
    const missing = headers.filter((h) => present.indexOf(h) === -1);
    if (missing.length > 0) {
      s.getRange(1, present.length + 1, 1, missing.length).setValues([missing]);
    }
  }
  s.setFrozenRows(1);
  s.getRange(1, 1, 1, Math.max(headers.length, present.length)).setFontWeight('bold');
  return s;
}

function headerMap(s: GoogleAppsScript.Spreadsheet.Sheet): Record<string, number> {
  const lastCol = Math.max(1, s.getLastColumn());
  const headers = (s.getRange(1, 1, 1, lastCol).getValues()[0] ?? []).map((v) => String(v ?? '').trim());
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    if (h) map[h] = i;
  });
  return map;
}

// ── Serialización de celdas ──────────────────────────────────────────────────

function toCell(field: string, value: unknown): string | number | boolean {
  if (value == null) return '';
  if (JSON_FIELDS.has(field)) {
    const arr = Array.isArray(value) ? value : [];
    return arr.length ? JSON.stringify(arr) : '';
  }
  if (BOOL_FIELDS.has(field)) {
    if (value === '' ) return '';
    return value === true || value === 'true' || value === 1;
  }
  if (NUMBER_FIELDS.has(field)) {
    if (value === '' ) return '';
    const n = Number(value);
    return Number.isFinite(n) ? n : '';
  }
  return sheetSafe(String(value));
}

function fromCell(field: string, value: unknown): unknown {
  if (JSON_FIELDS.has(field)) {
    const raw = String(value ?? '').trim();
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (BOOL_FIELDS.has(field)) {
    if (value === '' || value == null) return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  }
  if (NUMBER_FIELDS.has(field)) {
    if (value === '' || value == null) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  const s = value == null ? '' : String(value);
  return s === '' ? undefined : sheetUnsafe(s);
}

// ── Lectura ──────────────────────────────────────────────────────────────────

export function readAll(sheetName: string, includeDeleted = false): Row[] {
  const s = ss().getSheetByName(sheetName);
  if (!s) return [];
  const lastRow = s.getLastRow();
  const lastCol = s.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const values = s.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = (values[0] ?? []).map((v) => String(v ?? '').trim());
  const out: Row[] = [];

  for (let r = 1; r < values.length; r++) {
    const rowVals = values[r] ?? [];
    const id = String(rowVals[headers.indexOf('id')] ?? '').trim();
    if (!id) continue;

    const obj: Row = {};
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c];
      if (!h) continue;
      const parsed = fromCell(h, rowVals[c]);
      if (parsed !== undefined) obj[h] = parsed;
    }
    // Normaliza los campos de lista que puedan faltar.
    for (const f of JSON_FIELDS) {
      if (HEADERS[sheetName]?.includes(f) && obj[f] === undefined) obj[f] = [];
    }
    if (!includeDeleted && obj['deletedAt']) continue;
    out.push(obj);
  }
  return out;
}

/** Lee sólo lo modificado después de `since`, para sincronizaciones incrementales. */
export function readSince(sheetName: string, since: string): Row[] {
  const all = readAll(sheetName, true);
  if (!since) return all.filter((r) => !r['deletedAt']);
  return all.filter((r) => String(r['updatedAt'] ?? '') > since);
}

export function findById(sheetName: string, id: string): { row: Row; rowIndex: number } | null {
  const s = ss().getSheetByName(sheetName);
  if (!s) return null;
  const lastRow = s.getLastRow();
  const lastCol = s.getLastColumn();
  if (lastRow < 2) return null;

  const values = s.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = (values[0] ?? []).map((v) => String(v ?? '').trim());
  const idCol = headers.indexOf('id');
  if (idCol === -1) return null;

  for (let r = 1; r < values.length; r++) {
    if (String(values[r]?.[idCol] ?? '').trim() === id) {
      const obj: Row = {};
      for (let c = 0; c < headers.length; c++) {
        const h = headers[c];
        if (!h) continue;
        const parsed = fromCell(h, values[r]?.[c]);
        if (parsed !== undefined) obj[h] = parsed;
      }
      return { row: obj, rowIndex: r + 1 };
    }
  }
  return null;
}

// ── Escritura ────────────────────────────────────────────────────────────────

/**
 * Inserta o actualiza por `id`. Sólo escribe los campos presentes en `patch`,
 * así que dos clientes que editen campos distintos del mismo registro no se
 * pisan entre sí.
 */
export function upsert(sheetName: string, id: string, patch: Row): Row {
  const s = sheet(sheetName);
  const map = headerMap(s);
  const existing = findById(sheetName, id);

  if (existing) {
    const updates: { col: number; value: string | number | boolean }[] = [];
    for (const key of Object.keys(patch)) {
      const col = map[key];
      if (col === undefined) continue; // columna desconocida: se ignora
      updates.push({ col: col + 1, value: toCell(key, patch[key]) });
    }
    for (const u of updates) {
      s.getRange(existing.rowIndex, u.col).setValue(u.value);
    }
    return { ...existing.row, ...patch };
  }

  const headers = Object.keys(map).sort((a, b) => map[a]! - map[b]!);
  const rowValues = headers.map((h) => toCell(h, patch[h] ?? (h === 'id' ? id : '')));
  s.appendRow(rowValues);
  return patch;
}

/** Borrado suave. El dato sigue en la hoja y se puede recuperar. */
export function softDelete(sheetName: string, id: string, at: string): boolean {
  const s = sheet(sheetName);
  const map = headerMap(s);
  const found = findById(sheetName, id);
  if (!found) return false;
  const col = map['deletedAt'];
  if (col === undefined) return false;
  s.getRange(found.rowIndex, col + 1).setValue(at);
  const updCol = map['updatedAt'];
  if (updCol !== undefined) s.getRange(found.rowIndex, updCol + 1).setValue(at);
  return true;
}

export function appendAudit(entry: {
  at: string;
  actor: string;
  action: string;
  entity?: string;
  entityId?: string;
  result: string;
  errorCode?: string;
  durationMs?: number;
}): void {
  try {
    const s = ss().getSheetByName(SHEETS.audit);
    if (!s) return;
    s.appendRow([
      entry.at,
      entry.actor,
      entry.action,
      entry.entity ?? '',
      entry.entityId ?? '',
      entry.result,
      entry.errorCode ?? '',
      entry.durationMs ?? '',
    ]);
    // Rotación: nunca dejamos que el log crezca sin límite.
    const last = s.getLastRow();
    if (last > 5000) s.deleteRows(2, 1000);
  } catch {
    // El registro de auditoría jamás debe tumbar una petición.
  }
}

export function setMeta(key: string, value: string): void {
  const s = ss().getSheetByName(SHEETS.meta);
  if (!s) return;
  const values = s.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(values[r]?.[0] ?? '') === key) {
      s.getRange(r + 1, 2, 1, 2).setValues([[value, new Date().toISOString()]]);
      return;
    }
  }
  s.appendRow([key, value, new Date().toISOString()]);
}

export function getMeta(key: string): string {
  const s = ss().getSheetByName(SHEETS.meta);
  if (!s) return '';
  const values = s.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(values[r]?.[0] ?? '') === key) return String(values[r]?.[1] ?? '');
  }
  return '';
}

export function countRows(sheetName: string): number {
  const s = ss().getSheetByName(sheetName);
  if (!s) return 0;
  return Math.max(0, s.getLastRow() - 1);
}
