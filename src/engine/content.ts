// Turns the raw JSON files of content/ into a typed bundle, and validates cross-references.
// Adding a fragment, character or language means adding a file; no code changes.
//
// Path conventions (relative to the project root):
//   content/chapters/<chapter>/chapter.json   -> Chapter
//   content/chapters/<chapter>/<any>.json     -> Fragment
//   content/characters/<id>.json              -> Character
//   content/strings/<locale>.json             -> Strings
//   content/strings/<locale>/<any>.json       -> Strings (merged into the same locale)
//   assets/art/manifest.json                  -> ArtManifest
//   content/audio.json                        -> AudioManifest (music tracks and sound effects)

import { DEFAULT_LOCALE } from './strings';
import type {
  ArtManifest,
  AudioCue,
  AudioManifest,
  BackgroundInfo,
  Chapter,
  Character,
  Condition,
  ContentBundle,
  Effect,
  Fragment,
  MinigameKind,
  StageMode,
  Strings,
  ThreadKind,
} from './types';

const THREAD_KINDS: ThreadKind[] = ['tie', 'cut', 'tangle'];
const STAGE_MODES: StageMode[] = ['normal', 'flashback', 'night', 'dark'];
const MINIGAMES: MinigameKind[] = ['pour', 'reveal', 'descent', 'embers', 'rhythm', 'trace', 'restraint', 'threads', 'shells', 'vase'];

export function buildContentBundle(files: Record<string, unknown>): ContentBundle {
  const bundle: ContentBundle = { chapters: {}, fragments: {}, characters: {}, strings: {}, art: {}, backgrounds: {}, audio: { music: {}, sfx: {} } };
  for (const [rawPath, data] of Object.entries(files)) {
    // Accepts "/content/...", "content/..." or Windows-style paths, all relative to the project root.
    const path = rawPath.replace(/\\/g, '/').replace(/^\.?\//, '');
    const fileName = path.split('/').pop()!.replace(/\.json$/, '');
    if (path.startsWith('content/chapters/')) {
      if (fileName === 'chapter') {
        const chapter = data as Chapter;
        bundle.chapters[chapter.id] = chapter;
      } else {
        const fragment = data as Fragment;
        bundle.fragments[fragment.id] = fragment;
      }
    } else if (path.startsWith('content/characters/')) {
      const character = data as Character;
      bundle.characters[character.id] = character;
    } else if (path.startsWith('content/strings/')) {
      // content/strings/<locale>.json or content/strings/<locale>/<any>.json, merged per locale.
      const parts = path.split('/');
      const locale = parts.length > 3 ? parts[2]! : fileName;
      bundle.strings[locale] = { ...bundle.strings[locale], ...(data as Strings) };
    } else if (path.startsWith('content/backgrounds/')) {
      const info = data as BackgroundInfo;
      bundle.backgrounds[info.id] = info;
    } else if (path === 'assets/art/manifest.json') {
      bundle.art = data as ArtManifest;
    } else if (path === 'content/audio.json') {
      bundle.audio = data as AudioManifest;
    }
  }
  return bundle;
}

/**
 * Checks every reference in the content: node links, string keys, characters, poses, art ids.
 * Returns a list of human-readable problems (empty = OK).
 * `artFiles`, when given, is the set of existing files under assets/art/ (relative paths).
 */
export function validateContent(bundle: ContentBundle, artFiles?: Set<string>): string[] {
  const errors: string[] = [];
  const strings = bundle.strings[DEFAULT_LOCALE] ?? {};
  if (!bundle.strings[DEFAULT_LOCALE]) errors.push(`Missing default strings file ${DEFAULT_LOCALE}.json`);
  // Every translation has exactly the default locale's keys.
  for (const [locale, table] of Object.entries(bundle.strings)) {
    if (locale === DEFAULT_LOCALE) continue;
    for (const key of Object.keys(strings)) if (!(key in table)) errors.push(`strings ${locale}: missing translation "${key}"`);
    for (const key of Object.keys(table)) if (!(key in strings)) errors.push(`strings ${locale}: "${key}" is not in ${DEFAULT_LOCALE}`);
  }

  const checkString = (where: string, key: string | undefined) => {
    if (key !== undefined && !(key in strings)) errors.push(`${where}: missing string "${key}"`);
  };
  const checkArt = (where: string, artId: string | null | undefined) => {
    if (artId == null) return;
    const file = bundle.art[artId];
    if (!file) errors.push(`${where}: unknown art id "${artId}"`);
    else if (artFiles && !artFiles.has(file)) errors.push(`${where}: art file not found "${file}"`);
  };
  const checkCharacter = (where: string, id: string | undefined, pose?: string) => {
    if (id === undefined) return;
    const character = bundle.characters[id];
    if (!character) errors.push(`${where}: unknown character "${id}"`);
    else if (pose !== undefined && !character.poses[pose]) errors.push(`${where}: "${id}" has no pose "${pose}"`);
  };
  const checkConditions = (where: string, conditions: Condition[] | undefined) => {
    for (const c of conditions ?? []) {
      if ('all' in c) checkConditions(where, c.all);
      else if ('any' in c) checkConditions(where, c.any);
      else if ('not' in c) checkConditions(where, [c.not]);
      else if ('alive' in c) checkCharacter(where, c.alive);
      else if ('dead' in c) checkCharacter(where, c.dead);
      else if ('giftUses' in c) checkCharacter(where, c.giftUses);
    }
  };
  const checkEffects = (where: string, effects: Effect[] | undefined) => {
    for (const e of effects ?? []) {
      if ('kill' in e) checkCharacter(where, e.kill);
      if ('giftUse' in e) checkCharacter(where, e.giftUse);
    }
  };

  // Audio: ids named by nodes exist in content/audio.json (the files themselves may arrive later).
  const checkAudio = (where: string, cue: AudioCue | undefined) => {
    if (cue?.music && !bundle.audio.music[cue.music]) errors.push(`${where}: unknown music "${cue.music}"`);
    if (cue?.sfx && !bundle.audio.sfx[cue.sfx]) errors.push(`${where}: unknown sound effect "${cue.sfx}"`);
  };
  for (const [id, track] of Object.entries(bundle.audio.music)) {
    if (!track.layers.length) errors.push(`music ${id}: no layers`);
    for (const layer of track.layers) {
      if (layer.when && !['fera', 'selo', 'presence'].includes(layer.when.signal)) {
        errors.push(`music ${id}: unknown signal "${layer.when.signal}"`);
      }
    }
  }

  for (const character of Object.values(bundle.characters)) {
    const where = `character ${character.id}`;
    checkString(where, character.name);
    if (character.defaultPose && !character.poses[character.defaultPose]) {
      errors.push(`${where}: defaultPose "${character.defaultPose}" does not exist`);
    }
    for (const [poseId, pose] of Object.entries(character.poses)) checkArt(`${where} pose ${poseId}`, pose.art);
    for (const frame of character.animation?.walk?.frames ?? []) {
      if (!character.poses[frame]) errors.push(`${where}: walk frame "${frame}" is not a pose`);
    }
    for (const [expression, art] of Object.entries(character.portraits ?? {})) {
      checkArt(`${where} portrait ${expression}`, art);
    }
    if (character.defaultExpression && !character.portraits?.[character.defaultExpression]) {
      errors.push(`${where}: defaultExpression "${character.defaultExpression}" has no portrait`);
    }
  }

  const checkExpression = (where: string, speaker: string | undefined, expression: string | undefined) => {
    if (expression === undefined) return;
    if (speaker === undefined) errors.push(`${where}: expression "${expression}" without a speaker`);
    else if (!bundle.characters[speaker]?.portraits?.[expression]) {
      errors.push(`${where}: "${speaker}" has no portrait "${expression}"`);
    }
  };

  for (const info of Object.values(bundle.backgrounds)) {
    const where = `background ${info.id}`;
    if (!bundle.art[info.id]) errors.push(`${where}: no art with this id`);
    for (const prop of info.props ?? []) checkArt(`${where} prop`, prop.art);
    for (const column of info.foreground ?? []) checkArt(`${where} foreground`, column.art);
    if (info.floor !== undefined && (info.floor <= 0 || info.floor > 1)) errors.push(`${where}: floor must be in (0, 1]`);
  }

  for (const chapter of Object.values(bundle.chapters)) {
    checkString(`chapter ${chapter.id}`, chapter.title);
    for (const fragmentId of chapter.order) {
      if (!bundle.fragments[fragmentId]) errors.push(`chapter ${chapter.id}: unknown fragment "${fragmentId}"`);
    }
    (chapter.summary ?? []).forEach((group, i) =>
      group.cases.forEach((c) => {
        checkString(`chapter ${chapter.id} summary ${i}`, c.text);
        checkConditions(`chapter ${chapter.id} summary ${i}`, c.conditions);
      }),
    );
  }

  for (const fragment of Object.values(bundle.fragments)) {
    const ids = new Set<string>();
    for (const node of fragment.nodes) {
      if (ids.has(node.id)) errors.push(`fragment ${fragment.id}: duplicate node id "${node.id}"`);
      ids.add(node.id);
    }
    const checkLink = (where: string, target: string) => {
      if (!ids.has(target)) errors.push(`${where}: links to missing node "${target}"`);
    };
    checkString(`fragment ${fragment.id}`, fragment.title);
    checkCharacter(`fragment ${fragment.id}`, fragment.protagonist);
    checkLink(`fragment ${fragment.id} start`, fragment.start);
    if (!fragment.nodes.some((n) => n.type === 'end')) errors.push(`fragment ${fragment.id}: has no end node`);

    for (const node of fragment.nodes) {
      const where = `${fragment.id}/${node.id}`;
      checkEffects(where, node.effects);
      checkAudio(where, node.audio);
      switch (node.type) {
        case 'stage':
          checkArt(where, node.background);
          for (const c of node.characters ?? []) checkCharacter(where, c.id, c.pose);
          for (const u of node.update ?? []) {
            checkCharacter(where, u.id, u.pose);
            checkConditions(where, u.conditions);
          }
          if (node.mode !== undefined && !STAGE_MODES.includes(node.mode)) {
            errors.push(`${where}: unknown mode "${node.mode}"`);
          }
          checkLink(where, node.next);
          break;
        case 'minigame': {
          if (!MINIGAMES.includes(node.game)) errors.push(`${where}: unknown game "${node.game}"`);
          if (node.outcomes.length === 0) errors.push(`${where}: minigame without outcomes`);
          for (const outcome of node.outcomes) {
            checkString(`${where}/${outcome.id}`, outcome.label);
            checkEffects(`${where}/${outcome.id}`, outcome.effects);
            checkLink(`${where}/${outcome.id}`, outcome.next);
          }
          // Text inside params: `hint`, and `label` + `effects` of each target (reveal).
          const params = (node.params ?? {}) as { hint?: string; targets?: { label?: string; effects?: Effect[] }[] };
          checkString(where, params.hint);
          // Images named in params (surfaceArt, amphoraArt, stairsArt, ...).
          for (const [key, value] of Object.entries(node.params ?? {})) {
            if (key.endsWith('Art')) checkArt(`${where} ${key}`, typeof value === 'string' ? value : String(value));
          }
          for (const target of params.targets ?? []) {
            checkString(where, target.label);
            checkEffects(where, target.effects);
          }
          // Thread labels (threads; a ghost thread has none) and the vase's faces.
          const more = (node.params ?? {}) as { threads?: { label?: string }[]; faces?: { art: string; text: string }[]; ghostHint?: string; speaker?: string };
          for (const thread of more.threads ?? []) if (thread.label) checkString(where, thread.label);
          checkString(where, more.ghostHint);
          checkString(where, more.speaker);
          for (const face of more.faces ?? []) {
            checkArt(`${where} face`, face.art);
            checkString(where, face.text);
          }
          break;
        }
        case 'fate_event':
          if (!THREAD_KINDS.includes(node.thread)) errors.push(`${where}: unknown thread "${node.thread}"`);
          checkLink(where, node.next);
          break;
        case 'thought':
          checkCharacter(where, node.speaker, node.pose);
          if (!node.man && !node.beast) errors.push(`${where}: thought without man or beast text`);
          checkString(where, node.man);
          checkString(where, node.beast);
          checkString(where, node.second);
          checkLink(where, node.next);
          break;
        case 'dialogue':
          checkCharacter(where, node.speaker, node.pose);
          checkExpression(where, node.speaker, node.expression);
          checkString(where, node.text);
          checkLink(where, node.next);
          if (node.gift !== undefined) checkLink(`${where} gift`, node.gift);
          checkString(where, node.giftHint);
          if (node.gift !== undefined && node.giftHint === undefined) errors.push(`${where}: gift window without a giftHint (why raise the cup here?)`);
          break;
        case 'choice': {
          checkCharacter(where, node.speaker);
          checkExpression(where, node.speaker, node.expression);
          checkString(where, node.text);
          if (node.gift !== undefined) checkLink(`${where} gift`, node.gift);
          checkString(where, node.giftHint);
          if (node.gift !== undefined && node.giftHint === undefined) errors.push(`${where}: gift window without a giftHint (why raise the cup here?)`);
          if (node.choices.length === 0) errors.push(`${where}: choice node without choices`);
          const choiceIds = new Set<string>();
          for (const choice of node.choices) {
            if (choiceIds.has(choice.id)) errors.push(`${where}: duplicate choice id "${choice.id}"`);
            choiceIds.add(choice.id);
            checkString(`${where}/${choice.id}`, choice.text);
            checkString(`${where}/${choice.id}`, choice.lockedHint);
            if (choice.showWhenLocked && !choice.lockedHint) errors.push(`${where}/${choice.id}: shown when locked without a lockedHint (why is it locked?)`);
            checkConditions(`${where}/${choice.id}`, choice.conditions);
            checkEffects(`${where}/${choice.id}`, choice.effects);
            checkLink(`${where}/${choice.id}`, choice.next);
            if (choice.thread !== undefined && !THREAD_KINDS.includes(choice.thread)) {
              errors.push(`${where}/${choice.id}: unknown thread "${choice.thread}"`);
            }
          }
          if (node.timeLimit && !choiceIds.has(node.timeLimit.fallback)) {
            errors.push(`${where}: timeLimit fallback "${node.timeLimit.fallback}" is not a choice`);
          }
          break;
        }
        case 'branch':
          node.cases.forEach((c, i) => {
            checkConditions(`${where} case ${i}`, c.conditions);
            checkLink(`${where} case ${i}`, c.next);
          });
          checkLink(where, node.default);
          break;
        case 'exploration': {
          checkCharacter(where, node.character);
          checkArt(where, node.background);
          checkString(where, node.hint);
          if (node.width < 1920) errors.push(`${where}: width must be at least 1920`);
          if (node.start !== undefined && (node.start < 0 || node.start > node.width)) {
            errors.push(`${where}: start ${node.start} is outside the frieze`);
          }
          if (node.exits.length === 0) errors.push(`${where}: exploration without exits`);
          for (const exit of node.exits) {
            checkLink(`${where}/${exit.id}`, exit.next);
            checkString(`${where}/${exit.id}`, exit.label);
            checkConditions(`${where}/${exit.id}`, exit.conditions);
            if (exit.from > exit.to) errors.push(`${where}/${exit.id}: from > to`);
            if (node.start !== undefined && node.start >= exit.from && node.start <= exit.to) {
              errors.push(`${where}/${exit.id}: start is inside this exit`);
            }
          }
          if (node.exits.every((e) => e.conditions?.length)) {
            errors.push(`${where}: every exit is conditional; at least one must always exist`);
          }
          for (const hotspot of node.hotspots ?? []) {
            const at = `${where}/${hotspot.id}`;
            checkString(at, hotspot.label);
            checkArt(`${at} view`, hotspot.view);
            checkArt(`${at} viewGround`, hotspot.viewGround);
            if (hotspot.lines.length === 0) errors.push(`${at}: hotspot without lines`);
            for (const line of hotspot.lines) checkString(at, line);
            checkEffects(at, hotspot.effects);
            checkConditions(at, hotspot.conditions);
          }
          for (const bark of node.barks ?? []) {
            checkCharacter(`${where} bark`, bark.speaker);
            checkString(`${where} bark`, bark.text);
            checkConditions(`${where} bark`, bark.conditions);
          }
          for (const watcher of node.watchers ?? []) checkCharacter(`${where} watcher`, watcher.id);
          if (node.watchers?.length && !node.caught) errors.push(`${where}: watchers need a "caught" target`);
          if (node.caught) {
            checkEffects(`${where} caught`, node.caught.effects);
            checkLink(`${where} caught`, node.caught.next);
            checkString(`${where} caught`, node.caught.label);
          }
          if (node.scent) {
            checkEffects(`${where} scent`, node.scent.effects);
            if (node.scent.trails.length === 0) errors.push(`${where}: scent without trails`);
          }
          break;
        }
        case 'end':
          break;
        default:
          errors.push(`${where}: unknown node type "${(node as { type: string }).type}"`);
      }
    }
  }
  return errors;
}
