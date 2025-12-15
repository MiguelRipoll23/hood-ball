import type {
  FindMatchesResponse,
  MatchData,
} from "../../interfaces/responses/find-matches-response-interface.js";
import type { AdvertiseMatchRequest } from "../../interfaces/requests/advertise-match-request-interface.js";
import type { FindMatchesRequest } from "../../interfaces/requests/find-matches-request-interface.js";
import { LocalEvent } from "../../../engine/models/local-event.js";
import { MatchSession } from "../../models/match-session.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import { EventType } from "../../../engine/enums/event-type.js";
import { MATCH_ATTRIBUTES } from "../../constants/matchmaking-constants.js";
import { MATCH_TOTAL_SLOTS } from "../../constants/configuration-constants.js";
import { GAME_VERSION } from "../../constants/game-constants.js";
import { getConfigurationKey } from "../../utils/configuration-utils.js";
import { BinaryWriter } from "../../../engine/utils/binary-writer-utils.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { APIService } from "../network/api-service.js";
import { WebSocketService } from "../network/websocket-service.js";
import { GamePlayer } from "../../models/game-player.js";
import { MatchSessionService } from "../session/match-session-service.js";
import { GameServer } from "../../models/game-server.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { injectable, inject } from "@needle-di/core";
import { PendingIdentitiesToken } from "./matchmaking-tokens.js";

@injectable()
export class MatchFinderService {
  constructor(
    private readonly gamePlayer: GamePlayer = inject(GamePlayer),
    private readonly matchSessionService: MatchSessionService = inject(
      MatchSessionService
    ),
    private readonly gameServer: GameServer = inject(GameServer),
    private readonly apiService = inject(APIService),
    private readonly webSocketService = inject(WebSocketService),
    private readonly pendingIdentities = inject(PendingIdentitiesToken),
    private readonly eventProcessorService = inject(EventProcessorService)
  ) {}

  public async findMatches(): Promise<FindMatchesResponse> {
    const body: FindMatchesRequest = {
      clientVersion: GAME_VERSION,
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
      this.gameServer
    );

    const match = new MatchSession(
      true,
      MatchStateType.Countdown,
      totalSlots,
      MATCH_ATTRIBUTES
    );

    this.matchSessionService.setMatch(match);

    const localPlayer = this.gamePlayer;
    localPlayer.setHost(true);
    match.addPlayer(localPlayer);

    await this.advertiseMatch();
  }

  public async joinMatches(matches: MatchData[]): Promise<void> {
    await Promise.all(matches.map((m) => this.joinMatch(m)));
  }

  public async advertiseMatch(): Promise<void> {
    const match = this.matchSessionService.getMatch();

    if (match === null) {
      console.warn("Game match is null");
      return;
    }

    const body: AdvertiseMatchRequest = {
      version: GAME_VERSION,
      totalSlots: match.getTotalSlots(),
      availableSlots: match.getAvailableSlots(),
      attributes: match.getAttributes(),
    };

    if (match.getPlayers().length >= 2) {
      const pingMedian = match.getPingMedianMilliseconds();
      if (pingMedian !== null) {
        body.pingMedianMilliseconds = pingMedian;
      }
    }

    await this.apiService.advertiseMatch(body);
    const localEvent = new LocalEvent(EventType.MatchAdvertised);
    this.eventProcessorService.addLocalEvent(localEvent);
  }

  private async joinMatch(match: MatchData): Promise<void> {
    const { token: token } = match;
    const tokenBytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
    this.pendingIdentities.set(token, true);

    const payload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.PlayerIdentity)
      .bytes(tokenBytes, 32)
      .toArrayBuffer();

    this.webSocketService.sendMessage(payload);
  }
}
