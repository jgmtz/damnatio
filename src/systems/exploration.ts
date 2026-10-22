// Player-controlled walking along the frieze (GDD 8.4). Arrow keys / A-D walk, a click on the
// scene walks to that point, Shift sneaks (slower, quieter). E (or clicking the prompt) examines
// a nearby object. Watchers can catch the walker (light stealth); reaching an exit ends the node.
// In the labyrinth (Asterion): sounds show as rings of ink, F sniffs (the threads show on the floor
// for a few seconds), and a high era makes the walk lurch.

import type { ExplorationNode, Hotspot, Watcher } from '../engine/types';
import { el } from '../ui/dom';
import { GROUND_Y, type Figure } from '../ui/figure';
import type { Stage } from '../ui/stage';
import { drawFrame, SIGN, SIGN_ARCH, SIGN_RING_RADIUS } from './fxSprites';
import { hatchPattern } from './hatch';
import { drawSpark } from './threadFx';
import { drawYarn } from './yarn';

/** Characters can't walk closer than this to the frieze edges. */
const EDGE_MARGIN = 120;
/** How far ahead the walk target is placed while a key is held. */
const LOOKAHEAD = 200;
/** Distance at which a hotspot can be examined. */
const HOTSPOT_RANGE = 90;
const SNEAK_FACTOR = 0.45;
/** How close to a niche's x the walker must stand to hide in it. */
const NICHE_RANGE = 80;
/** Niche outline: half width and height where the arch begins, matching the doorways painted in the walls. */
const NICHE_HALF = 155;
const NICHE_SPRING = 222;
/** How long the threads stay visible after sniffing (s). */
const SCENT_SECONDS = 4.5;
const SCENT_COLORS = {
  path: { color: '#c9962f', light: '#ffe08a' },
  danger: { color: '#9c2a1c', light: '#ff8a6a' },
  person: { color: '#b9a88e', light: '#fff4dc' },
} as const;
/** Detection meter: rises while seen, decays otherwise; 1 = caught. */
const DETECT_DECAY = 0.8;
/** Seconds before an awake watcher turns around during which the turn is announced. */
const TURN_WARNING = 1.1;
/** Guiding by sound: how long a punch lasts, and how far from the knock the follower stops. */
const PUNCH_SECONDS = 0.45;
/** A line said while walking starts when the walker comes this close (px) to its x. */
const BARK_RANGE = 180;
const FOLLOW_SHORT = 260;
/** A sound goes quiet when the walker comes this close (px), fading over SOUND_FADE seconds. */
const SOUND_REACH = 120;
const SOUND_FADE = 0.9;
/** A frightened follower stays down at least this long, even if knocked for again. */
const FEAR_SECONDS = 1.2;

interface GuideState {
  mode: 'down' | 'follow' | 'scared';
  /** World x he limps toward (the last knock, stopping short of it). */
  target: number | null;
  /** When the current mode began (exploration clock). */
  since: number;
  /** Knocks so far: where and when, for the rings of sound. */
  knocks: { x: number; at: number }[];
  /** How many captions have been shown. */
  captions: number;
  caption: { text: string; until: number } | null;
}

export interface ExplorationSetup {
  character: string;
  hint: string;
  exits: { id: string; from: number; to: number; by?: string }[];
  hotspots: Hotspot[];
  watchers: Watcher[];
  guide?: ExplorationNode['guide'];
  sounds?: ExplorationNode['sounds'];
  scent?: ExplorationNode['scent'];
  niches?: number[];
  /** Asterion's beast level: from 3 on, the walk lurches. */
  fera?: number;
  /** Lines said while walking (already filtered by their conditions; text already translated). */
  barks?: { x: number; speaker: string; text: string }[];
}

export interface ExplorationCallbacks {
  /** `others`: where anyone else who moved ended up (a guided follower). */
  onExit: (exitId: string, x: number, others?: Record<string, number>) => void;
  onInspect: (hotspotId: string) => void;
  onCaught: (x: number) => void;
  /** The walker sniffed (F): the game applies the scent's price. */
  onSniff?: () => void;
}

/**
 * How fast a watcher notices the walker (meter units per second); 0 = not seen.
 * Awake watchers see what is in front of them within range (sneaking only slows them down).
 * Sleeping watchers notice anyone walking normally (not sneaking) nearby, on both sides.
 */
export function detectionRate(
  watcher: Pick<Watcher, 'range' | 'asleep'>,
  watcherX: number,
  facing: 'left' | 'right',
  walkerX: number,
  walking: boolean,
  sneaking: boolean,
): number {
  const dx = walkerX - watcherX;
  const dist = Math.abs(dx);
  if (dist > watcher.range) return 0;
  // A sleeper stirs slowly (about 2 s of noise nearby wakes her), so a careless step can be corrected.
  if (watcher.asleep) return walking && !sneaking ? 0.45 : 0;
  const inFront = facing === 'right' ? dx >= 0 : dx <= 0;
  if (!inFront) return 0;
  // Closer = noticed faster.
  const closeness = 1 - dist / watcher.range;
  return (sneaking ? 0.35 : 0.9) * (0.5 + closeness);
}

export class ExplorationController {
  private active: { setup: ExplorationSetup; callbacks: ExplorationCallbacks } | null = null;
  private direction = 0;
  private keyDriven = false;
  private sneaking = false;
  private inspecting = false;
  private elapsed = 0;
  private nearHotspot: Hotspot | null = null;
  /** Seconds left of visible scent trails. */
  private scentLeft = 0;
  /** The walker has moved since the exploration began. */
  private moved = false;
  private guide: GuideState | null = null;
  /** Exploration clock time until which the walker is punching the wall. */
  private punchUntil = 0;
  private readonly meters = new Map<string, number>();
  private readonly baseFacing = new Map<string, 'left' | 'right'>();
  private readonly prompt: HTMLButtonElement;
  /** Speech balloon of the line being said while walking (ExplorationSetup.barks). */
  private readonly balloon: HTMLDivElement;
  private readonly barksSaid = new Set<number>();
  /** Sounds the walker has reached (index → exploration clock when reached): they fade and stop. */
  private readonly soundsReached = new Map<number, number>();
  private bark: { speaker: string; until: number } | null = null;

  constructor(
    private readonly stage: Stage,
    private readonly hint: HTMLElement,
    parent: HTMLElement,
    private readonly isPaused: () => boolean,
    private readonly t: (key: string) => string,
  ) {
    this.prompt = el('button', { class: 'inspect-prompt hidden' });
    this.prompt.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.nearHotspot) this.inspectNear();
      else this.knock();
    });
    this.balloon = el('div', { class: 'bark hidden' });
    parent.append(this.prompt, this.balloon);
    stage.onUpdate((dt) => this.update(dt));
    stage.onDraw((ctx, cameraX, time) => this.draw(ctx, cameraX, time));
    stage.root.addEventListener('click', (e) => this.onClick(e));
  }

  get isActive(): boolean {
    return this.active !== null;
  }

  start(setup: ExplorationSetup, callbacks: ExplorationCallbacks): void {
    this.active = { setup, callbacks };
    this.direction = 0;
    this.sneaking = false;
    this.inspecting = false;
    this.elapsed = 0;
    this.scentLeft = 0;
    this.moved = false;
    this.punchUntil = 0;
    this.guide = setup.guide ? { mode: 'down', target: null, since: 0, knocks: [], captions: 0, caption: null } : null;
    this.meters.clear();
    this.baseFacing.clear();
    this.barksSaid.clear();
    this.soundsReached.clear();
    this.bark = null;
    this.balloon.classList.add('hidden');
    this.hint.textContent = setup.hint;
    this.hint.classList.remove('hidden');
  }

  stop(): void {
    const active = this.active;
    this.active = null;
    this.direction = 0;
    this.hint.classList.add('hidden');
    this.prompt.classList.add('hidden');
    this.balloon.classList.add('hidden');
    this.bark = null;
    if (active) {
      const walker = this.stage.figure(active.setup.character);
      if (walker) {
        walker.speedFactor = 1;
        walker.poseOverride = null;
      }
      for (const w of active.setup.watchers) {
        const figure = this.stage.figure(w.id);
        if (figure) figure.facingOverride = null;
      }
      const follower = active.setup.guide ? this.stage.figure(active.setup.guide.follower) : undefined;
      if (follower) {
        follower.speedFactor = 1;
        follower.poseOverride = null;
        follower.targetX = follower.x;
      }
    }
    this.guide = null;
  }

  /** Asterion punches the wall where he stands: a knock the follower hears. */
  private knock(): void {
    const active = this.active;
    const guide = this.guide;
    if (!active || !guide || !active.setup.guide) return;
    const walker = this.stage.figure(active.setup.character);
    const follower = this.stage.figure(active.setup.guide.follower);
    if (!walker || !follower || this.elapsed < this.punchUntil) return;
    walker.targetX = walker.x;
    this.punchUntil = this.elapsed + PUNCH_SECONDS;
    guide.knocks.push({ x: walker.x, at: this.elapsed });
    // He limps toward the sound, stopping short of where it came from (he doesn't want to meet it).
    const side = Math.sign(walker.x - follower.x) || 1;
    const target = this.clampX(walker.x - side * FOLLOW_SHORT);
    if (guide.mode === 'scared' && this.elapsed - guide.since < FEAR_SECONDS) return;
    const startsMoving = guide.mode !== 'follow';
    guide.mode = 'follow';
    guide.since = this.elapsed;
    guide.target = target;
    const captions = active.setup.guide.captions ?? [];
    if (startsMoving && guide.captions < captions.length) {
      guide.caption = { text: this.t(captions[guide.captions]!), until: this.elapsed + 4.5 };
      guide.captions++;
    }
  }

  /** The guided follower: lies frightened, limps toward the knocks, drops when the beast comes at him. */
  private updateGuide(walker: Figure, dt: number): boolean {
    const active = this.active!;
    const guide = this.guide;
    const setup = active.setup.guide;
    if (!guide || !setup) return false;
    const follower = this.stage.figure(setup.follower);
    if (!follower) return false;
    void dt;
    const toward = Math.sign(follower.x - walker.x);
    const approaching = walker.isWalking && Math.sign(walker.targetX - walker.x) === toward;
    const distance = Math.abs(follower.x - walker.x);
    if (guide.mode === 'follow' && approaching && distance < (setup.fearRange ?? 420)) {
      guide.mode = 'scared';
      guide.since = this.elapsed;
      guide.target = null;
    }
    if (guide.mode === 'follow' && guide.target !== null) {
      // Limping: the pace comes and goes with each step.
      follower.speedFactor = (setup.speed ?? 0.45) * (0.7 + 0.45 * Math.abs(Math.sin(this.elapsed * 3.4)));
      follower.targetX = guide.target;
      // Up on his feet (the scene may have left him lying down).
      follower.poseOverride = follower.character.defaultPose ?? (follower.character.poses.idle ? 'idle' : null);
    } else {
      follower.targetX = follower.x;
      follower.poseOverride = follower.character.poses.fallen ? 'fallen' : null;
    }
    // The way out is reached by the follower.
    const exit = active.setup.exits.find((e) => e.by === setup.follower && follower.x >= e.from && follower.x <= e.to);
    if (exit) {
      walker.targetX = walker.x;
      const others = { [setup.follower]: Math.round(follower.x) };
      const callbacks = active.callbacks;
      this.stop();
      callbacks.onExit(exit.id, Math.round(walker.x), others);
      return true;
    }
    return false;
  }

  /** Called by the game while an examined object's lines are on screen. */
  setInspecting(value: boolean): void {
    this.inspecting = value;
  }

  /** Returns true if the key was used by the exploration. */
  onKey(e: KeyboardEvent, down: boolean): boolean {
    if (!this.active || this.inspecting) return false;
    if (e.key === 'Shift') {
      this.sneaking = down;
      return true;
    }
    if (down && (e.key === 'e' || e.key === 'E')) {
      if (this.nearHotspot) this.inspectNear();
      else if (!e.repeat) this.knock();
      return true;
    }
    if ((e.key === 'f' || e.key === 'F') && this.active.setup.scent) {
      if (down && !e.repeat && this.scentLeft <= 0) {
        this.scentLeft = SCENT_SECONDS;
        this.active.callbacks.onSniff?.();
      }
      return true;
    }
    const dir = e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? -1
      : e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ? 1
      : 0;
    if (dir === 0) return false;
    if (down) {
      this.direction = dir;
      this.keyDriven = true;
    } else if (this.direction === dir) {
      this.direction = 0;
    }
    e.preventDefault();
    return true;
  }

  private inspectNear(): void {
    if (!this.active || this.inspecting || !this.nearHotspot) return;
    const walker = this.stage.figure(this.active.setup.character);
    if (walker) walker.targetX = walker.x;
    this.active.callbacks.onInspect(this.nearHotspot.id);
  }

  private onClick(e: MouseEvent): void {
    if (!this.active || this.isPaused() || this.inspecting) return;
    const figure = this.stage.figure(this.active.setup.character);
    if (!figure) return;
    this.keyDriven = false;
    figure.targetX = this.clampX(this.stage.toWorldX(e.clientX));
  }

  private clampX(x: number): number {
    return Math.min(Math.max(EDGE_MARGIN, x), this.stage.width - EDGE_MARGIN);
  }

  /**
   * Lines said while walking: passing a bark's x makes its speaker say it in a balloon over their
   * head (one at a time, each once), which follows them and fades after a reading time.
   */
  private updateBarks(setup: ExplorationSetup, walkerX: number): void {
    const barks = setup.barks ?? [];
    if (this.bark && this.elapsed >= this.bark.until) {
      this.bark = null;
      this.balloon.classList.add('hidden');
    }
    if (!this.bark) {
      const i = barks.findIndex((b, index) => !this.barksSaid.has(index) && Math.abs(b.x - walkerX) <= BARK_RANGE && this.stage.figure(b.speaker));
      const next = barks[i];
      if (next) {
        this.barksSaid.add(i);
        this.bark = { speaker: next.speaker, until: this.elapsed + 2.2 + next.text.length * 0.045 };
        this.balloon.textContent = next.text;
        this.balloon.classList.remove('hidden');
      }
    }
    if (this.bark) {
      const speaker = this.stage.figure(this.bark.speaker);
      if (!speaker) return;
      this.balloon.style.left = `${Math.min(1920 - 300, Math.max(300, speaker.screenX))}px`;
      this.balloon.style.top = `${Math.max(80, speaker.topY - 30)}px`;
    }
  }

  private update(dt: number): void {
    const active = this.active;
    if (!active) return;
    const { setup, callbacks } = active;
    const figure = this.stage.figure(setup.character);
    if (!figure) return;

    if (this.isPaused() || this.inspecting) {
      figure.targetX = figure.x;
      const follower = setup.guide ? this.stage.figure(setup.guide.follower) : undefined;
      if (follower) follower.targetX = follower.x;
      return;
    }
    this.elapsed += dt;
    this.scentLeft = Math.max(0, this.scentLeft - dt);
    figure.speedFactor = this.sneaking ? SNEAK_FACTOR : 1;
    // The beast pulls: from fera 3 on, the walk comes in lurches.
    const fera = setup.fera ?? 0;
    if (fera >= 3) figure.speedFactor *= 1 + Math.sin(this.elapsed * 7) * Math.min(0.75, (fera - 2) * 0.25);
    const punching = this.elapsed < this.punchUntil;
    if (punching) {
      figure.targetX = figure.x;
    } else if (this.direction !== 0) {
      figure.targetX = this.clampX(figure.x + this.direction * LOOKAHEAD);
    } else if (this.keyDriven) {
      // Key released: stop where we are.
      figure.targetX = figure.x;
      this.keyDriven = false;
    }

    // Objects to examine.
    this.nearHotspot = setup.hotspots.find((h) => Math.abs(h.x - figure.x) <= HOTSPOT_RANGE) ?? null;
    if (this.nearHotspot) {
      this.prompt.textContent = `E — ${this.t('ui.examine')} ${this.t(this.nearHotspot.label)}`;
      this.prompt.classList.remove('hidden');
    } else if (this.guide) {
      this.prompt.textContent = `E — ${this.t('ui.knock')}`;
      this.prompt.classList.remove('hidden');
    } else {
      this.prompt.classList.add('hidden');
    }

    this.updateBarks(setup, figure.x);
    // A sound the walker reaches is answered: it stops, so the player knows to go on.
    (setup.sounds ?? []).forEach((sound, i) => {
      if (!this.soundsReached.has(i) && Math.abs(sound.x - figure.x) <= SOUND_REACH) this.soundsReached.set(i, this.elapsed);
    });

    // Niches: standing still inside one, he crouches and can't be seen.
    const hidden = !figure.isWalking && (setup.niches ?? []).some((n) => Math.abs(n - figure.x) <= NICHE_RANGE);
    // Once he has walked, he stops in his plain standing pose, not the one the scene began with
    // (Asterion kept stopping hunched in "listen", as if sniffing).
    if (figure.isWalking) this.moved = true;
    const punchPose = punching && figure.character.poses.reach ? 'reach' : null;
    figure.poseOverride = punchPose ?? (hidden ? 'hide' : this.moved ? (figure.character.defaultPose ?? null) : null);

    if (this.updateGuide(figure, dt)) return;

    // Watchers.
    for (const w of setup.watchers) {
      const watcher = this.stage.figure(w.id);
      if (!watcher) continue;
      if (w.turnEvery && !w.asleep) {
        if (!this.baseFacing.has(w.id)) this.baseFacing.set(w.id, watcher.facing);
        const initial = this.baseFacing.get(w.id)!;
        const turned = Math.floor(this.elapsed / w.turnEvery) % 2 === 1;
        watcher.facingOverride = turned ? (initial === 'right' ? 'left' : 'right') : initial;
      }
      const rate = hidden ? 0 : detectionRate(w, watcher.x, watcher.facing, figure.x, figure.isWalking, this.sneaking);
      const meter = Math.max(0, (this.meters.get(w.id) ?? 0) + (rate > 0 ? rate * dt : -DETECT_DECAY * dt));
      this.meters.set(w.id, meter);
      if (meter >= 1) {
        figure.targetX = figure.x;
        this.stop();
        callbacks.onCaught(Math.round(figure.x));
        return;
      }
    }

    const exit = setup.exits.find((e) => !e.by && figure.x >= e.from && figure.x <= e.to);
    if (exit) {
      figure.targetX = figure.x;
      this.stop();
      callbacks.onExit(exit.id, Math.round(figure.x));
    }
  }

  /** Hotspot glints, sounds, scent trails, watchers' sight and alarm. Screen space. */
  private draw(ctx: CanvasRenderingContext2D, cameraX: number, time: number): void {
    const active = this.active;
    if (!active) return;
    this.drawSounds(ctx, cameraX, active.setup.sounds ?? []);
    this.drawNiches(ctx, cameraX, time, active.setup.niches ?? []);
    if (this.scentLeft > 0 && active.setup.scent) this.drawScent(ctx, cameraX, time, active.setup.scent.trails);
    this.drawGuide(ctx, cameraX);
    for (const h of active.setup.hotspots) {
      const near = this.nearHotspot === h;
      const x = h.x - cameraX;
      const pulse = 0.5 + Math.sin(time * 3 + h.x) * 0.5;
      if (drawFrame(ctx, 'fx.signs', SIGN.star, x, 640, (near ? 0.34 : 0.22) * (0.9 + 0.1 * pulse), { alpha: near ? 1 : 0.4 + pulse * 0.35, composite: 'lighter', rotation: Math.sin(time * 0.7 + h.x) * 0.15 })) continue;
      ctx.save();
      ctx.globalAlpha = near ? 1 : 0.35 + pulse * 0.35;
      ctx.fillStyle = '#ffd36a';
      ctx.shadowColor = '#ff9a2a';
      ctx.shadowBlur = near ? 18 : 8;
      ctx.beginPath();
      // A four-pointed glint.
      const y = 640;
      const r = near ? 14 : 9;
      ctx.moveTo(x, y - r * 2);
      ctx.lineTo(x + r * 0.4, y - r * 0.4);
      ctx.lineTo(x + r * 2, y);
      ctx.lineTo(x + r * 0.4, y + r * 0.4);
      ctx.lineTo(x, y + r * 2);
      ctx.lineTo(x - r * 0.4, y + r * 0.4);
      ctx.lineTo(x - r * 2, y);
      ctx.lineTo(x - r * 0.4, y - r * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    for (const w of active.setup.watchers) {
      const watcher = this.stage.figure(w.id);
      if (!watcher) continue;
      const x = watcher.x - cameraX;
      const eyeY = watcher.topY + 40;
      ctx.save();
      if (!w.asleep) {
        // Cone of sight.
        const dir = watcher.facing === 'right' ? 1 : -1;
        // Cone of sight: the light he looks with, engraved as golden hatching (pedidos 4.4).
        const lit = hatchPattern(ctx, 'light', '#e8c27a');
        ctx.beginPath();
        ctx.moveTo(x, eyeY);
        ctx.lineTo(x + dir * w.range, eyeY - 120);
        ctx.lineTo(x + dir * w.range, 860);
        ctx.lineTo(x, 860);
        ctx.closePath();
        if (lit) {
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = lit;
        } else {
          ctx.fillStyle = 'rgba(255, 220, 140, 0.12)';
        }
        ctx.fill();
        ctx.globalAlpha = 1;
        // About to turn around: a "?" flickers over the head.
        if (w.turnEvery) {
          const untilTurn = w.turnEvery - (this.elapsed % w.turnEvery);
          if (untilTurn < TURN_WARNING && Math.floor(time * 8) % 2 === 0) {
            ctx.fillStyle = '#ffd36a';
            ctx.font = '600 46px Cinzel, Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText('?', x, eyeY - 90);
          }
        }
      } else {
        ctx.fillStyle = 'rgba(241, 227, 207, 0.5)';
        ctx.font = 'italic 26px "Cormorant Garamond", Georgia, serif';
        ctx.fillText('z', x + 10, eyeY - 30 - ((time * 12) % 20));
        // She is stirring and the walker is not sneaking: say what to do.
        if ((this.meters.get(w.id) ?? 0) > 0.05 && !this.sneaking) {
          ctx.fillStyle = '#ffe3a8';
          ctx.font = '600 30px "Cormorant Garamond", Georgia, serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 8;
          ctx.fillText(this.t('ui.sneakWarn'), x, eyeY - 120);
        }
      }
      // Alarm: an eye that opens as the meter fills.
      const meter = Math.min(1, this.meters.get(w.id) ?? 0);
      if (meter > 0.02 && drawFrame(ctx, 'fx.signs', SIGN.eye, x, eyeY - 70, 0.36, { stretchY: 0.15 + meter * 0.85, alpha: 0.45 + meter * 0.55 })) {
        // the painted eye opens as he notices
      } else if (meter > 0.02) {
        ctx.strokeStyle = `rgba(255, ${Math.round(200 - meter * 150)}, 80, ${0.4 + meter * 0.6})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(x, eyeY - 70, 22, 4 + meter * 14, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /**
   * Guiding by sound: the knocks spread as rings from the wall, dust falls from the fist; over the
   * follower, "!" when he drops in fear, his line when he gets up; an arrow at the screen edge
   * when he is out of view.
   */
  private drawGuide(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const guide = this.guide;
    const setup = this.active?.setup.guide;
    if (!guide || !setup) return;
    ctx.save();
    ctx.lineCap = 'round';
    for (const k of guide.knocks) {
      const age = this.elapsed - k.at;
      if (age > 1.6) continue;
      const x = k.x - cameraX + 40;
      const y = 560;
      for (let i = 0; i < 3; i++) {
        const p = (age - i * 0.18) / 1.2;
        if (p <= 0 || p >= 1) continue;
        const r = 20 + p * 420;
        if (drawFrame(ctx, 'fx.signs', SIGN.ring, x, y, r / SIGN_RING_RADIUS, { stretchY: 0.7, alpha: (1 - p) * 0.95, rotation: i * 1.3 + k.at })) continue;
        ctx.globalAlpha = (1 - p) * 0.9;
        ctx.strokeStyle = '#e6be6e';
        ctx.lineWidth = 5 * (1 - p) + 1;
        ctx.setLineDash([26 * (1 - p) + 6, 12]);
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Grit falling from the stone.
      ctx.setLineDash([]);
      for (let i = 0; i < 14; i++) {
        const h = Math.sin(i * 91.7 + k.at * 13) * 0.5 + 0.5;
        const fall = age * age * 420 * (0.6 + h * 0.6);
        drawSpark(ctx, 3 + (i % 3), x + (h - 0.5) * 70, y + fall, 5 + h * 5, Math.max(0, 1 - age / 1.3) * 0.8);
      }
    }
    const follower = this.stage.figure(setup.follower);
    if (follower) {
      const x = follower.x - cameraX;
      const headY = follower.topY + 20;
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 8;
      if (guide.mode === 'scared' && this.elapsed - guide.since < 1.6) {
        ctx.fillStyle = '#ffb08a';
        ctx.font = '600 56px Cinzel, Georgia, serif';
        ctx.fillText('!', x, headY - 40 - Math.min(1, (this.elapsed - guide.since) * 4) * 20);
      }
      if (guide.caption && this.elapsed < guide.caption.until) {
        ctx.globalAlpha = Math.min(1, (guide.caption.until - this.elapsed) / 0.6);
        ctx.fillStyle = '#f1e3cf';
        ctx.font = 'italic 30px "Cormorant Garamond", Georgia, serif';
        const cx = Math.min(1700, Math.max(220, x));
        ctx.fillText(guide.caption.text, cx, Math.max(120, headY - 110));
      }
      // Out of view: where he is.
      if (x < 0 || x > 1920) {
        const left = x < 0;
        const ex = left ? 40 : 1880;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = guide.mode === 'follow' ? '#ffd36a' : '#c8743a';
        ctx.beginPath();
        ctx.moveTo(ex + (left ? -14 : 14), 560);
        ctx.lineTo(ex + (left ? 14 : -14), 540);
        ctx.lineTo(ex + (left ? 14 : -14), 580);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * Sounds made visible: rings of gold ink spreading from each source, squashed like on a floor.
   * A reached sound gives one last wide ring and fades out.
   */
  private drawSounds(ctx: CanvasRenderingContext2D, cameraX: number, sounds: NonNullable<ExplorationSetup['sounds']>): void {
    ctx.save();
    ctx.lineCap = 'round';
    for (const [i, sound] of sounds.entries()) {
      const x = sound.x - cameraX;
      if (x < -400 || x > 2320) continue;
      const y = sound.y ?? 700;
      const every = sound.every ?? 2.2;
      const reachedAt = this.soundsReached.get(i);
      const fade = reachedAt === undefined ? 1 : 1 - (this.elapsed - reachedAt) / SOUND_FADE;
      if (fade <= 0) continue;
      if (reachedAt !== undefined) {
        // The answer: a ring that opens wide and is gone.
        const k = 1 - fade;
        drawFrame(ctx, 'fx.signs', SIGN.ring, x, y, (40 + k * 420) / SIGN_RING_RADIUS, { stretchY: 0.55, alpha: fade, rotation: i });
      }
      for (const offset of [0, 0.5]) {
        const p = (this.elapsed / every + offset + i * 0.37) % 1;
        const r = 18 + p * 280;
        if (drawFrame(ctx, 'fx.signs', SIGN.ring, x, y, r / SIGN_RING_RADIUS, { stretchY: 0.55, alpha: (1 - p) * 0.85 * fade, rotation: i + offset * 2 })) continue;
        ctx.globalAlpha = (1 - p) * 0.85 * fade;
        ctx.strokeStyle = '#e6be6e';
        ctx.lineWidth = 3.5 * (1 - p) + 1;
        ctx.setLineDash([22 * (1 - p) + 6, 10]);
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // The source itself: a small glint.
      ctx.globalAlpha = 1;
      if (drawFrame(ctx, 'fx.signs', SIGN.star, x, y, 0.09, { alpha: 0.7 * fade, composite: 'lighter' })) continue;
      ctx.globalAlpha = 0.6 * fade;
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffe2a0';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Scent: the threads lying on the floor, gold for ways, red for danger, pale for people. */
  private drawScent(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    time: number,
    trails: NonNullable<ExplorationSetup['scent']>['trails'],
  ): void {
    const alpha = Math.min(1, this.scentLeft / 1, (SCENT_SECONDS - this.scentLeft) / 0.4);
    trails.forEach((trail, i) => {
      const points: [number, number][] = [];
      const dir = Math.sign(trail.to - trail.from) || 1;
      const y0 = GROUND_Y - 8 - i * 14;
      for (let x = trail.from; dir > 0 ? x <= trail.to : x >= trail.to; x += dir * 12) {
        points.push([x - cameraX, y0 + Math.sin(x * 0.012 + time * 2 + i) * 9]);
      }
      const colors = SCENT_COLORS[trail.kind];
      drawYarn(ctx, points, { width: 7, alpha, color: colors.color, light: colors.light, glow: true });
    });
  }

  /** Niches: dark hollows in the wall, outlined faintly so the player can find them. */
  private drawNiches(ctx: CanvasRenderingContext2D, cameraX: number, time: number, niches: number[]): void {
    const walker = this.active ? this.stage.figure(this.active.setup.character) : undefined;
    ctx.save();
    for (const n of niches) {
      const x = n - cameraX;
      if (x < -200 || x > 2120) continue;
      const inside = walker !== undefined && Math.abs(n - walker.x) <= NICHE_RANGE;
      const pulse = 0.5 + Math.sin(time * 2 + n) * 0.5;
      ctx.globalAlpha = inside ? 0.9 : 0.35 + pulse * 0.2;
      const archScale = (NICHE_HALF * 2) / SIGN_ARCH.w;
      const archHeight = NICHE_SPRING + NICHE_HALF;
      if (drawFrame(ctx, 'fx.signs', SIGN.arch, x, GROUND_Y - archHeight / 2, archScale, { stretchY: archHeight / (SIGN_ARCH.h * archScale), composite: inside ? 'lighter' : 'source-over' })) continue;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.strokeStyle = inside ? '#ffd36a' : '#c8743a';
      ctx.lineWidth = 3;
      // The shape of the labyrinth's arched doorways (labirinto_camara: ~310 px wide on stage).
      ctx.beginPath();
      ctx.moveTo(x - NICHE_HALF, GROUND_Y);
      ctx.lineTo(x - NICHE_HALF, GROUND_Y - NICHE_SPRING);
      ctx.arc(x, GROUND_Y - NICHE_SPRING, NICHE_HALF, Math.PI, 0);
      ctx.lineTo(x + NICHE_HALF, GROUND_Y);
      if (inside) ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}