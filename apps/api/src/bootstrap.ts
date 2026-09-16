/**
 * Arranque inicial: crea la hoja de cálculo, el árbol de Drive y los secretos.
 *
 * Es idempotente: ejecutarlo dos veces no destruye nada. Si ya está configurado,
 * comprueba que todas las hojas y carpetas existan y se limita a completar lo
 * que falte.
 */

import { HEADERS, PROP, ROOT_FOLDER_NAME, SHEETS } from './config.js';
import { createInvite, getSessionSecret } from './auth.js';
import { createFolder, findOrCreateFolder } from './drive.js';
import { ensureSheet, resetCache, setMeta } from './sheets.js';
import { SCHEMA_VERSION } from '@dalila/shared';

const SPREADSHEET_MIME = 'application/vnd.google-apps.spreadsheet';

export interface BootstrapResult {
  alreadyConfigured: boolean;
  sheetId: string;
  sheetUrl: string;
  rootFolderId: string;
  rootFolderUrl: string;
  createdSheets: string[];
}

function props(): GoogleAppsScript.Properties.Properties {
  return PropertiesService.getScriptProperties();
}

function createSpreadsheetInFolder(name: string, parentId: string): string {
  const res = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    payload: JSON.stringify({ name, mimeType: SPREADSHEET_MIME, parents: [parentId] }),
  });
  if (res.getResponseCode() >= 300) {
    throw new Error(`No se pudo crear la hoja: ${res.getContentText().slice(0, 200)}`);
  }
  return (JSON.parse(res.getContentText()) as { id: string }).id;
}

export function bootstrap(): BootstrapResult {
  const lock = LockService.getScriptLock();
  lock.waitLock(60000);
  try {
    const p = props();
    const already = p.getProperty(PROP.setupDone) === 'true';

    // ── Drive ────────────────────────────────────────────────────────────────
    let rootId = p.getProperty(PROP.rootFolderId) ?? '';
    if (!rootId) {
      rootId = createFolder(ROOT_FOLDER_NAME);
      p.setProperty(PROP.rootFolderId, rootId);
    }

    const mediaId = p.getProperty(PROP.mediaFolderId) || findOrCreateFolder('Media', rootId);
    const docsId = p.getProperty(PROP.docsFolderId) || findOrCreateFolder('Documentos', rootId);
    const reportsId = p.getProperty(PROP.reportsFolderId) || findOrCreateFolder('Exportaciones', rootId);
    p.setProperties({
      [PROP.mediaFolderId]: mediaId,
      [PROP.docsFolderId]: docsId,
      [PROP.reportsFolderId]: reportsId,
    });

    // ── Hoja de cálculo ──────────────────────────────────────────────────────
    let sheetId = p.getProperty(PROP.sheetId) ?? '';
    if (!sheetId) {
      sheetId = createSpreadsheetInFolder('Dalila Care · datos', rootId);
      p.setProperty(PROP.sheetId, sheetId);
    }
    resetCache();

    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const created: string[] = [];
    for (const name of Object.values(SHEETS)) {
      const headers = HEADERS[name];
      if (!headers) continue;
      const before = spreadsheet.getSheetByName(name);
      ensureSheet(spreadsheet, name, headers);
      if (!before) created.push(name);
    }

    // La hoja por defecto que crea Google estorba.
    const def = spreadsheet.getSheetByName('Hoja 1') ?? spreadsheet.getSheetByName('Sheet1');
    if (def && spreadsheet.getSheets().length > 1) {
      try {
        spreadsheet.deleteSheet(def);
      } catch {
        /* si está protegida, da igual */
      }
    }

    getSessionSecret();
    setMeta('schemaVersion', String(SCHEMA_VERSION));
    setMeta('bootstrappedAt', new Date().toISOString());
    p.setProperty(PROP.setupDone, 'true');

    return {
      alreadyConfigured: already,
      sheetId,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      rootFolderId: rootId,
      rootFolderUrl: `https://drive.google.com/drive/folders/${rootId}`,
      createdSheets: created,
    };
  } finally {
    lock.releaseLock();
  }
}

export function isConfigured(): boolean {
  return props().getProperty(PROP.setupDone) === 'true' && !!props().getProperty(PROP.sheetId);
}

/** Genera un enlace de invitación listo para enviar por WhatsApp. */
export function makeInviteLink(appUrl: string, role: 'admin' | 'caregiver', note = ''): string {
  const { code } = createInvite(role, note);
  const base = appUrl.replace(/[#?].*$/, '').replace(/\/$/, '');
  return `${base}/#/invitacion/${code}`;
}
