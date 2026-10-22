// Content schema: the shape of the JSON files under content/.
// Everything here is data; no story text lives in code (text fields are string keys).

export type FlagValue = boolean | number | string;

/** Changes applied to the world state when a node is entered or a choice is taken. */
export type Effect =
  | { flag: string; value: FlagValue }
  /** Numeric counter stored as a flag (missing = 0), e.g. { "flag": "colegio_suspeita", "add": 1 }. */
  | { flag: string; add: number }
  /** Relation key convention: "from:to", e.g. "livia:domicia" (Livia's bond toward Domicia). */
  | { relation: string; add: number }
  /** Fate tracks: long-term story direction. Not a morality meter. */
  | { fate: string; add: number }
  | { kill: string }
  | { giftUse: string; add?: number }
  | { crossover: string };

/** Predicates over the world state, used by choices and branches. */
export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  /** With `is`: exact value. With `min`/`max`: numeric range (missing = 0). With neither: truthy. */
  | { flag: string; is?: FlagValue; min?: number; max?: number }
  | { relation: string; min?: number; max?: number }
  | { fate: string; min?: number; max?: number }
  | { giftUses: string; min?: number; max?: number }
  | { alive: string }
  | { dead: string }
  | { crossover: string | null };

/**
 * Audio of a node (GDD 9), ids from content/audio.json. `music` changes the track (crossfade) when it
 * differs from the one playing; `null` lets the music fade to silence. `sfx` plays once.
 */
export interface AudioCue {
  music?: string | null;
  sfx?: string;
}

interface NodeBase {
  id: string;
  effects?: Effect[];
  audio?: AudioCue;
}

export interface StageCharacter {
  id: string;
  pose: string;
  /**
   * Horizontal position of the figure's ground point, in world pixels (the world is the
   * 1920px stage unless the scene sets a wider `worldWidth`). Changing it makes the figure walk.
   */
  x: number;
  facing?: 'left' | 'right';
  /** Code-drawn flame over the pose's cup (GDD 8.5). 0/omitted = none, 1 = normal, >1 = stronger. */
  flame?: number;
}

/**
 * Partial change to one character on stage. Fields left out are kept.
 * A character not yet on stage is added (needs `pose` and `x`); `remove: true` takes it off.
 */
export interface StageUpdate {
  id: string;
  pose?: string;
  x?: number;
  facing?: 'left' | 'right';
  flame?: number;
  remove?: boolean;
  /** Only applied if all conditions hold — for visible echoes of earlier choices (who is where, how strong a flame is). */
  conditions?: Condition[];
}

/**
 * Visual treatment of the whole stage. `flashback` = faded memory (GDD 8.2); `night` = dark, cold;
 * `dark` = almost black (the labyrinth): only a faint glow around the walker, sounds and scents show the way.
 */
export type StageMode = 'normal' | 'flashback' | 'night' | 'dark';

/** Sets the scene: background and who is visible. Auto-advances. */
export interface StageNode extends NodeBase {
  type: 'stage';
  /** Art id; null clears the background. Omitted keeps the current one. */
  background?: string | null;
  /** Width of the scrolling frieze in pixels. Omitted keeps the current one (default 1920). */
  worldWidth?: number;
  /** Omitted keeps the current mode. */
  mode?: StageMode;
  /** Full list of visible characters. Omitted keeps the current list. The camera follows the first one. */
  characters?: StageCharacter[];
  /** Partial changes applied after `characters` (move one figure, change a flame, add or remove someone). */
  update?: StageUpdate[];
  next: string;
}

/** A fate thread shown as a consequence (not tied to a choice), e.g. a death. Plays, then continues. */
export interface FateEventNode extends NodeBase {
  type: 'fate_event';
  thread: ThreadKind;
  next: string;
}

export interface DialogueNode extends NodeBase {
  type: 'dialogue';
  /** Character id; omitted for narration. */
  speaker?: string;
  /** Changes the speaker's pose if they are on stage. */
  pose?: string;
  /** Changes the flame over the speaker's cup if they are on stage. */
  flame?: number;
  /** Speaker's portrait expression; defaults to the character's defaultExpression. */
  expression?: string;
  /** While this line is shown, the player may raise the cup (F key) and jump to this node: the gift as a free action. */
  gift?: string;
  /**
   * What the gift would answer here (string key), shown on the gift button, e.g. "what is she hiding?".
   * Every gift window should have one: the player raises the cup for a reason, not out of curiosity.
   */
  giftHint?: string;
  text: string;
  next: string;
}

/**
 * A thought of the protagonist (Asterion, "two voices"): written over the scene near the thinker,
 * not in the dialogue box. `man` is the voice Calias taught; `beast` is the beast. Which one is heard
 * depends on the flag `fera`: 0–1 the man, 2–3 the man interrupted by the beast, 4+ the beast over a
 * faint man. Either may be missing (then the other is shown).
 */
export interface ThoughtNode extends NodeBase {
  type: 'thought';
  /** Who thinks (the text appears over them); defaults to the scene's first character. */
  speaker?: string;
  /** Changes the thinker's pose. */
  pose?: string;
  man?: string;
  beast?: string;
  /**
   * A second voice that answers the first a moment later (Lívia: Domícia's voice; Théron: the hero he
   * was). Both voices are right; the player decides which to follow. Not used by Asterion (he has the beast).
   */
  second?: string;
  next: string;
}

/** Fate thread animation played when a marked choice is taken (GDD 5.3). */
export type ThreadKind = 'tie' | 'cut' | 'tangle';

export interface Choice {
  id: string;
  text: string;
  conditions?: Condition[];
  /** If true, the choice is shown disabled when its conditions fail; otherwise it is hidden. */
  showWhenLocked?: boolean;
  /**
   * Why it is locked (string key), shown under a locked choice in a short line, e.g. "twelve winters of
   * silence close her mouth". Required with showWhenLocked: a lock without a reason feels arbitrary.
   */
  lockedHint?: string;
  effects?: Effect[];
  /** Marks an important choice: shows a fate thread being tied, cut or tangled. */
  thread?: ThreadKind;
  /** Written by the beast (Asterion): rust red, rough letters. Usually behind `{ flag: "fera", min: N }`. */
  voice?: 'beast';
  next: string;
}

/** Side-scrolling frieze the player walks along (GDD 8.4). Ends when the character reaches an exit. */
export interface ExplorationNode extends NodeBase {
  type: 'exploration';
  /** Character the player controls. Added to the stage if missing. */
  character: string;
  /** Art id of the frieze background. Omitted keeps the current one. */
  background?: string | null;
  /** Width of the frieze in pixels (>= 1920). */
  width: number;
  /** Starting x of the character. Omitted keeps the current position. */
  start?: number;
  /** On-screen hint (string key). */
  hint?: string;
  /**
   * Reaching [from, to] continues to `next`. Exits whose conditions fail don't exist.
   * With more than one exit (or a `caught`), the exploration is a decision: `label` names each way out
   * on the thread map and in the threads screen.
   */
  exits: {
    id: string;
    from: number;
    to: number;
    next: string;
    label?: string;
    conditions?: Condition[];
    /** The exit is reached when this character (not the walker) gets there, e.g. the guard being guided. */
    by?: string;
  }[];
  /**
   * Guiding someone by sound (Asterion leading the guard): E punches the wall where he stands; the
   * follower gets up and limps toward the last knock. If the walker comes at him, he drops in fear
   * and only a new knock gets him up again. Use with an exit `by` the follower.
   */
  guide?: {
    follower: string;
    /** Follower's walking speed multiplier (limping). Default 0.45. */
    speed?: number;
    /** How close the walker may come toward him before he drops in fear (px). Default 420. */
    fearRange?: number;
    /** Lines shown (as captions) the first times a knock gets him moving, in order (string keys). */
    captions?: string[];
  };
  /** Things to examine (E or click when close). They don't end the exploration. */
  hotspots?: Hotspot[];
  /**
   * Lines said while the player walks (docs/design/avaliacao-escolhas.md 5.4 A): when the walker passes
   * world x, `speaker` says `text` (string key) in a speech balloon over their head, without stopping
   * the walk. Each one is said once per exploration; `conditions` decide if it is said at all.
   */
  barks?: Bark[];
  /** Characters on stage that can catch the walker (light stealth). Being seen fills a meter; full = caught. */
  watchers?: Watcher[];
  /** Where to go when a watcher catches the player. Required if there are watchers. */
  caught?: { label?: string; effects?: Effect[]; next: string };
  /**
   * Niches to hide in (world x). Standing still inside one, the walker crouches (pose "hide" if the
   * character has it) and no watcher can see him. For someone too big to just walk softly.
   */
  niches?: number[];
  /** Sounds made visible: rings of ink spreading from these points (world x, screen y), every N seconds. */
  sounds?: { x: number; y?: number; every?: number }[];
  /**
   * Scent (Asterion's gift, F key): for a few seconds the threads show on the floor, gold for ways,
   * red for danger, pale for people. `effects` apply on every use (the price: giftUse, fera).
   */
  scent?: { trails: { from: number; to: number; kind: 'path' | 'danger' | 'person' }[]; effects?: Effect[] };
}

export interface Bark {
  /** World x the walker must pass (within ~180 px). */
  x: number;
  /** Character on stage who speaks. */
  speaker: string;
  /** String key. */
  text: string;
  conditions?: Condition[];
}

export interface Hotspot {
  id: string;
  /** World x of the object; the prompt appears within ~90 px. */
  x: number;
  /** Short name in the prompt (string key), e.g. "a ânfora". */
  label: string;
  /** Lines shown when examined (string keys), as narration. */
  lines: string[];
  /** Applied the first time only. The game also sets the flag `examined.<fragment>.<id>`. */
  effects?: Effect[];
  conditions?: Condition[];
  /**
   * First-person picture (art id, 16:9) shown while the lines are read: what the character sees,
   * with their own hands when they hold the thing. Optional: without it, the lines show over the scene.
   */
  view?: string;
  /** A flame drawn in code on the picture (lamps), in fractions of the picture; `lean` in radians. */
  viewFlame?: { x: number; y: number; size?: number; lean?: number };
  /**
   * Warm glows pulsing on the picture (the closed eye warming up, a distant torch, morning light),
   * in fractions; `r` = radius (fraction of the width). Drawn above the vignette.
   */
  viewGlow?: { x: number; y: number; r?: number }[];
  /** Darkens the picture by `amount` (0..1) except around `keep` (e.g. the hand on a bronze door). */
  viewShade?: { amount: number; keep?: { x: number; y: number; r: number } };
  /** Dust falling from this point (e.g. the knuckles hitting the wall), in fractions. */
  viewDust?: { x: number; y: number };
  /**
   * The light the picture is seen in, so a pale painting fits a night scene. Omitted = from the
   * scene's mode (night → "night", dark → "dark", otherwise "day"; memories already fade in sepia).
   * "lamplit" = an interior at night, warm and dim.
   */
  viewMood?: 'day' | 'lamplit' | 'night' | 'dark';
  /**
   * A ground drawn behind the picture (art id), for views painted as a cut-out object: the same
   * object can lie on the night quay or on the villa floor without repainting it.
   */
  viewGround?: string;
}

export interface Watcher {
  /** Character id on stage (their x and facing are used). */
  id: string;
  /** How far (px) they see in front of them. */
  range: number;
  /** Sleeping watchers only notice someone walking normally (not sneaking) inside their range, on both sides. */
  asleep?: boolean;
  /** Awake watchers turn around every N seconds. */
  turnEvery?: number;
}

export type MinigameKind = 'pour' | 'reveal' | 'descent' | 'embers' | 'rhythm' | 'trace' | 'restraint' | 'threads' | 'shells' | 'vase';

/**
 * First-person action scene (GDD 10.4). The game reports one outcome id plus effects earned while
 * playing (e.g. which hidden marks were revealed). There is no failure state: outcomes only vary.
 */
export interface MinigameNode extends NodeBase {
  type: 'minigame';
  game: MinigameKind;
  /** Game-specific settings (see src/systems/minigames/*). Text fields inside are string keys. */
  params?: Record<string, unknown>;
  outcomes: { id: string; label?: string; effects?: Effect[]; next: string }[];
}

export interface ChoiceNode extends NodeBase {
  type: 'choice';
  speaker?: string;
  expression?: string;
  /** See DialogueNode.gift. */
  gift?: string;
  /** See DialogueNode.giftHint. */
  giftHint?: string;
  /** "high" raises the options panel, so a seated or fallen figure stays visible under it. */
  panel?: 'high';
  text?: string;
  /** Timed choice. When time runs out, `fallback` (a choice id) is taken. Can be disabled in settings. */
  timeLimit?: { seconds: number; fallback: string };
  choices: Choice[];
}

/** Conditional jump. First matching case wins. Auto-advances. */
export interface BranchNode extends NodeBase {
  type: 'branch';
  cases: { conditions: Condition[]; next: string }[];
  default: string;
}

export interface EndNode extends NodeBase {
  type: 'end';
}

export type SceneNode =
  | StageNode
  | DialogueNode
  | ThoughtNode
  | ChoiceNode
  | BranchNode
  | ExplorationNode
  | FateEventNode
  | MinigameNode
  | EndNode;

export interface Fragment {
  id: string;
  /** Whose fragment it is. An interlude still names the character whose rules apply (gift, flame tint). */
  protagonist: string;
  /**
   * Prologue and closing hook (GDD 7.3, 7.6): the card shows only the title and the chapter's name,
   * and there is no thread map after it (nor a button for it at the chapter's end).
   */
  interlude?: boolean;
  title: string;
  start: string;
  nodes: SceneNode[];
}

export interface Chapter {
  id: string;
  title: string;
  /** Fragment ids in play order (GDD 7.3). */
  order: string[];
  /**
   * End-of-chapter summary ("what remained"): one line per group, the first case whose conditions
   * hold (a case without conditions always holds). Groups where nothing holds are left out.
   */
  summary?: { cases: { conditions?: Condition[]; text: string }[] }[];
}

export interface Pose {
  art: string;
  /** Point (in source image pixels) where the figure touches the ground. */
  ground: { x: number; y: number };
  /** Head size (top of head to chin) in source image pixels. Used to keep scale constant across poses. */
  headPx: number;
  /**
   * Center of the cup's rim in source image pixels: where the code-drawn flame is born.
   * `angle` (degrees, clockwise) tilts the flame when the cup is tilted in the image.
   * `scale` multiplies the flame size (default 1), e.g. a bigger fire on the altar.
   */
  /** `kind` picks the painted flame (default by size): 'small' lamp, 'cup', 'altar' fire. */
  cup?: { x: number; y: number; angle?: number; scale?: number; kind?: 'small' | 'cup' | 'altar' };
}

/**
 * Code animation applied to whole-pose images (until cutouts exist, GDD 8.5).
 * All fields optional; defaults live in src/ui/figure.ts.
 */
export interface CharacterAnimation {
  /** Idle breathing: vertical scale amplitude (e.g. 0.006) and period in seconds. */
  breathe?: { amplitude: number; period: number };
  /** Walking: speed in px/s, duration of each step, vertical bob in px, and the poses used as keyframes. */
  walk?: { speed: number; stepPeriod: number; bob: number; frames: string[] };
}

export interface Character {
  id: string;
  name: string;
  /** Head size on the 1920x1080 stage. */
  headPxOnStage?: number;
  defaultPose?: string;
  poses: Record<string, Pose>;
  animation?: CharacterAnimation;
  /** Soft shadow on the floor (default true; false for invisible props like the altar's fire). */
  shadow?: boolean;
  /** Dialogue portraits: expression -> art id (GDD 8.5). Characters without portraits show only their name. */
  portraits?: Record<string, string>;
  /** Expression used when a line doesn't set one. */
  defaultExpression?: string;
}

export type Strings = Record<string, string>;

/** Art manifest: art id -> path relative to assets/art/. */
export type ArtManifest = Record<string, string>;

/**
 * Atmosphere of a background (content/backgrounds/<any>.json), keyed by the background's art id.
 * Lights are in world pixels; figures carrying a flame are lights too (added automatically).
 */
export interface BackgroundInfo {
  /** Art id of the background this applies to. */
  id: string;
  /**
   * Where the floor line is in the background image, as a fraction of its height (0..1).
   * The image is scaled so this line lands on the stage's ground (GROUND_Y). Omitted = image fills 1080 px.
   */
  floor?: number;
  /** Repeat the image horizontally (for walls that tile). */
  repeat?: boolean;
  /** How dark the scene is away from lights, 0..1 (default 0.35). Night mode darkens further. */
  ambient?: number;
  lights?: { x: number; y: number; radius: number; intensity?: number }[];
  /** Scenery objects standing on the floor, behind the characters (columns, doors, altars...). */
  props?: BackgroundProp[];
  /**
   * Columns in front of the characters, moving faster than the scene (parallax depth).
   * With `art` (and `ground`/`scale` like a prop) the image is drawn darkened and blurred;
   * without it, a plain dark column of `width`.
   */
  foreground?: { x: number; width?: number; art?: string; scale?: number; ground?: { x: number; y: number } }[];
}

export interface BackgroundProp {
  art: string;
  /** World x of the object's ground point. */
  x: number;
  /** Ground point in source image pixels (where it touches the floor). */
  ground: { x: number; y: number };
  /** Source pixels → stage pixels. */
  scale: number;
  /** Optional flame drawn in code (and casting light), in source image pixels. */
  flame?: { x: number; y: number; size?: number; intensity?: number };
}

export interface ContentBundle {
  chapters: Record<string, Chapter>;
  fragments: Record<string, Fragment>;
  characters: Record<string, Character>;
  strings: Record<string, Strings>;
  art: ArtManifest;
  backgrounds: Record<string, BackgroundInfo>;
  audio: AudioManifest;
}

/**
 * What the music listens to (docs/audio/pedidos-de-musica.md): the price of the gift of whoever is being
 * played. `fera` 0–5 (Asterion), `selo` (Lívia's seal, about −5..5), `presence` 0.35–1 (Théron).
 */
export type AudioSignal = 'fera' | 'selo' | 'presence';

/**
 * One stem of a track. All stems of a track have the same length and tempo and start together;
 * `when` turns a stem up or down (a smooth fade) as its signal crosses the range.
 */
export interface MusicLayer {
  /** File under assets/audio/. A missing file is simply silent (the music can arrive later). */
  file: string;
  /** `min` and `max` are inclusive (fera ≥ 3: `min: 3`); `below` is exclusive (presence < 0.75). */
  when?: { signal: AudioSignal; min?: number; max?: number; below?: number };
  /** Volume of the stem when it plays (default 1). */
  gain?: number;
}

export interface MusicTrack {
  layers: MusicLayer[];
  /** False for a piece with a beginning and an end (the closing hook); default true. */
  loop?: boolean;
}

/** content/audio.json: music tracks (the ids used by `audio.music`) and sound effects (`audio.sfx`). */
export interface AudioManifest {
  music: Record<string, MusicTrack>;
  sfx: Record<string, string>;
  /** Shown on the Credits screen, only while one of `files` is used by a track or effect. */
  credits?: AudioCredit[];
}

/** A credited work: names and license stay as written (not translated). */
export interface AudioCredit {
  work: string;
  author: string;
  license: string;
  url: string;
  /** Files of assets/audio/ made from this work. */
  files: string[];
  /** An exact line the author asked for, used instead of the localized "work by author" form. */
  line?: string;
}
