// Keyboard + mouse state for minigames, in stage coordinates (1920x1080).
// Supports WASD, arrows and mouse, as the author asked for every first-person scene.

export type StagePoint = (clientX: number, clientY: number) => { x: number; y: number };

const UP = ['w', 'W', 'ArrowUp'];
const DOWN = ['s', 'S', 'ArrowDown'];
const LEFT = ['a', 'A', 'ArrowLeft'];
const RIGHT = ['d', 'D', 'ArrowRight'];
export const ACTION = [' ', 'Enter'];

export class MinigameInput {
  readonly held = new Set<string>();
  mouse = { x: 960, y: 540, moved: false, down: false };
  private pressed: string[] = [];
  private clicks = 0;
  private rightClicks = 0;
  private cleanup: (() => void) | null = null;

  attach(target: HTMLElement, toStage: StagePoint): void {
    this.detach();
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F2') return;
      if (!e.repeat) this.pressed.push(e.key);
      this.held.add(e.key);
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => this.held.delete(e.key);
    const move = (e: MouseEvent) => {
      const p = toStage(e.clientX, e.clientY);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
      this.mouse.moved = true;
    };
    const mdown = (e: MouseEvent) => {
      if (e.button === 2) this.rightClicks++;
      else {
        this.clicks++;
        this.mouse.down = true;
      }
    };
    const mup = () => (this.mouse.down = false);
    const menu = (e: Event) => e.preventDefault();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    target.addEventListener('mousemove', move);
    target.addEventListener('mousedown', mdown);
    window.addEventListener('mouseup', mup);
    target.addEventListener('contextmenu', menu);
    this.cleanup = () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      target.removeEventListener('mousemove', move);
      target.removeEventListener('mousedown', mdown);
      window.removeEventListener('mouseup', mup);
      target.removeEventListener('contextmenu', menu);
    };
  }

  detach(): void {
    this.cleanup?.();
    this.cleanup = null;
    this.held.clear();
    this.pressed = [];
    this.clicks = 0;
    this.rightClicks = 0;
    this.mouse = { x: 960, y: 540, moved: false, down: false };
  }

  /** -1..1 from two key groups. */
  private axis(neg: string[], pos: string[]): number {
    const n = neg.some((k) => this.held.has(k)) ? 1 : 0;
    const p = pos.some((k) => this.held.has(k)) ? 1 : 0;
    return p - n;
  }

  get vertical(): number {
    return this.axis(UP, DOWN); // +1 = down
  }

  get horizontal(): number {
    return this.axis(LEFT, RIGHT);
  }

  /** True once per key press of any of `keys` (edge-triggered). */
  consume(keys: string[]): boolean {
    const i = this.pressed.findIndex((k) => keys.includes(k));
    if (i < 0) return false;
    this.pressed.splice(i, 1);
    return true;
  }

  consumeUp(): boolean {
    return this.consume(UP);
  }

  consumeDown(): boolean {
    return this.consume(DOWN);
  }

  consumeClick(): boolean {
    if (this.clicks === 0) return false;
    this.clicks--;
    return true;
  }

  consumeRightClick(): boolean {
    if (this.rightClicks === 0) return false;
    this.rightClicks--;
    return true;
  }

  /** Drop presses not used this frame, so an old press can't trigger something later. */
  endFrame(): void {
    this.pressed = [];
    this.clicks = 0;
    this.rightClicks = 0;
  }
}
