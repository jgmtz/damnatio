// The Cut Thread (Théron's gift, docs/roteiros/roteiro-theron.md): in first person, he sees the threads that
// hold a person: golden cords leaving the chest toward what binds them ("the son", "duty", "fear").
// With the mouse he can:
// - CUT a thread: hold the button and sweep the blade across it;
// - LOOSEN a thread: rest the hand on it, without pressing, until it slackens;
// - TIE two threads: press on one thread and drag it onto another.
// Space (or a right click) leaves them be. There is no failure: the gesture IS the choice, and the
// outcome id says what was done ("cut:duty", "loosen:fear", "tie:son+duty", "none"). A gesture the
// content doesn't allow on that thread just doesn't take (the cord shivers).
//
// params: {
//   hint?: string key,
//   personArt?: art id         the person, drawn faint behind the threads
//   backgroundArt?: art id
//   chest?: { x, y }           where the threads leave the person (screen px; default 960, 470)
//   threads: [{ id, label: string key, angle: degrees (0 = right, 90 = down), allow: ['cut'|'loosen'|'tie'],
//               ghost?: true }]  a ghost thread (one already cut, like Théron's) is faint, has no label,
//                                and the hand and the blade pass through it
//   ghostHint?: string key     shown by the hand while it passes through a ghost thread
//   ties?: [[idA, idB]]        pairs that can be tied
//   rising?: number            faint threads that leave the chest upward, out of reach (someone above
//                              holds the other end); with no `threads`, he only stares: no tutorial,
//                              and the scene ends by itself with "none"
// }
// outcomes: "cut:<id>" | "loosen:<id>" | "tie:<a>+<b>" (in the order of `ties`) | "none"

import { drawFrame, SIGN, SIGN_RING_RADIUS } from '../fxSprites';
import { drawEmblem, emblemLoaded } from '../threadEmblems';
import { drawYarn } from '../yarn';
import { drawLimb } from './arms';
import { ACTION } from './input';
import { Tutorial } from './tutorial';
import { clamp, drawHints, drawImageFit, drawLabel, tutorialLabels, W, H, type Minigame, type MinigameContext, type MinigameFactory } from './types';

type P = [number, number];
type Gesture = 'cut' | 'loosen' | 'tie';

interface ThreadSpec {
  id: string;
  label: string;
  angle: number;
  allow: Gesture[];
  ghost?: boolean;
}

/** Length of a thread from the chest (px) and how close the hand must be to touch it. */
const REACH = 560;
const TOUCH = 30;
/** Seconds resting on a thread to loosen it. */
const LOOSEN_SECONDS = 1.6;
/** Seconds of the gesture's animation before the scene ends. */
const SETTLE = 1.8;
/** With nothing to touch, how long he stares before giving up. */
const STARE = 4.5;

/** Distance from point p to segment ab, and the position (0..1) along it. */
export function segmentDistance(p: P, a: P, b: P): { d: number; t: number } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy || 1;
  const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2, 0, 1);
  return { d: Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t)), t };
}

/** Whether segments pq and ab cross. */
export function segmentsCross(p: P, q: P, a: P, b: P): boolean {
  const o = (u: P, v: P, w: P) => Math.sign((v[0] - u[0]) * (w[1] - u[1]) - (v[1] - u[1]) * (w[0] - u[0]));
  return o(p, q, a) !== o(p, q, b) && o(a, b, p) !== o(a, b, q);
}

/** The outcome id of a tie, with the pair in the order the content lists it. */
export function tieOutcome(a: string, b: string, ties: [string, string][]): string | null {
  const pair = ties.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
  return pair ? `tie:${pair[0]}+${pair[1]}` : null;
}

export const createThreads: MinigameFactory = (params, ctx: MinigameContext): Minigame => {
  const specs = (params.threads ?? []) as ThreadSpec[];
  const ties = (params.ties ?? []) as [string, string][];
  const chestParam = params.chest as { x: number; y: number } | undefined;
  const chest: P = [chestParam?.x ?? 960, chestParam?.y ?? 470];
  const input = ctx.input;
  const end = (s: ThreadSpec): P => {
    const a = (s.angle * Math.PI) / 180;
    // Shorter when pointing up or down, so the end and its label stay clear of the hint lines.
    const dy = Math.sin(a);
    const reach = dy > 0 ? Math.min(REACH, (H - 230 - chest[1]) / dy) : dy < 0 ? Math.min(REACH, (chest[1] - 210) / -dy) : REACH;
    return [chest[0] + Math.cos(a) * reach, chest[1] + dy * reach];
  };
  const hand: P = [W / 2, H - 160];
  let last: P = [...hand];
  let hovered: ThreadSpec | null = null;
  let restOn: ThreadSpec | null = null;
  let rest = 0;
  let dragging: ThreadSpec | null = null;
  let pressedOnEmpty = false;
  let shiver: { id: string; at: number } | null = null;
  let done: { gesture: Gesture | 'none'; ids: string[]; at: number; outcome: string } | null = null;
  let elapsed = 0;
  let wasDown = false;

  const rising = Number(params.rising ?? 0);
  const tutorial = ctx.tutorial && specs.length > 0
    ? new Tutorial(
        [
          { text: ctx.t('mg.threads.tut1'), done: () => hovered !== null },
          { text: ctx.t('mg.threads.tut2'), done: () => input.consume(ACTION) },
        ],
        tutorialLabels(ctx.t),
      )
    : null;

  const finish = (gesture: Gesture | 'none', ids: string[], outcome: string) => {
    done = { gesture, ids, at: elapsed, outcome };
  };
  const refuse = (id: string) => {
    shiver = { id, at: elapsed };
  };
  const solid = specs.filter((s) => !s.ghost);
  const ghosts = specs.filter((s) => s.ghost);
  /** The hand over a ghost thread (it can't hold it): the hint shows by the hand. */
  const throughGhost = (p: P): boolean => ghosts.some((s) => {
    const { d, t } = segmentDistance(p, chest, end(s));
    return t > 0.12 && d < TOUCH * 1.6;
  });
  const threadAt = (p: P): ThreadSpec | null => {
    let best: ThreadSpec | null = null;
    let bestD = TOUCH;
    for (const s of solid) {
      const { d, t } = segmentDistance(p, chest, end(s));
      if (t > 0.12 && d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  };

  return {
    update(dt) {
      elapsed += dt;
      if (input.mouse.moved) {
        hand[0] = input.mouse.x;
        hand[1] = input.mouse.y;
        input.mouse.moved = false;
      }
      const down = input.mouse.down;
      hovered = threadAt(hand);
      if (tutorial?.active) {
        tutorial.update(dt, input.consume(['Enter']));
        last = [...hand];
        wasDown = down;
        input.endFrame();
        return null;
      }
      if (done) {
        input.endFrame();
        return elapsed - done.at > SETTLE ? { outcome: done.outcome, earned: [] } : null;
      }
      // Leave them be (or, with nothing to touch, give up after staring).
      if (input.consume(ACTION) || input.consumeRightClick() || (specs.length === 0 && elapsed > STARE)) {
        finish('none', [], 'none');
        input.endFrame();
        return null;
      }
      // Pressing: on a thread = start a tie; on empty space = the blade is out.
      if (down && !wasDown) {
        dragging = hovered;
        pressedOnEmpty = hovered === null;
      }
      if (down && pressedOnEmpty) {
        // The blade crosses a thread: cut (it goes through a ghost thread).
        for (const s of solid) {
          if (segmentsCross(last, hand, chest, end(s)) && Math.hypot(hand[0] - last[0], hand[1] - last[1]) > 4) {
            if (s.allow.includes('cut')) finish('cut', [s.id], `cut:${s.id}`);
            else refuse(s.id);
            break;
          }
        }
      }
      if (!down && wasDown && dragging) {
        // Released over another thread: tie.
        const target = hovered;
        if (target && target !== dragging) {
          const outcome = dragging.allow.includes('tie') && target.allow.includes('tie') ? tieOutcome(dragging.id, target.id, ties) : null;
          if (outcome) finish('tie', [dragging.id, target.id], outcome);
          else refuse(target.id);
        }
        dragging = null;
      }
      if (!down) pressedOnEmpty = false;
      // Resting the open hand on a thread: loosen.
      if (!down && hovered && hovered === restOn) {
        rest += dt;
        if (rest >= LOOSEN_SECONDS) {
          if (hovered.allow.includes('loosen')) finish('loosen', [hovered.id], `loosen:${hovered.id}`);
          else refuse(hovered.id);
          rest = 0;
        }
      } else {
        restOn = down ? null : hovered;
        rest = 0;
      }
      last = [...hand];
      wasDown = down;
      input.endFrame();
      return null;
    },

    draw(c, time) {
      c.fillStyle = '#0c0907';
      c.fillRect(0, 0, W, H);
      const bg = typeof params.backgroundArt === 'string' ? ctx.image(params.backgroundArt) : null;
      if (bg) {
        drawImageFit(c, bg, 'cover');
        c.fillStyle = 'rgba(8, 5, 3, 0.55)';
        c.fillRect(0, 0, W, H);
      }
      // The person, faint, as he sees them when he looks at the threads.
      const person = typeof params.personArt === 'string' ? ctx.image(params.personArt) : null;
      if (person) {
        const s = 860 / person.naturalHeight;
        c.save();
        c.globalAlpha = 0.55;
        c.drawImage(person, chest[0] - (person.naturalWidth * s) / 2, chest[1] - 300, person.naturalWidth * s, person.naturalHeight * s);
        c.restore();
      }
      const age = done ? elapsed - done.at : 0;
      // Threads that rise out of reach, swaying, toward whoever holds them from above.
      for (let i = 0; i < rising; i++) {
        const spread = (i - (rising - 1) / 2) * 70;
        const sway = Math.sin(time * 0.7 + i * 1.9) * 18;
        const pts: P[] = [];
        for (let k = 0; k <= 16; k++) {
          const q = k / 16;
          pts.push([chest[0] + spread * q + sway * Math.sin(Math.PI * q), chest[1] - (chest[1] + 60) * q]);
        }
        drawYarn(c, pts, { width: 4, alpha: 0.35 + 0.15 * Math.sin(time * 1.3 + i), fx: { time, state: 'tangle', intensity: 0.4, seed: 31 + i } });
      }
      // Ghost threads: barely there, swaying a little, nothing to hold.
      for (const [i, s] of ghosts.entries()) {
        const e = end(s);
        const sway = Math.sin(time * 0.9 + i * 2.3) * 14;
        const pts: P[] = [];
        for (let k = 0; k <= 12; k++) {
          const q = k / 12;
          pts.push([chest[0] + (e[0] - chest[0]) * q + sway * Math.sin(Math.PI * q), chest[1] + (e[1] - chest[1]) * q]);
        }
        drawYarn(c, pts, { width: 5, alpha: 0.2 + 0.06 * Math.sin(time * 1.7 + i), fibres: false });
      }
      for (const s of solid) {
        const e = end(s);
        const isDone = done?.ids.includes(s.id) ?? false;
        const shake = shiver && shiver.id === s.id && elapsed - shiver.at < 0.5 ? Math.sin(time * 70) * 6 * (1 - (elapsed - shiver.at) / 0.5) : 0;
        const lit = hovered === s || dragging === s;
        if (isDone && done?.gesture === 'cut') {
          // Cut: the two halves recoil and fall away.
          const q = clamp(age / 1.2, 0, 1);
          const mid: P = [(chest[0] + e[0]) / 2, (chest[1] + e[1]) / 2];
          drawYarn(c, [chest, [mid[0] - (mid[0] - chest[0]) * q * 0.6, mid[1] + 140 * q * q]], { width: 9, alpha: 1 - q * 0.5, fx: { time, state: 'cut' } });
          drawYarn(c, [[mid[0] + (e[0] - mid[0]) * q * 0.4, mid[1] + 160 * q * q], e], { width: 9, alpha: 1 - q, fx: { time, state: 'cut' } });
        } else if (isDone && done?.gesture === 'loosen') {
          // Loosened: it sags.
          const q = clamp(age / 1.2, 0, 1);
          const pts: P[] = [];
          for (let i = 0; i <= 24; i++) {
            const k = i / 24;
            pts.push([chest[0] + (e[0] - chest[0]) * k, chest[1] + (e[1] - chest[1]) * k + Math.sin(Math.PI * k) * 120 * q]);
          }
          drawYarn(c, pts, { width: 9, glow: true, fx: { time, state: 'normal', intensity: 0.6 } });
        } else if (isDone && done?.gesture === 'tie' && done.ids[0] === s.id) {
          // Tied: drawn to the other thread's end, with the painted knot where they meet.
          const other = specs.find((o) => o.id === done!.ids[1]);
          const target = other ? end(other) : e;
          const q = clamp(age / 0.9, 0, 1);
          const tip: P = [e[0] + (target[0] - e[0]) * q, e[1] + (target[1] - e[1]) * q];
          drawYarn(c, [chest, tip], { width: 9, glow: true, fx: { time, state: 'tie' } });
          if (q >= 1 && emblemLoaded('tie')) drawEmblem(c, 'tie', target[0], target[1], 70, 1, Math.atan2(target[1] - chest[1], target[0] - chest[0]));
        } else {
          const tip: P = dragging === s ? [...hand] : [e[0] + shake, e[1]];
          drawYarn(c, [chest, tip], { width: lit ? 11 : 8, glow: lit, alpha: done ? 0.5 : 1, fx: { time, state: 'normal', intensity: lit ? 1 : 0.55, seed: s.angle } });
        }
        // The label at the far end of each thread.
        c.save();
        c.textAlign = 'center';
        c.font = `italic ${lit ? 36 : 30}px "Cormorant Garamond", Georgia, serif`;
        c.fillStyle = lit ? '#fff1c8' : 'rgba(241, 227, 207, 0.75)';
        c.shadowColor = 'rgba(0, 0, 0, 0.9)';
        c.shadowBlur = 8;
        const lx = e[0] + Math.cos((s.angle * Math.PI) / 180) * 50;
        const ly = e[1] + Math.sin((s.angle * Math.PI) / 180) * 40 + 10;
        c.fillText(ctx.t(s.label), lx, ly);
        c.restore();
      }
      // Where they all leave the person: a painted spark.
      drawFrame(c, 'fx.signs', SIGN.star, chest[0], chest[1], 0.2, { alpha: 0.8, composite: 'lighter', rotation: time * 0.3 });
      // Resting to loosen: the painted brush ring fills like a clock.
      if (rest > 0.1 && restOn && !done) {
        c.save();
        c.beginPath();
        c.moveTo(hand[0], hand[1]);
        c.arc(hand[0], hand[1], 90, -Math.PI / 2, -Math.PI / 2 + (rest / LOOSEN_SECONDS) * Math.PI * 2);
        c.closePath();
        c.clip();
        drawFrame(c, 'fx.signs', SIGN.ring, hand[0], hand[1], 60 / SIGN_RING_RADIUS, { composite: 'lighter' });
        c.restore();
      }
      // His right hand, reaching in from below: the small sickle out while pressing on empty space,
      // the open hand otherwise. Until the paintings load, a painted sign (and the Moirai's shears).
      if (!done) {
        const blade = input.mouse.down && dragging === null;
        const from = { x: hand[0] + 320, y: H + 420 };
        if (!drawLimb(c, blade ? 'fp.theron.blade' : 'fp.theron.open', from, { x: hand[0], y: hand[1] }, 150, false)) {
          drawFrame(c, 'fx.signs', blade ? SIGN.star : SIGN.ring, hand[0], hand[1], blade ? 0.12 : 0.18, { alpha: 0.9, composite: 'lighter' });
          if (blade && emblemLoaded('cut')) drawEmblem(c, 'cut', hand[0], hand[1], 120, 0.9, -0.5);
        }
      }
      // Passing through a ghost thread: a line by the hand.
      if (!done && typeof params.ghostHint === 'string' && throughGhost(hand)) {
        c.save();
        c.font = 'italic 30px "Cormorant Garamond", Georgia, serif';
        drawLabel(c, ctx.t(params.ghostHint), hand[0], hand[1] - 110, 'rgba(241, 227, 207, 0.9)');
        c.restore();
      }
      if (tutorial?.active) tutorial.draw(c, time);
      else drawHints(c, ctx.t(String(params.hint ?? 'mg.threads.hint')), done || specs.length === 0 ? undefined : ctx.t('mg.threads.controls'));
    },
  };
};
