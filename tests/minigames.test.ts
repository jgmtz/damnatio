import { describe, expect, it } from 'vitest';
import { detectionRate } from '../src/systems/exploration';
import { stepDescent, type DescentState } from '../src/systems/minigames/descent';
import { embersOutcome, grabEmber, makeEmbers } from '../src/systems/minigames/embers';
import { pourFlow, pourOutcome, stepPour, type PourState } from '../src/systems/minigames/pour';
import { revealOutcome, stepReveal } from '../src/systems/minigames/reveal';
import {
  beatTimes,
  expireBeats,
  judgePress,
  pressTiming,
  rhythmOutcome,
  type BeatResult,
} from '../src/systems/minigames/rhythm';
import { Tutorial } from '../src/systems/minigames/tutorial';

describe('pour', () => {
  const run = (tilt: number, seconds: number, difficulty = 1): PourState => {
    let s: PourState = { flame: 0.8, tilt: 0, calm: 0, elapsed: 0 };
    for (let t = 0; t < seconds; t += 1 / 60) s = stepPour(s, tilt, 1 / 60, difficulty, false);
    return s;
  };

  it('needs some tilt before oil flows', () => {
    expect(pourFlow(0)).toBe(0);
    expect(pourFlow(1)).toBe(1);
  });

  it('without oil the flame shrinks; with too much it chokes', () => {
    expect(run(0, 8).flame).toBeLessThan(0.4);
    expect(run(1, 8, 0).flame).toBeGreaterThan(1.4);
  });

  it('a moderate, steady pour keeps the flame calm most of the time', () => {
    const s = run(0.6, 8, 0.8);
    expect(pourOutcome(s.calm, 8)).not.toBe('clumsy');
  });
});

describe('reveal', () => {
  it('reveals a mark only after the light stays on it', () => {
    const targets = [{ x: 100, y: 100 }];
    const progress = [0];
    expect(stepReveal(targets, progress, 100, 100, 0.5)).toEqual([]);
    expect(stepReveal(targets, progress, 100, 100, 0.6)).toEqual([0]);
    expect(progress[0]).toBe(1);
  });

  it('progress fades when the light moves away', () => {
    const progress = [0];
    stepReveal([{ x: 0, y: 0 }], progress, 0, 0, 0.5);
    stepReveal([{ x: 0, y: 0 }], progress, 900, 900, 0.5);
    expect(progress[0]).toBeLessThan(0.5);
  });

  it('outcome depends on how much was found', () => {
    expect(revealOutcome(0, 2)).toBe('none');
    expect(revealOutcome(1, 2)).toBe('some');
    expect(revealOutcome(2, 2)).toBe('all');
  });
});

describe('descent', () => {
  const start: DescentState = { phase: 'stairs', step: 0, shown: 0, cooldown: 0, waited: 0, outcome: null, ending: 0 };
  const none = { down: false, up: false, downPress: false, upPress: false };
  const down = { down: true, up: false, downPress: true, upPress: false };
  const up = { down: false, up: true, downPress: false, upPress: true };

  it('going back at the top means retreat', () => {
    expect(stepDescent(start, 3, up, 0.1, false).outcome).toBe('retreat');
  });

  it('reaching the bottom starts the encounter; holding the key does not raise the cup', () => {
    let s = start;
    for (let i = 0; i < 3; i++) s = stepDescent({ ...s, cooldown: 0 }, 3, down, 0.1, false);
    expect(s.phase).toBe('encounter');
    s = stepDescent({ ...s, waited: 1 }, 3, { ...down, downPress: false }, 0.1, false);
    expect(s.outcome).toBeNull();
    s = stepDescent(s, 3, down, 0.1, false);
    expect(s.outcome).toBe('raise');
  });

  it('waiting at the bottom lets him come closer', () => {
    let s: DescentState = { ...start, phase: 'encounter' };
    for (let t = 0; t < 7; t += 0.1) s = stepDescent(s, 3, none, 0.1, false);
    expect(s.outcome).toBe('still');
  });
});

describe('embers', () => {
  it('grabs the nearest live ember within reach', () => {
    const embers = makeEmbers(4, 1, false);
    const first = embers[0]!;
    expect(grabEmber(embers, first.x + 10, first.y)).toBe(true);
    expect(first.taken).toBe(true);
    expect(grabEmber(embers, -500, -500)).toBe(false);
  });

  it('outcome by how many were saved', () => {
    expect(embersOutcome(6, 8)).toBe('many');
    expect(embersOutcome(3, 8)).toBe('some');
    expect(embersOutcome(1, 8)).toBe('few');
  });
});

describe('rhythm', () => {
  it('judges presses inside the window and expires the rest', () => {
    const times = beatTimes(4, 1);
    const results: BeatResult[] = times.map(() => 'pending');
    expect(judgePress(times, results, times[0]! + 0.1, 0.18)).toBe(true);
    expect(judgePress(times, results, times[1]! + 0.5, 0.18)).toBe(false);
    expireBeats(times, results, 100, 0.18);
    expect(results).toEqual(['hit', 'miss', 'miss', 'miss']);
    expect(rhythmOutcome(results)).toBe('broken');
  });
});

describe('tutorial', () => {
  const labels = { step: () => '', skip: '' };

  it('advances only when the step is done, after a short pause', () => {
    let tilted = false;
    const tut = new Tutorial([{ text: 'a', done: () => tilted }, { text: 'b', done: () => true }], labels);
    tut.update(1, false);
    expect(tut.stepIndex).toBe(0);
    tilted = true;
    tut.update(0.1, false); // done: starts the pause
    tut.update(1, false); // pause over: next step
    expect(tut.stepIndex).toBe(1);
  });

  it('can be skipped entirely', () => {
    const tut = new Tutorial([{ text: 'a', done: () => false }], labels);
    tut.update(0.1, true);
    expect(tut.active).toBe(false);
  });
});

describe('rhythm feedback', () => {
  it('tells early from late', () => {
    const times = [2, 3];
    const results: BeatResult[] = ['pending', 'pending'];
    expect(pressTiming(times, results, 1.5)).toBe('early');
    expect(pressTiming(times, results, 2.4)).toBe('late');
  });
});

describe('stealth', () => {
  it('awake watchers see only in front, within range; sneaking is slower to notice', () => {
    const guard = { range: 500 };
    expect(detectionRate(guard, 1000, 'right', 1200, true, false)).toBeGreaterThan(0);
    expect(detectionRate(guard, 1000, 'left', 1200, true, false)).toBe(0);
    expect(detectionRate(guard, 1000, 'right', 1700, true, false)).toBe(0);
    expect(detectionRate(guard, 1000, 'right', 1200, true, true)).toBeLessThan(
      detectionRate(guard, 1000, 'right', 1200, true, false),
    );
  });

  it('sleepers only notice someone walking normally nearby', () => {
    const sleeper = { range: 200, asleep: true };
    expect(detectionRate(sleeper, 1000, 'left', 1100, true, false)).toBeGreaterThan(0);
    expect(detectionRate(sleeper, 1000, 'left', 1100, true, true)).toBe(0);
    expect(detectionRate(sleeper, 1000, 'left', 1100, false, false)).toBe(0);
  });
});
