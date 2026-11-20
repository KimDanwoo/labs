'use client';

import type { SlitherlinkGame } from '@views/slitherlink/model/hooks/useSlitherlinkGame';
import { createContext } from 'react';

export const SlitherlinkContext = createContext<SlitherlinkGame | null>(null);
