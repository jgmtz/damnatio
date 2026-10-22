// Loads the real content from disk, the same way the game bundles it.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { buildContentBundle } from '../src/engine/content';
import type { ContentBundle } from '../src/engine/types';

export const root = join(import.meta.dirname, '..');

export function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

export function loadJsonFiles(): Record<string, unknown> {
  const files: Record<string, unknown> = {};
  for (const file of [...walk(join(root, 'content')), join(root, 'assets/art/manifest.json')]) {
    if (!file.endsWith('.json')) continue;
    files[relative(root, file)] = JSON.parse(readFileSync(file, 'utf8'));
  }
  return files;
}

export function loadBundle(): ContentBundle {
  return buildContentBundle(loadJsonFiles());
}

export function artFiles(): Set<string> {
  const artDir = join(root, 'assets/art');
  return new Set(walk(artDir).map((f) => relative(artDir, f).replace(/\\/g, '/')));
}
