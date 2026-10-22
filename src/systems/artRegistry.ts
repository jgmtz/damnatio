// Images for the systems that draw on canvases (threads, first-person limbs, thread map).
// The game plugs in the stage's image cache at startup; until an image has loaded, `art()` returns
// null and each system falls back to its code drawing.

let resolver: (id: string) => HTMLImageElement | null = () => null;

export function setArtResolver(fn: (id: string) => HTMLImageElement | null): void {
  resolver = fn;
}

/** The loaded image for an art id (manifest), or null if missing or still loading. */
export function art(id: string): HTMLImageElement | null {
  return resolver(id);
}

/** Starts loading these ids right away (so they're ready before they're first needed). */
export function preloadArt(ids: string[]): void {
  for (const id of ids) resolver(id);
}

/** Art used by the systems themselves (not named by any content file). */
export const SYSTEM_ART = [
  'thread.strip',
  'thread.tie',
  'thread.cut',
  'thread.tangle',
  'thread.spindle',
  'thread.broken',
  'thread.sparks',
  'thread.map.background',
  'fp.livia.grip',
  'fp.livia.open',
  'fp.livia_child.arm',
  'fp.cup',
  'fp.asterion.finger',
  'fp.asterion.tense',
  'fp.asterion.open',
  'closeup.altar.chant',
  'closeup.wall.letters',
  'closeup.portals.stairs',
  'fp.livia.fist',
  'ui.panel.black',
  'fp.asterion_child.finger',
  'fp.asterion.nail',
  'fp.livia.amphora.base',
  'fp.livia.amphora.neck',
  'fp.theron.open',
  'fp.theron.blade',
  // Painted effects (tools/fx-sheets.ts).
  'fx.flame.cup',
  'fx.flame.altar',
  'fx.flame.small',
  'fx.embers',
  'fx.smoke',
  'fx.signs',
  'fx.hatch.light',
  'fx.hatch.medium',
  'fx.hatch.dense',
  'fx.cracks',
  'fx.letters',
  'fx.marks',
  'thread.frames.tie',
  'thread.frames.tangle',
  'thread.frames.cut',
];
