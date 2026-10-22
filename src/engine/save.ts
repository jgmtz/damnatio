// Save system: versioned save file, localStorage persistence and base64 export/import
// (so choices can be carried from one season to the next).

import { createInitialState, type WorldState } from './state';

/** Bump when WorldState changes shape, and add a migration from the previous version. */
export const SCHEMA_VERSION = 1;

export interface SaveFile {
  schemaVersion: number;
  savedAt: string;
  state: WorldState;
}

/** migrations[n] upgrades a save from version n to n + 1. */
const migrations: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {};

export class SaveError extends Error {}

export function createSave(state: WorldState, now = new Date()): SaveFile {
  return { schemaVersion: SCHEMA_VERSION, savedAt: now.toISOString(), state };
}

/** Parses and migrates unknown data into a SaveFile. Throws SaveError if it is not a valid save. */
export function parseSave(raw: unknown): SaveFile {
  if (typeof raw !== 'object' || raw === null) throw new SaveError('Save is not an object');
  let data = raw as Record<string, unknown>;
  let version = data.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new SaveError('Save has no valid schemaVersion');
  }
  if (version > SCHEMA_VERSION) throw new SaveError(`Save is from a newer version (${version})`);
  while (version < SCHEMA_VERSION) {
    const migrate = migrations[version];
    if (!migrate) throw new SaveError(`No migration from version ${version}`);
    data = migrate(data);
    version += 1;
  }
  const state = data.state;
  if (typeof state !== 'object' || state === null) throw new SaveError('Save has no state');
  // Fill fields missing from older or hand-edited saves with defaults.
  const merged = { ...createInitialState(), ...(state as Partial<WorldState>) };
  return {
    schemaVersion: SCHEMA_VERSION,
    savedAt: typeof data.savedAt === 'string' ? data.savedAt : new Date(0).toISOString(),
    state: merged,
  };
}

// --- Export / import as a text code (base64 of UTF-8 JSON) ---

export function exportSaveCode(save: SaveFile): string {
  const bytes = new TextEncoder().encode(JSON.stringify(save));
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function importSaveCode(code: string): SaveFile {
  let json: unknown;
  try {
    const binary = atob(code.replace(/\s+/g, ''));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    json = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new SaveError('Invalid save code');
  }
  return parseSave(json);
}

// --- Persistent storage ---

/** Minimal storage interface so tests can use an in-memory store. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SAVE_KEY = 'ofio.save.auto';

export class SaveStore {
  constructor(private readonly store: KeyValueStore | null) {}

  /** Returns false if storage is unavailable (private mode, blocked site data). */
  write(save: SaveFile): boolean {
    try {
      this.store?.setItem(SAVE_KEY, JSON.stringify(save));
      return this.store !== null;
    } catch {
      return false;
    }
  }

  read(): SaveFile | null {
    try {
      const raw = this.store?.getItem(SAVE_KEY);
      return raw ? parseSave(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      this.store?.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
  }
}

export function browserStore(): KeyValueStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
