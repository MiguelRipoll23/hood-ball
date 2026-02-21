import { APIService } from "../../../services/network/api-service.js";
import { CryptoService } from "../../../services/security/crypto-service.js";
import { WebSocketService } from "../../../services/network/websocket-service.js";
import type { ConfigurationType } from "../../../types/configuration-type.js";

export class LoginController {
  constructor(
    private readonly apiService: APIService,
    private readonly cryptoService: CryptoService,
    private readonly webSocketService: WebSocketService
  ) {}

  public checkForUpdates(): Promise<boolean> {
    return this.apiService.checkForUpdates();
  }

  // Note: session restore is no longer performed automatically; token
  // refresh should be handled via APIService when needed.

  public async downloadConfiguration(): Promise<ConfigurationType> {
    const response = await this.apiService.getConfiguration();
    const decrypted = await this.cryptoService.decryptResponse(response);
    return JSON.parse(decrypted);
  }

  public connectToServer(): void {
    this.webSocketService.connectToServer();
  }
}
