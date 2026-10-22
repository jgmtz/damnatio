import { describe, expect, it } from 'vitest';
import { layerGain, QUIET_SIGNALS } from '../src/engine/audio';
import { loadBundle } from './helpers';

describe('layered music', () => {
  it('turns the beast layers on step by step', () => {
    const beast2 = { file: 'x.ogg', when: { signal: 'fera' as const, min: 3 } };
    expect(layerGain(beast2, { ...QUIET_SIGNALS, fera: 2 })).toBe(0);
    expect(layerGain(beast2, { ...QUIET_SIGNALS, fera: 3 })).toBe(1);
  });

  it('plays exactly one of Théron\'s melodies at any presence', () => {
    const track = loadBundle().audio.music.port_day!;
    for (let presence = 0.35; presence <= 1; presence += 0.01) {
      const melodies = track.layers.filter((l) => l.when?.signal === 'presence' && layerGain(l, { ...QUIET_SIGNALS, presence }) > 0);
      expect(melodies.length, `presence ${presence.toFixed(2)}`).toBe(1);
    }
  });

  it('keeps a stem without a condition always on', () => {
    expect(layerGain({ file: 'x.ogg', gain: 0.6 }, { fera: 5, selo: -5, presence: 0.35 })).toBe(0.6);
  });
});
