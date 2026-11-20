import type { ComponentType } from 'react';

import type { MenuSectionName } from '@views/drive/config/menu';
import { CircuitContent } from '@views/drive/ui/CircuitContent';
import { ControlsContent } from '@views/drive/ui/ControlsContent';
import { HomeContent } from '@views/drive/ui/HomeContent';
import { OptionsContent } from '@views/drive/ui/OptionsContent';

export const MENU_SECTION_CONTENTS = {
  home: HomeContent,
  options: OptionsContent,
  controls: ControlsContent,
  circuit: CircuitContent,
} satisfies Record<MenuSectionName, ComponentType>;
