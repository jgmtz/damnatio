// Layered music and sound effects (docs/audio/pedidos-de-musica.md), with the Web Audio API.
// - A track is a set of stems of the same length, started together and looped; each stem fades in or
//   out by itself as the signals change (layerGain in engine/audio.ts): the beast adds drums, the
//   seal warms or chills the lyre, Théron's melody loses notes as he fades.
// - Changing track crossfades; `null` fades to silence.
// - duck(): the music steps back during the pause of weight before a marked choice.
// - muffle(): the room goes dull for a moment when Théron fades (a low-pass sweep).
// - Missing files are silent, so the game runs the same before the music arrives.
// Browsers only allow sound after a gesture: the context is resumed on the first key or click.

import { layerGain, QUIET_SIGNALS, type AudioSignals } from '../engine/audio';
import type { AudioCue, AudioManifest, MusicTrack } from '../engine/types';

/** Seconds of a crossfade between tracks, of a stem following its signal, and of a duck. */
const CROSSFADE = 2.5;
const LAYER_FADE = 1.2;
const DUCK_FADE = 0.4;
/** Music volume while ducked (fraction of the normal level). */
const DUCKED = 0.3;

interface PlayingTrack {
  id: string;
  out: GainNode;
  stems: { gain: GainNode; source: AudioBufferSourceNode; layer: AudioManifest['music'][string]['layers'][number] }[];
}

export class AudioPlayer {
  private ctx: AudioContext | null = null;
  private music: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private effects: GainNode | null = null;
  private readonly buffers = new Map<string, Promise<AudioBuffer | null>>();
  private current: PlayingTrack | null = null;
  /** The track asked for most recently (a slow load must not start an older one). */
  private wanted: string | null = null;
  /** The pause menu's track, playing over the silenced scene track. */
  private paused: PlayingTrack | null = null;
  private pauseWanted: string | null = null;
  private signals: AudioSignals = { ...QUIET_SIGNALS };
  private volumes = { music: 0.8, sfx: 0.8 };

  constructor(
    private readonly manifest: AudioManifest,
    private readonly url: (file: string) => string | null,
  ) {
    const unlock = () => {
      this.context()?.resume().catch(() => undefined);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  /** The audio graph, made on first use: music → duck → filter → out, effects → out. */
  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof AudioContext === 'undefined') return null;
    const ctx = new AudioContext();
    this.music = ctx.createGain();
    this.duckGain = ctx.createGain();
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 20000;
    this.effects = ctx.createGain();
    this.music.connect(this.duckGain).connect(this.filter).connect(ctx.destination);
    this.effects.connect(ctx.destination);
    this.music.gain.value = this.volumes.music;
    this.effects.gain.value = this.volumes.sfx;
    this.ctx = ctx;
    return ctx;
  }

  setVolumes(music: number, sfx: number): void {
    this.volumes = { music, sfx };
    const ctx = this.ctx;
    if (!ctx) return;
    this.music!.gain.setTargetAtTime(music, ctx.currentTime, 0.1);
    this.effects!.gain.setTargetAtTime(sfx, ctx.currentTime, 0.1);
  }

  /** A node's cue (SceneRunner.onEnterNode). */
  play(cue: AudioCue | undefined): void {
    if (!cue) return;
    if (cue.music !== undefined) this.playMusic(cue.music);
    if (cue.sfx) this.sfx(cue.sfx);
  }

  playMusic(id: string | null): void {
    this.setPauseMusic(null);
    if (id === this.wanted) return;
    this.wanted = id;
    void this.start(id);
  }

  /**
   * The pause menu's own track over the scene's: the scene's music keeps running silently underneath,
   * so it comes back from where it was when the menu closes (`null`).
   */
  setPauseMusic(id: string | null): void {
    const ctx = this.ctx;
    if (id === this.pauseWanted) return;
    this.pauseWanted = id;
    if (ctx && this.current) {
      this.current.out.gain.cancelScheduledValues(ctx.currentTime);
      this.current.out.gain.setTargetAtTime(id ? 0 : 1, ctx.currentTime, CROSSFADE / 4);
    }
    this.fadeOut(this.paused);
    this.paused = null;
    if (id) void this.startPause(id);
  }

  private async startPause(id: string): Promise<void> {
    const ctx = this.context();
    const track = this.manifest.music[id];
    if (!ctx || !track) return;
    const loaded = await Promise.all(track.layers.map((l) => this.load(l.file)));
    if (this.pauseWanted !== id) return;
    this.paused = this.launch(ctx, id, track, loaded);
  }

  private async start(id: string | null): Promise<void> {
    const ctx = this.context();
    if (!ctx) return;
    const track = id ? this.manifest.music[id] : undefined;
    const loaded = track ? await Promise.all(track.layers.map((l) => this.load(l.file))) : [];
    if (this.wanted !== id) return;
    this.fadeOut(this.current);
    this.current = null;
    if (!track) return;
    this.current = this.launch(ctx, id!, track, loaded);
    // Started while the pause menu is open: wait silent until it closes.
    if (this.current && this.pauseWanted) this.current.out.gain.cancelScheduledValues(ctx.currentTime);
  }

  /** Starts every stem of a track together, fading in (null when none of its files exists). */
  private launch(ctx: AudioContext, id: string, track: MusicTrack, loaded: (AudioBuffer | null)[]): PlayingTrack | null {
    if (loaded.every((b) => !b)) return null;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(this.music!);
    // All stems start on the same instant, so they stay in time with each other.
    const at = ctx.currentTime + 0.05;
    const stems: PlayingTrack['stems'] = [];
    track.layers.forEach((layer, i) => {
      const buffer = loaded[i];
      if (!buffer) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = track.loop !== false;
      const gain = ctx.createGain();
      gain.gain.value = layerGain(layer, this.signals);
      source.connect(gain).connect(out);
      source.start(at);
      stems.push({ gain, source, layer });
    });
    out.gain.setTargetAtTime(1, at, CROSSFADE / 3);
    return { id, out, stems };
  }

  private fadeOut(track: PlayingTrack | null): void {
    const ctx = this.ctx;
    if (!track || !ctx) return;
    track.out.gain.cancelScheduledValues(ctx.currentTime);
    track.out.gain.setTargetAtTime(0, ctx.currentTime, CROSSFADE / 3);
    const end = ctx.currentTime + CROSSFADE * 1.5;
    for (const stem of track.stems) stem.source.stop(end);
  }

  /** The price of the gift moved: each stem fades toward its new volume. */
  setSignals(signals: AudioSignals): void {
    this.signals = signals;
    const ctx = this.ctx;
    if (!ctx || !this.current) return;
    for (const stem of this.current.stems) {
      stem.gain.gain.setTargetAtTime(layerGain(stem.layer, signals), ctx.currentTime, LAYER_FADE / 3);
    }
  }

  duck(on: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    this.duckGain!.gain.setTargetAtTime(on ? DUCKED : 1, ctx.currentTime, DUCK_FADE / 3);
  }

  /** The room goes dull for a moment (Théron fading out of the scene). */
  muffle(seconds = 1.4): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const f = this.filter!.frequency;
    f.cancelScheduledValues(ctx.currentTime);
    f.setTargetAtTime(500, ctx.currentTime, 0.08);
    f.setTargetAtTime(20000, ctx.currentTime + seconds, 0.4);
  }

  sfx(id: string): void {
    const file = this.manifest.sfx[id];
    const ctx = this.context();
    if (!file || !ctx) return;
    void this.load(file).then((buffer) => {
      if (!buffer) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.effects!);
      source.start();
    });
  }

  /** Decodes a file once (null when it doesn't exist yet or can't be decoded). */
  private load(file: string): Promise<AudioBuffer | null> {
    let pending = this.buffers.get(file);
    if (!pending) {
      const url = this.url(file);
      const ctx = this.context();
      pending = url && ctx
        ? fetch(url)
            .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.statusText))))
            .then((data) => ctx.decodeAudioData(data))
            .catch(() => null)
        : Promise.resolve(null);
      this.buffers.set(file, pending);
    }
    return pending;
  }
}
