import type { ComponentType } from 'react';

import type { MenuSectionName } from '../config/menu';
import { CircuitContent } from './CircuitContent';
import { ControlsContent } from './ControlsContent';
import { HomeContent } from './HomeContent';
import { OptionsContent } from './OptionsContent';

export const MENU_SECTION_CONTENTS = {
  home: HomeContent,
  options: OptionsContent,
  controls: ControlsContent,
  circuit: CircuitContent,
} satisfies Record<MenuSectionName, ComponentType>;
