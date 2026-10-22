// Arms, hands and the cup seen in first person (Lívia, the girl, Asterion). Each is a painted piece
// (pedidos-de-arte 2.x); the code only places and turns it: the hand lands on `to`, the arm comes
// from the direction of `from`. Until an image has loaded, the old code drawing is used instead.

import { art } from '../artRegistry';

export interface Point {
  x: number;
  y: number;
}

/**
 * A painted limb: where the arm leaves the picture (`base`) and the point that goes on the target
 * (`tip`: the fist, the palm, the fingertip), in image pixels; `forearm` is the forearm's width in
 * the picture (to match the requested on-screen width).
 */
interface LimbArt {
  base: Point;
  tip: Point;
  forearm: number;
}

/** Measured on the images (all painted as right arms, except the girl's, which reaches down). */
export const LIMBS: Record<string, LimbArt> = {
  // Lívia's hands seen from behind (pedidos 5.1–5.3): holding the cup's stem, open, a fist.
  // (Long-sleeved versions, 617x1024: the sleeve reaches the bottom edge.)
  'fp.livia.grip': { base: { x: 264, y: 1023 }, tip: { x: 308, y: 222 }, forearm: 190 },
  'fp.livia.open': { base: { x: 268, y: 1023 }, tip: { x: 305, y: 300 }, forearm: 190 },
  'fp.livia.fist': { base: { x: 262, y: 1023 }, tip: { x: 300, y: 170 }, forearm: 200 },
  'fp.livia_child.arm': { base: { x: 436, y: 0 }, tip: { x: 447, y: 880 }, forearm: 210 },
  // The two hands on the amphora (livia_maos_anfora, split in two): a LEFT hand, palm up under the
  // belly (pass mirror = false), and a right hand gripping the neck from above.
  'fp.livia.amphora.base': { base: { x: 100, y: 767 }, tip: { x: 430, y: 430 }, forearm: 260 },
  'fp.livia.amphora.neck': { base: { x: 528, y: 767 }, tip: { x: 160, y: 220 }, forearm: 240 },
  'fp.asterion.finger': { base: { x: 758, y: 1199 }, tip: { x: 222, y: 159 }, forearm: 300 },
  // The man scratching with his nail (pedidos 6.1): the back of the hand, the index's nail as the tip.
  'fp.asterion.nail': { base: { x: 1023, y: 690 }, tip: { x: 157, y: 250 }, forearm: 250 },
  // The boy's hand (pedidos 5.5), a small claw scratching the stone.
  'fp.asterion_child.finger': { base: { x: 1023, y: 670 }, tip: { x: 152, y: 198 }, forearm: 200 },
  // The claw seen clearly from behind (pedidos 7.4): a RIGHT hand, thumb on the left.
  'fp.asterion.tense': { base: { x: 356, y: 1023 }, tip: { x: 370, y: 430 }, forearm: 240 },
  'fp.asterion.open': { base: { x: 388, y: 1199 }, tip: { x: 437, y: 520 }, forearm: 300 },
  // Théron's right hand (pedidos 8, E.1–E.2): open, seeing the threads (the middle fingertip), and
  // holding the small sickle (the blade's inner edge is the tip).
  'fp.theron.open': { base: { x: 693, y: 1023 }, tip: { x: 533, y: 168 }, forearm: 165 },
  'fp.theron.blade': { base: { x: 693, y: 1023 }, tip: { x: 215, y: 300 }, forearm: 165 },
};

/**
 * For a limb drawn `width` wide: how far from the tip its arm leaves the picture, and how wide the
 * arm is there (screen px), so callers can carry the arm on past the picture's edge.
 */
export function limbReach(id: string, width: number): { length: number; width: number } | null {
  const limb = LIMBS[id];
  if (!limb) return null;
  const scale = width / limb.forearm;
  return { length: Math.hypot(limb.base.x - limb.tip.x, limb.base.y - limb.tip.y) * scale, width: limb.forearm * scale * 0.95 };
}

/** Unit vector from a limb's tip toward where its arm leaves the picture (null if unknown). */
export function limbDirection(id: string): Point | null {
  const limb = LIMBS[id];
  if (!limb) return null;
  const dx = limb.base.x - limb.tip.x;
  const dy = limb.base.y - limb.tip.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/**
 * Draws a painted limb with its tip on `to`, pointing from `from`. `width` = forearm width on
 * screen. Right arms are mirrored when they come from the left. Returns false if not loaded yet.
 */
export function drawLimb(c: CanvasRenderingContext2D, id: string, from: Point, to: Point, width: number, mirror?: boolean, tipFraction?: Point): boolean {
  const img = art(id);
  const measured = LIMBS[id];
  if (!img || !measured) return false;
  const limb = tipFraction ? { ...measured, tip: { x: tipFraction.x * img.naturalWidth, y: tipFraction.y * img.naturalHeight } } : measured;
  const flip = mirror ?? from.x < to.x;
  const scale = width / limb.forearm;
  // Direction of the limb in the picture (base → tip) and on screen (from → to).
  const bx = (flip ? -1 : 1) * (limb.tip.x - limb.base.x);
  const by = limb.tip.y - limb.base.y;
  const angle = Math.atan2(to.y - from.y, to.x - from.x) - Math.atan2(by, bx);
  c.save();
  c.translate(to.x, to.y);
  c.rotate(angle);
  c.scale(scale * (flip ? -1 : 1), scale);
  c.drawImage(img, -limb.tip.x, -limb.tip.y);
  c.restore();
  return true;
}

export interface ArmOptions {
  /** Forearm width near the elbow, in px. */
  width?: number;
  /** Number of burn-scar hatch marks near the wrist (0 = none). */
  scars?: number;
  /** "grip": fingers curled around something; "open": palm open, fingers spread. */
  hand?: 'grip' | 'open';
  /** Draw the stola's sleeve over the part of the arm nearest the body (default true). */
  sleeve?: boolean;
  /** Painted limb to use (LIMBS id); default: Lívia's gripping or open hand, by hand. */
  limb?: string;
}

/** The painted cup: center of the rim and the rim's width, in image pixels. */
const CUP_ART = { rim: { x: 512, y: 222 }, rimWidth: 548 };

const SKIN = '#c8743a';
const INK = '#0c0907';
const SCAR = 'rgba(58, 26, 10, 0.9)';

/**
 * Draws a forearm coming from `from` (usually off-screen, below) to a hand centered on `to`.
 * The hand is oriented along the arm.
 */
export function drawArm(c: CanvasRenderingContext2D, from: Point, to: Point, options: ArmOptions = {}): void {
  const width = options.width ?? 92;
  const limb = options.limb ?? (options.hand === 'open' ? 'fp.livia.open' : 'fp.livia.grip');
  if (drawLimb(c, limb, from, to, width * 1.15)) return;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular.
  const px = -uy;
  const py = ux;
  const handLen = width * 0.95;
  const wrist = { x: to.x - ux * handLen * 0.55, y: to.y - uy * handLen * 0.55 };
  const w0 = width / 2;
  const w1 = width * 0.3;

  c.save();
  c.lineJoin = 'round';
  c.lineWidth = 5;
  c.strokeStyle = INK;
  c.fillStyle = SKIN;

  // Forearm: a tapered band with a slight muscle curve.
  c.beginPath();
  c.moveTo(from.x + px * w0, from.y + py * w0);
  c.quadraticCurveTo(
    (from.x + wrist.x) / 2 + px * w0 * 1.05,
    (from.y + wrist.y) / 2 + py * w0 * 1.05,
    wrist.x + px * w1,
    wrist.y + py * w1,
  );
  c.lineTo(wrist.x - px * w1, wrist.y - py * w1);
  c.quadraticCurveTo(
    (from.x + wrist.x) / 2 - px * w0 * 0.95,
    (from.y + wrist.y) / 2 - py * w0 * 0.95,
    from.x - px * w0,
    from.y - py * w0,
  );
  c.closePath();
  c.fill();
  c.stroke();

  // Inner contour of the forearm muscle, like the incised lines of red-figure painting.
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(from.x + (wrist.x - from.x) * 0.35 + px * w0 * 0.45, from.y + (wrist.y - from.y) * 0.35 + py * w0 * 0.45);
  c.quadraticCurveTo(
    from.x + (wrist.x - from.x) * 0.6 + px * w0 * 0.55,
    from.y + (wrist.y - from.y) * 0.6 + py * w0 * 0.55,
    from.x + (wrist.x - from.x) * 0.85 + px * w1 * 0.5,
    from.y + (wrist.y - from.y) * 0.85 + py * w1 * 0.5,
  );
  c.stroke();

  // The stola's sleeve: loose cloth over the upper part, with fold lines.
  if (options.sleeve ?? true) {
    const end = 0.38;
    const sx = from.x + (wrist.x - from.x) * end;
    const sy = from.y + (wrist.y - from.y) * end;
    const ws = w0 * 1.3;
    c.fillStyle = '#d8945a';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(from.x + px * ws, from.y + py * ws);
    c.lineTo(sx + px * w0 * 1.05, sy + py * w0 * 1.05);
    // Wavy hem.
    for (let i = 1; i <= 4; i++) {
      const k = i / 4;
      const hx = sx + px * w0 * (1.05 - 2.1 * k);
      const hy = sy + py * w0 * (1.05 - 2.1 * k);
      c.quadraticCurveTo(hx + ux * 14 + px * w0 * 0.26, hy + uy * 14 + py * w0 * 0.26, hx, hy);
    }
    c.lineTo(from.x - px * ws, from.y - py * ws);
    c.closePath();
    c.fill();
    c.stroke();
    c.lineWidth = 2.5;
    for (const k of [-0.5, 0, 0.5]) {
      c.beginPath();
      c.moveTo(from.x + px * ws * k, from.y + py * ws * k);
      c.lineTo(sx + px * w0 * k * 0.9 - ux * 10, sy + py * w0 * k * 0.9 - uy * 10);
      c.stroke();
    }
    c.fillStyle = SKIN;
  }

  // Burn scars: short hatched strokes across the forearm, close to the wrist (like the approved art).
  const scars = options.scars ?? 4;
  c.strokeStyle = SCAR;
  c.lineWidth = 3;
  for (let i = 0; i < scars; i++) {
    const t = 0.62 + i * 0.07;
    const cx = from.x + (wrist.x - from.x) * t;
    const cy = from.y + (wrist.y - from.y) * t;
    const half = w1 * 0.9 + (1 - t) * w0 * 0.6;
    c.beginPath();
    c.moveTo(cx + px * half * 0.7 - ux * 6, cy + py * half * 0.7 - uy * 6);
    c.lineTo(cx - px * half * 0.5 + ux * 6, cy - py * half * 0.5 + uy * 6);
    c.stroke();
  }

  // Hand.
  c.strokeStyle = INK;
  c.lineWidth = 5;
  c.fillStyle = SKIN;
  const angle = Math.atan2(uy, ux);
  c.translate(to.x, to.y);
  c.rotate(angle);
  if (options.hand === 'open') {
    // Open palm with spread fingers (orans gesture).
    c.beginPath();
    c.ellipse(0, 0, handLen * 0.42, w1 * 1.25, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    for (const [a, l] of [
      [-0.5, 0.75],
      [-0.17, 0.9],
      [0.17, 0.88],
      [0.5, 0.7],
    ] as const) {
      c.save();
      c.rotate(a);
      c.beginPath();
      c.roundRect(handLen * 0.3, -w1 * 0.22, handLen * l * 0.6, w1 * 0.44, w1 * 0.22);
      c.fill();
      c.stroke();
      c.restore();
    }
  } else {
    // Gripping: palm plus curled knuckles.
    c.beginPath();
    c.ellipse(0, 0, handLen * 0.48, w1 * 1.2, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.arc(handLen * 0.32, i * w1 * 0.55, w1 * 0.32, -Math.PI / 2, Math.PI / 2);
      c.stroke();
    }
  }
  c.restore();
}

/**
 * The signature cup (GDD 8.5): golden, three-legged, zigzag band. `rim` is the center of the rim,
 * where the flame is born; `scale` 1 = rim 300 px wide.
 */
export function drawCup(c: CanvasRenderingContext2D, rim: Point, scale = 1): void {
  // The painted cup: its rim (center of the top edge) on the rim point, 300 px wide at scale 1.
  const cup = art('fp.cup');
  if (cup) {
    const s = (300 * scale) / CUP_ART.rimWidth;
    c.drawImage(cup, rim.x - CUP_ART.rim.x * s, rim.y - CUP_ART.rim.y * s, cup.naturalWidth * s, cup.naturalHeight * s);
    return;
  }
  const { x } = rim;
  const y = rim.y + 60 * scale;
  const s = scale;
  c.save();
  c.lineWidth = Math.max(2, 5 * s);
  c.strokeStyle = '#2a1608';
  c.fillStyle = '#d9b45a';
  c.beginPath();
  c.moveTo(x - 150 * s, y - 60 * s);
  c.lineTo(x + 150 * s, y - 60 * s);
  c.quadraticCurveTo(x + 130 * s, y + 70 * s, x + 40 * s, y + 90 * s);
  c.lineTo(x - 40 * s, y + 90 * s);
  c.quadraticCurveTo(x - 130 * s, y + 70 * s, x - 150 * s, y - 60 * s);
  c.closePath();
  c.fill();
  c.stroke();
  c.beginPath();
  for (let i = 0; i <= 12; i++) c.lineTo(x - 138 * s + i * 23 * s, y - 30 * s + (i % 2 === 0 ? 0 : 26 * s));
  c.lineWidth = Math.max(1.5, 3 * s);
  c.stroke();
  c.lineWidth = Math.max(2, 5 * s);
  c.fillStyle = '#c9a24e';
  for (const dx of [-60, 0, 60]) {
    c.fillRect(x + (dx - 9) * s, y + 90 * s, 18 * s, 70 * s);
    c.strokeRect(x + (dx - 9) * s, y + 90 * s, 18 * s, 70 * s);
  }
  c.beginPath();
  c.ellipse(x, y + 170 * s, 120 * s, 22 * s, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = '#e8c870';
  c.beginPath();
  c.ellipse(x, y - 60 * s, 150 * s, 18 * s, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.restore();
}
