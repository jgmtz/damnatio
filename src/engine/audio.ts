// The rules of the layered music (docs/audio/pedidos-de-musica.md), without the browser's audio: which
// stems of a track sound, given the price of the gift of whoever is being played. The player that
// actually mixes the sound is src/systems/audioPlayer.ts.

import type { AudioSignal, MusicLayer } from './types';

export type AudioSignals = Record<AudioSignal, number>;

/** Neutral signals: no beast, the seal at rest, Théron fully present. */
export const QUIET_SIGNALS: AudioSignals = { fera: 0, selo: 0, presence: 1 };

/** Volume a stem should have now (0 = silent). A stem without `when` always plays. */
export function layerGain(layer: MusicLayer, signals: AudioSignals): number {
  const gain = layer.gain ?? 1;
  const when = layer.when;
  if (!when) return gain;
  const value = signals[when.signal];
  if (when.min !== undefined && value < when.min) return 0;
  if (when.max !== undefined && value > when.max) return 0;
  if (when.below !== undefined && value >= when.below) return 0;
  return gain;
}
