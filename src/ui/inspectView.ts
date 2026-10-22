// First-person view of an examined object (Hotspot.view): the picture fills the stage, coming
// slowly closer, while the lines are read in the dialogue box. Drawn in code on top: a flame (lamps),
// warm glows (the closed eye, a distant torch, morning light), a shade that spares part of the
// picture (a hand), and falling dust. The player sees what the character sees.

import type { Hotspot } from '../engine/types';
import { drawFlame } from '../systems/flame';
import { drawFrame, SIGN } from '../systems/fxSprites';
import { drawSpark } from '../systems/threadFx';
import { el } from './dom';
import type { Stage } from './stage';

const W = 1920;
const H = 1080;

/** Stable pseudo-random 0..1 (dust motes). */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export class InspectView {
  private readonly root: HTMLDivElement;
  /** Picture and effects move together (the slow approach must not separate a flame from its lamp). */
  private readonly frame: HTMLDivElement;
  private readonly img: HTMLImageElement;
  /** Ground behind a cut-out object (Hotspot.viewGround). */
  private readonly ground: HTMLImageElement;
  /** The light of the scene laid over the picture (Hotspot.viewMood): night blue, lamp warmth, dark. */
  private readonly mood: HTMLDivElement;
  /** Darkening that spares part of the picture (Hotspot.viewShade), as a CSS gradient. */
  private readonly shade: HTMLDivElement;
  /** Light only (glows, flame, dust), blended with "screen" so it really lights the picture. */
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private hotspot: Hotspot | null = null;
  private time = 0;

  constructor(stage: Stage, parent: HTMLElement) {
    this.img = el('img', { class: 'inspect-view-image', attrs: { alt: '', draggable: 'false' } });
    this.ground = el('img', { class: 'inspect-view-ground hidden', attrs: { alt: '', draggable: 'false' } });
    this.mood = el('div', { class: 'inspect-view-mood' });
    this.canvas = el('canvas', { class: 'inspect-view-fx', attrs: { width: String(W), height: String(H) } });
    this.ctx = this.canvas.getContext('2d');
    this.shade = el('div', { class: 'inspect-view-shade' });
    this.frame = el('div', { class: 'inspect-view-frame' }, [this.ground, this.img, this.mood, this.shade, this.canvas]);
    this.root = el('div', { class: 'inspect-view hidden' }, [this.frame]);
    // Put it under the dialogue box (the first child of the UI layer is drawn first).
    parent.prepend(this.root);
    stage.onUpdate((dt) => this.update(dt));
  }

  get isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  /** `mood`: the light it is seen in (see Hotspot.viewMood); `groundUrl`: a ground behind a cut-out. */
  show(hotspot: Hotspot, url: string, mood: NonNullable<Hotspot['viewMood']> = 'day', groundUrl: string | null = null): void {
    this.hotspot = hotspot;
    this.time = 0;
    this.img.src = url;
    this.ground.classList.toggle('hidden', !groundUrl);
    if (groundUrl) this.ground.src = groundUrl;
    this.root.className = `inspect-view mood-${mood}${groundUrl ? ' has-ground' : ''}`;
    const shade = hotspot.viewShade;
    if (shade) {
      const k = shade.keep;
      this.shade.style.background = k
        ? `radial-gradient(circle at ${k.x * 100}% ${k.y * 100}%, rgba(6, 3, 1, 0) ${k.r * 45}vw, rgba(6, 3, 1, ${shade.amount}) ${k.r * 100}vw)`
        : `rgba(6, 3, 1, ${shade.amount})`;
    } else {
      this.shade.style.background = 'none';
    }
    // Restart the slow approach.
    this.frame.classList.remove('approach');
    void this.frame.offsetWidth;
    this.frame.classList.add('approach');
  }

  hide(): void {
    if (!this.isOpen) return;
    this.hotspot = null;
    this.root.classList.add('leaving');
    window.setTimeout(() => {
      if (!this.hotspot) this.root.classList.add('hidden');
    }, 350);
  }

  private update(dt: number): void {
    const c = this.ctx;
    const h = this.hotspot;
    if (!c || !h) return;
    this.time += dt;
    const t = this.time;
    c.clearRect(0, 0, W, H);

    // Warm glows, breathing.
    for (const [i, glow] of (h.viewGlow ?? []).entries()) {
      const { x, y, r = 0.08 } = glow;
      const pulse = 0.55 + 0.45 * Math.sin(t * 2.2 + i * 1.7);
      const gx = x * W;
      const gy = y * H;
      const radius = r * W * (0.9 + 0.2 * pulse);
      // The painted star of light (fx_sinais), breathing; a second, wider one turns slowly.
      drawFrame(c, 'fx.signs', SIGN.star, gx, gy, (radius * 1.6) / 220, { alpha: 0.9 * pulse, composite: 'lighter', rotation: t * 0.15 });
      drawFrame(c, 'fx.signs', SIGN.star, gx, gy, (radius * 2.4) / 220, { alpha: 0.35 * pulse, composite: 'lighter', rotation: -t * 0.1 + 0.4 });
    }

    // Dust falling from a point (knuckles on stone).
    if (h.viewDust) {
      const ox = h.viewDust.x * W;
      const oy = h.viewDust.y * H;
      c.save();
      for (let i = 0; i < 26; i++) {
        const life = 1.2 + hash(i) * 1.4;
        const phase = ((t + hash(i * 3.7) * life) / life) % 1;
        const x = ox + (hash(i * 5.1) - 0.5) * 120 + Math.sin(phase * 6 + i) * 8;
        const y = oy + phase * phase * 260;
        drawSpark(c, 3 + (i % 3), x, y, 5 + hash(i * 9.3) * 6, Math.sin(phase * Math.PI) * 0.7);
      }
      c.restore();
    }

    // The flame on a lamp.
    if (h.viewFlame) {
      const { x, y, size = 1, lean = 0 } = h.viewFlame;
      c.save();
      c.translate(x * W, y * H);
      c.rotate(lean);
      drawFlame(c, 0, 0, 150 * size, 1.1, t, 3, 'small');
      c.restore();
    }
  }
}
