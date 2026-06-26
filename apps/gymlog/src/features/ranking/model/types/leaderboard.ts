// 글로벌 랭킹 공개 지표. 문서 id = uid.
export type LeaderboardEntry = {
  uid: string;
  displayName: string;
  score: number;
  totalVolume: number;
  level: number;
};
