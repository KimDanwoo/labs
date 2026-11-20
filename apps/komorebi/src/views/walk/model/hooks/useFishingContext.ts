'use client';

import { FishingContext, type FishingModel } from '@views/walk/model/store/fishingContext';
import { useContext } from 'react';

export function useFishingContext(): FishingModel {
  const fishing = useContext(FishingContext);
  if (!fishing) throw new Error('FishingHud 안에서만 사용할 수 있습니다');
  return fishing;
}
