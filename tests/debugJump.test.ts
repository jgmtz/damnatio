// The debugger's jump (findRunToNode) must reach every node a player can stop at, in every fragment.

import { describe, expect, it } from 'vitest';
import { findRunToNode } from '../src/engine/simulate';
import { createInitialState } from '../src/engine/state';
import { loadBundle } from './helpers';
import { reachesByScenario } from './rareScenarios';

const STOPS = new Set(['dialogue', 'thought', 'choice', 'exploration', 'fate_event', 'minigame']);

describe('debugger jump', () => {
  const bundle = loadBundle();

  for (const chapter of Object.values(bundle.chapters)) {
    it(`${chapter.id}: reaches every stopping node`, () => {
      const missing: string[] = [];
      for (const fragmentId of chapter.order) {
        for (const node of bundle.fragments[fragmentId]!.nodes) {
          if (!STOPS.has(node.type)) continue;
          // Some endings need several earlier decisions to line up (Mirto's fate on Lívia's road): many tries.
          const runner = findRunToNode(bundle, fragmentId, createInitialState(), node.id, {}, 2500);
          if (runner?.nodeId !== node.id && !reachesByScenario(bundle, fragmentId, node.id)) missing.push(`${fragmentId}/${node.id}`);
        }
      }
      expect(missing).toEqual([]);
    }, 180000);
  }
});
