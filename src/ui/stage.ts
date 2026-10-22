// The stage: a fixed 1920x1080 logical canvas (a vase panel), scaled to fit the window
// with letterboxing. One requestAnimationFrame loop animates figures (each draws its own flame),
// moves the camera along the frieze, and draws the atmosphere (light, dust, foreground columns),
// the shadows under the figures and the fate threads.

import type { LoadedContent } from '../engine/loadContent';
import type { StageState } from '../engine/state';
import type { BackgroundInfo, StageMode } from '../engine/types';
import { drawFlame } from '../systems/flame';
import { hatchVignette } from '../systems/hatch';
import { ThreadFx } from '../systems/threads';
import { Atmosphere } from './atmosphere';
import { el } from './dom';
import { Figure, GROUND_Y } from './figure';

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;
/** Camera easing speed (higher = snappier). */
const CAMERA_FOLLOW = 5;
/** Longest frame step, so a background tab doesn't make figures teleport on return. */
const MAX_DT = 0.05;
/** How far past the screen edge a departing figure walks before it is removed. */
const DEPART_MARGIN = 260;
/** A departing figure still on screen after this many seconds fades out. */
const DEPART_FADE_AFTER = 4;

export class Stage {
  readonly root: HTMLDivElement;
  readonly uiLayer: HTMLDivElement;
  readonly threads = new ThreadFx();
  /** Asterion's beast level shown on screen (0 = nothing; set by the game in his fragments). */
  fera = 0;
  /** True while a full-screen overlay (the thread map) hides the stage: nothing is drawn. */
  frozen = false;
  private readonly background: HTMLDivElement;
  private readonly props: HTMLDivElement;
  private readonly images = new Map<string, HTMLImageElement>();
  private readonly characterLayer: HTMLDivElement;
  private readonly under: CanvasRenderingContext2D;
  private readonly fx: CanvasRenderingContext2D;
  private readonly transition: HTMLDivElement;
  private readonly atmosphere = new Atmosphere();
  private readonly figures = new Map<string, Figure>();
  /** Figures removed from the scene, still walking out of view. */
  private readonly departing = new Map<string, { figure: Figure; time: number }>();
  private readonly updateHooks = new Set<(dt: number) => void>();
  private readonly drawHooks = new Set<(ctx: CanvasRenderingContext2D, cameraX: number, time: number) => void>();
  private focusId: string | null = null;
  private stacking = new Map<string, number>();
  private currentBackground: string | null = null;
  private mode: StageMode = 'normal';
  private worldWidth = STAGE_WIDTH;
  private cameraX = 0;
  private fit = { scale: 1, left: 0, top: 0 };
  private lastFrame: number | null = null;

  constructor(
    viewport: HTMLElement,
    private readonly content: LoadedContent,
  ) {
    const canvas = (cls: string) =>
      el('canvas', { class: cls, attrs: { width: String(STAGE_WIDTH), height: String(STAGE_HEIGHT) } });
    this.props = el('div', { class: 'stage-props' });
    this.background = el('div', { class: 'stage-background' }, [this.props]);
    const underCanvas = canvas('stage-under');
    this.under = underCanvas.getContext('2d')!;
    this.characterLayer = el('div', { class: 'stage-characters' });
    const fxCanvas = canvas('stage-fx');
    this.fx = fxCanvas.getContext('2d')!;
    this.transition = el('div', { class: 'scene-transition' });
    this.uiLayer = el('div', { class: 'stage-ui' });
    this.root = el('div', { class: 'stage' }, [
      this.background,
      underCanvas,
      this.characterLayer,
      fxCanvas,
      el('div', { class: 'vase-band vase-band-top' }),
      el('div', { class: 'vase-band vase-band-bottom' }),
      this.transition,
      this.uiLayer,
    ]);
    viewport.append(this.root);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    requestAnimationFrame((t) => this.frame(t));
  }

  private resize(): void {
    const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
    const left = (window.innerWidth - STAGE_WIDTH * scale) / 2;
    const top = (window.innerHeight - STAGE_HEIGHT * scale) / 2;
    this.fit = { scale, left, top };
    this.root.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
  }

  /** Converts a mouse clientX to a world x on the frieze. */
  toWorldX(clientX: number): number {
    return (clientX - this.fit.left) / this.fit.scale + this.cameraX;
  }

  /** Converts mouse client coordinates to stage coordinates (1920x1080, ignoring the camera). */
  toStagePoint(clientX: number, clientY: number): { x: number; y: number } {
    return { x: (clientX - this.fit.left) / this.fit.scale, y: (clientY - this.fit.top) / this.fit.scale };
  }

  get camera(): number {
    return this.cameraX;
  }

  /** Registers a per-frame drawing callback on the effects canvas (screen space). */
  onDraw(hook: (ctx: CanvasRenderingContext2D, cameraX: number, time: number) => void): () => void {
    this.drawHooks.add(hook);
    return () => this.drawHooks.delete(hook);
  }

  get width(): number {
    return this.worldWidth;
  }

  figure(id: string): Figure | undefined {
    return this.figures.get(id);
  }

  /**
   * Stage y (0..1080) of the highest figure top on screen: the room above everyone's heads, where a
   * panel can go without covering anybody. 1080 when nobody is in view.
   */
  headroom(): number {
    let top = 1080;
    const right = this.fit.left + 1920 * this.fit.scale;
    for (const img of this.root.querySelectorAll<HTMLImageElement>('img.figure')) {
      const r = img.getBoundingClientRect();
      if (r.height < 40 || r.right <= this.fit.left || r.left >= right || getComputedStyle(img).visibility === 'hidden') continue;
      top = Math.min(top, (r.top - this.fit.top) / this.fit.scale);
    }
    return top;
  }

  /** Registers a per-frame callback (e.g. the exploration controller). Returns an unsubscribe function. */
  onUpdate(hook: (dt: number) => void): () => void {
    this.updateHooks.add(hook);
    return () => this.updateHooks.delete(hook);
  }

  /**
   * Gentle scene change: a still copy of the old scene (background, props, figures, with their
   * current filters baked in) is laid over the new one and dissolves away. No cut to black.
   */
  playTransition(): void {
    this.transition.replaceChildren();
    const freeze = (node: HTMLElement): HTMLElement => {
      const copy = node.cloneNode(true) as HTMLElement;
      copy.style.filter = getComputedStyle(node).filter;
      return copy;
    };
    this.transition.append(freeze(this.background));
    const people = el('div', { class: 'stage-characters' });
    for (const img of this.characterLayer.querySelectorAll<HTMLImageElement>('img.figure')) {
      if (img.style.visibility !== 'hidden') people.append(freeze(img));
    }
    // The light and darkness of the old scene go along, so a lit room doesn't flash bright.
    const light = el('canvas', { class: 'stage-fx', attrs: { width: String(STAGE_WIDTH), height: String(STAGE_HEIGHT) } });
    light.getContext('2d')!.drawImage(this.fx.canvas, 0, 0);
    this.transition.append(people, light);
    this.transition.classList.remove('play');
    void this.transition.offsetWidth; // restart the CSS animation
    this.transition.classList.add('play');
  }

  /**
   * "The world took note" (docs/design/proposta-decisoes.md 7.3): a thread crosses the top of the scene for a
   * moment, without text, when a small choice moves one of the long counters. `tie` = a bond grew
   * (gold), `fray` = a bond wore thin (dull red), `alert` = the College heard something (grey ink).
   */
  echo(kind: 'tie' | 'fray' | 'alert'): void {
    const thread = el('div', { class: `echo-thread echo-${kind}` });
    this.root.insertBefore(thread, this.uiLayer);
    window.setTimeout(() => thread.remove(), 2600);
  }

  /**
   * A pause of weight before a marked choice (7.7): the edges of the scene close in. Returns a
   * function that lifts the veil (it fades out by itself after the choice is made).
   */
  veil(): () => void {
    const veil = el('div', { class: 'weight-veil' });
    this.root.insertBefore(veil, this.uiLayer);
    return () => {
      veil.classList.add('out');
      window.setTimeout(() => veil.remove(), 900);
    };
  }

  /**
   * Théron loses presence (F8): for a breath, everyone else on stage looks the other way, as if he
   * weren't there. `except` keeps its facing (the one who forgets him).
   */
  lookAway(except: string): void {
    for (const [id, figure] of this.figures) {
      if (id === except || figure.shadowWidth <= 0) continue;
      figure.facingOverride = figure.facing === 'left' ? 'right' : 'left';
      window.setTimeout(() => (figure.facingOverride = null), 1500);
    }
  }

  /** Applies a scene state. Figures already on stage walk to their new x; a new background snaps everything. */
  render(stage: StageState): void {
    const mode = stage.mode ?? 'normal';
    const sceneChanged = stage.background !== this.currentBackground;
    // Snapshot before anything changes (a change of mode alone, like entering a memory, dissolves too).
    if ((sceneChanged || mode !== this.mode) && stage.background !== null && this.currentBackground !== null) this.playTransition();
    this.mode = mode;
    this.root.classList.toggle('flashback', this.mode === 'flashback');
    this.root.classList.toggle('night', this.mode === 'night');    this.currentBackground = stage.background;
    this.worldWidth = Math.max(STAGE_WIDTH, stage.worldWidth ?? STAGE_WIDTH);
    const backgroundUrl = stage.background ? this.content.artUrl(stage.background) : null;
    this.background.style.backgroundImage = backgroundUrl ? `url("${backgroundUrl}")` : '';
    this.background.style.width = `${this.worldWidth}px`;
    if (sceneChanged) this.buildScenery();

    const visible = new Set(stage.characters.map((c) => c.id));
    for (const [id, figure] of this.figures) {
      if (!visible.has(id)) {
        this.figures.delete(id);
        // Someone leaving a scene that stays walks out of view instead of vanishing.
        if (sceneChanged || figure.shadowWidth <= 0) figure.unmount();
        else this.depart(id, figure);
      }
    }
    if (sceneChanged) {
      for (const leaving of this.departing.values()) leaving.figure.unmount();
      this.departing.clear();
    }
    for (const placed of stage.characters) {
      const character = this.content.bundle.characters[placed.id];
      if (!character) continue;
      // Called back while still walking out: turn around instead of popping a second copy.
      const returning = this.departing.get(placed.id);
      if (returning) {
        this.departing.delete(placed.id);
        returning.figure.opacity = 1;
        this.figures.set(placed.id, returning.figure);
      }
      const existing = this.figures.get(placed.id);
      if (existing) {
        existing.setPlacement(placed, sceneChanged);
      } else {
        const figure = new Figure(character, placed, (art) => this.content.artUrl(art));
        figure.mount(this.characterLayer);
        this.figures.set(placed.id, figure);
      }
    }

    this.focusId = stage.characters[0]?.id ?? null;
    // Stacking: the focus character (the protagonist) in front, then the others in list order.
    this.stacking = new Map(stage.characters.map((c, i) => [c.id, c.id === this.focusId ? 1000 : i + 1]));
    if (sceneChanged) this.cameraX = this.cameraTarget();
  }

  /**
   * Walks a removed figure out of view, toward the nearer screen edge. In the dark it fades as it
   * goes (swallowed by the black); anywhere else it only fades if the walk drags on too long.
   */
  private depart(id: string, figure: Figure): void {
    const left = this.cameraX - DEPART_MARGIN;
    const right = this.cameraX + STAGE_WIDTH + DEPART_MARGIN;
    figure.targetX = figure.x - left < right - figure.x ? left : right;
    this.departing.set(id, { figure, time: 0 });
  }

  /** Advances the figures walking out; unmounts them once out of view or faded. */
  private updateDeparting(dt: number, time: number): void {
    for (const [id, leaving] of this.departing) {
      leaving.time += dt;
      const f = leaving.figure;
      f.update(dt, time);
      if (this.mode === 'dark') f.opacity = Math.max(0, 1 - leaving.time / 1.6);
      else if (leaving.time > DEPART_FADE_AFTER) f.opacity = Math.max(0, 1 - (leaving.time - DEPART_FADE_AFTER) / 0.8);
      const offScreen = f.x < this.cameraX - DEPART_MARGIN / 2 || f.x > this.cameraX + STAGE_WIDTH + DEPART_MARGIN / 2;
      if (offScreen || f.opacity <= 0 || !f.isWalking) {
        f.unmount();
        this.departing.delete(id);
      }
    }
  }

  private get backgroundInfo(): BackgroundInfo | undefined {
    return this.currentBackground ? this.content.bundle.backgrounds[this.currentBackground] : undefined;
  }

  /** Background sizing (floor alignment, tiling) and the scenery objects of the current background. */
  private buildScenery(): void {
    const info = this.backgroundInfo;
    const style = this.background.style;
    if (info?.floor) {
      // Scale the image so its floor line lands on the stage's ground.
      style.backgroundSize = `auto ${Math.round(GROUND_Y / info.floor)}px`;
      style.backgroundPosition = 'left top';
    } else {
      style.backgroundSize = '100% 100%';
      style.backgroundPosition = '';
    }
    style.backgroundRepeat = info?.repeat ? 'repeat-x' : 'no-repeat';

    this.props.replaceChildren();
    for (const prop of info?.props ?? []) {
      const url = this.content.artUrl(prop.art);
      if (!url) continue;
      const img = el('img', { class: 'prop', attrs: { src: url, alt: '', draggable: 'false' } });
      img.style.left = `${prop.x - prop.ground.x * prop.scale}px`;
      img.style.top = `${GROUND_Y - prop.ground.y * prop.scale}px`;
      img.style.transform = `scale(${prop.scale})`;
      this.props.append(img);
    }
  }

  /** Flames on scenery (lamps): screen positions, drawn under the figures and casting light. */
  private propFlames(): { x: number; y: number; intensity: number; size: number }[] {
    return (this.backgroundInfo?.props ?? []).flatMap((p) =>
      p.flame
        ? [
            {
              x: p.x + (p.flame.x - p.ground.x) * p.scale - this.cameraX,
              y: GROUND_Y + (p.flame.y - p.ground.y) * p.scale,
              intensity: p.flame.intensity ?? 1,
              size: (p.flame.size ?? 1) * p.scale * 2,
            },
          ]
        : [],
    );
  }

  /** Images drawn on canvases (foreground columns, minigames), loaded once and cached. Null until loaded. */
  image(artId: string): HTMLImageElement | null {
    let img = this.images.get(artId);
    if (!img) {
      const url = this.content.artUrl(artId);
      if (!url) return null;
      img = new Image();
      img.src = url;
      this.images.set(artId, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  private cameraTarget(): number {
    const focus = this.focusId ? this.figures.get(this.focusId) : undefined;
    const x = focus ? focus.x - STAGE_WIDTH / 2 : 0;
    return Math.min(Math.max(0, x), this.worldWidth - STAGE_WIDTH);
  }

  private frame(now: number): void {
    const elapsed = this.lastFrame === null ? 0 : (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    if (this.frozen) {
      requestAnimationFrame((t) => this.frame(t));
      return;
    }
    this.tick(Math.min(MAX_DT, Math.max(0, elapsed)), now / 1000);
    requestAnimationFrame((t) => this.frame(t));
  }

  /** Dev/testing aid: runs `seconds` of simulation at 60 fps right now (works even in a hidden tab). */
  simulate(seconds: number): void {
    const start = performance.now() / 1000;
    for (let t = 0; t < seconds; t += 1 / 60) this.tick(1 / 60, start + t);
  }

  private tick(dt: number, time: number): void {
    for (const hook of this.updateHooks) hook(dt);
    for (const figure of this.figures.values()) figure.update(dt, time);
    this.updateDeparting(dt, time);

    this.cameraX += (this.cameraTarget() - this.cameraX) * Math.min(1, dt * CAMERA_FOLLOW);
    this.background.style.transform = `translateX(${-this.cameraX}px)`;
    for (const [id, figure] of this.figures) figure.apply(this.cameraX, time, this.stacking.get(id) ?? 1);
    for (const { figure } of this.departing.values()) figure.apply(this.cameraX, time, 1);

    const figures = [...this.figures.values(), ...[...this.departing.values()].map((d) => d.figure)];
    Atmosphere.drawShadows(this.under, figures);
    // Scenery flames (lamps) sit behind the figures, on the same canvas as the shadows.
    const propFlames = this.propFlames();
    propFlames.forEach((f, i) => drawFlame(this.under, f.x, f.y, 80 * f.size, f.intensity, time, i * 3.7, 'small'));

    const ctx = this.fx;
    ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    const info = this.backgroundInfo;
    const flameLights = [...figures.flatMap((f) => (f.light ? [f.light] : [])), ...propFlames];
    // In the dark, everyone on stage keeps a faint halo so they can be seen (the one the camera
    // follows a little more); without it, figures without a flame vanished into the black.
    if (this.mode === 'dark') {
      for (const [id, f] of this.figures) {
        if (f.shadowWidth <= 0) continue; // invisible props, like the altar's fire
        const lead = id === this.focusId;
        flameLights.push({ x: f.screenX, y: (f.topY + GROUND_Y) / 2, intensity: lead ? 0.75 : 0.6, size: lead ? 0.75 : 0.6 });
      }
    }
    const lights = Atmosphere.lights(info, this.cameraX, flameLights, time);
    if (this.currentBackground || flameLights.length) this.atmosphere.drawLight(ctx, info, this.mode, lights, time, this.cameraX);
    for (const hook of this.drawHooks) hook(ctx, this.cameraX, time);
    this.atmosphere.drawForeground(ctx, info, this.cameraX, (id) => this.image(id));
    this.drawFera(ctx, time);
    this.threads.draw(ctx, time);
  }

  /** Asterion's beast (0–5): the screen's edges pulse red like a heartbeat, faster as it grows. */
  private drawFera(ctx: CanvasRenderingContext2D, time: number): void {
    if (this.fera <= 0) return;
    const beat = 0.55 + 0.45 * Math.abs(Math.sin(time * (1.6 + this.fera * 0.45)));
    const strength = Math.min(1, this.fera / 5) * beat;
    // Red engraving closing in from the edges, with a faint flat red under it.
    if (hatchVignette(ctx, Math.min(1, strength * 1.3), '#8c1a0c', 0.5)) {
      ctx.fillStyle = `rgba(120, 18, 8, ${0.12 * strength})`;
      ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
      return;
    }
    const g =ctx.createRadialGradient(STAGE_WIDTH / 2, STAGE_HEIGHT / 2, STAGE_HEIGHT * 0.38, STAGE_WIDTH / 2, STAGE_HEIGHT / 2, STAGE_WIDTH * 0.62);
    g.addColorStop(0, 'rgba(120, 18, 8, 0)');
    g.addColorStop(1, `rgba(120, 18, 8, ${0.55 * strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  }
}