// In-game debugger (F2): see any scene, minigame or screen without replaying, and inspect or edit the
// world state. Available in `npm run dev`, or in a build with `?debug` in the URL. It is a tool for the
// author, so its own labels are in Portuguese and live here, not in content/strings.

import type { WorldState } from '../engine/state';
import type { ContentBundle, SceneNode, ThreadKind } from '../engine/types';
import { el } from './dom';

/** Map data shown by the debugger: the real one, simulated playthroughs, or everything revealed. */
export type MapPreview = 'real' | 'simulated' | 'all';

/** What the game exposes to the debugger. */
export interface DebugHost {
  readonly bundle: ContentBundle;
  t(key: string): string;
  readonly currentState: WorldState;
  readonly currentNode: { fragmentId: string; nodeId: string } | null;
  jump(fragmentId: string, nodeId?: string, patch?: Partial<WorldState>): void;
  showScreen(screen: 'title' | 'threads' | 'settings' | 'chapterEnd'): void;
  showMap(fragmentId: string, preview: MapPreview): void;
  playThread(kind: ThreadKind): void;
  setTutorials(show: boolean): void;
  cycleLocale(): void;
}

const TYPE_LABEL: Record<SceneNode['type'], string> = {
  stage: 'cena',
  dialogue: 'fala',
  thought: 'pensamento',
  choice: 'escolha',
  branch: 'desvio',
  exploration: 'exploração',
  fate_event: 'fio',
  minigame: 'mini-jogo',
  end: 'fim',
};

/** Node types the debugger can jump to (the ones that wait for the player). */
const JUMPABLE: SceneNode['type'][] = ['dialogue', 'thought', 'choice', 'exploration', 'minigame', 'fate_event', 'stage'];

export class DebugPanel {
  private readonly root: HTMLDivElement;
  private readonly stateView: HTMLPreElement;
  private readonly nodeList: HTMLDivElement;
  private readonly fragmentSelect: HTMLSelectElement;
  private readonly filterSelect: HTMLSelectElement;
  private readonly flagsInput: HTMLTextAreaElement;
  private readonly here: HTMLDivElement;
  private mapPreview: MapPreview = 'simulated';

  constructor(private readonly host: DebugHost) {
    const fragments = Object.values(host.bundle.chapters).flatMap((c) => c.order);
    this.fragmentSelect = el(
      'select',
      { on: { change: () => this.renderNodes() } },
      fragments.map((id) => el('option', { text: `${id} — ${host.t(host.bundle.fragments[id]!.title)}`, attrs: { value: id } })),
    );
    this.filterSelect = el('select', { on: { change: () => this.renderNodes() } }, [
      el('option', { text: 'Pontos de parada (sem cenas)', attrs: { value: 'stops' } }),
      el('option', { text: 'Só decisões e mini-jogos', attrs: { value: 'decisions' } }),
      el('option', { text: 'Todos os nós', attrs: { value: 'all' } }),
    ]);
    this.nodeList = el('div', { class: 'debug-nodes' });
    this.here = el('div', { class: 'debug-here' });
    this.stateView = el('pre', { class: 'debug-state' });
    this.flagsInput = el('textarea', { class: 'debug-flags', attrs: { rows: '8', spellcheck: 'false' } });

    const minigames = fragments.flatMap((fid) =>
      host.bundle.fragments[fid]!.nodes
        .filter((n) => n.type === 'minigame')
        .map((n) => this.button(`${fid} · ${n.id} (${n.type === 'minigame' ? n.game : ''})`, () => host.jump(fid, n.id))),
    );
    const mapButtons = fragments.map((fid) => this.button(`Mapa: ${host.t(host.bundle.fragments[fid]!.title)}`, () => host.showMap(fid, this.mapPreview)));
    const previewSelect = el(
      'select',
      {
        on: {
          change: (e) => (this.mapPreview = (e.target as HTMLSelectElement).value as MapPreview),
        },
      },
      [
        el('option', { text: 'Dados: 40 partidas simuladas', attrs: { value: 'simulated' } }),
        el('option', { text: 'Dados: tudo descoberto', attrs: { value: 'all' } }),
        el('option', { text: 'Dados: os seus (save real)', attrs: { value: 'real' } }),
      ],
    );

    this.root = el('div', { class: 'debug-panel hidden' }, [
      el('div', { class: 'debug-title', text: 'Depurador · F2 fecha' }),
      this.here,
      this.section('Pular para uma cena', true, [
        this.fragmentSelect,
        this.filterSelect,
        this.nodeList,
      ]),
      this.section('Mini-jogos', false, [
        el('div', { class: 'debug-row' }, [
          this.button('Com tutorial', () => host.setTutorials(true)),
          this.button('Sem tutorial', () => host.setTutorials(false)),
        ]),
        ...minigames,
      ]),
      this.section('Telas', false, [
        this.button('Tela de título', () => host.showScreen('title')),
        this.button('Fios (Tab)', () => host.showScreen('threads')),
        this.button('Opções', () => host.showScreen('settings')),
        this.button('Fim do capítulo', () => host.showScreen('chapterEnd')),
        previewSelect,
        ...mapButtons,
        el('div', { class: 'debug-row' }, [
          this.button('Fio: atar', () => host.playThread('tie')),
          this.button('Fio: cortar', () => host.playThread('cut')),
          this.button('Fio: emaranhar', () => host.playThread('tangle')),
        ]),
        this.button('Trocar idioma', () => {
          host.cycleLocale();
          this.renderNodes();
        }),
      ]),
      this.section('Estado (flags)', false, [
        el('div', { class: 'debug-help', text: 'Edite flags, relações, fados e usos da dádiva e aplique: o nó atual recomeça com o novo estado.' }),
        this.flagsInput,
        el('div', { class: 'debug-row' }, [
          this.button('Recarregar', () => this.fillFlags()),
          this.button('Aplicar', () => this.applyFlags()),
        ]),
      ]),
      this.section('Estado completo (só leitura)', false, [this.stateView]),
    ]);
    // Keys typed in the debugger's fields never reach the game. Only in fields: a button clicked
    // here keeps the focus, and swallowing its keys left the game deaf to WASD until a click.
    this.root.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement | null;
      const typing = target !== null && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (typing && e.key !== 'F2') e.stopPropagation();
    });
    // Clicking a button here must not keep the keyboard focus away from the game.
    this.root.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'BUTTON') target.blur();
    });
    document.body.append(this.root);
    this.renderNodes();
  }

  get isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  toggle(): void {
    this.root.classList.toggle('hidden');
    if (this.isOpen) {
      const node = this.host.currentNode;
      if (node) this.fragmentSelect.value = node.fragmentId;
      this.renderNodes();
      this.fillFlags();
      this.update(this.host.currentState);
    }
  }

  update(state: WorldState): void {
    if (!this.isOpen) return;
    this.stateView.textContent = JSON.stringify(state, null, 2);
    const node = this.host.currentNode;
    this.here.textContent = node ? `Agora: ${node.fragmentId} / ${node.nodeId}` : 'Agora: fora de um fragmento';
    for (const b of this.nodeList.querySelectorAll<HTMLButtonElement>('button')) {
      b.classList.toggle('current', node?.fragmentId === this.fragmentSelect.value && b.dataset.node === node?.nodeId);
    }
  }

  private section(title: string, open: boolean, children: Node[]): HTMLDetailsElement {
    const details = el('details', {}, [el('summary', { text: title }), ...children]);
    details.open = open;
    return details;
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    return el('button', { class: 'debug-button', text: label, on: { click: onClick } });
  }

  /** One line per node: id, type and the start of its text, in the current language. */
  private describe(node: SceneNode): string {
    const t = (key: string | undefined) => (key ? this.host.t(key) : '');
    const snippet = (text: string) => (text.length > 60 ? `${text.slice(0, 60)}…` : text);
    switch (node.type) {
      case 'dialogue':
        return snippet(`${node.speaker ? `${node.speaker}: ` : ''}${t(node.text)}`);
      case 'thought':
        return snippet(t(node.man ?? node.beast));
      case 'choice':
        return snippet(node.text ? t(node.text) : node.choices.map((c) => t(c.text)).join(' / '));
      case 'minigame':
        return node.game;
      case 'exploration':
        return snippet(t(node.hint));
      case 'fate_event':
        return node.thread;
      case 'stage':
        return node.mode && node.mode !== 'normal' ? `${node.background ?? ''} (${node.mode})` : (node.background ?? '');
      default:
        return '';
    }
  }

  private renderNodes(): void {
    const fragmentId = this.fragmentSelect.value;
    const fragment = this.host.bundle.fragments[fragmentId];
    if (!fragment) return;
    const filter = this.filterSelect.value;
    const nodes = fragment.nodes.filter((n) =>
      filter === 'all'
        ? true
        : filter === 'decisions'
          ? n.type === 'choice' || n.type === 'minigame' || n.type === 'exploration' || (n.type === 'dialogue' && n.gift)
          : n.type !== 'stage' && n.type !== 'branch' && n.type !== 'end',
    );
    this.nodeList.replaceChildren(
      this.button('▶ Começar o fragmento', () => this.host.jump(fragmentId)),
      ...nodes.map((n) => {
        const b = el('button', { class: `debug-node type-${n.type}`, attrs: { 'data-node': n.id } }, [
          el('span', { class: 'debug-node-id', text: `${n.id} · ${TYPE_LABEL[n.type]}` }),
          el('span', { class: 'debug-node-text', text: this.describe(n) }),
        ]);
        b.disabled = !JUMPABLE.includes(n.type);
        b.addEventListener('click', () => this.host.jump(fragmentId, n.id));
        return b;
      }),
    );
    this.update(this.host.currentState);
  }

  private fillFlags(): void {
    const s = this.host.currentState;
    this.flagsInput.value = JSON.stringify({ flags: s.flags, relations: s.relations, fate: s.fate, giftUses: s.giftUses }, null, 2);
  }

  private applyFlags(): void {
    let patch: Partial<WorldState>;
    try {
      patch = JSON.parse(this.flagsInput.value) as Partial<WorldState>;
    } catch {
      this.flagsInput.classList.add('error');
      return;
    }
    this.flagsInput.classList.remove('error');
    const node = this.host.currentNode;
    if (node) this.host.jump(node.fragmentId, node.nodeId, patch);
    else this.host.jump(this.fragmentSelect.value, undefined, patch);
  }
}
