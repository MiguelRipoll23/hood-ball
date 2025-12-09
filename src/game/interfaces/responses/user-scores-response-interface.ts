export interface UserScoresResponse {
  results: UserScore[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface UserScore {
  userDisplayName: string;
  totalScore: number;
}
