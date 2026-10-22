import { describe, expect, it } from 'vitest';
import { SceneRunner } from '../src/engine/sceneRunner';
import { applyEffects, createInitialState } from '../src/engine/state';
import type { Fragment } from '../src/engine/types';

const fragment: Fragment = {
  id: 'test-01',
  protagonist: 'livia',
  title: 't',
  start: 's1',
  nodes: [
    { id: 's1', type: 'stage', characters: [{ id: 'livia', pose: 'idle', x: 500 }], next: 'd1' },
    { id: 'd1', type: 'dialogue', speaker: 'livia', text: 't', effects: [{ flag: 'seen_d1', value: true }], next: 'c1' },
    {
      id: 'c1',
      type: 'choice',
      timeLimit: { seconds: 5, fallback: 'b' },
      choices: [
        { id: 'a', text: 't', effects: [{ flag: 'picked', value: 'a' }], next: 'br' },
        { id: 'b', text: 't', effects: [{ flag: 'picked', value: 'b' }], next: 'br' },
        { id: 'locked', text: 't', conditions: [{ flag: 'never' }], showWhenLocked: true, next: 'br' },
        { id: 'hidden', text: 't', conditions: [{ flag: 'never' }], next: 'br' },
      ],
    },
    { id: 'br', type: 'branch', cases: [{ conditions: [{ flag: 'picked', is: 'a' }], next: 'da' }], default: 'db' },
    { id: 'da', type: 'dialogue', speaker: 'livia', pose: 'offering', text: 't', next: 'end' },
    { id: 'db', type: 'dialogue', text: 't', next: 'end' },
    { id: 'end', type: 'end' },
  ],
};

describe('SceneRunner', () => {
  it('runs auto nodes and stops on the first dialogue, applying its effects', () => {
    const r = new SceneRunner(fragment, createInitialState());
    expect(r.view.kind).toBe('dialogue');
    expect(r.nodeId).toBe('d1');
    expect(r.state.flags.seen_d1).toBe(true);
    expect(r.stage.characters).toEqual([{ id: 'livia', pose: 'idle', x: 500 }]);
  });

  it('shows locked choices only when showWhenLocked is set', () => {
    const r = new SceneRunner(fragment, createInitialState());
    r.advance();
    const view = r.view;
    if (view.kind !== 'choice') throw new Error('expected choice');
    expect(view.options.map((o) => [o.choice.id, o.available])).toEqual([
      ['a', true],
      ['b', true],
      ['locked', false],
    ]);
    expect(() => r.choose('locked')).toThrow();
  });

  it('records history, applies choice effects, branches and changes the speaker pose', () => {
    const r = new SceneRunner(fragment, createInitialState());
    r.advance();
    r.choose('a');
    expect(r.nodeId).toBe('da');
    expect(r.state.history).toEqual([{ fragmentId: 'test-01', nodeId: 'c1', choiceId: 'a', available: ['a', 'b'] }]);
    expect(r.stage.characters[0]?.pose).toBe('offering');
    r.advance();
    expect(r.isEnded).toBe(true);
  });

  it('takes the fallback on timeout', () => {
    const r = new SceneRunner(fragment, createInitialState());
    r.advance();
    r.timeout();
    expect(r.nodeId).toBe('db');
    expect(r.state.history[0]).toMatchObject({ choiceId: 'b', timedOut: true });
  });

  it('runs an exploration node: places the character, waits, and keeps its x after the exit', () => {
    const walk: Fragment = {
      id: 'walk-01',
      protagonist: 'livia',
      title: 't',
      start: 's1',
      nodes: [
        { id: 's1', type: 'stage', characters: [{ id: 'domicia', pose: 'idle', x: 900 }], next: 'e1' },
        {
          id: 'e1',
          type: 'exploration',
          character: 'livia',
          background: 'bg',
          width: 3840,
          start: 300,
          exits: [{ id: 'altar', from: 3000, to: 3840, next: 'd1' }],
        },
        { id: 'd1', type: 'dialogue', speaker: 'livia', flame: 1.5, text: 't', next: 'end' },
        { id: 'end', type: 'end' },
      ],
    };
    const r = new SceneRunner(walk, createInitialState());
    expect(r.view.kind).toBe('exploration');
    expect(r.stage.worldWidth).toBe(3840);
    expect(r.stage.background).toBe('bg');
    // The controlled character comes first (camera focus) and starts at `start`.
    expect(r.stage.characters.map((c) => [c.id, c.x])).toEqual([['livia', 300], ['domicia', 900]]);
    expect(() => r.exit('nope', 3100)).toThrow();
    r.exit('altar', 3100);
    expect(r.nodeId).toBe('d1');
    expect(r.stage.characters[0]).toMatchObject({ id: 'livia', x: 3100, flame: 1.5 });
  });

  it('applies partial stage updates, the stage mode and fate events', () => {
    const f: Fragment = {
      id: 'upd-01',
      protagonist: 'livia',
      title: 't',
      start: 's1',
      nodes: [
        {
          id: 's1',
          type: 'stage',
          mode: 'flashback',
          characters: [{ id: 'livia', pose: 'idle', x: 100 }, { id: 'domicia', pose: 'idle', x: 300 }],
          update: [
            { id: 'livia', x: 200, flame: 1 },
            { id: 'varrao', pose: 'idle', x: 500 },
            { id: 'domicia', remove: true },
          ],
          next: 'f1',
        },
        { id: 'f1', type: 'fate_event', thread: 'cut', effects: [{ kill: 'domicia' }], next: 's2' },
        { id: 's2', type: 'stage', update: [{ id: 'livia', pose: 'offering' }], next: 'end' },
        { id: 'end', type: 'end' },
      ],
    };
    const r = new SceneRunner(f, createInitialState());
    expect(r.view.kind).toBe('fate_event');
    expect(r.state.deaths).toEqual(['domicia']);
    expect(r.stage.mode).toBe('flashback');
    expect(r.stage.characters).toEqual([
      { id: 'livia', pose: 'idle', x: 200, flame: 1 },
      { id: 'varrao', pose: 'idle', x: 500 },
    ]);
    r.advance();
    expect(r.isEnded).toBe(true);
    // Mode is kept until a stage node changes it.
    expect(r.stage.mode).toBe('flashback');
    expect(r.stage.characters[0]?.pose).toBe('offering');
  });

  it('rejects an update for a character that is not on stage and has no pose/x', () => {
    const f: Fragment = {
      id: 'upd-02',
      protagonist: 'livia',
      title: 't',
      start: 's1',
      nodes: [
        { id: 's1', type: 'stage', update: [{ id: 'ghost', x: 10 }], next: 'end' },
        { id: 'end', type: 'end' },
      ],
    };
    expect(() => new SceneRunner(f, createInitialState())).toThrow(/ghost/);
  });

  it('handles minigames, the gift as a free action, hotspots and being caught', () => {
    const f: Fragment = {
      id: 'play-01',
      protagonist: 'livia',
      title: 't',
      start: 'd1',
      nodes: [
        { id: 'd1', type: 'dialogue', text: 't', gift: 'm1', next: 'e1' },
        {
          id: 'm1',
          type: 'minigame',
          game: 'reveal',
          effects: [{ giftUse: 'livia' }],
          outcomes: [
            { id: 'all', effects: [{ flag: 'outcome_all', value: true }], next: 'e1' },
            { id: 'none', next: 'e1' },
          ],
        },
        {
          id: 'e1',
          type: 'exploration',
          character: 'livia',
          width: 1920,
          start: 100,
          hotspots: [
            { id: 'lamp', x: 300, label: 't', lines: ['a', 'b'], effects: [{ flag: 'lamp_seen', add: 1 }] },
            { id: 'hidden', x: 400, label: 't', lines: ['c'], conditions: [{ flag: 'never' }] },
          ],
          watchers: [{ id: 'domicia', range: 300 }],
          caught: { effects: [{ flag: 'caught', value: true }], next: 'end' },
          exits: [
            { id: 'open', from: 1500, to: 1920, next: 'end' },
            { id: 'secret', from: 0, to: 50, next: 'end', conditions: [{ flag: 'never' }] },
          ],
        },
        { id: 'end', type: 'end' },
      ],
    };
    const r = new SceneRunner(f, createInitialState());
    r.useGift();
    expect(r.view.kind).toBe('minigame');
    expect(r.state.giftUses.livia).toBe(1);
    r.finishMinigame('all', [{ flag: 'earned', value: true }]);
    expect(r.state.flags).toMatchObject({ earned: true, outcome_all: true });
    expect(r.state.history.map((h) => h.choiceId)).toEqual(['gift', 'all']);

    const view = r.view;
    if (view.kind !== 'exploration') throw new Error('expected exploration');
    expect(view.hotspots.map((h) => h.id)).toEqual(['lamp']);
    expect(view.exits.map((e) => e.id)).toEqual(['open']);
    expect(r.inspect('lamp')).toEqual(['a', 'b']);
    r.inspect('lamp');
    // Effects apply only the first time; the examined flag is set.
    expect(r.state.flags.lamp_seen).toBe(1);
    expect(r.state.flags['examined.play-01.lamp']).toBe(true);
    expect(() => r.exit('secret', 10)).toThrow();
    r.caught(700);
    expect(r.state.flags.caught).toBe(true);
    expect(r.isEnded).toBe(true);
    // An exploration with a watcher is a decision: being caught goes into the history (for the thread map).
    expect(r.state.history.at(-1)).toMatchObject({ nodeId: 'e1', choiceId: 'caught', available: ['open', 'caught'] });
  });

  it('records leaving a gift window without the gift as "pass"', () => {
    const f: Fragment = {
      id: 'pass-01',
      protagonist: 'livia',
      title: 't',
      start: 'd1',
      nodes: [
        { id: 'd1', type: 'dialogue', text: 't', gift: 'g', next: 'd2' },
        { id: 'd2', type: 'dialogue', text: 't', gift: 'g', next: 'd3' },
        { id: 'd3', type: 'dialogue', text: 't', next: 'end' },
        { id: 'g', type: 'dialogue', text: 't', next: 'end' },
        { id: 'end', type: 'end' },
      ],
    };
    const r = new SceneRunner(f, createInitialState());
    r.advance();
    expect(r.state.history).toEqual([]);
    r.advance();
    expect(r.state.history.map((h) => `${h.nodeId}:${h.choiceId}`)).toEqual(['d2:pass']);
  });

  it('resumes without re-applying the current node effects', () => {
    const state = applyEffects(createInitialState(), [{ flag: 'seen_d1', value: false }]);
    const r = new SceneRunner(fragment, state, { resume: { nodeId: 'd1', stage: { background: null, characters: [] } } });
    expect(r.state.flags.seen_d1).toBe(false);
    r.advance();
    expect(r.view.kind).toBe('choice');
  });
});
