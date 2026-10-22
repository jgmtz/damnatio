// A "monkey" player: plays fragments with random choices, exits and minigame results.
// Used by the playthrough test (dead ends, loops, unreachable nodes) and by the in-game debugger
// (to preview thread maps without touching the real save).

import { SceneRunner } from './sceneRunner';
import { createInitialState, type WorldState } from './state';
import type { ContentBundle, Effect, Fragment, MinigameNode, SceneNode } from './types';

const MAX_STEPS = 2000;

/** Small deterministic PRNG so runs are reproducible. The seed is scrambled so nearby seeds differ. */
export function prng(seed: number): () => number {
  let s = Math.imul(seed ^ 0x9e3779b9, 2654435761) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** A random but consistent minigame result: revealed marks match the outcome (all / some / none). */
export function randomMinigameResult(node: MinigameNode, random: () => number): { outcome: string; earned: Effect[] } {
  const params = (node.params ?? {}) as { targets?: { effects?: Effect[] }[]; suspicionEffects?: Effect[] };
  if (node.game === 'reveal' && params.targets) {
    const found = params.targets.filter(() => random() < 0.6);
    const earned = found.flatMap((t) => t.effects ?? []);
    if (params.suspicionEffects && random() < 0.4) earned.push(...params.suspicionEffects);
    const id = found.length === 0 ? 'none' : found.length === params.targets.length ? 'all' : 'some';
    const outcome = node.outcomes.some((o) => o.id === id) ? id : node.outcomes[0]!.id;
    return { outcome, earned };
  }
  return { outcome: node.outcomes[Math.floor(random() * node.outcomes.length)]!.id, earned: [] };
}

/**
 * Where the walker stops when reaching an exit: at the edge of the exit zone nearest to where they
 * are (walking stops as soon as the zone is entered), not in its middle. Using the middle put
 * characters far from where a real playthrough leaves them (e.g. Lívia 1000 px away from Domícia).
 */
export function exitStop(runner: SceneRunner, exit: { from: number; to: number; by?: string }, character: string): number {
  // An exit reached by someone else (a guided follower): the walker stays where he is.
  if (exit.by) return runner.stage.characters.find((c) => c.id === character)?.x ?? Math.round((exit.from + exit.to) / 2);
  const x = runner.stage.characters.find((c) => c.id === character)?.x;
  if (x === undefined) return Math.round((exit.from + exit.to) / 2);
  return Math.round(Math.min(Math.max(x, exit.from), exit.to));
}

/** Where the walker is now (being caught doesn't move them). */
function walkerX(runner: SceneRunner, character: string, fallback: number): number {
  return runner.stage.characters.find((c) => c.id === character)?.x ?? fallback;
}

/** Plays one fragment to its end with random decisions. Returns the state with the fragment completed. */
export function playFragmentRandomly(
  fragment: Fragment,
  state: WorldState,
  random: () => number,
  onEnterNode?: (node: SceneNode) => void,
): WorldState {
  const runner = new SceneRunner(fragment, state, onEnterNode ? { onEnterNode } : {});
  let steps = 0;
  while (!runner.isEnded) {
    if (++steps > MAX_STEPS) throw new Error(`${fragment.id}: no end after ${MAX_STEPS} steps (at ${runner.nodeId})`);
    const view = runner.view;
    // Sometimes raise the cup when a line allows it (the gift as a free action).
    if ((view.kind === 'dialogue' || view.kind === 'choice') && view.node.gift && random() < 0.15) {
      runner.useGift();
      continue;
    }
    if (view.kind === 'dialogue' || view.kind === 'thought' || view.kind === 'fate_event') {
      runner.advance();
    } else if (view.kind === 'choice') {
      const available = view.options.filter((o) => o.available);
      if (available.length === 0) throw new Error(`${fragment.id}/${view.node.id} has no available choice`);
      // Sometimes simulate a timeout, like a player who doesn't answer in time.
      if (view.node.timeLimit && random() < 0.2) runner.timeout();
      else runner.choose(available[Math.floor(random() * available.length)]!.choice.id);
    } else if (view.kind === 'exploration') {
      for (const h of view.hotspots) if (random() < 0.5) runner.inspect(h.id);
      if (view.node.caught && random() < 0.3) {
        runner.caught(walkerX(runner, view.node.character, 1000));
      } else {
        const exit = view.exits[Math.floor(random() * view.exits.length)]!;
        runner.exit(exit.id, exitStop(runner, exit, view.node.character));
      }
    } else if (view.kind === 'minigame') {
      const { outcome, earned } = randomMinigameResult(view.node, random);
      runner.finishMinigame(outcome, earned);
    }
  }
  return { ...runner.state, completedFragments: [...runner.state.completedFragments, fragment.id] };
}

/** Every node a node can lead to (any choice, exit, outcome, case or gift). */
function links(node: SceneNode): string[] {
  switch (node.type) {
    case 'stage':
    case 'fate_event':
    case 'thought':
      return [node.next];
    case 'dialogue':
      return node.gift ? [node.next, node.gift] : [node.next];
    case 'choice':
      return [...node.choices.map((c) => c.next), ...(node.gift ? [node.gift] : [])];
    case 'branch':
      return [...node.cases.map((c) => c.next), node.default];
    case 'exploration':
      return [...node.exits.map((e) => e.next), ...(node.caught ? [node.caught.next] : [])];
    case 'minigame':
      return node.outcomes.map((o) => o.next);
    case 'end':
      return [];
  }
}

const SEARCH_LIMIT = 4000;

/**
 * Debugger: plays a fragment by itself until `targetId`, so the scene, the people on stage and the
 * flags are what they would be there. It searches the decisions (closest to the target first, by the
 * node graph) and backtracks when a branch's conditions send it elsewhere. Returns the runner stopped
 * at the target (or at the first stop after it, for automatic nodes), or null if the target can't be
 * reached from `state` (e.g. it needs a flag from an earlier fragment).
 */
export function runToNode(fragment: Fragment, state: WorldState, targetId: string): SceneRunner | null {
  const nodes = new Map(fragment.nodes.map((n) => [n.id, n]));
  const distances = new Map<string, number>();
  /** Steps from `from` to the target in the node graph, ignoring conditions (Infinity = never). */
  const distance = (from: string): number => {
    const cached = distances.get(from);
    if (cached !== undefined) return cached;
    const seen = new Set([from]);
    let frontier = [from];
    let result = Infinity;
    for (let d = 0; frontier.length; d++) {
      if (frontier.includes(targetId)) {
        result = d;
        break;
      }
      const next: string[] = [];
      for (const id of frontier) {
        for (const to of links(nodes.get(id)!)) {
          if (!seen.has(to)) {
            seen.add(to);
            next.push(to);
          }
        }
      }
      frontier = next;
    }
    distances.set(from, result);
    return result;
  };

  let reached = false;
  const track = { onEnterNode: (n: SceneNode) => (reached ||= n.id === targetId) };
  const first = new SceneRunner(fragment, structuredClone(state), track);
  if (reached) return first;
  const clone = (r: SceneRunner) =>
    new SceneRunner(fragment, structuredClone(r.state), { ...track, resume: { nodeId: r.nodeId, stage: r.stage } });

  /** Every way to leave the current stop. */
  const moves = (r: SceneRunner): ((c: SceneRunner) => void)[] => {
    const view = r.view;
    const out: ((c: SceneRunner) => void)[] = [];
    if ((view.kind === 'dialogue' || view.kind === 'choice') && view.node.gift) out.push((c) => c.useGift());
    if (view.kind === 'dialogue' || view.kind === 'thought' || view.kind === 'fate_event') out.push((c) => c.advance());
    else if (view.kind === 'choice') {
      for (const o of view.options) if (o.available) out.push((c) => c.choose(o.choice.id));
    } else if (view.kind === 'exploration') {
      for (const e of view.exits) out.push((c) => c.exit(e.id, exitStop(c, e, view.node.character)));
      // Clues found by examining (hotspot effects) can unlock later options: also leave having examined everything.
      if (view.hotspots.some((h) => h.effects?.length)) {
        for (const e of view.exits) {
          out.push((c) => {
            for (const h of view.hotspots) c.inspect(h.id);
            c.exit(e.id, exitStop(c, e, view.node.character));
          });
        }
      }
      if (view.node.caught) out.push((c) => c.caught(walkerX(c, view.node.character, view.node.start ?? 1000)));
    } else if (view.kind === 'minigame') {
      const params = (view.node.params ?? {}) as { targets?: { effects?: Effect[] }[]; suspicionEffects?: Effect[] };
      const targets = params.targets ?? [];
      for (const o of view.node.outcomes) {
        // Revealed marks consistent with the outcome (all / some / none); with and without being noticed.
        const earned = (o.id === 'all' ? targets : o.id === 'some' ? targets.slice(0, 1) : []).flatMap((t) => t.effects ?? []);
        out.push((c) => c.finishMinigame(o.id, earned));
        if (params.suspicionEffects) out.push((c) => c.finishMinigame(o.id, [...earned, ...params.suspicionEffects!]));
      }
    }
    return out;
  };

  // Depth-first, best child first; states already tried are skipped. Lines with a single way on are
  // simply followed (no copy), so only real decisions cost a copy of the state.
  const stack = [first];
  const tried = new Set<string>();
  for (let expansions = 0; stack.length && expansions < SEARCH_LIMIT; expansions++) {
    const r = stack.pop()!;
    let options = moves(r);
    let dead = false;
    while (!r.isEnded && r.nodeId !== targetId && options.length === 1) {
      reached = false;
      options[0]!(r);
      if (reached) return r;
      if (r.isEnded || distance(r.nodeId) === Infinity) {
        dead = true;
        break;
      }
      options = moves(r);
    }
    if (r.nodeId === targetId) return r;
    if (dead || r.isEnded) continue;
    const s = r.state;
    const key = `${r.nodeId}|${JSON.stringify([s.flags, s.relations, s.fate, s.giftUses, s.deaths])}`;
    if (tried.has(key)) continue;
    tried.add(key);
    const children: { runner: SceneRunner; d: number }[] = [];
    for (const move of options) {
      const c = clone(r);
      reached = false;
      move(c);
      if (reached) return c;
      const d = c.isEnded ? Infinity : distance(c.nodeId);
      if (d < Infinity) children.push({ runner: c, d });
    }
    children.sort((a, b) => b.d - a.d);
    for (const child of children) stack.push(child.runner);
  }
  return null;
}

/**
 * runToNode from `state`; if the node needs something decided in an earlier fragment, tries simulated
 * playthroughs of the earlier fragments of the chapter (with `patch` on top) until one gets there.
 */
export function findRunToNode(
  bundle: ContentBundle,
  fragmentId: string,
  state: WorldState,
  targetId: string,
  patch: Partial<WorldState> = {},
  attempts = 60,
): SceneRunner | null {
  const fragment = bundle.fragments[fragmentId];
  if (!fragment) return null;
  const direct = runToNode(fragment, state, targetId);
  if (direct) return direct;
  const chapter = Object.values(bundle.chapters).find((c) => c.order.includes(fragmentId));
  const index = chapter?.order.indexOf(fragmentId) ?? 0;
  if (!chapter || index === 0) return null;
  const previous = chapter.order[index - 1];
  for (let seed = 1; seed <= attempts; seed++) {
    const before = playChapterRandomly(bundle, chapter.id, prng(seed), previous);
    const runner = runToNode(fragment, { ...before, ...patch, progress: null }, targetId);
    if (runner) return runner;
  }
  return null;
}

/** Plays a chapter's fragments in order, up to and including `untilFragment` (all if omitted). */
export function playChapterRandomly(
  bundle: ContentBundle,
  chapterId: string,
  random: () => number,
  untilFragment?: string,
  onEnterNode?: (fragmentId: string, node: SceneNode) => void,
  afterFragment?: (fragment: Fragment, state: WorldState) => void,
): WorldState {
  let state = createInitialState();
  for (const fragmentId of bundle.chapters[chapterId]!.order) {
    const fragment = bundle.fragments[fragmentId]!;
    state = playFragmentRandomly(fragment, state, random, onEnterNode ? (n) => onEnterNode(fragmentId, n) : undefined);
    afterFragment?.(fragment, state);
    if (fragmentId === untilFragment) break;
  }
  return state;
}
