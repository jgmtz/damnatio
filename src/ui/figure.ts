// One character on stage, animated by code on top of whole-pose images (GDD 8.5):
// breathing while still, a two-keyframe walk cycle with bob while moving, and pose normalization
// (scale by head size, anchor at the ground point). Cutout puppets can replace this later.
// Each figure owns a small canvas for the flame over its cup, placed right above its image,
// so the flame always shares the figure's depth (a figure in front also hides its flame).

import type { Character, Pose, StageCharacter } from '../engine/types';
import { drawFlame } from '../systems/flame';
import { el } from './dom';

/** Y of the frieze floor on the stage (matches the ground line of the backgrounds). */
export const GROUND_Y = 860;
const DEFAULT_HEAD_PX_ON_STAGE = 56;
const DEFAULT_BREATHE = { amplitude: 0.006, period: 4.2 };
const DEFAULT_WALK = { speed: 200, stepPeriod: 0.42, bob: 4, frames: ['walk', 'idle'] };
/** Distance (px) under which the figure counts as arrived. */
const ARRIVE_EPSILON = 2;
/** Flame base width relative to the figure scale (a cup rim is ~80 source px wide). */
const FLAME_SIZE = 80;
/** Flame canvas size and where the flame base sits inside it. */
const FLAME_CANVAS = { width: 360, height: 480, baseX: 180, baseY: 400 };

export class Figure {
  readonly img: HTMLImageElement;
  /** Current world x of the ground point. */
  x: number;
  /** Where the figure is walking to. Set by the stage (scripted) or by the exploration controller. */
  targetX: number;
  /** Walking speed multiplier (sneaking = slower). */
  speedFactor = 1;
  /** Facing forced by a system (e.g. a watcher turning around); null = the scene's facing. */
  facingOverride: 'left' | 'right' | null = null;
  /** Pose forced by a system while standing (e.g. hiding in a niche); null = the scene's pose. */
  poseOverride: string | null = null;
  /** 0–1; below 1 while the figure fades away (leaving a dark scene, or after a long walk off). */
  opacity = 1;
  /** 0–1: how much of him the world still holds (Théron's presence; 1 for everyone else). */
  presence = 1;
  /** CSS filter tinting this figure's flame (Lívia's seal: bluer with truth, redder with secrets). */
  flameFilter = '';
  private appliedFlameFilter = '';

  private readonly flameCanvas: HTMLCanvasElement;
  private readonly flameCtx: CanvasRenderingContext2D;
  private placed: StageCharacter;
  private walking = false;
  private stepTime = 0;
  private readonly phase = Math.random() * 10;
  private flame = 0;
  /** Screen position and strength of this figure's flame (a light source), or null. Set by apply(). */
  light: { x: number; y: number; intensity: number; size: number } | null = null;
  /** Screen x of the ground point. Set by apply(). */
  screenX = 0;
  // Values computed in update() and used by apply().
  private pose: Pose | null = null;
  private scale = 1;
  private flip = 1;
  private bob = 0;
  private breath = 1;

  constructor(
    readonly character: Character,
    placed: StageCharacter,
    private readonly artUrl: (artId: string) => string | null,
  ) {
    this.placed = placed;
    this.x = placed.x;
    this.targetX = placed.x;
    this.flame = placed.flame ?? 0;
    this.img = el('img', { class: 'figure', attrs: { alt: '', draggable: 'false' } });
    this.flameCanvas = el('canvas', {
      class: 'figure-flame',
      attrs: { width: String(FLAME_CANVAS.width), height: String(FLAME_CANVAS.height) },
    });
    this.flameCtx = this.flameCanvas.getContext('2d')!;
  }

  mount(parent: HTMLElement): void {
    parent.append(this.img, this.flameCanvas);
  }

  unmount(): void {
    this.img.remove();
    this.flameCanvas.remove();
  }

  get isWalking(): boolean {
    return this.walking;
  }

  /** Direction the figure is currently looking. */
  get facing(): 'left' | 'right' {
    return this.flip < 0 ? 'left' : 'right';
  }

  /** Width of the soft shadow under the figure (0 for invisible props). */
  get shadowWidth(): number {
    if (!this.pose || this.character.shadow === false) return 0;
    return (this.character.headPxOnStage ?? DEFAULT_HEAD_PX_ON_STAGE) * 2.6;
  }

  /** Approximate head height on the stage (for drawing things above a figure). */
  get topY(): number {
    return GROUND_Y - (this.character.headPxOnStage ?? DEFAULT_HEAD_PX_ON_STAGE) * 8;
  }

  /** New placement from the scene. `snap` teleports instead of walking (scene changes). */
  setPlacement(placed: StageCharacter, snap: boolean): void {
    this.placed = placed;
    this.targetX = placed.x;
    if (snap) {
      this.x = placed.x;
      this.flame = placed.flame ?? 0;
    }
  }

  update(dt: number, time: number): void {
    const walk = { ...DEFAULT_WALK, ...this.character.animation?.walk };
    const breathe = { ...DEFAULT_BREATHE, ...this.character.animation?.breathe };

    const distance = this.targetX - this.x;
    this.walking = Math.abs(distance) > ARRIVE_EPSILON;
    let poseId = (!this.walking && this.poseOverride && this.character.poses[this.poseOverride] ? this.poseOverride : null) ?? this.placed.pose;
    this.flip = (this.facingOverride ?? this.placed.facing) === 'left' ? -1 : 1;

    if (this.walking) {
      const step = Math.sign(distance) * Math.min(Math.abs(distance), walk.speed * this.speedFactor * dt);
      this.x += step;
      this.flip = distance < 0 ? -1 : 1;
      this.stepTime += dt * this.speedFactor;
      const frame = Math.floor(this.stepTime / walk.stepPeriod) % walk.frames.length;
      poseId = walk.frames[frame] ?? poseId;
      // Body rises mid-step and drops on each footfall.
      this.bob = -walk.bob * Math.abs(Math.sin((Math.PI * this.stepTime) / walk.stepPeriod));
      this.breath = 1;
    } else {
      this.x = this.targetX;
      this.stepTime = 0;
      this.bob = 0;
      this.breath = 1 + breathe.amplitude * Math.sin((2 * Math.PI * (time + this.phase)) / breathe.period);
    }

    this.pose =
      this.character.poses[poseId] ??
      this.character.poses[this.placed.pose] ??
      this.character.poses[this.character.defaultPose ?? ''] ??
      null;
    if (this.pose) {
      this.scale = (this.character.headPxOnStage ?? DEFAULT_HEAD_PX_ON_STAGE) / this.pose.headPx;
      const url = this.artUrl(this.pose.art);
      if (url && this.img.getAttribute('src') !== url) this.img.src = url;
    }

    // Ease the flame toward its target so it grows and dies instead of popping.
    const targetFlame = this.placed.flame ?? 0;
    this.flame += (targetFlame - this.flame) * Math.min(1, dt * 3);
  }

  /** Writes the DOM transform for the camera position and draws the flame. `z` = stacking order. */
  apply(cameraX: number, time: number, z: number): void {
    const pose = this.pose;
    this.img.style.zIndex = String(z);
    this.flameCanvas.style.zIndex = String(z);
    if (!pose) {
      this.img.style.visibility = 'hidden';
      this.flameCanvas.style.visibility = 'hidden';
      return;
    }
    this.img.style.visibility = '';
    const visible = this.opacity * this.presence;
    const alpha = visible < 1 ? String(Math.max(0, visible)) : '';
    this.img.style.opacity = alpha;
    this.flameCanvas.style.opacity = alpha;
    const screenX = this.x - cameraX;
    this.screenX = screenX;
    this.img.style.transformOrigin = `${pose.ground.x}px ${pose.ground.y}px`;
    this.img.style.transform =
      `translate(${screenX - pose.ground.x}px, ${GROUND_Y - pose.ground.y + this.bob}px) ` +
      `scale(${this.scale * this.flip}, ${this.scale * this.breath})`;
    this.drawFlame(screenX, time);
  }

  private drawFlame(screenX: number, time: number): void {
    const pose = this.pose;
    const canvas = this.flameCanvas;
    if (!pose?.cup || this.flame < 0.02) {
      canvas.style.visibility = 'hidden';
      this.light = null;
      return;
    }
    canvas.style.visibility = '';
    if (this.appliedFlameFilter !== this.flameFilter) {
      this.appliedFlameFilter = this.flameFilter;
      canvas.style.filter = this.flameFilter;
    }
    const x = screenX + (pose.cup.x - pose.ground.x) * this.scale * this.flip;
    const y = GROUND_Y + this.bob + (pose.cup.y - pose.ground.y) * this.scale * this.breath;
    this.light = { x, y: y - 20, intensity: this.flame, size: this.scale * (pose.cup.scale ?? 1) };
    // The canvas moves with the cup; the flame is drawn at a fixed point inside it.
    canvas.style.transform = `translate(${x - FLAME_CANVAS.baseX}px, ${y - FLAME_CANVAS.baseY}px)`;
    const ctx = this.flameCtx;
    ctx.clearRect(0, 0, FLAME_CANVAS.width, FLAME_CANVAS.height);
    ctx.save();
    // Tilt the flame with the cup (angle mirrors when the figure faces left).
    const angle = ((pose.cup.angle ?? 0) * Math.PI) / 180;
    ctx.translate(FLAME_CANVAS.baseX, FLAME_CANVAS.baseY);
    ctx.rotate(angle * this.flip);
    drawFlame(ctx, 0, 0, FLAME_SIZE * this.scale * (pose.cup.scale ?? 1), this.flame, time, this.phase, pose.cup.kind);
    ctx.restore();
  }
}
