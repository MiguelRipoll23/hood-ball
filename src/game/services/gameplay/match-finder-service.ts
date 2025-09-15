import type {
  FindMatchesResponse,
  MatchData,
} from "../../interfaces/responses/find-matches-response.js";
import type { AdvertiseMatchRequest } from "../../interfaces/requests/advertise-match-request.js";
import type { FindMatchesRequest } from "../../interfaces/requests/find-matches-request.js";
import { LocalEvent } from "../../../core/models/local-event.js";
import { Match } from "../../models/match.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import { EventType } from "../../enums/event-type.js";
import { MATCH_ATTRIBUTES } from "../../constants/matchmaking-constants.js";
import { MATCH_TOTAL_SLOTS } from "../../constants/configuration-constants.js";
import { GAME_VERSION } from "../../constants/game-constants.js";
import { getConfigurationKey } from "../../utils/configuration-utils.js";
import { BinaryWriter } from "../../../core/utils/binary-writer-utils.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { APIService } from "../network/api-service.js";
import { WebSocketService } from "../network/websocket-service.js";
import { GameState } from "../../../core/models/game-state.js";
import { EventProcessorService } from "../../../core/services/gameplay/event-processor-service.js";
import { injectable, inject } from "@needle-di/core";
import { PendingIdentitiesToken } from "./matchmaking-tokens.js";
import type { GamePlayer } from "../../models/game-player.js";

@injectable()
export class MatchFinderService {
  constructor(
    private readonly gameState = inject(GameState),
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
      this.gameState
    );

    const match = new Match(
      true,
      MatchStateType.WaitingPlayers,
      totalSlots,
      MATCH_ATTRIBUTES
    );

    this.gameState.setMatch(match);

    const localPlayer = this.gameState.getGamePlayer();
    localPlayer.setHost(true);
    match.addPlayer(localPlayer);

    await this.advertiseMatch();
  }

  public async joinMatches(matches: MatchData[]): Promise<void> {
    await Promise.all(matches.map((m) => this.joinMatch(m)));
  }

  public async advertiseMatch(): Promise<void> {
    const match = this.gameState.getMatch();

    if (match === null) {
      console.warn("Game match is null");
      return;
    }

    this.updatePlayersPingMedian();

    const body: AdvertiseMatchRequest = {
      version: GAME_VERSION,
      totalSlots: match.getTotalSlots(),
      availableSlots: match.getAvailableSlots(),
      attributes: match.getAttributes(),
    };

    const pingMedian = match.getPingMedianMilliseconds();

    if (pingMedian !== null) {
      body.pingMedianMilliseconds = pingMedian;
    }

    await this.apiService.advertiseMatch(body);
    const localEvent = new LocalEvent(EventType.MatchAdvertised);
    this.eventProcessorService.addLocalEvent(localEvent);
  }

  public updatePlayersPingMedian(): void {
    const match = this.gameState.getMatch();

    if (match === null) {
      console.warn("Game match is null");
      return;
    }

    const pings = match
      .getPlayers()
      .map((player: GamePlayer) => player.getPingTime())
      .filter((ping: number | null): ping is number => ping !== null);

    if (pings.length === 0) {
      match.setPingMedianMilliseconds(null);
      return;
    }

    pings.sort((a: number, b: number) => a - b);
    const middle = Math.floor(pings.length / 2);

    const median =
      pings.length % 2 === 0
        ? Math.round((pings[middle - 1] + pings[middle]) / 2)
        : Math.round(pings[middle]);

    match.setPingMedianMilliseconds(median);
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
