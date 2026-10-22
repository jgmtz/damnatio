// Validates the real files in content/ and assets/art/: run `npm test` after editing content.

import { describe, expect, it } from 'vitest';
import { validateContent } from '../src/engine/content';
import { artFiles, loadBundle } from './helpers';

describe('content', () => {
  it('has no broken references', () => {
    const bundle = loadBundle();
    expect(validateContent(bundle, artFiles())).toEqual([]);
    expect(Object.keys(bundle.fragments).length).toBeGreaterThan(0);
  });

  it('merges per-fragment string files into the locale', () => {
    const strings = loadBundle().strings['pt-BR']!;
    expect(strings['ui.newGame']).toBeDefined();
    expect(strings['livia01.title']).toBeDefined();
  });

  it('reports broken references', () => {
    const bundle = loadBundle();
    const fragment = structuredClone(Object.values(bundle.fragments)[0]!);
    fragment.nodes.push({ id: 'bad', type: 'dialogue', speaker: 'nobody', text: 'no.such.key', next: 'nowhere' });
    fragment.nodes.push({ id: 'bad2', type: 'dialogue', speaker: 'livia', expression: 'gleeful', text: 'no.such.key', next: 'bad' });
    fragment.nodes.push({
      id: 'bad3',
      type: 'exploration',
      character: 'livia',
      width: 1000,
      start: 50,
      exits: [{ id: 'x', from: 0, to: 100, next: 'bad' }],
    });
    fragment.nodes.push({ id: 'bad4', type: 'stage', update: [{ id: 'livia', pose: 'dancing' }], next: 'bad' });
    fragment.nodes.push({ id: 'bad5', type: 'fate_event', thread: 'knot' as never, next: 'bad' });
    bundle.fragments[fragment.id] = fragment;
    const errors = validateContent(bundle);
    expect(errors.some((e) => e.includes('unknown character "nobody"'))).toBe(true);
    expect(errors.some((e) => e.includes('missing string "no.such.key"'))).toBe(true);
    expect(errors.some((e) => e.includes('missing node "nowhere"'))).toBe(true);
    expect(errors.some((e) => e.includes('"livia" has no portrait "gleeful"'))).toBe(true);
    expect(errors.some((e) => e.includes('bad3: width must be at least 1920'))).toBe(true);
    expect(errors.some((e) => e.includes('bad3/x: start is inside this exit'))).toBe(true);
    expect(errors.some((e) => e.includes('"livia" has no pose "dancing"'))).toBe(true);
    expect(errors.some((e) => e.includes('bad5: unknown thread "knot"'))).toBe(true);
  });
});
