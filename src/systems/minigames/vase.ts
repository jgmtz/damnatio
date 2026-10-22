// The Empire's vase (the prologue, docs/roteiros/roteiro-fase6.md): a painted vase turns slowly, and each face
// is a picture of the official story, recited by a voice of the College. The player turns it:
// - drag sideways with the mouse, or use A/D or the arrows;
// - Space (or Enter) turns to the next face; once every face has been seen, it ends the scene.
// There is no failure and a single outcome ("done").
//
// params: {
//   hint?: string key,
//   speaker?: string key       who recites (shown over each line)
//   faces: [{ art: art id, text: string key }]   in turning order
// }
// outcomes: "done"

import { ACTION } from './input';
import { clamp, drawHints, drawLabel, W, H, type Minigame, type MinigameContext, type MinigameFactory } from './types';

interface Face {
  art: string;
  text: string;
}

/** Radius of the vase on screen and the painted band's height and top. */
const R = 640;
const BAND_H = 700;
const BAND_TOP = 150;
/** One face of the painted band (px of the offscreen band): about the shape a face takes on screen. */
const FACE_W = 1300;
const FACE_H = 900;
/** Vertical slices drawn across the vase's width (the cylinder is drawn slice by slice). */
const SLICES = 180;
/** How near (radians) a face's centre must be to count as seen, and to show its line. */
const CENTRED = 0.07;

const LEFT = ['a', 'A', 'ArrowLeft'];
const RIGHT = ['d', 'D', 'ArrowRight'];

/** Angle (radians) at which face `k` of `n` faces is in front. */
export function faceAngle(k: number, n: number): number {
  return ((k + 0.5) * Math.PI * 2) / n;
}

/** Which face is nearest the front at rotation `rot`, and how far from centred it is (radians). */
export function frontFace(rot: number, n: number): { index: number; offset: number } {
  const step = (Math.PI * 2) / n;
  const turns = rot / step - 0.5;
  const nearest = Math.round(turns);
  return { index: ((nearest % n) + n) % n, offset: (turns - nearest) * step };
}

export const createVase: MinigameFactory = (params, ctx: MinigameContext): Minigame => {
  const faces = (params.faces ?? []) as Face[];
  const n = Math.max(1, faces.length);
  const input = ctx.input;
  const step = (Math.PI * 2) / n;
  let rot = faceAngle(0, n);
  /** The rotation it eases toward when nobody is turning it. */
  let target = rot;
  let dragging = false;
  let lastX = 0;
  const seen = new Set<number>();
  let shown = 0;
  let elapsed = 0;
  let finished = 0;
  let band: HTMLCanvasElement | null = null;

  /** The faces painted side by side once, when every picture has loaded. */
  const paintBand = (): HTMLCanvasElement | null => {
    const images = faces.map((f) => ctx.image(f.art));
    if (images.some((img) => !img)) return null;
    const canvas = document.createElement('canvas');
    canvas.width = FACE_W * n;
    canvas.height = FACE_H;
    const c = canvas.getContext('2d');
    if (!c) return null;
    images.forEach((img, k) => {
      const s = Math.max(FACE_W / img!.naturalWidth, FACE_H / img!.naturalHeight);
      const w = img!.naturalWidth * s;
      const h = img!.naturalHeight * s;
      c.save();
      c.beginPath();
      c.rect(k * FACE_W, 0, FACE_W, FACE_H);
      c.clip();
      c.drawImage(img!, k * FACE_W + (FACE_W - w) / 2, (FACE_H - h) / 2, w, h);
      c.restore();
      // Between two pictures, a black band of glaze, as between the panels of a vase.
      c.fillStyle = '#0c0907';
      c.fillRect(k * FACE_W - 14, 0, 28, FACE_H);
    });
    c.fillRect(n * FACE_W - 14, 0, 14, FACE_H);
    return canvas;
  };

  const turnTo = (to: number) => {
    target = to;
  };

  return {
    update(dt) {
      elapsed += dt;
      if (finished) {
        input.endFrame();
        return elapsed - finished > 0.6 ? { outcome: 'done', earned: [] } : null;
      }
      const front = frontFace(rot, n);
      // Dragging turns it by the arc the hand travels.
      if (input.mouse.down && !dragging) {
        dragging = true;
        lastX = input.mouse.x;
      }
      if (dragging) {
        rot -= (input.mouse.x - lastX) / R;
        lastX = input.mouse.x;
        if (!input.mouse.down) {
          // Let go: it settles on the nearest face.
          dragging = false;
          turnTo(rot - frontFace(rot, n).offset);
        }
      } else {
        const base = rot - front.offset;
        if (input.consume(RIGHT)) turnTo(base + step);
        else if (input.consume(LEFT)) turnTo(base - step);
        else if (input.consume(ACTION)) {
          // Every face seen: Space goes on, whichever face is in front (the player may keep turning).
          if (seen.size >= n) finished = elapsed;
          else turnTo(base + step);
        }
        rot += (target - rot) * clamp(dt * 5, 0, 1);
      }
      const now = frontFace(rot, n);
      const centred = !dragging && Math.abs(now.offset) < CENTRED;
      if (centred) seen.add(now.index);
      shown = clamp(shown + (centred ? dt * 2.5 : -dt * 4), 0, 1);
      input.endFrame();
      return null;
    },

    draw(c, time) {
      c.fillStyle = '#0c0907';
      c.fillRect(0, 0, W, H);
      band ??= paintBand();
      const cx = W / 2;
      // The body of the vase, slice by slice: each slice shows the band at its angle, darker toward
      // the edges where the round turns away from the light.
      for (let i = 0; i < SLICES; i++) {
        const a0 = -Math.PI / 2 + (Math.PI * i) / SLICES;
        const a1 = -Math.PI / 2 + (Math.PI * (i + 1)) / SLICES;
        const x0 = cx + R * Math.sin(a0);
        const x1 = cx + R * Math.sin(a1);
        const mid = (a0 + a1) / 2;
        if (band) {
          const u = (((rot + mid) / (Math.PI * 2)) % 1 + 1) % 1;
          const sw = (band.width * (a1 - a0)) / (Math.PI * 2);
          const sx = Math.min(band.width - sw, u * band.width);
          c.drawImage(band, sx, 0, sw, band.height, x0, BAND_TOP, x1 - x0 + 0.6, BAND_H);
        } else {
          c.fillStyle = '#a4502a';
          c.fillRect(x0, BAND_TOP, x1 - x0 + 0.6, BAND_H);
        }
        const shade = 0.9 * Math.pow(1 - Math.cos(mid), 1.4);
        if (shade > 0.01) {
          c.fillStyle = `rgba(6, 3, 1, ${shade})`;
          c.fillRect(x0, BAND_TOP, x1 - x0 + 0.6, BAND_H);
        }
      }
      // Black glaze above and below the pictures, with the thin terracotta lines of a vase.
      c.fillStyle = '#120c08';
      c.fillRect(cx - R, BAND_TOP - 60, R * 2, 60);
      c.fillRect(cx - R, BAND_TOP + BAND_H, R * 2, 60);
      c.strokeStyle = 'rgba(190, 96, 52, 0.75)';
      c.lineWidth = 3;
      for (const y of [BAND_TOP - 10, BAND_TOP + BAND_H + 10]) {
        c.beginPath();
        c.moveTo(cx - R, y);
        c.lineTo(cx + R, y);
        c.stroke();
      }
      // The line recited for the face in front, over the vase.
      const front = frontFace(rot, n);
      const face = faces[front.index];
      if (face && shown > 0.02) {
        c.save();
        c.globalAlpha = shown;
        c.font = 'italic 40px "Cormorant Garamond", Georgia, serif';
        const lines = wrap(c, ctx.t(face.text), 1500);
        const top = H - 110 - (lines.length - 1) * 50;
        if (typeof params.speaker === 'string') {
          c.font = '26px "Cinzel", Georgia, serif';
          drawLabel(c, ctx.t(params.speaker), cx, top - 58, '#d9b45a');
          c.font = 'italic 40px "Cormorant Garamond", Georgia, serif';
        }
        lines.forEach((line, i) => drawLabel(c, line, cx, top + i * 50, '#f1e3cf'));
        c.restore();
      }
      const last = seen.size >= n;
      drawHints(c, ctx.t(String(params.hint ?? 'mg.vase.hint')));
      // A small count of the faces, like marks on the foot of the vase.
      c.save();
      c.font = '24px "Cinzel", Georgia, serif';
      c.textAlign = 'right';
      c.fillStyle = 'rgba(217, 180, 90, 0.8)';
      c.fillText(last ? ctx.t('mg.vase.done') : `${seen.size} / ${n}`, W - 60, 60 + Math.sin(time * 2) * (last ? 3 : 0));
      c.restore();
    },
  };
};

/** Breaks a line into lines no wider than `max` px (in the current font). */
function wrap(c: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && c.measureText(next).width > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
