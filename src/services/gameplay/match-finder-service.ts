import type { FindMatchesResponse } from "../../interfaces/responses/find-matches-response.js";
import type { AdvertiseMatchRequest } from "../../interfaces/requests/advertise-match-request.js";
import type { FindMatchesRequest } from "../../interfaces/requests/find-matches-request.js";
import { LocalEvent } from "../../models/local-event.js";
import { Match } from "../../models/match.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import { EventType } from "../../enums/event-type.js";
import { MATCH_ATTRIBUTES } from "../../constants/matchmaking-constants.js";
import { MATCH_TOTAL_SLOTS } from "../../constants/configuration-constants.js";
import { GAME_VERSION } from "../../constants/game-constants.js";
import { getConfigurationKey } from "../../utils/configuration-utils.js";
import { BinaryWriter } from "../../utils/binary-writer-utils.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import type { FindMatchesResponse as MatchesResponse } from "../../interfaces/responses/find-matches-response.js";
import { APIService } from "../network/api-service.js";
import { WebSocketService } from "../network/websocket-service.js";
import { GameState } from "../../models/game-state.js";
import { EventProcessorService } from "./event-processor-service.js";

export class MatchFinderService {
  constructor(
    private readonly gameState: GameState,
    private readonly apiService: APIService,
    private readonly webSocketService: WebSocketService,
    private readonly pendingIdentities: Map<string, boolean>,
    private readonly eventProcessorService: EventProcessorService,
  ) {}

  public async findMatches(): Promise<MatchesResponse[]> {
    const body: FindMatchesRequest = {
      version: GAME_VERSION,
      totalSlots: 1,
      attributes: MATCH_ATTRIBUTES,
    };
    return this.apiService.findMatches(body);
  }

  public async createAndAdvertiseMatch(): Promise<void> {
    this.pendingIdentities.clear();
    const totalSlots: number = getConfigurationKey<number>(
      MATCH_TOTAL_SLOTS,
      4,
      this.gameState,
    );

    const match = new Match(
      true,
      MatchStateType.WaitingPlayers,
      totalSlots,
      MATCH_ATTRIBUTES,
    );

    this.gameState.setMatch(match);
    const localPlayer = this.gameState.getGamePlayer();
    localPlayer.setHost(true);
    match.addPlayer(localPlayer);

    await this.advertiseMatch();
  }

  public async joinMatches(matches: FindMatchesResponse[]): Promise<void> {
    await Promise.all(matches.map((m) => this.joinMatch(m)));
  }

  public async advertiseMatch(): Promise<void> {
    const match = this.gameState.getMatch();
    if (match === null) {
      return console.warn("Game match is null");
    }

    const body: AdvertiseMatchRequest = {
      version: GAME_VERSION,
      totalSlots: match.getTotalSlots(),
      availableSlots: match.getAvailableSlots(),
      attributes: match.getAttributes(),
    };

    await this.apiService.advertiseMatch(body);
    const localEvent = new LocalEvent(EventType.MatchAdvertised);
    this.eventProcessorService.addLocalEvent(localEvent);
  }

  private async joinMatch(match: FindMatchesResponse): Promise<void> {
    const { token } = match;
    const tokenBytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
    this.pendingIdentities.set(token, true);

    const payload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.PlayerIdentity)
      .bytes(tokenBytes, 32)
      .toArrayBuffer();

    this.webSocketService.sendMessage(payload);
  }
}
