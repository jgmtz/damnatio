// Game controller: glues content, world state, the scene runner, saving and the UI.
// Chapter flow: fragments play in chapter.order; the world state is autosaved after every input.

import { AudioPlayer } from './systems/audioPlayer';
import { Discovery } from './engine/discovery';
import type { LoadedContent } from './engine/loadContent';
import { browserStore, createSave, exportSaveCode, importSaveCode, SaveError, SaveStore } from './engine/save';
import { CAUGHT_CHOICE_ID, GIFT_CHOICE_ID, SceneRunner } from './engine/sceneRunner';
import { loadSettings, saveSettings, type Settings } from './engine/settings';
import { END_KEY, optionKey, runSteps } from './engine/pathMap';
import { findRunToNode, playChapterRandomly, prng } from './engine/simulate';
import { createInitialState, emptyStage, evaluateAll, summaryLines, type DecisionRecord, type WorldState } from './engine/state';
import { LOCALES, StringTable } from './engine/strings';
import type { Chapter, Choice, MinigameKind, ThreadKind } from './engine/types';
import { ExplorationController } from './systems/exploration';
import { preloadArt, setArtResolver, SYSTEM_ART } from './systems/artRegistry';
import { yarnStripUrl } from './systems/yarn';
import { DebugPanel, type MapPreview } from './ui/debugPanel';
import { ChoiceList, DialogueBox } from './ui/dialogueBox';
import { el } from './ui/dom';
import { MinigameHost } from './ui/minigameHost';
import { button, Overlay } from './ui/overlay';
import { createPathMap } from './ui/pathMap';
import { Stage } from './ui/stage';
import { InspectView } from './ui/inspectView';
import { ThoughtView } from './ui/thoughts';

const FIRST_CHAPTER = 'ch01';

/** The long counters the world shows when they move (docs/design/proposta-decisoes.md, options B and E). */
interface Signals {
  fragment: string;
  /** Théron's Bond: how many people still hold a thread to him. */
  laco: number;
  /** Lívia's seal: + secrets kept, − truth told. */
  selo: number;
  /** How much the College has heard, from all three protagonists. */
  alerta: number;
  theronGift: number;
  relations: Record<string, number>;
}

const num = (value: unknown): number => (typeof value === 'number' ? value : 0);

export class Game {
  private readonly store = browserStore();
  private readonly saves = new SaveStore(this.store);
  private readonly settings: Settings = loadSettings(this.store);
  private readonly strings: StringTable;
  private readonly audio: AudioPlayer;
  private readonly stage: Stage;
  private readonly dialogue: DialogueBox;
  private readonly choices: ChoiceList;
  private readonly thoughts: ThoughtView;
  private readonly inspectView: InspectView;
  private readonly overlay: Overlay;
  private readonly exploration: ExplorationController;
  private readonly minigames: MinigameHost;
  private readonly giftHint: HTMLButtonElement;
  private readonly debug: DebugPanel | null;
  private readonly discovery: Discovery;
  /** Stops the thread map's animation when its screen closes. */
  private stopMap: (() => void) | null = null;

  private state: WorldState = createInitialState();
  private runner: SceneRunner | null = null;
  private warnedSaveUnavailable = false;
  /** True while a fate thread animation plays; input is ignored. */
  private busy = false;
  /** Lifts the veil of a weighty choice (Stage.veil), if one is down. */
  private liftVeil: (() => void) | null = null;
  /** The marked choice that already had its pause of weight (so a menu round trip doesn't repeat it). */
  private weighedNode: string | null = null;
  /** Long counters as last seen, to signal their changes on screen (noticeSignals). */
  private signals: Signals | null = null;
  /** The next signal check only records: a marked choice already showed its own thread. */
  private quietSignals = false;
  /** Théron just lost presence: his name flickers on his next line. */
  private flickerTheron = false;

  constructor(
    viewport: HTMLElement,
    private readonly content: LoadedContent,
  ) {
    this.strings = new StringTable(content.bundle.strings, this.settings.locale);
    this.audio = new AudioPlayer(content.bundle.audio, (file) => content.audioUrl(file));
    this.audio.setVolumes(this.settings.musicVolume, this.settings.sfxVolume);
    this.discovery = new Discovery(this.store, content.bundle);
    this.stage = new Stage(viewport, content);
    this.dialogue = new DialogueBox(this.stage.uiLayer);
    this.choices = new ChoiceList(this.stage.uiLayer, () => this.t('ui.locked'));
    this.thoughts = new ThoughtView(this.stage, this.stage.uiLayer);
    this.inspectView = new InspectView(this.stage, this.stage.uiLayer);
    const hint = el('div', { class: 'explore-hint hidden' });
    this.giftHint = el('button', { class: 'gift-hint hidden', text: this.t('ui.giftHint') });
    this.giftHint.addEventListener('click', (e) => {
      e.stopPropagation();
      this.useGift();
    });
    this.stage.uiLayer.append(hint, this.giftHint);
    this.overlay = new Overlay(this.stage.uiLayer);
    this.exploration = new ExplorationController(
      this.stage,
      hint,
      this.stage.uiLayer,
      () => this.overlay.isOpen,
      (key) => this.t(key),
    );
    this.minigames = new MinigameHost(this.stage, (key) => this.t(key), () => this.overlay.isOpen);
    // In-game debugger (F2): in dev, or in a build opened with ?debug.
    const debugEnabled = import.meta.env.DEV || new URLSearchParams(location.search).has('debug');
    this.debug = debugEnabled ? this.createDebugger() : null;
    window.addEventListener('keydown', (e) => this.onKey(e));
    window.addEventListener('keyup', (e) => this.exploration.onKey(e, false));
    // Dev console access for debugging, e.g. __game.stage.simulate(2).
    if (import.meta.env.DEV) Object.assign(window, { __game: this });
    // Painted pieces used by the systems (threads, first-person limbs, the map): start loading now.
    setArtResolver((id) => this.stage.image(id));
    preloadArt(SYSTEM_ART);
    // The thread texture used by CSS (scene transitions, timers, title ornaments): drawn in code
    // first, then again with the painted strip as soon as it has loaded.
    document.documentElement.style.setProperty('--yarn', `url(${yarnStripUrl()})`);
    const stripUrl = content.artUrl('thread.strip');
    if (stripUrl) {
      const strip = new Image();
      // A moment later, so the stage's own copy of the image (the one drawYarn uses) is ready too.
      strip.onload = () =>
        window.setTimeout(() => document.documentElement.style.setProperty('--yarn', `url(${yarnStripUrl()})`), 200);
      strip.src = stripUrl;
    }
    this.applyLocale();
  }

  private t(key: string, vars?: Record<string, string | number>): string {
    return this.strings.t(key, vars);
  }

  /** Texts that live outside the screens being rebuilt (tab title, the gift button). */
  private applyLocale(): void {
    this.strings.setLocale(this.settings.locale);
    document.title = this.t('game.fullTitle');
    document.documentElement.lang = this.settings.locale;
    this.giftHint.textContent = this.t('ui.giftHint');
  }

  /** Switches to the next language (Options, and the switch on the title screen). */
  private cycleLocale(): void {
    const i = LOCALES.indexOf(this.settings.locale);
    this.settings.locale = LOCALES[(i + 1) % LOCALES.length]!;
    saveSettings(this.store, this.settings);
    this.applyLocale();
  }

  private languageLabel(): string {
    return `${this.t('ui.language')}: ${this.t('ui.languageName')}`;
  }

  // --- Screens ---

  showTitle(): void {
    this.runner = null;
    this.liftVeil?.();
    this.liftVeil = null;
    this.exploration.stop();
    this.minigames.stop();
    this.giftHint.classList.add('hidden');
    this.dialogue.hide();
    this.choices.hide();
    this.thoughts.hide();
    this.inspectView.hide();
    this.stage.fera = 0;
    this.audio.playMusic('title');
    // Title backdrop: the temple at night, Lívia kneeling at the altar with the cup alight.
    this.stage.render({
      background: 'bg.temple',
      worldWidth: 3840,
      mode: 'night',
      characters: [
        { id: 'livia', pose: 'offering', x: 3010, flame: 1.2, facing: 'right' },
        { id: 'hearth', pose: 'idle', x: 3250, flame: 1.4 },
      ],
    });
    const hasSave = this.saves.read() !== null;
    this.overlay.show(
      [
        el('h1', { class: 'title', text: this.t('game.title') }),
        el('div', { class: 'subtitle', text: this.t('game.subtitle') }),
        button(this.t('ui.continue'), () => this.continueGame(), { disabled: !hasSave }),
        button(this.t('ui.newGame'), () => this.newGame()),
        button(this.t('ui.importSave'), () => this.showImport(() => this.showTitle())),
        button(this.t('ui.settings'), () => this.showSettings(() => this.showTitle())),
        button(this.t('ui.credits'), () => this.showCredits(() => this.showTitle())),
        el('button', {
          class: 'language-button',
          text: this.languageLabel(),
          on: {
            click: () => {
              this.cycleLocale();
              this.showTitle();
            },
          },
        }),
      ],
      { variant: 'title-screen' },
    );
  }

  private showMenu(): void {
    if (!this.runner) return;
    this.choices.hide();
    this.audio.setPauseMusic('pause');
    this.overlay.show(
      [
        el('h2', { text: this.t('ui.menu') }),
        button(this.t('ui.resume'), () => this.resumeFromMenu()),
        button(this.t('ui.threads'), () => this.showThreads(() => this.showMenu())),
        button(this.t('ui.exportSave'), () => this.showExport(() => this.showMenu())),
        button(this.t('ui.settings'), () => this.showSettings(() => this.showMenu())),
        button(this.t('ui.backToTitle'), () => this.showTitle()),
      ],
      { onDismiss: () => this.resumeFromMenu() },
    );
  }

  private resumeFromMenu(): void {
    this.overlay.hide();
    this.audio.setPauseMusic(null);
    // Re-render the current node; this also restarts a timed choice from full time.
    this.render();
  }

  private showExport(back: () => void): void {
    const code = exportSaveCode(createSave(this.state));
    const textarea = el('textarea', { class: 'save-code', attrs: { readonly: '', rows: '6' } });
    textarea.value = code;
    const copy = button(this.t('ui.copy'), () => {
      textarea.select();
      navigator.clipboard?.writeText(code).then(
        () => (copy.textContent = this.t('ui.copied')),
        () => undefined,
      );
    });
    this.overlay.show(
      [el('h2', { text: this.t('ui.exportSave') }), el('p', { text: this.t('ui.exportHelp') }), textarea, copy, button(this.t('ui.close'), back)],
      { onDismiss: back },
    );
  }

  private showImport(back: () => void): void {
    const textarea = el('textarea', { class: 'save-code', attrs: { rows: '6' } });
    const error = el('p', { class: 'error hidden', text: this.t('ui.importError') });
    const confirm = button(this.t('ui.confirm'), () => {
      try {
        const save = importSaveCode(textarea.value);
        this.state = save.state;
        this.persist();
        this.continueGame();
      } catch (e) {
        if (!(e instanceof SaveError)) throw e;
        error.classList.remove('hidden');
      }
    });
    this.overlay.show(
      [el('h2', { text: this.t('ui.importSave') }), el('p', { text: this.t('ui.importHelp') }), textarea, error, confirm, button(this.t('ui.cancel'), back)],
      { onDismiss: back },
    );
  }

  private showSettings(back: () => void): void {
    const label = () =>
      `${this.t('ui.timedChoices')}: ${this.settings.timedChoices ? this.t('ui.on') : this.t('ui.off')}`;
    const toggle = button(label(), () => {
      this.settings.timedChoices = !this.settings.timedChoices;
      saveSettings(this.store, this.settings);
      toggle.textContent = label();
    });
    const tutorials = button(this.t('ui.replayTutorials'), () => {
      this.settings.seenTutorials = [];
      saveSettings(this.store, this.settings);
      tutorials.textContent = this.t('ui.replayTutorialsDone');
    });
    const language = button(this.languageLabel(), () => {
      this.cycleLocale();
      this.showSettings(back);
    });
    // Volumes step down 100 → 75 → 50 → 25 → 0 → 100 %.
    const volume = (key: 'musicVolume' | 'sfxVolume', labelKey: string) => {
      const text = () => `${this.t(labelKey)}: ${Math.round(this.settings[key] * 100)}%`;
      const b = button(text(), () => {
        const next = Math.round(this.settings[key] * 4) - 1;
        this.settings[key] = next < 0 ? 1 : next / 4;
        saveSettings(this.store, this.settings);
        this.audio.setVolumes(this.settings.musicVolume, this.settings.sfxVolume);
        if (key === 'sfxVolume') this.audio.sfx('echo.tie');
        b.textContent = text();
      });
      return b;
    };
    this.overlay.show(
      [
        el('h2', { text: this.t('ui.settings') }),
        language,
        volume('musicVolume', 'ui.musicVolume'),
        volume('sfxVolume', 'ui.sfxVolume'),
        toggle,
        tutorials,
        button(this.t('ui.credits'), () => this.showCredits(() => this.showSettings(back))),
        button(this.t('ui.close'), back),
      ],
      { onDismiss: back },
    );
  }

  /** The works the game uses (audio.json `credits`): a work leaves the list once no track plays it. */
  private showCredits(back: () => void): void {
    const audio = this.content.bundle.audio;
    const used = new Set([
      ...Object.values(audio.music).flatMap((track) => track.layers.map((layer) => layer.file)),
      ...Object.values(audio.sfx),
    ]);
    const list = el('ul', { class: 'credits-list' });
    for (const credit of audio.credits ?? []) {
      if (!credit.files.some((file) => used.has(file))) continue;
      const line = credit.line ?? this.t('ui.creditsLine', { work: credit.work, author: credit.author, license: credit.license });
      const link = el('a', { text: line, attrs: { href: credit.url, target: '_blank', rel: 'noopener' } });
      list.append(el('li', {}, [link]));
    }
    this.overlay.show(
      [
        el('h2', { text: this.t('ui.credits') }),
        el('h3', { text: this.t('ui.creditsMusic') }),
        el('p', { text: this.t('ui.creditsMusicIntro') }),
        list,
        button(this.t('ui.close'), back),
      ],
      { onDismiss: back },
    );
  }

  /**
   * The threads so far: only the path the player actually took, grouped by fragment, plus the
   * threads that were cut. The roads not taken appear only on the thread map at the end of a fragment.
   */
  private showThreads(back: () => void): void {
    const state = this.runner?.state ?? this.state;
    const bundle = this.content.bundle;
    const list = el('div', { class: 'threads-list' });
    let lastFragment = '';
    for (const record of state.history) {
      const fragment = bundle.fragments[record.fragmentId];
      const node = fragment?.nodes.find((n) => n.id === record.nodeId);
      let taken: string | null = null;
      let marked = false;
      if (record.choiceId === GIFT_CHOICE_ID) {
        taken = this.t(fragment?.protagonist === 'theron' ? 'ui.threads.gift.theron' : 'ui.threads.gift');
        marked = true;
      } else if (node?.type === 'choice') {
        const choice = node.choices.find((c) => c.id === record.choiceId);
        taken = choice ? this.t(choice.text) : null;
        marked = Boolean(choice?.thread);
      } else if (node?.type === 'minigame') {
        const outcome = node.outcomes.find((o) => o.id === record.choiceId);
        taken = outcome?.label ? this.t(outcome.label) : null;
        marked = true;
      } else if (node?.type === 'exploration') {
        const label = record.choiceId === CAUGHT_CHOICE_ID ? node.caught?.label : node.exits.find((e) => e.id === record.choiceId)?.label;
        taken = label ? this.t(label) : null;
      }
      if (!taken) continue;
      if (fragment && fragment.id !== lastFragment) {
        lastFragment = fragment.id;
        list.append(el('h3', { class: 'threads-fragment', text: this.t(fragment.title) }));
      }
      list.append(
        el('div', { class: `thread-row${marked ? ' marked' : ''}` }, [
          el('span', { class: 'thread-knot' }),
          el('div', { class: 'thread-taken', text: taken }),
        ]),
      );
    }
    for (const id of state.deaths) {
      const character = bundle.characters[id];
      list.append(
        el('div', { class: 'thread-row cut' }, [
          el('span', { class: 'thread-knot' }),
          el('div', { class: 'thread-taken', text: `${this.t('ui.threads.cut')} ${character ? this.t(character.name) : id}` }),
        ]),
      );
    }
    if (!list.childElementCount) list.append(el('p', { text: this.t('ui.threads.empty') }));
    this.overlay.show([el('h2', { text: this.t('ui.threads') }), list, button(this.t('ui.close'), back)], {
      variant: 'threads',
      onDismiss: back,
    });
  }

  private showCard(title: string, subtitle: string, onContinue: () => void): void {
    this.dialogue.hide();
    this.choices.hide();
    this.overlay.show(
      [el('h2', { class: 'card-title', text: title }), el('p', { text: subtitle }), button('▶', () => {
        this.overlay.hide();
        onContinue();
      })],
      { variant: 'card' },
    );
  }

  // --- Flow ---

  private get chapter(): Chapter {
    const chapter = this.content.bundle.chapters[this.state.progress?.chapterId ?? FIRST_CHAPTER];
    if (!chapter) throw new Error('Chapter not found');
    return chapter;
  }

  private newGame(): void {
    this.state = createInitialState();
    const firstFragment = this.content.bundle.chapters[FIRST_CHAPTER]?.order[0];
    if (!firstFragment) throw new Error(`Chapter ${FIRST_CHAPTER} has no fragments`);
    this.state.progress = { chapterId: FIRST_CHAPTER, fragmentId: firstFragment, nodeId: null, stage: emptyStage() };
    this.persist();
    this.continueGame();
  }

  private continueGame(): void {
    const saved = this.saves.read();
    if (saved) this.state = saved.state;
    const progress = this.state.progress;
    this.overlay.hide();
    // Clear the title backdrop so the fragment's scene starts fresh (no walking from the old spot).
    this.stage.render(emptyStage());
    if (!progress) {
      this.showChapterEnd();
      return;
    }
    const fragment = this.content.bundle.fragments[progress.fragmentId];
    if (!fragment) throw new Error(`Fragment ${progress.fragmentId} not found`);

    if (progress.nodeId === null) {
      const protagonist = this.content.bundle.characters[fragment.protagonist];
      // An interlude (prologue, closing hook) belongs to no one: its title, under the chapter's name.
      const [title, subtitle] = fragment.interlude
        ? [this.t(fragment.title), this.t(this.chapter.title)]
        : [protagonist ? this.t(protagonist.name) : '', this.t(fragment.title)];
      this.showCard(title, subtitle, () => {
        this.runner = new SceneRunner(fragment, this.state, { onEnterNode: (n) => this.audio.play(n.audio) });
        this.afterInput();
      });
    } else {
      this.runner = new SceneRunner(fragment, this.state, {
        resume: { nodeId: progress.nodeId, stage: progress.stage },
        onEnterNode: (n) => this.audio.play(n.audio),
      });
      this.render();
    }
  }

  /** Called after every player action: sync state, autosave, render. */
  private afterInput(): void {
    const runner = this.runner;
    if (!runner) return;
    this.state = runner.state;

    if (runner.isEnded) {
      this.finishFragment(runner.fragment.id);
      return;
    }
    this.state = {
      ...this.state,
      progress: { chapterId: this.chapter.id, fragmentId: runner.fragment.id, nodeId: runner.nodeId, stage: runner.stage },
    };
    this.persist();
    this.render();
  }

  private finishFragment(fragmentId: string): void {
    const order = this.chapter.order;
    const next = order[order.indexOf(fragmentId) + 1];
    this.state = {
      ...this.state,
      completedFragments: [...new Set([...this.state.completedFragments, fragmentId])],
      progress: next ? { chapterId: this.chapter.id, fragmentId: next, nodeId: null, stage: emptyStage() } : null,
    };
    this.persist();
    this.runner = null;
    this.liftVeil?.();
    this.liftVeil = null;
    this.stage.render(emptyStage());
    this.dialogue.hide();
    this.choices.hide();
    this.giftHint.classList.add('hidden');
    this.thoughts.hide();
    this.stage.fera = 0;
    // The thread map of the fragment just played, then the next one (or the chapter's end).
    const onward = () => (next ? this.continueGame() : this.showChapterEnd());
    if (this.content.bundle.fragments[fragmentId]?.interlude) onward();
    else this.showPathMap(fragmentId, onward);
  }

  /** The thread map of one fragment (GDD 5.3): this playthrough's path among every path. */
  private showPathMap(
    fragmentId: string,
    onContinue: () => void,
    /** Debugger previews pass their own data instead of the real playthrough. */
    data?: { history: DecisionRecord[]; discovered: Set<string>; ended: boolean },
  ): void {
    const fragment = this.content.bundle.fragments[fragmentId];
    const graph = this.discovery.graph(fragmentId);
    if (!fragment || !graph) {
      onContinue();
      return;
    }
    this.stopMap?.();
    const map = createPathMap({
      graph,
      history: data?.history ?? this.state.history,
      discovered: data?.discovered ?? this.discovery.found,
      ended: data?.ended ?? this.state.completedFragments.includes(fragmentId),
      t: (key, vars) => this.t(key, vars),
      title: this.t('ui.map.title', { fragment: this.t(fragment.title) }),
    });
    // The map covers the whole stage: stop drawing the scene behind it (it only cost frame time).
    this.stage.frozen = true;
    const stop = () => {
      map.stop();
      this.stage.frozen = false;
    };
    this.stopMap = stop;
    const close = () => {
      stop();
      this.stopMap = null;
      this.overlay.hide();
      onContinue();
    };
    this.overlay.show([map.element, button(this.t('ui.map.continue'), close)], { variant: 'pathmap-screen', onDismiss: close });
  }

  /** `preview` (debugger): a simulated playthrough shown instead of the real one, never saved. */
  private showChapterEnd(preview?: WorldState): void {
    this.runner = null;
    this.dialogue.hide();
    this.choices.hide();
    this.stage.render(emptyStage());
    const state = preview ?? this.state;
    const again = () => this.showChapterEnd(preview);
    const maps = this.chapter.order
      .filter((id) => state.completedFragments.includes(id) && !this.content.bundle.fragments[id]?.interlude)
      .map((id) => {
        const fragment = this.content.bundle.fragments[id]!;
        const graph = this.discovery.graph(id);
        const data =
          preview && graph
            ? {
                history: preview.history,
                ended: true,
                discovered: new Set([
                  ...this.discovery.found,
                  ...runSteps(graph, preview.history).map((s) => optionKey(id, s.point, s.option)),
                  optionKey(id, END_KEY, ''),
                ]),
              }
            : undefined;
        return button(this.t(fragment.title), () => this.showPathMap(id, again, data));
      });
    // What remained: who lives, who was taken, who still remembers (chapter.json "summary").
    const remained = summaryLines(this.chapter.summary, state).map((key) => el('li', { text: this.t(key) }));
    this.overlay.show(
      [
        el('h2', { class: 'card-title', text: this.t('ui.chapterEnd') }),
        ...(remained.length ? [el('h3', { class: 'chapter-summary-title', text: this.t('ui.chapterSummary') }), el('ul', { class: 'chapter-summary' }, remained)] : []),
        el('p', { text: this.t('ui.chapterEndHelp') }),
        el('div', { class: 'chapter-maps' }, maps),
        el('div', { class: 'chapter-end-actions' }, [
          button(this.t('ui.exportSave'), () => this.showExport(again)),
          button(this.t('ui.backToTitle'), () => this.showTitle()),
        ]),
      ],
      { variant: 'chapter-end' },
    );
  }

  private persist(): void {
    this.discovery.record(this.state);
    const ok = this.saves.write(createSave(this.state));
    if (!ok && !this.warnedSaveUnavailable) {
      this.warnedSaveUnavailable = true;
      console.warn(this.t('ui.saveUnavailable'));
    }
    this.debug?.update(this.state);
  }

  // --- Rendering the current node ---

  private speakerName(id: string | undefined): string | null {
    if (!id) return null;
    const character = this.content.bundle.characters[id];
    return character ? this.t(character.name) : id;
  }

  private portraitUrl(speaker: string | undefined, expression: string | undefined): string | null {
    if (!speaker) return null;
    const character = this.content.bundle.characters[speaker];
    const art = character?.portraits?.[expression ?? character.defaultExpression ?? ''];
    return art ? this.content.artUrl(art) : null;
  }

  private render(): void {
    const runner = this.runner;
    if (!runner) return;
    // Back from the menu mid-walk or mid-minigame: keep things where the player left them.
    if (runner.view.kind === 'exploration' && this.exploration.isActive) return;
    if (runner.view.kind === 'minigame' && this.minigames.isActive) return;
    this.stage.render(runner.stage);
    this.debug?.update(this.state);
    const view = runner.view;
    const gift = (view.kind === 'dialogue' || view.kind === 'choice') && view.node.gift !== undefined;
    this.giftHint.classList.toggle('hidden', !gift);
    if (gift) this.giftHint.textContent = this.giftLabel(runner, view.node.giftHint);
    this.liftVeil?.();
    this.liftVeil = null;

    // Asterion's beast shows on screen only in his own fragments.
    this.stage.fera = this.fera(runner);
    // Théron's presence: the more he has used his gift, the less the world holds him.
    const presence = this.presence(runner);
    const theron = this.stage.figure('theron');
    if (theron) theron.presence = presence;
    // Lívia's seal colors the flame in her cup: bluer as she tells the truth, redder as she keeps secrets.
    const livia = this.stage.figure('livia');
    if (livia) livia.flameFilter = this.sealFilter(runner);
    // The music hears the same prices: the beast's drums, the seal's warmth, Théron's missing notes.
    this.audio.setSignals({ fera: this.fera(runner), selo: runner.state.fate.selo ?? 0, presence });
    this.noticeSignals(runner);
    if (view.kind !== 'thought') this.thoughts.hide();

    if (view.kind === 'thought') {
      this.dialogue.hide();
      this.choices.hide();
      const { node } = view;
      const thinker = node.speaker ?? runner.stage.characters[0]?.id ?? null;
      this.thoughts.show(
        thinker,
        node.man ? this.t(node.man) : null,
        node.beast ? this.t(node.beast) : null,
        this.fera(runner),
        () => {
          runner.advance();
          this.afterInput();
        },
        // The voice is the thinker's: Asterion can think inside a fragment of Théron's (T4, the bronze).
        thinker === 'theron' ? 'theron' : undefined,
        node.second ? this.t(node.second) : null,
      );
    } else if (view.kind === 'dialogue') {
      this.choices.hide();
      const { node } = view;
      this.dialogue.setSpeakerPresence(node.speaker === 'theron' ? presence : 1);
      this.dialogue.show(
        this.speakerName(node.speaker),
        this.t(node.text),
        () => {
          runner.advance();
          this.afterInput();
        },
        this.portraitUrl(node.speaker, node.expression),
      );
      if (node.speaker === 'theron' && this.flickerTheron) {
        this.flickerTheron = false;
        this.dialogue.flickerName();
      }
    } else if (view.kind === 'choice') {
      const { node } = view;
      if (node.text) {
        this.dialogue.show(
          this.speakerName(node.speaker),
          this.t(node.text),
          null,
          this.portraitUrl(node.speaker, node.expression),
        );
      } else {
        this.dialogue.hide();
      }
      const seconds = node.timeLimit && this.settings.timedChoices ? node.timeLimit.seconds : null;
      const historyLength = runner.state.history.length;
      // After choosing, play the fate thread of the choice actually taken (if it is marked).
      const taken = (): Choice | undefined => {
        const record = runner.state.history[historyLength];
        return node.choices.find((c) => c.id === record?.choiceId);
      };
      const showChoices = () =>
        this.choices.show(
          view.options.map((o) => ({
            id: o.choice.id,
            text: this.t(o.choice.text),
            available: o.available,
            ...(o.choice.voice ? { voice: o.choice.voice } : {}),
            ...(o.choice.lockedHint ? { lockedReason: this.t(o.choice.lockedHint) } : {}),
          })),
          (id) => {
            runner.choose(id);
            void this.afterChoice(taken());
          },
          seconds,
          () => {
            runner.timeout();
            void this.afterChoice(taken());
          },
          node.panel === 'high',
          () => this.stage.headroom(),
        );
      // A pause of weight before a marked (untimed) choice: the scene closes in, then the options come.
      const weighty = seconds === null && node.choices.some((c) => c.thread) && this.weighedNode !== `${runner.fragment.id}/${node.id}`;
      if (weighty) {
        this.weighedNode = `${runner.fragment.id}/${node.id}`;
        this.choices.hide();
        // The music steps back with the scene, and returns when the veil lifts.
        const lift = this.stage.veil();
        this.audio.duck(true);
        this.liftVeil = () => {
          lift();
          this.audio.duck(false);
        };
        window.setTimeout(() => {
          if (this.runner === runner && runner.nodeId === node.id && !this.overlay.isOpen) showChoices();
        }, 1100);
      } else {
        showChoices();
      }
    } else if (view.kind === 'fate_event') {
      this.dialogue.hide();
      this.choices.hide();
      this.busy = true;
      void this.playThread(view.node.thread).then(() => {
        this.busy = false;
        // Ignore if the player left to the title screen meanwhile.
        if (this.runner !== runner) return;
        runner.advance();
        this.afterInput();
      });
    } else if (view.kind === 'exploration') {
      const { node } = view;
      this.dialogue.hide();
      this.choices.hide();
      const controls = node.watchers?.length ? this.t('ui.sneakHint') : this.t('ui.walkHint');
      const hint = node.hint ? `${this.t(node.hint)}  ·  ${controls}` : controls;
      this.exploration.start(
        {
          character: node.character,
          hint,
          exits: view.exits,
          hotspots: view.hotspots,
          watchers: node.watchers ?? [],
          ...(node.guide ? { guide: node.guide } : {}),
          sounds: node.sounds ?? [],
          niches: node.niches ?? [],
          barks: (node.barks ?? [])
            .filter((b) => evaluateAll(runner.state, b.conditions))
            .map((b) => ({ x: b.x, speaker: b.speaker, text: this.t(b.text) })),
          ...(node.scent ? { scent: node.scent } : {}),
          fera: this.fera(runner),
        },
        {
          onExit: (exitId, x, others) => {
            runner.exit(exitId, x, others);
            this.afterInput();
          },
          onCaught: (x) => {
            runner.caught(x);
            this.afterInput();
          },
          onInspect: (hotspotId) => this.inspect(runner, hotspotId),
          onSniff: () => {
            runner.sniff();
            this.state = runner.state;
            this.persist();
            this.stage.fera = this.fera(runner);
            this.noticeSignals(runner);
          },
        },
      );
    } else if (view.kind === 'minigame') {
      this.dialogue.hide();
      this.choices.hide();
      // Guided tutorial the first time each kind of scene is played (not for involuntary, guided scenes).
      const kind = view.node.game;
      const guided = Boolean(view.node.params?.guided);
      const tutorial = !guided && !this.settings.seenTutorials.includes(kind);
      void this.minigames.play(view.node, !this.settings.timedChoices, tutorial, this.fera(runner)).then((result) => {
        if (tutorial) {
          this.settings.seenTutorials = [...this.settings.seenTutorials, kind];
          saveSettings(this.store, this.settings);
        }
        if (this.runner !== runner) return;
        runner.finishMinigame(result.outcome, result.earned);
        this.afterInput();
      });
    }
  }

  /**
   * Debugger (F2 panel, or the console): jump straight to a node, e.g. __game.debugJump('livia-04', 'm_book').
   * Without a node it starts the fragment. The fragment is played by itself along the shortest way to
   * the node (src/engine/simulate.ts runToNode), so the scene, who is on stage and the flags are right;
   * those automatic decisions are left out of the history (they don't count as discovered paths).
   * `patch` then overrides parts of the world state, e.g. { flags: { claudia_deu_dica: true } }.
   */
  debugJump(fragmentId: string, nodeId?: string, patch: Partial<WorldState> = {}): void {
    const fragment = this.content.bundle.fragments[fragmentId];
    if (!fragment) throw new Error(`Fragment ${fragmentId} not found`);
    const base: WorldState = { ...(this.runner?.state ?? this.state), ...patch, progress: null };
    this.state = base;
    this.signals = null;
    this.weighedNode = null;
    this.stopMap?.();
    this.stopMap = null;
    this.busy = false;
    this.overlay.hide();
    this.exploration.stop();
    this.minigames.stop();
    this.dialogue.hide();
    this.choices.hide();
    this.thoughts.hide();
    this.inspectView.hide();
    this.stage.render(emptyStage());
    const guided = nodeId ? findRunToNode(this.content.bundle, fragmentId, base, nodeId, patch) : null;
    if (guided && !guided.isEnded) {
      this.state = { ...guided.state, history: base.history, completedFragments: base.completedFragments, ...patch };
      this.runner = new SceneRunner(fragment, this.state, {
        resume: { nodeId: guided.nodeId, stage: guided.stage },
        onEnterNode: (n) => this.audio.play(n.audio),
      });
      this.afterInput();
      return;
    }
    // Unreachable from this state (or no node given): start there with the fragment's first scene.
    const firstStage = fragment.nodes.find((n) => n.type === 'stage');
    const stage = {
      ...emptyStage(),
      ...(firstStage?.type === 'stage'
        ? {
            background: firstStage.background ?? null,
            characters: structuredClone(firstStage.characters ?? []),
            worldWidth: firstStage.worldWidth,
            mode: firstStage.mode,
          }
        : {}),
    };
    const target = nodeId ? fragment.nodes.find((n) => n.id === nodeId) : undefined;
    if (nodeId && !target) throw new Error(`Node ${nodeId} not found`);
    const waits = target && ['dialogue', 'thought', 'choice', 'exploration', 'fate_event', 'minigame'].includes(target.type);
    this.runner = new SceneRunner(fragment, this.state, {
      ...(waits ? { resume: { nodeId: target.id, stage } } : {}),
      onEnterNode: (n) => this.audio.play(n.audio),
    });
    if (target && !waits) this.runner.jumpTo(target.id);
    this.afterInput();
  }

  /** The debugger panel (src/ui/debugPanel.ts) and what it can do in the game. */
  private createDebugger(): DebugPanel {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- getters below need the game
    const game = this;
    const back = () => {
      this.overlay.hide();
      if (this.runner) this.render();
      else this.showTitle();
    };
    return new DebugPanel({
      bundle: this.content.bundle,
      t: (key) => this.t(key),
      get currentState() {
        return game.runner?.state ?? game.state;
      },
      get currentNode() {
        return game.runner ? { fragmentId: game.runner.fragment.id, nodeId: game.runner.nodeId } : null;
      },
      jump: (fragmentId, nodeId, patch) => this.debugJump(fragmentId, nodeId, patch),
      showScreen: (screen) => {
        this.choices.hide();
        if (screen === 'title') this.showTitle();
        else if (screen === 'threads') this.showThreads(back);
        else if (screen === 'settings') this.showSettings(back);
        // A simulated playthrough of the chapter, so the map buttons have something to show (not saved).
        else this.showChapterEnd(playChapterRandomly(this.content.bundle, this.chapter.id, prng(7)));
      },
      showMap: (fragmentId, preview) => this.previewMap(fragmentId, preview, back),
      playThread: (kind) => void this.playThread(kind),
      setTutorials: (show) => {
        const all: MinigameKind[] = ['pour', 'reveal', 'descent', 'embers', 'rhythm', 'trace', 'restraint', 'threads', 'shells', 'vase'];
        this.settings.seenTutorials = show ? [] : all;
        saveSettings(this.store, this.settings);
      },
      cycleLocale: () => {
        this.cycleLocale();
        if (this.overlay.isOpen && !this.runner) this.showTitle();
        else if (this.runner) this.render();
      },
    });
  }

  /** Debugger: a fragment's thread map with real, simulated or fully revealed data (nothing is saved). */
  private previewMap(fragmentId: string, preview: MapPreview, back: () => void): void {
    const graph = this.discovery.graph(fragmentId);
    if (!graph) return;
    if (preview === 'real') {
      this.showPathMap(fragmentId, back);
      return;
    }
    const chapter = Object.values(this.content.bundle.chapters).find((c) => c.order.includes(fragmentId));
    if (!chapter) return;
    const discovered = new Set<string>();
    let last: WorldState | null = null;
    for (let i = 0; i < 40; i++) {
      last = playChapterRandomly(this.content.bundle, chapter.id, prng(1000 + i), fragmentId);
      for (const step of runSteps(graph, last.history)) discovered.add(optionKey(fragmentId, step.point, step.option));
    }
    if (preview === 'all') {
      for (const point of graph.points.values()) for (const o of point.options) discovered.add(optionKey(fragmentId, point.key, o.id));
    }
    discovered.add(optionKey(fragmentId, END_KEY, ''));
    this.showPathMap(fragmentId, back, { history: last?.history ?? [], discovered, ended: true });
  }

  /**
   * Théron's presence (docs/roteiros/roteiro-theron.md), 1 → 0.35: each use of the Cut Thread
   * (`giftUses.theron`) takes some of him out of the world, and each person who keeps a thread to
   * him (the flag `laco`, his Bond) holds a little of him back. Only in his own fragments.
   */
  private presence(runner: SceneRunner): number {
    if (runner.fragment.protagonist !== 'theron') return 1;
    const bond = Math.max(0, num(runner.state.flags.laco));
    return Math.min(1, Math.max(0.35, 1 - (runner.state.giftUses.theron ?? 0) * 0.16 + bond * 0.05));
  }

  /** Lívia's seal (fate `selo`) as a tint on her flame: from 2 steps either way, stronger from 3. */
  private sealFilter(runner: SceneRunner): string {
    if (runner.fragment.protagonist !== 'livia') return '';
    const seal = runner.state.fate.selo ?? 0;
    if (seal <= -3) return 'saturate(0.35) hue-rotate(165deg) brightness(1.25)';
    if (seal <= -2) return 'saturate(0.6) hue-rotate(150deg) brightness(1.15)';
    if (seal >= 3) return 'saturate(1.7) hue-rotate(-18deg) brightness(0.85)';
    if (seal >= 2) return 'saturate(1.35) hue-rotate(-10deg) brightness(0.92)';
    return '';
  }

  /** The gift button: what raising the cup (or looking at the threads) would answer here. */
  private giftLabel(runner: SceneRunner, hint: string | undefined): string {
    const base = this.t(runner.fragment.protagonist === 'theron' ? 'ui.giftHint.theron' : 'ui.giftHint');
    return hint ? `${base}: ${this.t(hint)}` : base;
  }

  /**
   * "The world took note" (docs/design/proposta-decisoes.md 7.3): when a small choice moves a relation or a
   * long counter, a thread crosses the scene for a moment; when Théron loses presence, everyone looks
   * away and his name flickers (F8). Changes made by a marked choice only update the record (its own
   * thread already played).
   */
  private noticeSignals(runner: SceneRunner): void {
    const state = runner.state;
    const now: Signals = {
      fragment: runner.fragment.id,
      laco: num(state.flags.laco),
      selo: state.fate.selo ?? 0,
      alerta: num(state.flags.colegio_alerta),
      theronGift: state.giftUses.theron ?? 0,
      relations: { ...state.relations },
    };
    const before = this.signals;
    const quiet = this.quietSignals;
    this.signals = now;
    this.quietSignals = false;
    if (!before || before.fragment !== now.fragment) return;
    if (now.theronGift > before.theronGift && runner.fragment.protagonist === 'theron') {
      this.stage.lookAway('theron');
      this.audio.muffle();
      this.audio.sfx('theron.fade');
      // His name flickers the next time it shows (the line right after is usually someone else's).
      this.flickerTheron = true;
    }
    if (quiet) return;
    if (now.alerta > before.alerta) this.echo('alert');
    else if (now.laco < before.laco) this.echo('fray');
    else if (now.laco > before.laco || now.selo !== before.selo) this.echo('tie');
    else {
      const keys = new Set([...Object.keys(before.relations), ...Object.keys(now.relations)]);
      let delta = 0;
      for (const key of keys) delta += (now.relations[key] ?? 0) - (before.relations[key] ?? 0);
      if (delta > 0) this.echo('tie');
      else if (delta < 0) this.echo('fray');
    }
  }

  /** "The world took note": the thread across the top of the scene, and its pluck. */
  private echo(kind: 'tie' | 'fray' | 'alert'): void {
    this.stage.echo(kind);
    this.audio.sfx(`echo.${kind}`);
  }

  /**
   * Asterion's beast (flag `fera`, 0–5), counted only while he is the one being played: his own
   * fragments, or a scene inside another's where the camera follows him (T4, behind the bronze).
   */
  private fera(runner: SceneRunner): number {
    if (runner.fragment.protagonist !== 'asterion' && runner.stage.characters[0]?.id !== 'asterion') return 0;
    const value = runner.state.flags.fera;
    return typeof value === 'number' ? Math.max(0, Math.min(5, value)) : 0;
  }

  /** Shows an examined object's lines over the frieze, then lets the player walk again. */
  private inspect(runner: SceneRunner, hotspotId: string): void {
    const view = runner.view;
    const hotspot = view.kind === 'exploration' ? view.hotspots.find((h) => h.id === hotspotId) : undefined;
    const lines = runner.inspect(hotspotId);
    this.state = runner.state;
    this.persist();
    this.noticeSignals(runner);
    this.exploration.setInspecting(true);
    // First person: what the character sees (Hotspot.view), while the lines are read.
    const url = hotspot?.view ? this.content.artUrl(hotspot.view) : null;
    if (hotspot && url) {
      // Seen in the scene's light: a pale painting at night is dimmed and cooled, in the dark dimmer still.
      const mode = runner.stage.mode;
      const mood = hotspot.viewMood ?? (mode === 'night' ? 'night' : mode === 'dark' ? 'dark' : 'day');
      this.inspectView.show(hotspot, url, mood, hotspot.viewGround ? this.content.artUrl(hotspot.viewGround) : null);
    }
    const show = (i: number) => {
      const key = lines[i];
      if (key === undefined || this.runner !== runner) {
        this.dialogue.hide();
        this.inspectView.hide();
        this.exploration.setInspecting(false);
        return;
      }
      this.dialogue.show(null, this.t(key), () => show(i + 1));
    };
    show(0);
  }

  /** Raise the cup during a line that allows it (F key or the on-screen hint). */
  private useGift(): void {
    const runner = this.runner;
    if (!runner || this.busy || this.overlay.isOpen) return;
    const view = runner.view;
    if ((view.kind !== 'dialogue' && view.kind !== 'choice') || !view.node.gift) return;
    this.choices.hide();
    this.giftHint.classList.add('hidden');
    runner.useGift();
    this.afterInput();
  }

  private async afterChoice(choice: Choice | undefined): Promise<void> {
    if (choice?.thread) {
      this.quietSignals = true;
      this.busy = true;
      this.dialogue.hide();
      await this.playThread(choice.thread);
      this.busy = false;
    }
    this.afterInput();
  }

  /** A fate thread's animation (tie, cut, tangle), with its sound. */
  private playThread(kind: ThreadKind): Promise<void> {
    this.audio.sfx(`thread.${kind}`);
    return this.stage.threads.play(kind);
  }

  // --- Input ---

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'F2' && this.debug) {
      e.preventDefault();
      this.debug.toggle();
      return;
    }
    if (this.overlay.isOpen) {
      if (e.key === 'Escape') this.overlay.dismiss();
      return;
    }
    if (!this.runner || this.busy) return;
    if (e.key === 'Escape') {
      this.showMenu();
      return;
    }
    // Minigames read the keyboard themselves.
    if (this.minigames.isActive) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      this.showThreads(() => this.resumeFromMenu());
      return;
    }
    if (this.exploration.onKey(e, true)) return;
    if (e.key === 'f' || e.key === 'F') {
      this.useGift();
    } else if (this.choices.isOpen && /^[1-9]$/.test(e.key)) {
      this.choices.pick(Number(e.key) - 1);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (this.thoughts.isOpen) this.thoughts.input();
      else this.dialogue.input();
    }
  }
}
