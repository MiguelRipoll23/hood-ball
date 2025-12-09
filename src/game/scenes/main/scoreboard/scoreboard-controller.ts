import type {
  UserScoresResponse,
  UserScore,
} from "../../../interfaces/responses/user-scores-response-interface.js";
import { APIService } from "../../../services/network/api-service.js";

export class ScoreboardController {
  constructor(private readonly apiService: APIService) {}

  public async fetchRanking(cursor?: string): Promise<UserScore[]> {
    const rankingResponse = await this.apiService.getRanking(cursor);
    return rankingResponse.results;
  }

  public async fetchRankingWithPagination(
    cursor?: string
  ): Promise<UserScoresResponse> {
    return this.apiService.getRanking(cursor);
  }
}
