// Browser-side content loading. Vite bundles every JSON under content/ and every image under
// assets/art/ at build time; art is then resolved by id through assets/art/manifest.json.

import { buildContentBundle, validateContent } from './content';
import type { ContentBundle } from './types';

const jsonFiles = import.meta.glob(['/content/**/*.json', '/assets/art/manifest.json'], {
  eager: true,
  import: 'default',
});

const artUrls = import.meta.glob('/assets/art/**/*.{png,webp,jpg,jpeg,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

// Music and sound effects (content/audio.json names them by path under assets/audio/).
const audioUrls = import.meta.glob('/assets/audio/**/*.{ogg,mp3,m4a,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export interface LoadedContent {
  bundle: ContentBundle;
  /** Resolves an art id to a URL usable in <img src>. */
  artUrl(artId: string): string | null;
  /** Resolves an audio file (path under assets/audio/) to a URL; null until the file exists. */
  audioUrl(file: string): string | null;
}

export function loadContent(): LoadedContent {
  const bundle = buildContentBundle(jsonFiles);

  if (import.meta.env.DEV) {
    const files = new Set(Object.keys(artUrls).map((p) => p.replace('/assets/art/', '')));
    const errors = validateContent(bundle, files);
    if (errors.length) console.warn(`[content] ${errors.length} problem(s):\n` + errors.join('\n'));
  }

  return {
    bundle,
    artUrl(artId) {
      const file = bundle.art[artId];
      return file ? (artUrls[`/assets/art/${file}`] ?? null) : null;
    },
    audioUrl(file) {
      return audioUrls[`/assets/audio/${file}`] ?? null;
    },
  };
}
