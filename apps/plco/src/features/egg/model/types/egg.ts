import { EGG_PHASE } from '@features/egg/model/constants';

export type EggPhase = (typeof EGG_PHASE)[keyof typeof EGG_PHASE];
