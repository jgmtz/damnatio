// The cups (Théron, "Dia de Feira"): the old fairground swindle, in first person. Three cups on a
// barrel, a pebble under one; his hands shuffle them while the mark watches. The trick is to palm
// the pebble (hold the mouse button or Space) at a moment the mark looks away.
// - Each round: the cup lifts to show the pebble, then the shuffle.
// - The mark's face is large at the top: "looking" (eye open), "distracted" (eye shut) and, just before
//   looking back, "about to look" (the eye opening). Hold while distracted until the ring around
//   Théron's hand fills.
// - Pressing while the mark looks, or still holding once he looks back (after a short grace), is seen;
//   twice and the swindle turns into a scene. In the tutorial, mistakes are only explained.
// Not palming at all is just an honest game (he may win). No "game over": how it went picks the outcome.
//
// params: {
//   hint?: string key,
//   rounds?: number (3),
//   markArt?: art id           the mark's portrait, at the top
//   tableArt?: art id          the barrel top, seen from above
//   tableHands?: boolean       the table art already shows his hands: no reaching hand is drawn
//   cupArt?: art id            one cup (painted); stands in: the painted cup turned over
//   cupY?: number              screen y of the cups' base (to sit them where the table art painted them)
//   cupScale?: number          scale of cupArt (the table's own scale, so the cups match it)
//   cupAnchor?: { x, y }       the middle of the cup's base in cupArt (px)
//   watchful?: 0..1 (0.5)      how much of the time the mark keeps his eyes on the cups
//   mode?: "belt"              the same trick on a belt (Théron 4): no cups, a key hanging from a knotted
//                              cord; each round is one turn of the knot to undo while she looks at the sea
//   beltArt?: art id           the belt seen up close (stands in: drawn in code)
//   beltY?: number             screen y where the knot hangs from the belt (440)
// }
// outcomes: "clean" (palmed most rounds, never seen) | "sloppy" (seen once, or palmed few) | "caught" (seen twice)

import { drawFrame, SIGN, SIGN_RING_RADIUS } from '../fxSprites';
import { drawCup, drawLimb } from './arms';
import { ACTION } from './input';
import { Tutorial } from './tutorial';
import { clamp, drawHints, drawImageFit, drawLabel, prng, tutorialLabels, W, H, type Minigame, type MinigameContext, type MinigameFactory } from './types';

const CUP_X = [700, 960, 1220];
const CUP_Y = 640;
/** Seconds the pebble shows under its lifted cup at the start of a round, then of shuffling. */
const SHOW = 1.1;
const SHUFFLE = 4.6;
const ROUND = SHOW + SHUFFLE;
const SWAP = 0.42;
/** Seconds the button must be held, while the mark looks away, to palm the pebble. */
const PALM = 0.45;
/** Seconds of warning before the mark looks back (his eye starts to open). */
const WARN = 0.55;
/** Once he looks back, a hold released this quickly is not seen. */
const GRACE = 0.15;

export function shellsOutcome(palmed: number, rounds: number, seen: number): 'clean' | 'sloppy' | 'caught' {
  if (seen >= 2) return 'caught';
  if (seen === 0 && palmed >= Math.ceil(rounds / 2)) return 'clean';
  return 'sloppy';
}

type RoundMark = 'palmed' | 'seen' | 'honest';

export const createShells: MinigameFactory = (params, ctx: MinigameContext): Minigame => {
  const rounds = Number(params.rounds ?? 3);
  const watchful = clamp(Number(params.watchful ?? 0.5) * (ctx.relaxed ? 0.7 : 1), 0.1, 0.9);
  const rand = prng(41);
  const cupY = Number(params.cupY ?? CUP_Y);
  const cupAnchor = params.cupAnchor as { x: number; y: number } | undefined;
  const belt = params.mode === 'belt';
  const input = ctx.input;
  let round = 0;
  let t = 0;
  let palmed = 0;
  let seen = 0;
  let holding = 0;
  let palmedThisRound = false;
  let seenThisRound = false;
  /** After being seen, the button must be let go before trying again. */
  let mustRelease = false;
  const marks: RoundMark[] = [];
  let flash: { text: string; good: boolean; at: number } | null = null;
  let elapsed = 0;
  let finishAt: number | null = null;
  // Where each cup is (slot index), the pebble's cup, the swap in progress.
  let slots = [0, 1, 2];
  let pebble = 1;
  let swap: { a: number; b: number; start: number } | null = null;
  let nextSwap = SHOW + 0.2;
  // The mark's gaze: looking at the cups, or away, changing every so often.
  let looking = true;
  let gazeFrom = 0;
  let gazeUntil = 1.6;
  let wasHolding = false;

  const tutorial = ctx.tutorial
    ? new Tutorial(
        [
          { text: ctx.t(belt ? 'mg.shells.belt.tut1' : 'mg.shells.tut1'), done: () => !looking },
          { text: ctx.t(belt ? 'mg.shells.belt.tut2' : 'mg.shells.tut2'), done: () => palmed > 0 },
          { text: ctx.t(belt ? 'mg.shells.belt.tut3' : 'mg.shells.tut3'), done: () => input.consumeClick() || input.consume(ACTION) },
        ],
        tutorialLabels(ctx.t),
      )
    : null;

  const cupPos = (cup: number): { x: number; y: number } => {
    const slot = slots[cup]!;
    let x = CUP_X[slot]!;
    let y = cupY;
    if (swap && (cup === swap.a || cup === swap.b)) {
      const k = clamp((t - swap.start) / SWAP, 0, 1);
      const from = CUP_X[slots[cup]!]!;
      const other = cup === swap.a ? swap.b : swap.a;
      const to = CUP_X[slots[other]!]!;
      x = from + (to - from) * k;
      y = cupY + Math.sin(Math.PI * k) * (cup === swap.a ? -40 : 30);
    }
    return { x, y };
  };

  /** How far the pebble's cup is lifted (0..1) while the round shows where the pebble is. */
  const lift = (): number => (t < SHOW ? Math.sin(Math.PI * clamp(t / SHOW, 0, 1)) : 0);

  const say = (key: string, good: boolean) => {
    if (flash && elapsed - flash.at < 0.6 && flash.text === ctx.t(key)) return;
    flash = { text: ctx.t(key), good, at: elapsed };
  };

  const newRound = () => {
    t = 0;
    nextSwap = SHOW + 0.2;
    palmedThisRound = false;
    seenThisRound = false;
    holding = 0;
    pebble = Math.floor(rand() * 3);
  };

  const step = (dt: number, practice: boolean) => {
    t += dt;
    // The gaze. Looking spells grow with watchfulness; distracted spells are always long enough to palm.
    if (t >= gazeUntil) {
      looking = !looking;
      gazeFrom = t;
      gazeUntil = t + (looking ? 0.9 + rand() * 1.6 * watchful * 2 : 1.0 + rand() * 1.2 * (1 - watchful) * 2);
    }
    // The shuffle (after the pebble was shown).
    if (swap && t - swap.start >= SWAP) {
      const sa = slots[swap.a]!;
      slots[swap.a] = slots[swap.b]!;
      slots[swap.b] = sa;
      swap = null;
    }
    if (!swap && t >= nextSwap && t < ROUND - 0.3) {
      const a = Math.floor(rand() * 3);
      const b = (a + 1 + Math.floor(rand() * 2)) % 3;
      swap = { a, b, start: t };
      nextSwap = t + SWAP + 0.05 + rand() * 0.25;
    }
    // Palming: holding the button (or Space).
    const hold = input.mouse.down || input.held.has(' ');
    const pressedNow = hold && !wasHolding;
    wasHolding = hold;
    if (!hold) {
      holding = 0;
      mustRelease = false;
      return;
    }
    if (palmedThisRound || mustRelease) return;
    if (!looking) {
      holding += dt;
      if (holding >= PALM) {
        palmedThisRound = true;
        palmed++;
        if (!practice) marks[round] = 'palmed';
        say(belt ? 'mg.shells.belt.palmed' : 'mg.shells.palmed', true);
      }
      return;
    }
    // He is looking. A hold he turned back on gets a moment to be let go.
    const caughtMidway = holding > 0 && t - gazeFrom < GRACE;
    if (caughtMidway && !pressedNow) return;
    holding = 0;
    mustRelease = true;
    if (practice) {
      say('mg.shells.wait', false);
      return;
    }
    seen++;
    seenThisRound = true;
    marks[round] = 'seen';
    say('mg.shells.seen', false);
  };

  return {
    update(dt) {
      elapsed += dt;
      if (tutorial?.active) {
        step(dt, true);
        if (t > ROUND) newRound();
        tutorial.update(dt, input.consume(['Enter']));
        if (!tutorial.active) {
          palmed = 0;
          seen = 0;
          marks.length = 0;
          newRound();
          pebble = 1;
        }
        input.endFrame();
        return null;
      }
      if (finishAt !== null) {
        input.endFrame();
        return elapsed - finishAt > 1.4 ? { outcome: shellsOutcome(palmed, rounds, seen), earned: [] } : null;
      }
      step(dt, false);
      if (seen >= 2) finishAt = elapsed;
      if (t >= ROUND) {
        if (!marks[round]) marks[round] = seenThisRound ? 'seen' : palmedThisRound ? 'palmed' : 'honest';
        round++;
        if (round >= rounds) finishAt = elapsed;
        else newRound();
      }
      input.endFrame();
      return null;
    },

    draw(c, time) {
      c.fillStyle = '#0c0907';
      c.fillRect(0, 0, W, H);
      if (belt) {
        drawBelt(c, time, round, rounds, palmedThisRound, holding / PALM, finishAt !== null && seen < 2);
      } else {
        drawCups(c, time);
      }
      drawGaze(c, time);
      c.save();
      drawRounds(c);
      if (flash && elapsed - flash.at < 1.3) {
        c.font = 'italic 46px "Cormorant Garamond", Georgia, serif';
        c.globalAlpha = 1 - (elapsed - flash.at) / 1.3;
        drawLabel(c, flash.text, W / 2, 470, flash.good ? '#ffd36a' : '#e0664a');
      }
      c.restore();
      if (tutorial?.active) tutorial.draw(c, time);
      else drawHints(c, ctx.t(String(params.hint ?? 'mg.shells.hint')), ctx.t(belt ? 'mg.shells.belt.controls' : 'mg.shells.controls'));
    },
  };

  /**
   * The mark, large at the top right: the portrait, the eye (open / shut / opening) and a word.
   * While the tutorial panel is up it sits lower, beside the panel.
   */
  function drawGaze(c: CanvasRenderingContext2D, time: number): void {
    const warning = !looking && gazeUntil - t < WARN;
    const x = W - 250;
    const top = tutorial?.active ? 380 : 120;
    const mark = typeof params.markArt === 'string' ? ctx.image(params.markArt) : null;
    if (mark) {
      const s = 240 / mark.naturalHeight;
      c.drawImage(mark, x - (mark.naturalWidth * s) / 2, top, mark.naturalWidth * s, mark.naturalHeight * s);
    }
    // The eye: shut while distracted, opening during the warning, open (and pulsing red) while looking.
    const open = looking ? 1 : warning ? 0.18 + 0.82 * (1 - (gazeUntil - t) / WARN) : 0.15;
    const pulse = looking ? 1 + Math.sin(time * 8) * 0.04 : warning ? 1 + Math.sin(time * 18) * 0.08 : 1;
    drawFrame(c, 'fx.signs', SIGN.eye, x, top + 300, 0.8 * pulse, { stretchY: open, alpha: looking || warning ? 1 : 0.55 });
    c.save();
    c.font = 'bold 40px "Cinzel", Georgia, serif';
    const word = looking ? 'mg.shells.looking' : warning ? 'mg.shells.warn' : 'mg.shells.away';
    const color = looking ? '#e0664a' : warning ? '#ffb347' : '#ffd36a';
    drawLabel(c, ctx.t(word), x, top + 380, color);
    c.restore();
  }

  /** "Round 2 of 3" and one mark per round: palmed, seen, or played honestly. */
  function drawRounds(c: CanvasRenderingContext2D): void {
    c.font = 'italic 32px "Cormorant Garamond", Georgia, serif';
    const roundKey = belt ? 'mg.shells.belt.round' : 'mg.shells.round';
    const label = ctx.t(roundKey).replace('{n}', String(Math.min(round + 1, rounds))).replace('{total}', String(rounds));
    drawLabel(c, label, 80, tutorial?.active ? 420 : 160, 'rgba(241, 227, 207, 0.9)', 'left');
    if (tutorial?.active) return;
    c.font = 'bold 40px "Cinzel", Georgia, serif';
    for (let i = 0; i < rounds; i++) {
      const m = marks[i];
      const glyph = m === 'palmed' ? '✓' : m === 'seen' ? '✗' : m === 'honest' ? '–' : '·';
      const color = m === 'palmed' ? '#ffd36a' : m === 'seen' ? '#e0664a' : 'rgba(241, 227, 207, 0.6)';
      drawLabel(c, glyph, 100 + i * 60, 225, color);
    }
  }

  /** The painted brush ring around a point, uncovered like a clock hand as `k` goes 0 → 1. */
  function drawRing(c: CanvasRenderingContext2D, x: number, y: number, radius: number, k: number): void {
    if (k <= 0.01) return;
    c.save();
    c.beginPath();
    c.moveTo(x, y);
    c.arc(x, y, radius * 1.8, -Math.PI / 2, -Math.PI / 2 + clamp(k, 0, 1) * Math.PI * 2);
    c.closePath();
    c.clip();
    drawFrame(c, 'fx.signs', SIGN.ring, x, y, radius / SIGN_RING_RADIUS, { composite: 'lighter' });
    c.restore();
  }

  /** The belt (mode "belt"): the cord's knot, one turn per round, and the key swinging below it. */
  function drawBelt(c: CanvasRenderingContext2D, time: number, done: number, total: number, palmedNow: boolean, grip: number, freed: boolean): void {
    const art = typeof params.beltArt === 'string' ? ctx.image(params.beltArt) : null;
    if (art) drawImageFit(c, art, 'cover');
    else {
      // A woven belt across the frame, the sea dark behind it.
      c.fillStyle = '#16120f';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#5a3a22';
      c.fillRect(0, 300, W, 120);
      c.strokeStyle = 'rgba(20, 12, 6, 0.6)';
      c.lineWidth = 3;
      for (let x = -40; x < W; x += 46) {
        c.beginPath();
        c.moveTo(x, 300);
        c.lineTo(x + 40, 420);
        c.stroke();
      }
    }
    const turnsLeft = Math.max(0, total - done - (palmedNow ? 1 : 0));
    // Where the knot hangs: under the painted belt (beltY), or under the band drawn in code.
    const knotY = Number(params.beltY ?? 440);
    const cx = W / 2 - 120;
    // The knot: one loop per turn still to undo. The one under his fingers trembles as he works it.
    for (let i = 0; i < turnsLeft; i++) {
      const shake = i === 0 && grip > 0 ? Math.sin(time * 60) * 3 * grip : 0;
      c.strokeStyle = '#c9a76a';
      c.lineWidth = 9;
      c.beginPath();
      c.ellipse(cx + shake, knotY + i * 26, 34, 16, 0.2, 0, Math.PI * 2);
      c.stroke();
    }
    if (turnsLeft > 0 && !palmedNow) drawRing(c, cx, knotY, 70, grip);
    if (freed) return;
    // The cord and the key, swinging with her breath.
    const swing = Math.sin(time * 1.7) * 0.16;
    const top = { x: cx, y: knotY + turnsLeft * 26 };
    // The cord shortens when the belt hangs low, so the key stays on screen above the hints.
    const cord = Math.max(80, Math.min(230, H - 300 - top.y));
    const end = { x: top.x + Math.sin(swing) * cord, y: top.y + Math.cos(swing) * cord };
    c.strokeStyle = '#c9a76a';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(top.x, top.y);
    c.lineTo(end.x, end.y);
    c.stroke();
    c.save();
    c.translate(end.x, end.y);
    c.rotate(-swing);
    c.fillStyle = '#b07a32';
    c.strokeStyle = '#3a2410';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(0, 30, 30, 0, Math.PI * 2);
    c.arc(0, 30, 13, 0, Math.PI * 2, true);
    c.fill('evenodd');
    c.stroke();
    c.fillRect(-9, 58, 18, 150);
    c.strokeRect(-9, 58, 18, 150);
    c.fillRect(9, 170, 34, 16);
    c.fillRect(9, 196, 26, 12);
    c.restore();
  }

  function drawCups(c: CanvasRenderingContext2D, time: number): void {
    const table = typeof params.tableArt === 'string' ? ctx.image(params.tableArt) : null;
    if (table) drawImageFit(c, table, 'cover');
    // The cups. The pebble shows while its cup is lifted at the start of the round.
    const cupArt = typeof params.cupArt === 'string' ? ctx.image(params.cupArt) : null;
    const raised = lift();
    for (let cup = 0; cup < 3; cup++) {
      const p = cupPos(cup);
      const up = cup === pebble && !palmedThisRound ? raised * 120 : 0;
      if (up > 4) drawFrame(c, 'fx.embers', 7, p.x, p.y + (cupAnchor ? 14 : 70), 0.26);
      const y = p.y - up;
      if (cupArt && cupAnchor) {
        // Sat on the table where the painting had its cups, at the painting's scale.
        const s = Number(params.cupScale ?? 1);
        c.drawImage(cupArt, p.x - cupAnchor.x * s, y - cupAnchor.y * s, cupArt.naturalWidth * s, cupArt.naturalHeight * s);
      } else if (cupArt) {
        const s = 230 / cupArt.naturalWidth;
        c.drawImage(cupArt, p.x - (cupArt.naturalWidth * s) / 2, y - cupArt.naturalHeight * s + 90, cupArt.naturalWidth * s, cupArt.naturalHeight * s);
      } else {
        // The painted cup, turned over.
        c.save();
        c.translate(p.x, y + 40);
        c.scale(1, -1);
        drawCup(c, { x: 0, y: 0 }, 0.62);
        c.restore();
      }
    }
    // Théron's hand: resting at the side, on the pebble's cup while he works it free, closed over
    // the pebble once palmed (the pebble glowing between his fingers).
    const target = cupPos(pebble);
    const working = holding > 0 && !palmedThisRound;
    const tip = palmedThisRound
      ? { x: 1500, y: H - 260 }
      : working
        ? { x: target.x + 30, y: target.y + 10 }
        : { x: 1560, y: H - 300 };
    const from = { x: tip.x + 360, y: H + 420 };
    // A table painted with his hands already on it would show a third hand: only the ring then.
    if (params.tableHands === true) {
      if (palmedThisRound) drawFrame(c, 'fx.embers', 7, W / 2, H - 150, 0.18, { alpha: 0.7 });
    } else if (!drawLimb(c, 'fp.theron.open', from, tip, 170, false)) {
      drawFrame(c, 'fx.signs', SIGN.ring, tip.x, tip.y, 0.18, { alpha: 0.9, composite: 'lighter' });
    }
    if (palmedThisRound && params.tableHands !== true) drawFrame(c, 'fx.embers', 7, tip.x - 20, tip.y + 60, 0.2, { alpha: 0.6 + Math.sin(time * 4) * 0.2 });
    if (working) drawRing(c, target.x, target.y - 40, 110, holding / PALM);
  }
};
