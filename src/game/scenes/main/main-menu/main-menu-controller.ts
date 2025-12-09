import { APIService } from "../../../services/network/api-service.js";
import type { ServerMessagesResponse } from "../../../interfaces/responses/server-messages-response-interface.js";

export class MainMenuController {
  constructor(private readonly apiService: APIService) {}

  public async fetchServerMessages(
    cursor?: number
  ): Promise<ServerMessagesResponse> {
    return this.apiService.getMessages(cursor);
  }
}
