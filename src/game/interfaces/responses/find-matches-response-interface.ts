export interface FindMatchesResponse {
  results: MatchData[];
  nextCursor?: number;
  hasMore: boolean;
}

export interface MatchData {
  token: string;
}
