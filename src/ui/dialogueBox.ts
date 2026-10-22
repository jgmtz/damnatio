// Dialogue box (with typewriter text) and choice list. Pure presentation:
// they receive already-resolved text and report the player's input through callbacks.

import { clear, el } from './dom';

const CHARS_PER_SECOND = 45;

export class DialogueBox {
  readonly root: HTMLDivElement;
  private readonly speakerEl: HTMLDivElement;
  private readonly textEl: HTMLDivElement;
  private readonly hintEl: HTMLDivElement;
  private readonly portraitEl: HTMLImageElement;
  private fullText = '';
  private shown = 0;
  private startedAt = 0;
  private timer: number | null = null;
  private onAdvance: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.speakerEl = el('div', { class: 'dialogue-speaker' });
    this.textEl = el('div', { class: 'dialogue-text' });
    this.hintEl = el('div', { class: 'dialogue-hint', text: '▼' });
    this.portraitEl = el('img', { class: 'dialogue-portrait hidden', attrs: { alt: '', draggable: 'false' } });
    this.root = el('div', { class: 'dialogue-box hidden' }, [
      this.portraitEl,
      this.speakerEl,
      this.textEl,
      this.hintEl,
    ]);
    this.root.addEventListener('click', (e) => {
      // The click that advances a line must not also reach the stage (e.g. become a walk target).
      e.stopPropagation();
      this.input();
    });
    parent.append(this.root);
  }

  /**
   * Shows a line. `onAdvance` is null for prompts that wait for something else (choices).
   * `portraitUrl` shows the speaker's expression medallion next to the text.
   */
  show(speaker: string | null, text: string, onAdvance: (() => void) | null, portraitUrl: string | null = null): void {
    this.stopTyping();
    this.root.classList.remove('hidden');
    this.root.classList.toggle('narration', speaker === null);
    this.root.classList.toggle('with-portrait', portraitUrl !== null);
    this.portraitEl.classList.toggle('hidden', portraitUrl === null);
    if (portraitUrl !== null && this.portraitEl.getAttribute('src') !== portraitUrl) this.portraitEl.src = portraitUrl;
    this.speakerEl.textContent = speaker ?? '';
    this.fullText = text;
    this.shown = 0;
    this.startedAt = performance.now();
    this.onAdvance = onAdvance;
    this.hintEl.classList.add('hidden');
    this.timer = window.setInterval(() => this.tick(), 1000 / CHARS_PER_SECOND);
    this.tick();
  }

  /** How solid the speaker's name is (Théron's fades as the world forgets him). */
  setSpeakerPresence(presence: number): void {
    this.speakerEl.style.opacity = presence < 1 ? String(Math.max(0.15, presence)) : '';
  }

  hide(): void {
    this.stopTyping();
    this.root.classList.add('hidden');
    this.onAdvance = null;
  }

  /** The speaker's name flickers once (Théron losing presence). */
  flickerName(): void {
    this.speakerEl.classList.remove('flicker');
    void this.speakerEl.offsetWidth; // restart the CSS animation
    this.speakerEl.classList.add('flicker');
  }

  /** Click / Space / Enter: finish typing first, then advance. */
  input(): void {
    if (this.root.classList.contains('hidden')) return;
    if (this.shown < this.fullText.length) {
      this.shown = this.fullText.length;
      this.tick();
      return;
    }
    const advance = this.onAdvance;
    if (advance) {
      this.onAdvance = null;
      advance();
    }
  }

  private tick(): void {
    // Based on elapsed time, so throttled timers (background tabs) don't slow the text down.
    const byTime = Math.floor(((performance.now() - this.startedAt) / 1000) * CHARS_PER_SECOND);
    this.shown = Math.min(this.fullText.length, Math.max(this.shown, byTime));
    this.textEl.textContent = this.fullText.slice(0, this.shown);
    if (this.shown >= this.fullText.length) {
      this.stopTyping();
      this.hintEl.classList.toggle('hidden', this.onAdvance === null);
    }
  }

  private stopTyping(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }
}

export interface ChoiceItem {
  id: string;
  text: string;
  available: boolean;
  /** Written by the beast (Asterion): rust red, rough letters. */
  voice?: 'beast';
  /** Why a locked choice is locked, shown in a short line under it. */
  lockedReason?: string;
}

/** Choices above the heads: their top edge (stage px, matches `.choices.above`) and the gap kept over the highest head. */
const ABOVE_TOP = 96;
const ABOVE_GAP = 12;

export class ChoiceList {
  readonly root: HTMLDivElement;
  private readonly list: HTMLDivElement;
  private readonly timerBar: HTMLDivElement;
  private items: ChoiceItem[] = [];
  private onChoose: ((id: string) => void) | null = null;
  private timeout: number | null = null;
  private headroom: (() => number) | null = null;
  private placeTimers: number[] = [];

  constructor(
    parent: HTMLElement,
    private readonly lockedLabel: () => string,
  ) {
    this.list = el('div', { class: 'choice-list' });
    // Diegetic timer: a wick burning toward its end (the ember travels with the shrinking thread).
    this.timerBar = el('div', { class: 'choice-timer hidden' }, [
      el('div', { class: 'choice-timer-fill' }),
      el('div', { class: 'choice-timer-ember' }),
    ]);
    this.root = el('div', { class: 'choices hidden' }, [this.timerBar, this.list]);
    this.root.addEventListener('click', (e) => e.stopPropagation());
    parent.append(this.root);
  }

  /**
   * `seconds` = null for untimed choices. `high` raises the panel (someone seated below must stay visible).
   * `headroom` (stage y of the highest head in view): when the options fit above everyone's heads they
   * go there, so they don't cover the people the choice is about; otherwise they sit above the dialogue box.
   */
  show(items: ChoiceItem[], onChoose: (id: string) => void, seconds: number | null, onTimeout: () => void, high = false, headroom: (() => number) | null = null): void {
    this.clearTimer();
    this.root.classList.toggle('high', high);
    this.root.classList.remove('above');
    this.headroom = high ? null : headroom;
    this.items = items;
    this.onChoose = onChoose;
    clear(this.list);
    items.forEach((item, i) => {
      const button = el(
        'button',
        { class: item.voice === 'beast' ? 'choice beast' : 'choice', attrs: item.available ? {} : { disabled: '', title: this.lockedLabel() } },
        [
          el('span', { class: 'choice-key', text: String(i + 1) }),
          el('span', { class: 'choice-body' }, [
            el('span', { text: item.text }),
            ...(!item.available && item.lockedReason ? [el('span', { class: 'choice-lock', text: item.lockedReason })] : []),
          ]),
        ],
      );
      button.addEventListener('click', () => this.pick(i));
      this.list.append(button);
    });
    this.timerBar.classList.toggle('hidden', seconds === null);
    this.root.classList.remove('hidden');
    this.place();
    // Someone may still be walking in, or a picture loading: look again a moment later.
    for (const ms of [250, 700, 1500]) this.placeTimers.push(window.setTimeout(() => this.place(), ms));

    if (seconds !== null) {
      const fill = this.timerBar.children[0] as HTMLDivElement;
      const ember = this.timerBar.children[1] as HTMLDivElement;
      fill.style.transition = 'none';
      fill.style.transform = 'scaleX(1)';
      ember.style.transition = 'none';
      ember.style.left = '100%';
      void fill.offsetWidth; // restart the CSS transitions
      fill.style.transition = `transform ${seconds}s linear`;
      fill.style.transform = 'scaleX(0)';
      ember.style.transition = `left ${seconds}s linear`;
      ember.style.left = '0%';
      this.timeout = window.setTimeout(() => {
        this.timeout = null;
        if (this.onChoose) {
          this.onChoose = null;
          this.hide();
          onTimeout();
        }
      }, seconds * 1000);
    }
  }

  /** Above the heads when the compact list fits there, otherwise in the usual place. */
  private place(): void {
    if (!this.headroom || this.root.classList.contains('hidden')) return;
    this.root.classList.add('above');
    if (ABOVE_TOP + this.root.offsetHeight + ABOVE_GAP > this.headroom()) this.root.classList.remove('above');
  }

  /** Keyboard shortcut: 1-based index. */
  pick(index: number): void {
    const item = this.items[index];
    if (!item || !item.available || !this.onChoose) return;
    const choose = this.onChoose;
    this.onChoose = null;
    this.hide();
    choose(item.id);
  }

  hide(): void {
    this.clearTimer();
    this.root.classList.add('hidden');
  }

  get isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  private clearTimer(): void {
    if (this.timeout !== null) window.clearTimeout(this.timeout);
    this.timeout = null;
    for (const t of this.placeTimers) window.clearTimeout(t);
    this.placeTimers = [];
  }
}
