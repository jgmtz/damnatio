// Endings that need many earlier decisions to line up can be missed by random play and by the
// debugger's directed search. Each one is listed here with the world state that leads to it, so the
// tests still prove it is reachable (and document what it takes to get there).

import { runToNode } from '../src/engine/simulate';
import { createInitialState, type WorldState } from '../src/engine/state';
import type { ContentBundle } from '../src/engine/types';

const MIRTO_ALONE_ON_LIVIA_ROAD: Partial<WorldState> = {
  // Lívia met Asterion, raised the cup, and Mirto never trusted him (growled at, then shown the mark).
  crossover: 'livia-asterion',
  relations: { 'mirto:asterion': 0 },
};

const SCENARIOS: Record<string, Partial<WorldState>[]> = {
  // The College knows of Mirto, nobody helped Quinto, but Théron warned his father.
  'asterion-04/dm_father': [
    { ...MIRTO_ALONE_ON_LIVIA_ROAD, flags: { encontro_asterion: 'raise', fera: 1, colegio_sabe_do_mirto: true, nisio_avisado: true } },
  ],
  // ...and nobody warned the father, with the College on alert.
  'asterion-04/dm_alone_dies': [
    { ...MIRTO_ALONE_ON_LIVIA_ROAD, flags: { encontro_asterion: 'raise', fera: 1, colegio_sabe_do_mirto: true, colegio_alerta: 3 } },
  ],
  'asterion-04/fe_mirto2': [
    { ...MIRTO_ALONE_ON_LIVIA_ROAD, flags: { encontro_asterion: 'raise', fera: 1, colegio_sabe_do_mirto: true, colegio_alerta: 3 } },
  ],
  // Nerea in danger 2, and a Théron bound to enough people to shout his name and turn the men away.
  'theron-04/s_men_gone': [{ flags: { nerea_perigo: 2, laco: 5 } }],
};

/** True if one of the listed scenarios reaches the node. */
export function reachesByScenario(bundle: ContentBundle, fragmentId: string, nodeId: string): boolean {
  const fragment = bundle.fragments[fragmentId];
  if (!fragment) return false;
  // runToNode stops at the target, or right after it when the target is an automatic node (stage,
  // branch): either way, a runner means the node was passed through.
  return (SCENARIOS[`${fragmentId}/${nodeId}`] ?? []).some(
    (patch) => runToNode(fragment, { ...createInitialState(), ...patch }, nodeId) !== null,
  );
}
