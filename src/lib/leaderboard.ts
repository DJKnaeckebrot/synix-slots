export const LEADERBOARD_METRICS = [
  "credits",
  "biggest_win",
  "highest_multiplier",
] as const;

export type LeaderboardMetric = (typeof LEADERBOARD_METRICS)[number];

export type LeaderboardEntry = {
  rank: number;
  id: string;
  username: string | null;
  avatarUrl: string | null;
  value: number;
};

export type LeaderboardMe = {
  rank: number | null;
  id: string;
  username: string | null;
  avatarUrl: string | null;
  credits: number;
  totalSpins: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  highestMultiplier: number;
  value: number;
};

export type LeaderboardResponse = {
  by: LeaderboardMetric;
  entries: LeaderboardEntry[];
  me: LeaderboardMe | null;
};

export function isLeaderboardMetric(value: string): value is LeaderboardMetric {
  return (LEADERBOARD_METRICS as readonly string[]).includes(value);
}

export function metricLabel(metric: LeaderboardMetric): string {
  switch (metric) {
    case "credits":
      return "Credits";
    case "biggest_win":
      return "Biggest Win";
    case "highest_multiplier":
      return "Highest Mult";
  }
}

export function formatMetricValue(
  metric: LeaderboardMetric,
  value: number,
): string {
  if (metric === "highest_multiplier") {
    return `${Number(value.toFixed(2))}×`;
  }
  return Math.floor(value).toLocaleString();
}
