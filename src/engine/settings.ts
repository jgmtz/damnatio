// Player settings, stored apart from the save (they belong to the player, not the playthrough).

import type { KeyValueStore } from './save';
import { DEFAULT_LOCALE } from './strings';

export interface Settings {
  /** Accessibility: when false, timed choices wait forever (GDD 5.2). */
  timedChoices: boolean;
  locale: string;
  /** Minigame kinds whose guided tutorial was already played. */
  seenTutorials: string[];
  /** Volumes, 0–1 (Options). */
  musicVolume: number;
  sfxVolume: number;
  /** Format of the stored settings (see loadSettings). */
  version: number;
}

const SETTINGS_KEY = 'ofio.settings';
const SETTINGS_VERSION = 2;

export function defaultSettings(): Settings {
  return { timedChoices: true, locale: DEFAULT_LOCALE, seenTutorials: [], musicVolume: 0.8, sfxVolume: 0.8, version: SETTINGS_VERSION };
}

export function loadSettings(store: KeyValueStore | null): Settings {
  try {
    const raw = store?.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const stored = JSON.parse(raw) as Partial<Settings>;
    // v1 stored Portuguese as the locale before English became the default: start in English once.
    if ((stored.version ?? 1) < 2) stored.locale = DEFAULT_LOCALE;
    return { ...defaultSettings(), ...stored, version: SETTINGS_VERSION };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(store: KeyValueStore | null, settings: Settings): void {
  try {
    store?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore: settings are a convenience
  }
}
