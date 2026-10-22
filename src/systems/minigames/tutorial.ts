// Guided tutorial shown the first time a minigame is played: each step asks for an action and only
// advances when the player does it ("learn by doing"). Enter skips the whole tutorial.

import { drawPanel } from '../fxSprites';
import { drawSpark } from '../threadFx';
import { W } from './types';

export interface TutorialStep {
  /** Already-resolved text. */
  text: string;
  /** Checked every frame; true = the player did what the step asks. */
  done: () => boolean;
}

/** Pause after a step is done, so the player sees it was understood. */
const STEP_PAUSE = 0.6;

export class Tutorial {
  private index = 0;
  private pause = 0;
  private flash = 0;

  constructor(
    private readonly steps: TutorialStep[],
    private readonly labels: { step: (n: number, total: number) => string; skip: string },
  ) {}

  get active(): boolean {
    return this.index < this.steps.length;
  }

  get stepIndex(): number {
    return this.index;
  }

  /** `skip` = the player asked to skip the whole tutorial this frame. */
  update(dt: number, skip: boolean): void {
    if (!this.active) return;
    if (skip) {
      this.index = this.steps.length;
      return;
    }
    this.flash = Math.max(0, this.flash - dt * 2);
    if (this.pause > 0) {
      this.pause -= dt;
      if (this.pause <= 0) this.index++;
      return;
    }
    if (this.steps[this.index]!.done()) {
      this.pause = STEP_PAUSE;
      this.flash = 1;
    }
  }

  draw(c: CanvasRenderingContext2D, time: number): void {
    if (!this.active) return;
    const step = this.steps[this.index]!;
    const width = 1150;
    const x = (W - width) / 2;
    const y = 170;
    c.save();
    // The black ceramic plaque of the interface (pedidos 4.10); brighter for a moment on success.
    if (drawPanel(c, 'ui.panel.black', x - 14, y - 16, width + 28, 182, [38, 10, 38, 10], [18, 12, 18, 12])) {
      if (this.flash > 0) {
        c.globalAlpha = this.flash * 0.5;
        c.globalCompositeOperation = 'lighter';
        drawPanel(c, 'ui.panel.black', x - 14, y - 16, width + 28, 182, [38, 10, 38, 10], [18, 12, 18, 12]);
        c.globalCompositeOperation = 'source-over';
        c.globalAlpha = 1;
      }
    } else {
      c.fillStyle = 'rgba(12, 9, 7, 0.88)';
      c.strokeStyle = this.flash > 0 ? `rgba(255, 230, 150, ${0.6 + this.flash * 0.4})` : '#d9b45a';
      c.lineWidth = 3;
      c.beginPath();
      c.roundRect(x, y, width, 150, 6);
      c.fill();
      c.stroke();
    }
    c.textAlign = 'left';
    c.font = '22px "Cormorant Garamond", Georgia, serif';
    c.fillStyle = '#c8743a';
    c.fillText(this.labels.step(this.index + 1, this.steps.length), x + 28, y + 36);
    c.textAlign = 'right';
    c.fillStyle = 'rgba(241, 227, 207, 0.55)';
    c.fillText(this.labels.skip, x + width - 28, y + 36);
    c.textAlign = 'left';
    c.font = '32px "Cormorant Garamond", Georgia, serif';
    c.fillStyle = this.pause > 0 ? '#ffe7a3' : '#f1e3cf';
    wrapText(c, (this.pause > 0 ? '✓ ' : '') + step.text, x + 28, y + 82, width - 56, 40);
    // A small pulsing spark (painted) so the panel feels alive.
    drawSpark(c, 1, x + width - 30, y + 120, 22, 0.5 + Math.sin(time * 5) * 0.5, time);
    c.restore();
  }
}

export function wrapText(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  let line = '';
  let yy = y;
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (c.measureText(test).width > maxWidth && line) {
      c.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) c.fillText(line, x, yy);
}
