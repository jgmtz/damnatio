// Runs a first-person minigame on a full-stage canvas, driven by the stage's animation loop.
// The scene stays underneath; the UI (menus, hints) stays on top.

import type { MinigameNode } from '../engine/types';
import { MINIGAMES } from '../systems/minigames';
import { MinigameInput } from '../systems/minigames/input';
import type { Minigame, MinigameResult } from '../systems/minigames/types';
import { el } from './dom';
import type { Stage } from './stage';

export class MinigameHost {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input = new MinigameInput();
  private active: { game: Minigame; resolve: (r: MinigameResult) => void } | null = null;
  private time = 0;
  private hideTimer: number | null = null;

  constructor(
    private readonly stage: Stage,
    private readonly t: (key: string) => string,
    private readonly isPaused: () => boolean,
  ) {
    this.canvas = el('canvas', { class: 'minigame-layer hidden', attrs: { width: '1920', height: '1080' } });
    this.ctx = this.canvas.getContext('2d')!;
    stage.root.insertBefore(this.canvas, stage.uiLayer);
    stage.onUpdate((dt) => this.tick(dt));
  }

  get isActive(): boolean {
    return this.active !== null;
  }

  /**
   * Plays the node's game (with its guided tutorial first if `tutorial`).
   * Resolves with the outcome id (always one the node defines) and earned effects.
   */
  play(node: MinigameNode, relaxed: boolean, tutorial: boolean, fera = 0): Promise<MinigameResult> {
    this.stop();
    // Start loading every image the scene names (params ending in "Art").
    for (const [key, value] of Object.entries(node.params ?? {})) {
      if (key.endsWith('Art') && typeof value === 'string') this.stage.image(value);
    }
    const factory = MINIGAMES[node.game];
    // Listen on the whole stage: the UI layer (hints, dialogue) sits above the minigame canvas and
    // would swallow the mouse if only the canvas listened (the mouse never reached the minigames).
    this.input.attach(this.stage.root, (x, y) => this.stage.toStagePoint(x, y));
    const game = factory(node.params ?? {}, {
      input: this.input,
      t: this.t,
      relaxed,
      tutorial,
      fera,
      image: (id) => this.stage.image(id),
    });
    this.canvas.classList.remove('hidden');
    this.time = 0;
    return new Promise((resolve) => {
      this.active = {
        game,
        resolve: (r) => {
          const known = node.outcomes.some((o) => o.id === r.outcome);
          resolve({ ...r, outcome: known ? r.outcome : node.outcomes[0]!.id });
        },
      };
    });
  }

  /**
   * Ends the current game. `fade` lets its last frame dissolve into the scene (a finished game);
   * without it the layer just goes (abandoned, e.g. back to the title screen).
   */
  stop(fade = false): void {
    this.active = null;
    this.input.detach();
    if (this.hideTimer !== null) clearTimeout(this.hideTimer);
    this.hideTimer = null;
    if (fade && !this.canvas.classList.contains('hidden')) {
      this.canvas.classList.add('leaving');
      this.hideTimer = window.setTimeout(() => {
        this.canvas.classList.add('hidden');
        this.canvas.classList.remove('leaving');
        this.hideTimer = null;
      }, 600);
    } else {
      this.canvas.classList.add('hidden');
      this.canvas.classList.remove('leaving');
    }
  }

  private tick(dt: number): void {
    const active = this.active;
    if (!active) return;
    if (this.isPaused()) {
      this.input.endFrame();
      return;
    }
    this.time += dt;
    const result = active.game.update(dt, this.time);
    active.game.draw(this.ctx, this.time);
    if (result) {
      this.stop(true);
      active.resolve(result);
    }
  }
}
