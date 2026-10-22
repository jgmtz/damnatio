// Paths discovered on the thread map, across every playthrough (like Detroit's flowchart).
// Stored apart from the save: a new game keeps them. Ids come from optionKey() in pathMap.ts.

import { buildPathGraph, END_KEY, optionKey, runSteps, type PathGraph } from './pathMap';
import type { KeyValueStore } from './save';
import type { WorldState } from './state';
import type { ContentBundle } from './types';

const DISCOVERY_KEY = 'ofio.paths';

export class Discovery {
  readonly found: Set<string>;
  private readonly graphs = new Map<string, PathGraph>();

  constructor(
    private readonly store: KeyValueStore | null,
    private readonly bundle: ContentBundle,
  ) {
    let ids: string[] = [];
    try {
      ids = JSON.parse(store?.getItem(DISCOVERY_KEY) ?? '[]') as string[];
    } catch {
      ids = [];
    }
    this.found = new Set(ids);
  }

  graph(fragmentId: string): PathGraph | null {
    const fragment = this.bundle.fragments[fragmentId];
    if (!fragment) return null;
    let graph = this.graphs.get(fragmentId);
    if (!graph) {
      graph = buildPathGraph(fragment);
      this.graphs.set(fragmentId, graph);
    }
    return graph;
  }

  /** Marks every decision of the state's history (and finished fragments) as discovered. */
  record(state: WorldState): void {
    const before = this.found.size;
    for (const fragmentId of new Set(state.history.map((h) => h.fragmentId))) {
      const graph = this.graph(fragmentId);
      if (!graph) continue;
      for (const step of runSteps(graph, state.history)) this.found.add(optionKey(fragmentId, step.point, step.option));
    }
    for (const fragmentId of state.completedFragments) this.found.add(optionKey(fragmentId, END_KEY, ''));
    if (this.found.size === before) return;
    try {
      this.store?.setItem(DISCOVERY_KEY, JSON.stringify([...this.found]));
    } catch {
      // ignore: the map is a convenience
    }
  }
}
