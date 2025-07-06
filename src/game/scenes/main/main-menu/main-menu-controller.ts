import { APIService } from "../../../services/network/api-service.js";
import type { MessagesResponse } from "../../../interfaces/responses/messages-response.js";

export class MainMenuController {
  constructor(private readonly apiService: APIService) {}

  public async fetchServerMessages(): Promise<MessagesResponse[]> {
    return this.apiService.getMessages();
  }
}
