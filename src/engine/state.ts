// World state: one plain, serializable object. All mutation goes through pure functions here,
// so consequence logic stays testable and independent from the UI.

import type { Condition, Effect, FlagValue, StageCharacter, StageMode } from './types';

export interface StageState {
  background: string | null;
  characters: StageCharacter[];
  /** Width of the scrolling world; omitted = one screen (1920). */
  worldWidth?: number;
  /** Omitted = normal. */
  mode?: StageMode;
}

export interface Progress {
  chapterId: string;
  fragmentId: string;
  /** Node the player is currently at (dialogue, choice or exploration); null = fragment not started. */
  nodeId: string | null;
  stage: StageState;
}

/** One taken decision. The thread map (GDD 5.3) reads this to show what happened and what could have. */
export interface DecisionRecord {
  fragmentId: string;
  nodeId: string;
  choiceId: string;
  /** Choices that were available at that moment. */
  available: string[];
  /** True when the choice was taken by a timeout. */
  timedOut?: boolean;
}

export interface WorldState {
  flags: Record<string, FlagValue>;
  relations: Record<string, number>;
  fate: Record<string, number>;
  deaths: string[];
  giftUses: Record<string, number>;
  /** Which pair of protagonists met this chapter, e.g. "livia-theron". */
  crossover: string | null;
  history: DecisionRecord[];
  completedFragments: string[];
  progress: Progress | null;
}

export function createInitialState(): WorldState {
  return {
    flags: {},
    relations: {},
    fate: {},
    deaths: [],
    giftUses: {},
    crossover: null,
    history: [],
    completedFragments: [],
    progress: null,
  };
}

export function emptyStage(): StageState {
  return { background: null, characters: [] };
}

export function applyEffect(state: WorldState, effect: Effect): WorldState {
  if ('flag' in effect) {
    if ('add' in effect) {
      const current = state.flags[effect.flag];
      const base = typeof current === 'number' ? current : 0;
      return { ...state, flags: { ...state.flags, [effect.flag]: base + effect.add } };
    }
    return { ...state, flags: { ...state.flags, [effect.flag]: effect.value } };
  }
  if ('relation' in effect) {
    const current = state.relations[effect.relation] ?? 0;
    return { ...state, relations: { ...state.relations, [effect.relation]: current + effect.add } };
  }
  if ('fate' in effect) {
    const current = state.fate[effect.fate] ?? 0;
    return { ...state, fate: { ...state.fate, [effect.fate]: current + effect.add } };
  }
  if ('kill' in effect) {
    if (state.deaths.includes(effect.kill)) return state;
    return { ...state, deaths: [...state.deaths, effect.kill] };
  }
  if ('giftUse' in effect) {
    const current = state.giftUses[effect.giftUse] ?? 0;
    return { ...state, giftUses: { ...state.giftUses, [effect.giftUse]: current + (effect.add ?? 1) } };
  }
  if ('crossover' in effect) {
    return { ...state, crossover: effect.crossover };
  }
  throw new Error(`Unknown effect: ${JSON.stringify(effect)}`);
}

export function applyEffects(state: WorldState, effects: Effect[] | undefined): WorldState {
  return (effects ?? []).reduce(applyEffect, state);
}

function inRange(value: number, min?: number, max?: number): boolean {
  return (min === undefined || value >= min) && (max === undefined || value <= max);
}

export function evaluateCondition(state: WorldState, condition: Condition): boolean {
  if ('all' in condition) return condition.all.every((c) => evaluateCondition(state, c));
  if ('any' in condition) return condition.any.some((c) => evaluateCondition(state, c));
  if ('not' in condition) return !evaluateCondition(state, condition.not);
  if ('flag' in condition) {
    const value = state.flags[condition.flag];
    if (condition.is !== undefined) return value === condition.is;
    if (condition.min !== undefined || condition.max !== undefined) {
      return inRange(typeof value === 'number' ? value : 0, condition.min, condition.max);
    }
    return Boolean(value);
  }
  if ('relation' in condition) {
    return inRange(state.relations[condition.relation] ?? 0, condition.min, condition.max);
  }
  if ('fate' in condition) {
    return inRange(state.fate[condition.fate] ?? 0, condition.min, condition.max);
  }
  if ('giftUses' in condition) {
    return inRange(state.giftUses[condition.giftUses] ?? 0, condition.min, condition.max);
  }
  if ('alive' in condition) return !state.deaths.includes(condition.alive);
  if ('dead' in condition) return state.deaths.includes(condition.dead);
  if ('crossover' in condition) return state.crossover === condition.crossover;
  throw new Error(`Unknown condition: ${JSON.stringify(condition)}`);
}

export function evaluateAll(state: WorldState, conditions: Condition[] | undefined): boolean {
  return (conditions ?? []).every((c) => evaluateCondition(state, c));
}

/** The end-of-chapter summary (Chapter.summary): the string key of the first matching case of each group. */
export function summaryLines(summary: { cases: { conditions?: Condition[]; text: string }[] }[] | undefined, state: WorldState): string[] {
  return (summary ?? []).flatMap((group) => {
    const match = group.cases.find((c) => evaluateAll(state, c.conditions));
    return match ? [match.text] : [];
  });
}
