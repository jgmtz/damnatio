// Plays every chapter many times with random choices and exits (a "monkey" player, src/engine/simulate.ts).
// Catches dead ends, crashes, infinite loops and nodes that no path can reach, and checks that the
// thread map matches what really happens.

import { describe, expect, it } from 'vitest';
import { buildPathGraph, END_KEY, optionKey, runSteps, type PathGraph } from '../src/engine/pathMap';
import { findRunToNode, playChapterRandomly, prng } from '../src/engine/simulate';
import { createInitialState, type WorldState } from '../src/engine/state';
import { loadBundle } from './helpers';
import { reachesByScenario } from './rareScenarios';

// Outcomes now need several decisions across the chapter to line up (docs/design/proposta-decisoes.md),
// so the rarest ones (Mirto's fate on Lívia's road) only show up in a larger sample.
const RUNS = 1500;

/**
 * The thread map must match what really happens: every decision recorded in a playthrough is an option
 * on the map, and each one leads (on the map) to the next decision taken, or to the end.
 */
function checkMap(graph: PathGraph, state: WorldState, walked: Set<string>): void {
  const records = state.history.filter((h) => h.fragmentId === graph.fragmentId);
  const steps = runSteps(graph, state.history);
  expect(steps.length, `${graph.fragmentId}: decisions missing from the map`).toBe(records.length);
  const first = steps[0]?.point ?? END_KEY;
  expect(graph.start.map((e) => e.to), `${graph.fragmentId}: start`).toContain(first);
  steps.forEach((step, i) => {
    walked.add(optionKey(graph.fragmentId, step.point, step.option));
    const option = graph.points.get(step.point)!.options.find((o) => o.id === step.option)!;
    const next = steps[i + 1]?.point ?? END_KEY;
    expect(option.edges.map((e) => e.to), `${graph.fragmentId}: ${step.point}/${step.option} -> ${next}`).toContain(next);
  });
}

describe('playthrough', () => {
  const bundle = loadBundle();

  for (const chapterId of Object.keys(bundle.chapters)) {
    it(`${chapterId}: every random path ends and every node is reachable`, () => {
      const random = prng(42);
      const visited = new Set<string>();
      const walked = new Set<string>();
      const endings = new Map<string, number>();
      for (let i = 0; i < RUNS; i++) {
        const state = playChapterRandomly(
          bundle,
          chapterId,
          random,
          undefined,
          (fragmentId, n) => visited.add(`${fragmentId}/${n.id}`),
          (fragment, s) => checkMap(buildPathGraph(fragment), s, walked),
        );
        const key = `${state.crossover ?? 'none'}|${state.deaths.join(',') || 'alive'}`;
        endings.set(key, (endings.get(key) ?? 0) + 1);
      }
      // Endings that need many earlier decisions to line up may not come up at random: those are
      // checked with the debugger's directed search instead (it plays toward the node).
      const unreachable = bundle.chapters[chapterId]!.order.flatMap((fragmentId) =>
        bundle.fragments[fragmentId]!.nodes
          .filter((n) => !visited.has(`${fragmentId}/${n.id}`))
          .filter((n) => !reachesByScenario(bundle, fragmentId, n.id))
          .filter((n) => findRunToNode(bundle, fragmentId, createInitialState(), n.id, {}, 2500)?.nodeId !== n.id)
          .map((n) => `${fragmentId}/${n.id}`),
      );
      expect(unreachable).toEqual([]);
      // Every option drawn on the thread maps can actually be walked.
      const unwalked = bundle.chapters[chapterId]!.order.flatMap((fragmentId) => {
        const graph = buildPathGraph(bundle.fragments[fragmentId]!);
        const fragment = bundle.fragments[fragmentId]!;
        return [...graph.points.values()]
          // Any outcome of a minigame is in the player's hands once the minigame is reached: a rare
          // minigame (e.g. Iante's threads with the hand bound by the Bond) needs no lucky outcome too.
          .filter((p) => !(fragment.nodes.find((n) => n.id === p.key)?.type === 'minigame' && visited.has(`${fragmentId}/${p.key}`)))
          .flatMap((p) => p.options.map((o) => optionKey(fragmentId, p.key, o.id)).filter((k) => !walked.has(k)));
      });
      expect(unwalked).toEqual([]);
      // Print the distribution of outcomes for balancing (visible with `npx vitest run --reporter=verbose`).
      console.info(`[${chapterId}] outcomes over ${RUNS} runs:`, Object.fromEntries(endings));
      // Hundreds of playthroughs: give it room on a busy machine (it timed out at the 5 s default).
    }, 180_000);
  }
});
