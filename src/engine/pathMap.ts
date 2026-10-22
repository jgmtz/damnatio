// Thread map (GDD 5.3): the decisions of a fragment as a graph, Detroit-style. Pure logic; the
// drawing lives in src/ui/pathMap.ts.
//
// A "point" is a decision: a choice node, a minigame (its outcomes), an exploration with several ways
// out, or a gift window (consecutive lines that let the player raise the cup: raise / let it pass).
// Each option leads to the next points it can reach (stage, dialogue and fate_event nodes are walked
// through; branches fan out to every case), or to the end of the fragment.

import { CAUGHT_CHOICE_ID, GIFT_CHOICE_ID, isDecisionExploration, PASS_CHOICE_ID } from './sceneRunner';
import type { DecisionRecord } from './state';
import type { Fragment, SceneNode, ThreadKind } from './types';

export const END_KEY = '#end';

export interface MapEdge {
  /** Point key, or END_KEY. */
  to: string;
  /** Fate events crossed on the way (a death, a bond), drawn on the thread. */
  fate?: ThreadKind;
}

export interface MapOption {
  id: string;
  /** String key; options without one are shown with a generic mark. */
  label?: string;
  thread?: ThreadKind;
  edges: MapEdge[];
}

export interface MapPoint {
  key: string;
  kind: 'choice' | 'minigame' | 'exploration' | 'gift';
  options: MapOption[];
}

export interface PathGraph {
  fragmentId: string;
  start: MapEdge[];
  points: Map<string, MapPoint>;
  /** Node id (where a decision is recorded) -> point key. Gift windows map every line in them. */
  pointOfNode: Map<string, string>;
}

/** Discovery id of one option, as stored in the discovered-paths set. */
export function optionKey(fragmentId: string, pointKey: string, optionId: string): string {
  return `${fragmentId}|${pointKey}|${optionId}`;
}

export function buildPathGraph(fragment: Fragment): PathGraph {
  const nodes = new Map<string, SceneNode>(fragment.nodes.map((n) => [n.id, n]));
  // Théron's gift is looking at the threads, not raising a cup.
  const giftLabel = fragment.protagonist === 'theron' ? 'ui.map.gift.theron' : 'ui.map.gift';
  const points = new Map<string, MapPoint>();
  const pointOfNode = new Map<string, string>();
  const pending: string[] = [];

  const node = (id: string): SceneNode => {
    const n = nodes.get(id);
    if (!n) throw new Error(`Node "${id}" not found in fragment "${fragment.id}"`);
    return n;
  };

  const isPoint = (n: SceneNode): boolean =>
    n.type === 'choice' ||
    n.type === 'minigame' ||
    (n.type === 'exploration' && isDecisionExploration(n)) ||
    (n.type === 'dialogue' && n.gift !== undefined);

  /** Edges reachable from `id` until the next decision points. */
  const follow = (id: string, fate?: ThreadKind, seen = new Set<string>()): MapEdge[] => {
    if (seen.has(id)) return [];
    seen.add(id);
    const n = node(id);
    if (isPoint(n)) {
      if (!points.has(n.id) && !pending.includes(n.id)) pending.push(n.id);
      return [{ to: n.id, ...(fate ? { fate } : {}) }];
    }
    switch (n.type) {
      case 'end':
        return [{ to: END_KEY, ...(fate ? { fate } : {}) }];
      case 'branch':
        return [...n.cases.map((c) => c.next), n.default].flatMap((next) => follow(next, fate, seen));
      case 'fate_event':
        return follow(n.next, n.thread, seen);
      case 'stage':
      case 'dialogue':
      case 'thought':
        return follow(n.next, fate, seen);
      case 'exploration':
        return follow(n.exits[0]!.next, fate, seen);
      default:
        return [];
    }
  };

  const unique = (edges: MapEdge[]): MapEdge[] => {
    const byTarget = new Map<string, MapEdge>();
    for (const e of edges) if (!byTarget.has(e.to) || e.fate) byTarget.set(e.to, e);
    return [...byTarget.values()];
  };

  const build = (id: string): MapPoint => {
    const n = node(id);
    pointOfNode.set(n.id, n.id);
    switch (n.type) {
      case 'choice': {
        const options: MapOption[] = n.choices.map((c) => ({
          id: c.id,
          label: c.text,
          ...(c.thread ? { thread: c.thread } : {}),
          edges: unique(follow(c.next)),
        }));
        if (n.gift) options.push({ id: GIFT_CHOICE_ID, label: giftLabel, edges: unique(follow(n.gift)) });
        return { key: n.id, kind: 'choice', options };
      }
      case 'minigame':
        return {
          key: n.id,
          kind: 'minigame',
          options: n.outcomes.map((o) => ({ id: o.id, ...(o.label ? { label: o.label } : {}), edges: unique(follow(o.next)) })),
        };
      case 'exploration': {
        const options: MapOption[] = n.exits.map((e) => ({ id: e.id, ...(e.label ? { label: e.label } : {}), edges: unique(follow(e.next)) }));
        if (n.caught) {
          options.push({ id: CAUGHT_CHOICE_ID, ...(n.caught.label ? { label: n.caught.label } : {}), edges: unique(follow(n.caught.next)) });
        }
        return { key: n.id, kind: 'exploration', options };
      }
      case 'dialogue': {
        // Gift window: this line and the following ones with the same gift.
        let last = n;
        for (;;) {
          const next = node(last.next);
          if (next.type !== 'dialogue' || next.gift !== n.gift) break;
          last = next;
          if (!pointOfNode.has(last.id)) pointOfNode.set(last.id, n.id);
        }
        return {
          key: n.id,
          kind: 'gift',
          options: [
            { id: GIFT_CHOICE_ID, label: giftLabel, edges: unique(follow(n.gift!)) },
            { id: PASS_CHOICE_ID, label: 'ui.map.pass', edges: unique(follow(last.next)) },
          ],
        };
      }
      default:
        throw new Error(`"${id}" is not a decision`);
    }
  };

  const start = unique(follow(fragment.start));
  while (pending.length) {
    const id = pending.shift()!;
    if (!points.has(id)) points.set(id, build(id));
  }
  return { fragmentId: fragment.id, start, points, pointOfNode };
}

/** One step of a playthrough on the map. */
export interface PathStep {
  point: string;
  option: string;
}

/** The decisions of this playthrough inside one fragment, in order. */
export function runSteps(graph: PathGraph, history: DecisionRecord[]): PathStep[] {
  const steps: PathStep[] = [];
  for (const record of history) {
    if (record.fragmentId !== graph.fragmentId) continue;
    const point = graph.pointOfNode.get(record.nodeId);
    if (point && graph.points.get(point)?.options.some((o) => o.id === record.choiceId)) {
      steps.push({ point, option: record.choiceId });
    }
  }
  return steps;
}

/** Share of the fragment's options ever walked (0..1). */
export function discoveredShare(graph: PathGraph, discovered: Set<string>): number {
  let total = 0;
  let found = 0;
  for (const point of graph.points.values()) {
    for (const option of point.options) {
      total++;
      if (discovered.has(optionKey(graph.fragmentId, point.key, option.id))) found++;
    }
  }
  return total ? found / total : 1;
}

// --- Layout -----------------------------------------------------------------------------------
//
// Detroit-style flowchart: rows of decisions top to bottom, threads running vertically.
// 1. Layers: longest path from the start (loops, i.e. edges going back up, are set aside).
// 2. A thread that skips rows gets a "lane" (a thin reserved column) in every row it crosses, so it
//    never runs behind a box. Threads heading to the same decision share their lanes (they merge).
// 3. Each row is ordered and placed under its parents (average x), packed without overlap.
// Units: x in option slots (one option box = 1).

export interface LayoutPoint {
  key: string;
  layer: number;
  /** Center x of the point's group of options. */
  x: number;
}

export interface GraphLayout {
  points: Map<string, LayoutPoint>;
  /** Number of rows of decisions; the end sits on row `layers`. */
  layers: number;
  /** Lane x of the threads heading to `target` while crossing row `layer`: key laneKey(target, layer). */
  lanes: Map<string, number>;
  endX: number;
  /** Loops: `${from}>${to}`. */
  back: Set<string>;
}

const LANE_WIDTH = 0.55;
const ITEM_GAP = 0.5;

export function laneKey(target: string, layer: number): string {
  return `${target}@${layer}`;
}

/** Center x of option `index` of a point placed at `x` with `count` options. */
export function optionX(x: number, count: number, index: number): number {
  return x - (count - 1) / 2 + index;
}

export function layoutPathGraph(graph: PathGraph): GraphLayout {
  // Loops: found by depth-first search from the start.
  const back = new Set<string>();
  const visitState = new Map<string, 'open' | 'done'>();
  const visit = (key: string) => {
    visitState.set(key, 'open');
    for (const option of graph.points.get(key)?.options ?? []) {
      for (const edge of option.edges) {
        if (edge.to === END_KEY) continue;
        const s = visitState.get(edge.to);
        if (s === 'open') back.add(`${key}>${edge.to}`);
        else if (!s) visit(edge.to);
      }
    }
    visitState.set(key, 'done');
  };
  for (const e of graph.start) if (e.to !== END_KEY && !visitState.has(e.to)) visit(e.to);

  const forward = (from: string): string[] =>
    (graph.points.get(from)?.options ?? [])
      .flatMap((o) => o.edges.map((e) => e.to))
      .filter((to) => to !== END_KEY && !back.has(`${from}>${to}`));

  // Longest-path layering over what is left (a DAG).
  const layer = new Map<string, number>();
  const order: string[] = [];
  const seen = new Set<string>();
  const topo = (key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    for (const to of forward(key)) topo(to);
    order.push(key);
  };
  for (const e of graph.start) if (e.to !== END_KEY) topo(e.to);
  order.reverse();
  for (const e of graph.start) if (e.to !== END_KEY) layer.set(e.to, 0);
  for (const key of order) {
    const l = layer.get(key) ?? 0;
    layer.set(key, l);
    for (const to of forward(key)) layer.set(to, Math.max(layer.get(to) ?? 0, l + 1));
  }
  const layers = layer.size ? Math.max(...layer.values()) + 1 : 0;
  const layerOf = (key: string) => (key === END_KEY ? layers : (layer.get(key) ?? 0));

  // Every forward thread: source option -> target, with the rows it spans.
  interface Thread {
    from: string;
    index: number;
    to: string;
    fromLayer: number;
    toLayer: number;
  }
  const threads: Thread[] = [];
  for (const [key, point] of graph.points) {
    if (!layer.has(key)) continue;
    point.options.forEach((option, index) => {
      for (const edge of option.edges) {
        if (back.has(`${key}>${edge.to}`)) continue;
        threads.push({ from: key, index, to: edge.to, fromLayer: layerOf(key), toLayer: layerOf(edge.to) });
      }
    });
  }

  const points = new Map<string, LayoutPoint>();
  const lanes = new Map<string, number>();
  const average = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  /** Where a thread is just above row `row`: its source option, or its lane in the row above. */
  const xAbove = (t: Thread, row: number): number | undefined => {
    if (t.fromLayer === row - 1) {
      const p = points.get(t.from);
      return p ? optionX(p.x, graph.points.get(t.from)!.options.length, t.index) : undefined;
    }
    return lanes.get(laneKey(t.to, row - 1));
  };
  const desiredFor = (target: string, row: number): number => {
    const xs = threads
      .filter((t) => t.to === target && t.fromLayer < row)
      .map((t) => xAbove(t, row))
      .filter((x): x is number => x !== undefined);
    if (row === 0 && graph.start.some((e) => e.to === target)) xs.push(0);
    return average([...new Set(xs)]);
  };

  for (let row = 0; row <= layers; row++) {
    type Item = { kind: 'point' | 'lane'; key: string; width: number; desired: number };
    const items: Item[] = [];
    if (row < layers) {
      for (const [key, l] of layer) {
        if (l !== row) continue;
        items.push({ kind: 'point', key, width: graph.points.get(key)!.options.length, desired: desiredFor(key, row) });
      }
      // Lanes for threads crossing this row (one per target: threads to the same decision merge).
      const crossing = new Set(threads.filter((t) => t.fromLayer < row && t.toLayer > row).map((t) => t.to));
      for (const target of crossing) items.push({ kind: 'lane', key: target, width: LANE_WIDTH, desired: desiredFor(target, row) });
    } else {
      // The end of the fragment.
      lanes.set('#endX', desiredFor(END_KEY, row));
      break;
    }
    items.sort((a, b) => a.desired - b.desired);
    // Pack left to right without overlap, then shift the row so it sits under its parents on average.
    const placed: number[] = [];
    items.forEach((item, i) => {
      const prev = i > 0 ? placed[i - 1]! + items[i - 1]!.width / 2 + ITEM_GAP + item.width / 2 : -Infinity;
      placed.push(Math.max(item.desired, prev));
    });
    const shift = average(items.map((item, i) => item.desired - placed[i]!));
    items.forEach((item, i) => {
      const x = placed[i]! + shift;
      if (item.kind === 'point') points.set(item.key, { key: item.key, layer: row, x });
      else lanes.set(laneKey(item.key, row), x);
    });
  }
  const endX = lanes.get('#endX') ?? 0;
  lanes.delete('#endX');
  return { points, layers, lanes, endX, back };
}
