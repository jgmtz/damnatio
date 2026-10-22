// Full-screen panel used for the title screen, menus, interstitials and save import/export.

import { clear, el } from './dom';

export class Overlay {
  readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private onDismiss: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.panel = el('div', { class: 'overlay-panel' });
    this.root = el('div', { class: 'overlay hidden' }, [this.panel]);
    // Menu clicks never reach the stage underneath.
    this.root.addEventListener('click', (e) => e.stopPropagation());
    parent.append(this.root);
  }

  /** `onDismiss` runs on Escape (null = Escape does nothing). */
  show(children: (Node | string)[], options: { variant?: string; onDismiss?: () => void } = {}): void {
    clear(this.panel);
    this.panel.append(...children);
    this.root.className = `overlay ${options.variant ?? ''}`;
    this.onDismiss = options.onDismiss ?? null;
    this.panel.querySelector<HTMLElement>('button, textarea')?.focus();
  }

  hide(): void {
    this.root.classList.add('hidden');
    this.onDismiss = null;
  }

  dismiss(): void {
    this.onDismiss?.();
  }

  get isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }
}

export function button(label: string, onClick: () => void, options: { disabled?: boolean } = {}): HTMLButtonElement {
  return el('button', {
    class: 'menu-button',
    text: label,
    attrs: options.disabled ? { disabled: '' } : {},
    on: { click: onClick },
  });
}
