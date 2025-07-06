import type { RankingResponse } from "../../../interfaces/responses/ranking-response.js";
import { APIService } from "../../../services/network/api-service.js";

export class ScoreboardController {
  constructor(private readonly apiService: APIService) {}

  public async fetchRanking(): Promise<RankingResponse[]> {
    return this.apiService.getRanking();
  }
}
