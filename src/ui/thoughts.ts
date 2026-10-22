// Asterion's thoughts ("two voices", docs/roteiros/roteiro-asterion.md): written over the scene near his head,
// like incisions on the vase, instead of in the dialogue box. The man (what Calias taught him) writes
// whole sentences in gold; the beast scrawls broken words in rust red. The `fera` level decides who
// is heard: 0–1 the man; 2–3 the man, then the beast cuts in; 4+ the beast over a faint man.

import { el } from './dom';
import type { Stage } from './stage';

export type VoiceLevel = 'man' | 'mixed' | 'beast';

export function voiceLevel(fera: number): VoiceLevel {
  return fera <= 1 ? 'man' : fera <= 3 ? 'mixed' : 'beast';
}

/** Delay before the beast cuts in on the man's thought (mixed level), in ms. */
const INTERRUPT_MS = 750;

export class ThoughtView {
  private readonly root: HTMLDivElement;
  private readonly catcher: HTMLDivElement;
  private readonly manEl: HTMLDivElement;
  private readonly beastEl: HTMLDivElement;
  /** The second voice (ThoughtNode.second): answers the first one a moment later. */
  private readonly secondEl: HTMLDivElement;
  private thinker: string | null = null;
  private onAdvance: (() => void) | null = null;
  private interrupt: number | null = null;
  private shownAt = 0;

  constructor(
    private readonly stage: Stage,
    parent: HTMLElement,
  ) {
    this.manEl = el('div', { class: 'thought-man' });
    this.beastEl = el('div', { class: 'thought-beast' });
    this.secondEl = el('div', { class: 'thought-second' });
    this.root = el('div', { class: 'thought hidden' }, [this.manEl, this.beastEl, this.secondEl]);
    // Clicking anywhere advances (and never becomes a walk target).
    this.catcher = el('div', { class: 'thought-catcher hidden' });
    this.catcher.addEventListener('click', (e) => {
      e.stopPropagation();
      this.input();
    });
    parent.append(this.catcher, this.root);
    stage.onUpdate(() => this.follow());
  }

  get isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  /** `voice` styles the writing for whose thought it is (e.g. "theron": pale ink, sardonic). */
  show(
    thinker: string | null,
    man: string | null,
    beast: string | null,
    fera: number,
    onAdvance: () => void,
    voice?: string,
    second: string | null = null,
  ): void {
    this.clearInterrupt();
    this.thinker = thinker;
    this.onAdvance = onAdvance;
    this.shownAt = performance.now();
    const level = voiceLevel(fera);
    // A missing voice gives way to the other one.
    const manText = man ?? (level === 'man' ? beast : null);
    const beastText = level === 'man' && man ? null : beast;
    this.root.className = `thought level-${level}${voice ? ` voice-${voice}` : ''}`;
    this.manEl.textContent = manText ?? '';
    this.manEl.classList.toggle('hidden', !manText);
    this.beastEl.textContent = beastText ?? '';
    this.beastEl.classList.add('hidden');
    this.secondEl.textContent = second ?? '';
    this.secondEl.classList.add('hidden');
    if (beastText) {
      if (level === 'mixed' && manText) {
        this.interrupt = window.setTimeout(() => {
          this.interrupt = null;
          this.beastEl.classList.remove('hidden');
        }, INTERRUPT_MS);
      } else {
        this.beastEl.classList.remove('hidden');
      }
    } else if (second) {
      // The other voice answers a moment later, like the beast cutting in.
      this.interrupt = window.setTimeout(() => {
        this.interrupt = null;
        this.secondEl.classList.remove('hidden');
      }, INTERRUPT_MS * 1.6);
    }
    this.catcher.classList.remove('hidden');
    this.follow();
  }

  hide(): void {
    this.clearInterrupt();
    this.root.classList.add('hidden');
    this.catcher.classList.add('hidden');
    this.onAdvance = null;
  }

  /** Click / Space / Enter: show the interruption at once if it is still coming, then advance. */
  input(): void {
    if (!this.isOpen) return;
    if (this.interrupt !== null && (this.beastEl.textContent || this.secondEl.textContent)) {
      this.clearInterrupt();
      if (this.beastEl.textContent) this.beastEl.classList.remove('hidden');
      else this.secondEl.classList.remove('hidden');
      return;
    }
    // A short grace so the same key press that opened it doesn't skip it.
    if (performance.now() - this.shownAt < 250) return;
    const advance = this.onAdvance;
    this.hide();
    advance?.();
  }

  private clearInterrupt(): void {
    if (this.interrupt !== null) window.clearTimeout(this.interrupt);
    this.interrupt = null;
  }

  /** Keeps the thought over the thinker's head, inside the screen. */
  private follow(): void {
    if (!this.isOpen) return;
    const figure = this.thinker ? this.stage.figure(this.thinker) : undefined;
    const x = figure ? figure.screenX : 960;
    const top = figure ? figure.topY : 300;
    const left = Math.min(1920 - 460, Math.max(460, x));
    this.root.style.left = `${left}px`;
    this.root.style.top = `${Math.max(90, top - 40)}px`;
  }
}
