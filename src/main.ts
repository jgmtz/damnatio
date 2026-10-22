// Self-hosted fonts (bundled, so the game works offline and on itch.io).
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-600.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import './ui/styles.css';
import { loadContent } from './engine/loadContent';
import { Game } from './game';

const viewport = document.getElementById('viewport');
if (!viewport) throw new Error('#viewport not found');

const game = new Game(viewport, loadContent());
game.showTitle();

// Dev only: shortcuts for reviewing scenes from the console (or browser automation):
// __review.go('livia-01', 'e01>tablet') jumps to a node (and examines a hotspot after ">");
// __review.mouse(x, y, down?) moves the minigame pointer.
if (import.meta.env.DEV) {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const g = game as unknown as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  (window as unknown as Record<string, unknown>).__review = {
    async go(fragment: string, stop: string, flags?: Record<string, unknown>) {
      const [node, hotspot] = stop.split('>');
      g.settings.seenTutorials = ['pour', 'reveal', 'descent', 'embers', 'rhythm', 'trace', 'restraint', 'threads', 'shells', 'vase'];
      g.inspectView.hide();
      g.dialogue.hide();
      game.debugJump(fragment, node, flags ? { flags: { ...g.runner?.state.flags, ...flags } } : {});
      await wait(1400);
      if (hotspot) {
        g.inspect(g.runner, hotspot);
        await wait(1600);
      }
      const v = g.runner?.view;
      return `${fragment} ${stop} -> ${v ? `${v.kind}@${g.runner.nodeId}` : 'none'}`;
    },
    mouse(x: number, y: number, down?: boolean) {
      const input = g.minigames.input;
      Object.assign(input.mouse, { x, y, moved: true, ...(down === undefined ? {} : { down }) });
    },
    stage() {
      return g.runner?.stage.characters.map((c: { id: string; pose: string; x: number; facing?: string }) => [c.id, c.pose, c.x, c.facing]);
    },
  };
}
