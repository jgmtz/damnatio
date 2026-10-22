// Atmosphere on top of the scene (GDD 8.1: engraving, strong shadows, high contrast):
// - darkness away from light, with pools of warm light around lamps and flames; the darkness is
//   engraved: part flat shadow, part hatching that thickens away from the light (hatch.ts);
// - dust motes drifting in the light;
// - dark foreground columns sliding faster than the scene (parallax depth);
// - soft shadows under the figures (drawn on a canvas below them).
// Light sources come from the background's data (content/backgrounds) plus every figure carrying a flame.

import type { BackgroundInfo, StageMode } from '../engine/types';
import { engraveDarkness, hatchPattern } from '../systems/hatch';
import { drawSpark } from '../systems/threadFx';
import { GROUND_Y } from './figure';

const W = 1920;
const H = 1080;
const DEFAULT_AMBIENT = 0.35;
const NIGHT_EXTRA = 0.3;
/** The labyrinth in the dark: almost nothing shows except what is lit. */
const DARK_AMBIENT = 0.9;
const FOREGROUND_PARALLAX = 1.35;
const MOTES_PER_LIGHT = 12;
/** Foreground objects stand on a floor below the screen's bottom edge (closer to the camera). */
const FOREGROUND_GROUND = 1150;
/** Room around a blurred piece so the blur isn't cut. */
const BLUR_PAD = 8;

export interface ScreenLight {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export class Atmosphere {
  private readonly dark: HTMLCanvasElement;
  private readonly darkCtx: CanvasRenderingContext2D;

  constructor() {
    this.dark = document.createElement('canvas');
    this.dark.width = W;
    this.dark.height = H;
    this.darkCtx = this.dark.getContext('2d')!;
  }

  /** Lights in screen space: the background's (scrolling with the camera) plus the figures' flames. */
  static lights(
    info: BackgroundInfo | undefined,
    cameraX: number,
    figureLights: { x: number; y: number; intensity: number; size: number }[],
    time: number,
  ): ScreenLight[] {
    const lights: ScreenLight[] = (info?.lights ?? []).map((l, i) => ({
      x: l.x - cameraX,
      y: l.y,
      radius: l.radius * (1 + Math.sin(time * 7 + i * 1.7) * 0.025),
      intensity: l.intensity ?? 1,
    }));
    for (const f of figureLights) {
      lights.push({
        x: f.x,
        y: f.y,
        radius: (180 + 260 * f.size) * Math.min(1.6, 0.6 + f.intensity * 0.5) * (1 + Math.sin(time * 9 + f.x) * 0.03),
        intensity: Math.min(1, f.intensity),
      });
    }
    return lights;
  }

  /** Darkness, light pools, warm glow and dust. Drawn over the figures. */
  drawLight(
    ctx: CanvasRenderingContext2D,
    info: BackgroundInfo | undefined,
    mode: StageMode,
    lights: ScreenLight[],
    time: number,
    cameraX = 0,
  ): void {
    if (mode === 'flashback') return; // memories are flat, like a painted plate
    const ambient =
      mode === 'dark' ? DARK_AMBIENT : Math.min(0.9, (info?.ambient ?? DEFAULT_AMBIENT) + (mode === 'night' ? NIGHT_EXTRA : 0));
    const d = this.darkCtx;
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, W, H);
    d.fillStyle = `rgba(6, 3, 1, ${ambient})`;
    d.fillRect(0, 0, W, H);
    // Carve light pools out of the darkness.
    d.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      const g = d.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.radius);
      g.addColorStop(0, `rgba(0,0,0,${0.95 * l.intensity})`);
      g.addColorStop(0.5, `rgba(0,0,0,${0.55 * l.intensity})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g;
      d.fillRect(l.x - l.radius, l.y - l.radius, l.radius * 2, l.radius * 2);
    }
    // Engraved shadow: the spaces between hatch strokes are lightened inside the darkness layer,
    // so the dark reads as engraving lines (the strokes stay put as the camera moves). One layer,
    // one copy per frame: extra full-screen copies made the game crawl.
    if (mode !== 'dark') engraveDarkness(d, 'medium', 0.45, cameraX);
    ctx.drawImage(this.dark, 0, 0);

    // (The light is the absence of hatching; no smooth glow on top.)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Dust motes drifting up through each light.
    ctx.fillStyle = 'rgba(255, 220, 160, 1)';
    lights.forEach((l, li) => {
      for (let i = 0; i < MOTES_PER_LIGHT; i++) {
        const seed = li * 31 + i * 7.3;
        const p = (time * (0.04 + (i % 5) * 0.012) + seed * 0.137) % 1;
        const angle = seed * 2.4;
        const dist = l.radius * (0.15 + ((i * 37) % 70) / 100);
        const x = l.x + Math.cos(angle) * dist + Math.sin(time * 0.6 + seed) * 18;
        const y = l.y + Math.sin(angle) * dist * 0.6 - p * 140;
        const fade = Math.sin(p * Math.PI) * l.intensity;
        // Painted motes (fio_centelhas), or a dot until they load.
        if (drawSpark(ctx, 3 + (i % 3), x, y, 5 + (i % 3) * 2, 0.45 * fade)) continue;
        ctx.globalAlpha = 0.35 * fade;
        ctx.beginPath();
        ctx.arc(x, y, 1.6 + (i % 3) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  private readonly softCache = new Map<string, HTMLCanvasElement>();

  /** A foreground piece at its drawn size, darkened and out of focus (made once, then reused). */
  private softened(img: HTMLImageElement, scale: number): HTMLCanvasElement {
    const key = `${img.src}|${scale}`;
    const hit = this.softCache.get(key);
    if (hit) return hit;
    const w = Math.ceil(img.naturalWidth * scale);
    const h = Math.ceil(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w + BLUR_PAD * 2;
    canvas.height = h + BLUR_PAD * 2;
    const c = canvas.getContext('2d')!;
    c.filter = 'brightness(0.16) blur(3px)';
    c.drawImage(img, BLUR_PAD, BLUR_PAD, w, h);
    this.softCache.set(key, canvas);
    return canvas;
  }

  /** Dark columns in the foreground, faster than the scene: the frieze gains depth. */
  drawForeground(
    ctx: CanvasRenderingContext2D,
    info: BackgroundInfo | undefined,
    cameraX: number,
    image: (artId: string) => HTMLImageElement | null,
  ): void {
    if (!info?.foreground) return;
    ctx.save();
    for (const col of info.foreground) {
      const x = col.x - cameraX * FOREGROUND_PARALLAX;
      const img = col.art ? image(col.art) : null;
      if (img && col.ground) {
        // The real column, very close to the camera: bigger, darkened, out of focus, cut by the bottom.
        const scale = col.scale ?? 1;
        const w = img.naturalWidth * scale;
        if (x + w < -50 || x - w > W + 50) continue;
        // Darkened and blurred once, then reused (a canvas filter every frame is slow).
        const soft = this.softened(img, scale);
        ctx.drawImage(soft, x - col.ground.x * scale - BLUR_PAD, FOREGROUND_GROUND - col.ground.y * scale - BLUR_PAD);
        continue;
      }
      ctx.filter = 'blur(2px)';
      const width = col.width ?? 150;
      if (x + width < -50 || x - width > W + 50) continue;
      ctx.fillStyle = '#060403';
      ctx.fillRect(x - width / 2, 0, width, H);
      // A faint terracotta edge, like a contour catching the light.
      ctx.fillStyle = 'rgba(200, 116, 58, 0.18)';
      ctx.fillRect(x + width / 2 - 4, 0, 4, H);
      // Capital and base.
      ctx.fillStyle = '#060403';
      ctx.fillRect(x - width * 0.75, 40, width * 1.5, 60);
      ctx.fillRect(x - width * 0.7, H - 150, width * 1.4, 60);
    }
    ctx.restore();
  }

  /** Soft shadows under figures (drawn below them). */
  static drawShadows(ctx: CanvasRenderingContext2D, figures: { screenX: number; shadowWidth: number }[]): void {
    ctx.clearRect(0, 0, W, H);
    for (const f of figures) {
      if (f.shadowWidth <= 0) continue;
      const g = ctx.createRadialGradient(f.screenX, GROUND_Y, 0, f.screenX, GROUND_Y, f.shadowWidth);
      g.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.save();
      ctx.translate(f.screenX, GROUND_Y);
      ctx.scale(1, 0.16);
      ctx.translate(-f.screenX, -GROUND_Y);
      // The shadow engraved: medium hatching, and dense hatching closer to the feet.
      const medium = hatchPattern(ctx, 'medium');
      const dense = hatchPattern(ctx, 'dense');
      if (medium && dense) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = medium;
        ctx.beginPath();
        ctx.arc(f.screenX, GROUND_Y, f.shadowWidth, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = dense;
        ctx.beginPath();
        ctx.arc(f.screenX, GROUND_Y, f.shadowWidth * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.screenX, GROUND_Y, f.shadowWidth, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
