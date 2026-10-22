import type { MinigameKind } from '../../engine/types';
import { createDescent } from './descent';
import { createEmbers } from './embers';
import { createPour } from './pour';
import { createRestraint } from './restraint';
import { createReveal } from './reveal';
import { createRhythm } from './rhythm';
import { createShells } from './shells';
import { createThreads } from './threads';
import { createTrace } from './trace';
import type { MinigameFactory } from './types';
import { createVase } from './vase';

export const MINIGAMES: Record<MinigameKind, MinigameFactory> = {
  pour: createPour,
  reveal: createReveal,
  descent: createDescent,
  embers: createEmbers,
  rhythm: createRhythm,
  trace: createTrace,
  restraint: createRestraint,
  threads: createThreads,
  shells: createShells,
  vase: createVase,
};
