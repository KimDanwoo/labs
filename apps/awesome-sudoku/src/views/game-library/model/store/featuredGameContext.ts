'use client';

import { createContext } from 'react';

import type { ShelfGame } from '@entities/game-catalog';

export const FeaturedGameContext = createContext<ShelfGame | null>(null);
