export type GameStatus = 'ready' | 'myTurn' | 'rivalTurn' | 'choosing' | 'deciding' | 'over';

export type Outcome = 'win' | 'lose' | 'draw';

export type CardMark =
  'gwang' | 'rainGwang' | 'godori' | 'yeol' | 'hong' | 'cheong' | 'cho' | 'plain' | 'ssangPi' | 'pi';

export type HandCardState = 'match' | 'open' | 'waiting';

export type BakRisk = 'piBak' | 'gwangBak';

export type JokboKey = 'gwang' | 'godori' | 'hong' | 'cheong' | 'cho' | 'yeol' | 'tti' | 'pi';

export type ScorePart = 'gwang' | 'yeol' | 'tti' | 'pi' | 'godori' | 'dan';
