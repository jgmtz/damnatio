// The sacred flame over Lívia's cup, the altar, the lamps and torches. It is painted (pedidos 4.1–4.3:
// three hand-drawn flames, 6–9 frames each, flipped like hand-drawn animation); the code only places
// it and makes it react to the story: grow, shrink, lean, die. A faint bloom of the same painted
// shape and a few painted sparks (fio_centelhas) go with it.
// Until the paintings load, the old code flame (bezier tongues) is drawn instead.

import { loopFrame, sheet, sheetLoaded, drawFrame } from './fxSprites';
import { drawSpark } from './threadFx';

/** Which painted flame for a base width (px): lamps and torches, the cup, the altar fire. */
export type FlameKind = 'small' | 'cup' | 'altar';

function flameSheet(size: number, kind?: FlameKind): string {
  if (kind) return `fx.flame.${kind}`;
  if (size < 34) return 'fx.flame.small';
  if (size < 120) return 'fx.flame.cup';
  return 'fx.flame.altar';
}

/** Frames per second of the painted flames (hand-drawn animation, not smooth video). */
const FLAME_FPS = 9;

function drawPaintedFlame(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, intensity: number, time: number, seed: number, kind?: FlameKind): boolean {
  const id = flameSheet(size, kind);
  const s = sheet(id);
  if (!s || !sheetLoaded(id)) return false;
  // The painted flame's body is about the cell's width: match it to the base width asked for.
  const scale = (size * 1.15) / (s.w - 12);
  // Intensity makes it taller (and a little wider); below ~0.35 it fades as it dies.
  const tall = Math.min(1.8, 0.55 + 0.45 * intensity);
  const wide = Math.min(1.3, 0.75 + 0.25 * intensity);
  const fade = Math.min(1, intensity / 0.35);
  // Faster and more nervous when it burns hard.
  const fps = FLAME_FPS * (0.8 + 0.25 * Math.min(2, intensity));
  const frame = loopFrame(id, time, fps, seed);
  const flip = Math.floor(seed * 3.7) % 2 === 1;
  // Bloom: the same shape, bigger and added as light (the painting's own glow, not a gradient).
  drawFrame(ctx, id, frame, x, y + 2, scale * wide * 1.35, { stretchY: tall / wide * 1.05, alpha: 0.2 * fade * Math.min(1.4, intensity), composite: 'lighter', flipX: flip });
  drawFrame(ctx, id, frame, x, y, scale * wide, { stretchY: tall / wide, alpha: fade, flipX: flip });
  // A few painted sparks rising and fading.
  const height = s.h * scale * tall;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const p = (time * 0.55 + i / 4 + seed * 0.13) % 1;
    const sx = x + Math.sin(i * 12.9 + time * 2) * size * 0.4;
    const sy = y - height * (0.55 + p * 0.9);
    drawSpark(ctx, 3 + (i % 3), sx, sy, Math.max(4, size * 0.12), (1 - p) * 0.8 * Math.min(intensity, 1) * fade);
  }
  ctx.restore();
  return true;
}

/** Smooth pseudo-noise from summed sines: cheap and deterministic. */
function wobble(t: number): number {
  return Math.sin(t) * 0.5 + Math.sin(t * 1.7 + 1.3) * 0.3 + Math.sin(t * 3.1 + 0.7) * 0.2;
}

const TONGUES = [
  { width: 1, height: 1, color: '#c8521f', speed: 2.1 },
  { width: 0.7, height: 0.78, color: '#ec9a34', speed: 2.9 },
  { width: 0.4, height: 0.5, color: '#ffe3a1', speed: 3.7 },
];

/**
 * Draws a flame whose base sits at (x, y).
 * `size` is the base width in screen px; `intensity` scales the height (1 = normal).
 */
export function drawFlame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  intensity: number,
  time: number,
  seed = 0,
  kind?: FlameKind,
): void {
  if (intensity > 0.01 && drawPaintedFlame(ctx, x, y, size, intensity, time, seed, kind)) return;
  const height = size * 1.5 * intensity * (0.92 + 0.08 * wobble(time * 6 + seed));
  ctx.save();

  // Glow behind the flame.
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(x, y - height * 0.4, 0, x, y - height * 0.4, height * 1.6);
  glow.addColorStop(0, `rgba(242, 160, 60, ${0.3 * Math.min(intensity, 1.5)})`);
  glow.addColorStop(1, 'rgba(242, 160, 60, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - height * 1.6, y - height * 2, height * 3.2, height * 3.2);
  ctx.globalCompositeOperation = 'source-over';

  for (const [i, tongue] of TONGUES.entries()) {
    const halfBase = (size / 2) * tongue.width;
    const h = height * tongue.height;
    const lean = wobble(time * tongue.speed + seed + i) * h * 0.25;
    const tipX = x + lean;
    const tipY = y - h;
    ctx.beginPath();
    ctx.moveTo(x - halfBase, y);
    ctx.bezierCurveTo(x - halfBase * 1.1, y - h * 0.45, tipX - halfBase * 0.35, y - h * 0.75, tipX, tipY);
    ctx.bezierCurveTo(tipX + halfBase * 0.35, y - h * 0.75, x + halfBase * 1.1, y - h * 0.45, x + halfBase, y);
    ctx.closePath();
    ctx.fillStyle = tongue.color;
    ctx.fill();
    if (i === 0) {
      // Ink outline, like the incised contours of the vase figures.
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(40, 14, 4, 0.8)';
      ctx.stroke();
    }
  }

  // A few sparks rising and fading.
  ctx.fillStyle = '#ffd98a';
  for (let i = 0; i < 5; i++) {
    const p = (time * 0.6 + i / 5 + seed * 0.13) % 1;
    ctx.globalAlpha = (1 - p) * 0.8 * Math.min(intensity, 1);
    const sx = x + Math.sin(i * 12.9 + time * 2) * size * 0.35;
    const sy = y - height * (0.6 + p * 1.4);
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(1.5, size * 0.025), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
