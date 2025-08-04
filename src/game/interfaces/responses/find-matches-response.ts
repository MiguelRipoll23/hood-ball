export interface FindMatchesResponse {
  results: MatchData[];
  nextCursor?: number;
}

export interface MatchData {
  sessionId: string;
}
