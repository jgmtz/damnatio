// Executes one fragment: walks its nodes, applies effects, and exposes what the UI should show.
// It knows nothing about the DOM; the UI calls advance()/choose() and reads `view`.

import { applyEffects, emptyStage, evaluateAll, type StageState, type WorldState } from './state';
import type {
  Choice,
  ChoiceNode,
  DialogueNode,
  Effect,
  EndNode,
  ExplorationNode,
  FateEventNode,
  Fragment,
  Hotspot,
  MinigameNode,
  SceneNode,
  StageCharacter,
  ThoughtNode,
  StageUpdate,
} from './types';

export interface ChoiceOption {
  choice: Choice;
  available: boolean;
}

export type RunnerView =
  | { kind: 'dialogue'; node: DialogueNode }
  | { kind: 'thought'; node: ThoughtNode }
  | { kind: 'choice'; node: ChoiceNode; options: ChoiceOption[] }
  | { kind: 'exploration'; node: ExplorationNode; exits: ExplorationNode['exits']; hotspots: Hotspot[] }
  | { kind: 'fate_event'; node: FateEventNode }
  | { kind: 'minigame'; node: MinigameNode }
  | { kind: 'end'; node: EndNode };

/** Node types where the runner stops and waits (for the player, or for an animation to finish). */
const INPUT_NODES = new Set<SceneNode['type']>(['dialogue', 'thought', 'choice', 'exploration', 'fate_event', 'minigame']);

/** History id used when the player raises the cup as a free action (DialogueNode.gift). */
export const GIFT_CHOICE_ID = 'gift';
/** History id when a line that allowed the gift ended without it (the thread map shows the road not taken). */
export const PASS_CHOICE_ID = 'pass';
/** History id when a watcher caught the walker. */
export const CAUGHT_CHOICE_ID = 'caught';

/** An exploration is a decision (recorded in the history, shown on the thread map) when it has several ways out. */
export function isDecisionExploration(node: ExplorationNode): boolean {
  return node.exits.length > 1 || node.caught !== undefined;
}

/** Flag set when a hotspot is examined: `examined.<fragment>.<hotspot>`. */
export function examinedFlag(fragmentId: string, hotspotId: string): string {
  return `examined.${fragmentId}.${hotspotId}`;
}

/**
 * Applies partial stage updates. Unknown ids are added (if they have pose and x).
 * Updates with conditions are skipped when `state` doesn't satisfy them.
 */
export function applyStageUpdates(
  characters: StageCharacter[],
  updates: StageUpdate[],
  nodeId: string,
  state?: WorldState,
): StageCharacter[] {
  let result = characters;
  for (const { id, remove, conditions, ...changes } of updates) {
    if (state && !evaluateAll(state, conditions)) continue;
    if (remove) {
      result = result.filter((c) => c.id !== id);
    } else if (result.some((c) => c.id === id)) {
      result = result.map((c) => (c.id === id ? { ...c, ...changes } : c));
    } else if (changes.pose !== undefined && changes.x !== undefined) {
      result = [...result, { id, ...changes, pose: changes.pose, x: changes.x }];
    } else {
      throw new Error(`Stage update in "${nodeId}": "${id}" is not on stage (add it with pose and x)`);
    }
  }
  return result;
}

export interface RunnerOptions {
  /** Resume at an input node without re-applying its effects (used when loading a save). */
  resume?: { nodeId: string; stage: StageState };
  /** Called every time a node is entered (audio hooks, analytics, debugging). */
  onEnterNode?: (node: SceneNode) => void;
}

const MAX_AUTO_STEPS = 1000;

export class SceneRunner {
  readonly fragment: Fragment;
  private readonly nodes = new Map<string, SceneNode>();
  private readonly onEnterNode?: (node: SceneNode) => void;
  private _state: WorldState;
  private _stage: StageState;
  private currentId: string;

  constructor(fragment: Fragment, state: WorldState, options: RunnerOptions = {}) {
    this.fragment = fragment;
    for (const node of fragment.nodes) this.nodes.set(node.id, node);
    this.onEnterNode = options.onEnterNode;
    this._state = state;

    if (options.resume) {
      this._stage = structuredClone(options.resume.stage);
      this.currentId = options.resume.nodeId;
      const node = this.getNode(this.currentId);
      if (!INPUT_NODES.has(node.type)) {
        throw new Error(`Cannot resume at ${node.type} node "${node.id}"`);
      }
    } else {
      this._stage = emptyStage();
      this.currentId = fragment.start;
      this.enter(fragment.start);
    }
  }

  get state(): WorldState {
    return this._state;
  }

  get stage(): StageState {
    return this._stage;
  }

  get nodeId(): string {
    return this.currentId;
  }

  get view(): RunnerView {
    const node = this.getNode(this.currentId);
    switch (node.type) {
      case 'dialogue':
        return { kind: 'dialogue', node };
      case 'thought':
        return { kind: 'thought', node };
      case 'choice':
        return {
          kind: 'choice',
          node,
          options: node.choices
            .map((choice) => ({ choice, available: evaluateAll(this._state, choice.conditions) }))
            .filter((o) => o.available || o.choice.showWhenLocked),
        };
      case 'exploration':
        return {
          kind: 'exploration',
          node,
          exits: node.exits.filter((e) => evaluateAll(this._state, e.conditions)),
          hotspots: (node.hotspots ?? []).filter((h) => evaluateAll(this._state, h.conditions)),
        };
      case 'fate_event':
        return { kind: 'fate_event', node };
      case 'minigame':
        return { kind: 'minigame', node };
      case 'end':
        return { kind: 'end', node };
      default:
        throw new Error(`Runner stopped on auto node "${node.id}"`);
    }
  }

  get isEnded(): boolean {
    return this.getNode(this.currentId).type === 'end';
  }

  /** Continue past a dialogue or thought, or after a fate event finished playing. */
  advance(): void {
    const node = this.getNode(this.currentId);
    if (node.type !== 'dialogue' && node.type !== 'thought' && node.type !== 'fate_event') {
      throw new Error(`advance() called on ${node.type} node "${node.id}"`);
    }
    // Leaving a gift window without raising the cup is a decision too (the road not taken on the map).
    if (node.type === 'dialogue' && node.gift) {
      const next = this.getNode(node.next);
      if (!(next.type === 'dialogue' && next.gift === node.gift)) this.record(node.id, PASS_CHOICE_ID, [GIFT_CHOICE_ID, PASS_CHOICE_ID]);
    }
    this.enter(node.next);
  }

  choose(choiceId: string, opts: { timedOut?: boolean } = {}): void {
    const view = this.view;
    if (view.kind !== 'choice') throw new Error(`choose() called on ${view.kind} node "${this.currentId}"`);
    const option = view.options.find((o) => o.choice.id === choiceId);
    if (!option || !option.available) throw new Error(`Choice "${choiceId}" is not available`);

    this.record(
      view.node.id,
      choiceId,
      view.options.filter((o) => o.available).map((o) => o.choice.id),
      opts.timedOut ?? false,
    );
    this._state = applyEffects(this._state, option.choice.effects);
    this.enter(option.choice.next);
  }

  /** The walking character reached an exit; `x` is where they stopped, kept for the next scenes. */
  /** Leaves an exploration by an exit, the walker at `x` (and anyone else who moved, in `others`). */
  exit(exitId: string, x: number, others: Record<string, number> = {}): void {
    const node = this.getNode(this.currentId);
    if (node.type !== 'exploration') throw new Error(`exit() called on ${node.type} node "${node.id}"`);
    const exit = node.exits.find((e) => e.id === exitId);
    if (!exit) throw new Error(`Exit "${exitId}" not found in "${node.id}"`);
    if (!evaluateAll(this._state, exit.conditions)) throw new Error(`Exit "${exitId}" is not available`);
    if (isDecisionExploration(node)) {
      const available = node.exits.filter((e) => evaluateAll(this._state, e.conditions)).map((e) => e.id);
      this.record(node.id, exitId, node.caught ? [...available, CAUGHT_CHOICE_ID] : available);
    }
    this._stage = {
      ...this._stage,
      characters: this._stage.characters.map((c) =>
        c.id === node.character ? { ...c, x } : others[c.id] !== undefined ? { ...c, x: others[c.id]! } : c,
      ),
    };
    this.enter(exit.next);
  }

  /** Debug aid: continue from any node, as if a link led there. */
  jumpTo(nodeId: string): void {
    this.enter(nodeId);
  }

  /** Examine a hotspot during exploration. Returns the lines to show; effects apply only the first time. */
  inspect(hotspotId: string): string[] {
    const view = this.view;
    if (view.kind !== 'exploration') throw new Error(`inspect() called on ${view.kind} node "${this.currentId}"`);
    const hotspot = view.hotspots.find((h) => h.id === hotspotId);
    if (!hotspot) throw new Error(`Hotspot "${hotspotId}" is not available`);
    const flag = examinedFlag(this.fragment.id, hotspot.id);
    if (!this._state.flags[flag]) {
      this._state = applyEffects(this._state, [...(hotspot.effects ?? []), { flag, value: true }]);
    }
    return hotspot.lines;
  }

  /** The walker used the scent (Asterion's gift) in an exploration: its price applies on every use. */
  sniff(): void {
    const node = this.getNode(this.currentId);
    if (node.type !== 'exploration' || !node.scent) throw new Error(`sniff() called on "${node.id}"`);
    this._state = applyEffects(this._state, node.scent.effects);
  }

  /** A watcher caught the walker. */
  caught(x: number): void {
    const node = this.getNode(this.currentId);
    if (node.type !== 'exploration' || !node.caught) throw new Error(`caught() called on "${node.id}"`);
    this._stage = {
      ...this._stage,
      characters: this._stage.characters.map((c) => (c.id === node.character ? { ...c, x } : c)),
    };
    const available = node.exits.filter((e) => evaluateAll(this._state, e.conditions)).map((e) => e.id);
    this.record(node.id, CAUGHT_CHOICE_ID, [...available, CAUGHT_CHOICE_ID]);
    this._state = applyEffects(this._state, node.caught.effects);
    this.enter(node.caught.next);
  }

  /** The player raised the cup during a line that allows it (DialogueNode.gift / ChoiceNode.gift). */
  useGift(): void {
    const node = this.getNode(this.currentId);
    if ((node.type !== 'dialogue' && node.type !== 'choice') || !node.gift) {
      throw new Error(`useGift() called on "${node.id}", which has no gift`);
    }
    this.record(node.id, GIFT_CHOICE_ID, [GIFT_CHOICE_ID]);
    this.enter(node.gift);
  }

  /** A minigame ended with `outcomeId`; `earned` are effects won while playing (e.g. revealed marks). */
  finishMinigame(outcomeId: string, earned: Effect[] = []): void {
    const node = this.getNode(this.currentId);
    if (node.type !== 'minigame') throw new Error(`finishMinigame() called on ${node.type} node "${node.id}"`);
    const outcome = node.outcomes.find((o) => o.id === outcomeId);
    if (!outcome) throw new Error(`Outcome "${outcomeId}" not found in "${node.id}"`);
    this.record(node.id, outcomeId, node.outcomes.map((o) => o.id));
    this._state = applyEffects(applyEffects(this._state, earned), outcome.effects);
    this.enter(outcome.next);
  }

  private record(nodeId: string, choiceId: string, available: string[], timedOut = false): void {
    const entry = { fragmentId: this.fragment.id, nodeId, choiceId, available, ...(timedOut ? { timedOut } : {}) };
    this._state = { ...this._state, history: [...this._state.history, entry] };
  }

  /** Time ran out on a timed choice: take the fallback, or the first available choice. */
  timeout(): void {
    const view = this.view;
    if (view.kind !== 'choice') throw new Error('timeout() called outside a choice');
    const available = view.options.filter((o) => o.available);
    const fallback = available.find((o) => o.choice.id === view.node.timeLimit?.fallback) ?? available[0];
    if (!fallback) throw new Error(`No available choice at "${view.node.id}"`);
    this.choose(fallback.choice.id, { timedOut: true });
  }

  private getNode(id: string): SceneNode {
    const node = this.nodes.get(id);
    if (!node) throw new Error(`Node "${id}" not found in fragment "${this.fragment.id}"`);
    return node;
  }

  /** Enter a node and keep going through auto nodes (stage, branch) until one needs the player. */
  private enter(id: string): void {
    let nextId: string | null = id;
    for (let steps = 0; nextId !== null; steps++) {
      if (steps > MAX_AUTO_STEPS) throw new Error(`Possible infinite loop in "${this.fragment.id}"`);
      const node = this.getNode(nextId);
      this.currentId = node.id;
      this._state = applyEffects(this._state, node.effects);
      this.onEnterNode?.(node);
      nextId = this.step(node);
    }
  }

  /** Returns the next node id for auto nodes, or null when the node waits for input. */
  private step(node: SceneNode): string | null {
    switch (node.type) {
      case 'stage': {
        const base = node.characters ? structuredClone(node.characters) : this._stage.characters;
        this._stage = {
          background: node.background === undefined ? this._stage.background : node.background,
          characters: applyStageUpdates(base, node.update ?? [], node.id, this._state),
          worldWidth: node.worldWidth ?? this._stage.worldWidth,
          mode: node.mode ?? this._stage.mode,
        };
        return node.next;
      }
      case 'fate_event':
      case 'minigame':
        return null;
      case 'exploration': {
        const existing = this._stage.characters.find((c) => c.id === node.character);
        const placed = existing
          ? { ...existing, x: node.start ?? existing.x }
          : { id: node.character, pose: 'idle', x: node.start ?? 0 };
        this._stage = {
          ...this._stage,
          background: node.background === undefined ? this._stage.background : node.background,
          worldWidth: node.width,
          // The controlled character goes first so the camera follows it.
          characters: [placed, ...this._stage.characters.filter((c) => c.id !== node.character)],
        };
        return null;
      }
      case 'branch': {
        const match = node.cases.find((c) => evaluateAll(this._state, c.conditions));
        return match ? match.next : node.default;
      }
      case 'thought': {
        const thinker = node.speaker ?? this._stage.characters[0]?.id;
        if (thinker && node.pose !== undefined) {
          this._stage = {
            ...this._stage,
            characters: this._stage.characters.map((c) => (c.id === thinker ? { ...c, pose: node.pose! } : c)),
          };
        }
        return null;
      }
      case 'dialogue':
        if (node.speaker && (node.pose !== undefined || node.flame !== undefined)) {
          this._stage = {
            ...this._stage,
            characters: this._stage.characters.map((c) =>
              c.id === node.speaker
                ? { ...c, pose: node.pose ?? c.pose, ...(node.flame !== undefined ? { flame: node.flame } : {}) }
                : c,
            ),
          };
        }
        return null;
      case 'choice': {
        if (!node.choices.some((c) => evaluateAll(this._state, c.conditions))) {
          throw new Error(`Choice node "${node.id}" has no available choices`);
        }
        return null;
      }
      case 'end':
        return null;
    }
  }
}
