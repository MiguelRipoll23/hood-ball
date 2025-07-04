import { GameServer } from "../models/game-server.js";
import { GameState } from "../models/game-state.js";
import { container } from "./di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class CryptoService {
  private gameServer: GameServer;

  constructor(gameState = container.get(GameState)) {
    this.gameServer = gameState.getGameServer();
  }

  public async encryptRequest(request: string): Promise<ArrayBuffer> {
    const serverRegistration = this.gameServer.getServerRegistration();

    if (serverRegistration === null) {
      throw new Error("Game registration not found");
    }

    const sessionKey = serverRegistration.getSessionKey();

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(request);

    const keyData = Uint8Array.from(atob(sessionKey), (c) =>
      c.charCodeAt(0)
    ).buffer;

    const algorithm = {
      name: "AES-GCM",
      iv,
    };

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );

    const encryptedBuffer = await crypto.subtle.encrypt(
      algorithm,
      cryptoKey,
      data
    );

    const combinedBuffer = new Uint8Array(
      iv.length + encryptedBuffer.byteLength
    );
    combinedBuffer.set(iv, 0);
    combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);

    return combinedBuffer.buffer;
  }

  public async decryptResponse(response: ArrayBuffer): Promise<string> {
    const serverRegistration = this.gameServer.getServerRegistration();

    if (serverRegistration === null) {
      throw new Error("Game registration not found");
    }

    const sessionKey = serverRegistration.getSessionKey();

    const iv = response.slice(0, 12);
    const data = response.slice(12);

    const keyData = Uint8Array.from(atob(sessionKey), (c) =>
      c.charCodeAt(0)
    ).buffer;

    const algorithm = {
      name: "AES-GCM",
      iv,
    };

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      algorithm,
      cryptoKey,
      data
    );

    return new TextDecoder().decode(decryptedBuffer);
  }
}
