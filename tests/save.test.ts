import { describe, expect, it } from 'vitest';
import {
  createSave,
  exportSaveCode,
  importSaveCode,
  parseSave,
  SaveError,
  SaveStore,
  SCHEMA_VERSION,
  type KeyValueStore,
} from '../src/engine/save';
import { applyEffects, createInitialState } from '../src/engine/state';

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const state = applyEffects(createInitialState(), [
  { flag: 'acentuação_ç', value: 'Lívia, Domícia — “fios”' },
  { relation: 'livia:domicia', add: 2 },
  { kill: 'mirto' },
]);

describe('save', () => {
  it('round-trips through the export code, including non-ASCII text', () => {
    const save = createSave(state, new Date('2026-01-01T00:00:00Z'));
    const loaded = importSaveCode(exportSaveCode(save));
    expect(loaded).toEqual(save);
  });

  it('round-trips through the store', () => {
    const store = new SaveStore(memoryStore());
    expect(store.read()).toBeNull();
    expect(store.write(createSave(state))).toBe(true);
    expect(store.read()?.state).toEqual(state);
    store.clear();
    expect(store.read()).toBeNull();
  });

  it('rejects garbage and saves from the future', () => {
    expect(() => importSaveCode('not base64!!')).toThrow(SaveError);
    expect(() => parseSave({ foo: 1 })).toThrow(SaveError);
    expect(() => parseSave({ schemaVersion: SCHEMA_VERSION + 1, state: {} })).toThrow(SaveError);
  });

  it('fills fields missing from older saves with defaults', () => {
    const save = parseSave({ schemaVersion: SCHEMA_VERSION, state: { flags: { x: true } } });
    expect(save.state.flags).toEqual({ x: true });
    expect(save.state.deaths).toEqual([]);
    expect(save.state.progress).toBeNull();
  });

  it('works when storage is unavailable', () => {
    const store = new SaveStore(null);
    expect(store.write(createSave(state))).toBe(false);
    expect(store.read()).toBeNull();
  });
});
