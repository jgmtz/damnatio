// The rite's chant (GDD 7.2 "mini-jogo de ritmo"): the flame breathes in a steady pulse; a ring of
// light closes on it each beat. Press (Space / click / W/↑) as the ring touches the flame.
//
// params: { hint?: string key, beats?: number (8), interval?: seconds (0.9) }
// outcomes: "steady" | "wavering" | "broken"

import { drawFlame } from '../flame';
import { drawFrame, SIGN, SIGN_KEY_RING_RADIUS, SIGN_RING_RADIUS } from '../fxSprites';
import { drawArm } from './arms';
import { Tutorial } from './tutorial';
import {
  clamp,
  drawHints,
  drawImageFit,
  fitPoint,
  H,
  tutorialLabels,
  W,
  type Minigame,
  type MinigameContext,
  type MinigameFactory,
} from './types';

const LEAD_IN = 2.0;
/** Where the flame stands (and the rings close): the bowl of the painted altar, or this default. */
const DEFAULT_CENTER = { x: W / 2, y: 620 };
/** Center of the bowl's rim in the altar picture (pedidos-de-arte 2.5), in image pixels. */
const ALTAR_BOWL = { x: 676, y: 250 };

export type BeatResult = 'pending' | 'hit' | 'miss';

export function beatTimes(beats: number, interval: number): number[] {
  return Array.from({ length: beats }, (_, i) => LEAD_IN + i * interval);
}

/** Judge a press at `time`: marks the nearest pending beat within the window as hit. */
export function judgePress(times: number[], results: BeatResult[], time: number, window: number): boolean {
  let best = -1;
  let bestDelta = window;
  times.forEach((t, i) => {
    const delta = Math.abs(t - time);
    if (results[i] === 'pending' && delta <= bestDelta) {
      best = i;
      bestDelta = delta;
    }
  });
  if (best >= 0) results[best] = 'hit';
  return best >= 0;
}

/** Beats whose window has passed without a press become misses. */
export function expireBeats(times: number[], results: BeatResult[], time: number, window: number): void {
  times.forEach((t, i) => {
    if (results[i] === 'pending' && time > t + window) results[i] = 'miss';
  });
}

export function rhythmOutcome(results: BeatResult[]): 'steady' | 'wavering' | 'broken' {
  const ratio = results.filter((r) => r === 'hit').length / results.length;
  if (ratio >= 0.75) return 'steady';
  if (ratio >= 0.4) return 'wavering';
  return 'broken';
}

/** "early" or "late" for a press that matched no beat: compared with the nearest pending beat. */
export function pressTiming(times: number[], results: BeatResult[], time: number): 'early' | 'late' {
  let nearest: number | null = null;
  times.forEach((t, i) => {
    if (results[i] !== 'pending') return;
    if (nearest === null || Math.abs(t - time) < Math.abs(nearest - time)) nearest = t;
  });
  return nearest !== null && time < nearest ? 'early' : 'late';
}

const TARGET_RADIUS = 85;
const PRACTICE_HITS = 2;

export const createRhythm: MinigameFactory = (params, ctx: MinigameContext): Minigame => {
  const beats = Number(params.beats ?? 8);
  const interval = Number(params.interval ?? 0.9) * (ctx.relaxed ? 1.25 : 1);
  const window = ctx.relaxed ? 0.3 : 0.18;
  const input = ctx.input;
  // Real beats; practice beats repeat while the tutorial runs and don't count.
  const times = beatTimes(beats, interval);
  const results: BeatResult[] = times.map(() => 'pending');
  let practiceTimes = beatTimes(60, interval);
  let practiceResults: BeatResult[] = practiceTimes.map(() => 'pending');
  let practiceHits = 0;
  let elapsed = 0;
  let flash = 0;
  let gutter = 0;
  let feedback: { text: string; good: boolean; ttl: number } | null = null;

  const tutorial = ctx.tutorial
    ? new Tutorial(
        [
          { text: ctx.t('mg.rhythm.tut1'), done: () => practiceHits >= PRACTICE_HITS },
          { text: ctx.t('mg.rhythm.tut2'), done: () => input.consume(['Enter']) || input.consumeRightClick() },
        ],
        tutorialLabels(ctx.t),
      )
    : null;

  /** Beats currently in play (practice during the tutorial). */
  const active = () =>
    tutorial?.active ? { times: practiceTimes, results: practiceResults } : { times, results };

  return {
    update(dt) {
      elapsed += dt;
      const { times: ts, results: rs } = active();
      // Space / click / W / ↑ sing; Enter is kept for the tutorial (continue / skip).
      const pressed = input.consume([' ']) || input.consumeClick() || input.consumeUp();
      if (pressed) {
        if (judgePress(ts, rs, elapsed, window)) {
          flash = 1;
          feedback = { text: ctx.t('mg.rhythm.now'), good: true, ttl: 0.6 };
          if (tutorial?.active) practiceHits++;
        } else {
          // A press out of time makes the flame stumble.
          gutter = 1;
          feedback = { text: ctx.t(pressTiming(ts, rs, elapsed) === 'early' ? 'mg.rhythm.early' : 'mg.rhythm.late'), good: false, ttl: 0.6 };
        }
      }
      const before = rs.filter((r) => r === 'miss').length;
      expireBeats(ts, rs, elapsed, window);
      if (rs.filter((r) => r === 'miss').length > before) gutter = 1;
      flash = Math.max(0, flash - dt * 3);
      gutter = Math.max(0, gutter - dt * 2);
      if (feedback) feedback.ttl -= dt;

      if (tutorial?.active) {
        // Enter skips only during the practice step; on the last step it means "start".
        tutorial.update(dt, tutorial.stepIndex === 0 && input.consume(['Enter']));
        if (practiceResults.every((r) => r !== 'pending')) {
          practiceTimes = beatTimes(60, interval).map((t) => t + elapsed);
          practiceResults = practiceTimes.map(() => 'pending');
        }
        if (!tutorial.active) elapsed = 0; // the real chant starts now
        input.endFrame();
        return null;
      }
      input.endFrame();
      if (elapsed > times[times.length - 1]! + 1.2) return { outcome: rhythmOutcome(results), earned: [] };
      return null;
    },
    draw(c, time) {
      const { times: ts, results: rs } = active();
      c.fillStyle = '#0c0907';
      c.fillRect(0, 0, W, H);
      // The altar: the painted one, with the flame on its bowl; or a code drawing until it loads.
      const altar = ctx.image('closeup.altar.chant');
      let CENTER = DEFAULT_CENTER;
      if (altar) {
        drawImageFit(c, altar, 'cover');
        const bowl = fitPoint(altar, 'cover', ALTAR_BOWL.x, ALTAR_BOWL.y);
        CENTER = { x: bowl.x, y: bowl.y - 20 };
        c.fillStyle = 'rgba(8, 4, 2, 0.35)';
        c.fillRect(0, 0, W, H);
      } else {
        c.fillStyle = '#1a120c';
        c.strokeStyle = '#c8743a';
        c.lineWidth = 5;
        c.fillRect(CENTER.x - 260, CENTER.y + 20, 520, 380);
        c.strokeRect(CENTER.x - 260, CENTER.y + 20, 520, 380);
      }
      // The flame breathes with the beat.
      const next = ts.find((t, i) => rs[i] === 'pending' && t >= elapsed - 0.2);
      const phase = next === undefined ? 1 : clamp(1 - (next - elapsed) / interval, 0, 1);
      const intensity = 1 + phase * 0.25 + flash * 0.4 - gutter * 0.5;
      drawFlame(c, CENTER.x, CENTER.y + 20, 220, intensity, time, 4, 'altar');
      // The fixed target: the painted Greek-key ring; press when a ring touches it.
      const target = drawFrame(c, 'fx.signs', SIGN.keyRing, CENTER.x, CENTER.y - 120, TARGET_RADIUS / SIGN_KEY_RING_RADIUS, { alpha: 0.75 + flash * 0.25 });
      if (target && flash > 0) drawFrame(c, 'fx.signs', SIGN.keyRing, CENTER.x, CENTER.y - 120, TARGET_RADIUS / SIGN_KEY_RING_RADIUS, { alpha: flash * 0.8, composite: 'lighter' });
      if (!target) {
      c.save();
      c.strokeStyle = `rgba(255, 211, 106, ${0.75 + flash * 0.25})`;
      c.lineWidth = 5;
      c.shadowColor = '#ff9a2a';
      c.shadowBlur = 10;
      c.setLineDash([10, 8]);
      c.beginPath();
      c.arc(CENTER.x, CENTER.y - 120, TARGET_RADIUS, 0, Math.PI * 2);
      c.stroke();
      c.restore();
      }
      // Closing rings: painted brush rings shrinking onto the target.
      ts.forEach((t, i) => {
        if (rs[i] !== 'pending') return;
        const until = t - elapsed;
        if (until < -window || until > interval * 2.2) return;
        const r = TARGET_RADIUS + Math.max(0, until) * 340;
        const fade = clamp(1 - until / (interval * 2.2), 0, 1);
        if (drawFrame(c, 'fx.signs', SIGN.ring, CENTER.x, CENTER.y - 120, r / SIGN_RING_RADIUS, { alpha: fade, rotation: i * 1.7 })) return;
        c.save();
        c.strokeStyle = `rgba(217, 180, 90, ${clamp(1 - until / (interval * 2.2), 0, 1)})`;
        c.lineWidth = 4;
        c.beginPath();
        c.arc(CENTER.x, CENTER.y - 120, r, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      });
      // Lívia's open hands raised in prayer at both sides, lifting with each good beat.
      const lift = flash * 40 - gutter * 20;
      drawArm(c, { x: 120, y: H + 120 }, { x: 520, y: 620 - lift }, { width: 120, scars: 4, hand: 'open' });
      drawArm(c, { x: W - 120, y: H + 120 }, { x: W - 520, y: 620 - lift }, { width: 120, scars: 3, hand: 'open' });
      if (feedback && feedback.ttl > 0) {
        c.save();
        c.textAlign = 'center';
        c.font = 'italic 40px "Cormorant Garamond", Georgia, serif';
        c.globalAlpha = clamp(feedback.ttl / 0.6, 0, 1);
        c.fillStyle = feedback.good ? '#ffd36a' : '#e0664a';
        c.fillText(feedback.text, CENTER.x, CENTER.y - 250);
        c.restore();
      }
      if (tutorial?.active) {
        tutorial.draw(c, time);
        return;
      }
      // Beads: hits in gold, misses dark.
      results.forEach((r, i) => {
        const bx = W / 2 - ((results.length - 1) * 40) / 2 + i * 40;
        // Hits: a painted star; misses: a dark spiral; still to come: a faint ring.
        const sign = r === 'hit' ? SIGN.star : r === 'miss' ? SIGN.spiral : SIGN.ring;
        if (drawFrame(c, 'fx.signs', sign, bx, H - 150, r === 'hit' ? 0.13 : 0.1, { alpha: r === 'hit' ? 1 : r === 'miss' ? 0.35 : 0.3 })) return;
        c.fillStyle = r === 'hit' ? '#ffd36a' : r === 'miss' ? '#3a2a20' : 'rgba(217, 180, 90, 0.3)';
        c.beginPath();
        c.arc(W / 2 - ((results.length - 1) * 40) / 2 + i * 40, H - 150, 10, 0, Math.PI * 2);
        c.fill();
      });
      drawHints(c, ctx.t(String(params.hint ?? 'mg.rhythm.hint')), ctx.t('mg.rhythm.controls'));
    },
  };
};
