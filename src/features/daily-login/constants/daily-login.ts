type DailyReward = {
  coins: number;
  food?: Record<string, number>;
  label: string;
};

export const DAILY_REWARDS: DailyReward[] = [
  { coins: 10, label: '1일차' },
  { coins: 15, label: '2일차' },
  { coins: 20, food: { bread: 1 }, label: '3일차' },
  { coins: 25, label: '4일차' },
  { coins: 30, food: { riceball: 1 }, label: '5일차' },
  { coins: 40, label: '6일차' },
  { coins: 50, food: { meat: 1, bread: 2 }, label: '7일차' },
];

export const STREAK_RESET_HOURS = 48;
