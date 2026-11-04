import { ListSelector } from './ListSelector';
import { SelectSelector } from './SelectSelector';

export const GameDifficultySelector = { Select: SelectSelector, List: ListSelector } as const;
