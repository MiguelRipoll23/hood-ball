import { GameController } from "../models/game-controller.js";
import { APIService } from "./api-service.js";
import { FindMatchesResponse } from "../interfaces/response/find-matches-response.js";
import { TimerService } from "./timer-service.js";
import { WebRTCService } from "./webrtc-service.js";
import { Match } from "../models/match.js";
import { MATCH_ATTRIBUTES } from "../constants/matchmaking-constants.js";
import { GamePlayer } from "../models/game-player.js";
import { GameState } from "../models/game-state.js";
import { ConnectionStateType } from "../enums/connection-state-type.js";
import { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { MatchStateType } from "../enums/match-state-type.js";
import { EventType } from "../enums/event-type.js";
import { LocalEvent } from "../models/local-event.js";
import { PlayerConnectedPayload } from "../interfaces/event/player-connected-payload.js";
import { PlayerDisconnectedPayload } from "../interfaces/event/player-disconnected-payload.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import { AdvertiseMatchRequest } from "../interfaces/request/advertise-match-request.js";
import { FindMatchesRequest } from "../interfaces/request/find-matches-request.js";
import { SaveScoreRequest } from "../interfaces/request/save-score-request.js";
import { MATCH_TOTAL_SLOTS } from "../constants/configuration-constants.js";
import { getConfigurationKey } from "../utils/configuration-utils.js";

export class MatchmakingService {
  private apiService: APIService;
  private webrtcService: WebRTCService;

  private gameState: GameState;

  private findMatchesTimerService: TimerService | null = null;

  constructor(private gameController: GameController) {
    this.apiService = gameController.getAPIService();
    this.webrtcService = gameController.getWebRTCService();
    this.gameState = gameController.getGameState();
  }

  public async findOrAdvertiseMatch(): Promise<void> {
    const matches = await this.findMatches();

    if (matches.length === 0) {
      console.log("No matches found");
      return this.createAndAdvertiseMatch();
    }

    await this.joinMatches(matches);

    this.findMatchesTimerService = this.gameController.addTimer(
      10,
      this.createAndAdvertiseMatch.bind(this)
    );
  }

  public hasPeerConnected(peer: WebRTCPeer): void {
    if (this.gameState.getMatch()?.isHost()) {
      return console.log("Peer connected", peer);
    }

    console.log("Connected to host", peer);

    this.sendJoinRequest(peer);
  }

  public hasPeerDisconnected(peer: WebRTCPeer): void {
    if (peer.hasJoined() === false) {
      return console.warn("Ignoring disconnecting from non-joined peer", peer);
    }

    const id = peer.getPlayer()?.getId() ?? null;

    if (id === null) {
      return console.warn("Unknown peer disconnected", peer);
    }

    if (this.gameState.getMatch()?.isHost()) {
      this.handlePlayerDisconnection(peer);
    } else {
      this.handleHostDisconnected(peer);
    }
  }

  public handleJoinRequest(
    peer: WebRTCPeer,
    payload: ArrayBuffer | null
  ): void {
    if (payload === null) {
      return console.warn("Received empty join request");
    }

    const match = this.gameState.getMatch();

    if (match === null) {
      return console.warn("Game match is null");
    }

    if (match?.getAvailableSlots() === 0) {
      return this.handleUnavailableSlots(peer);
    }

    const playerId = new TextDecoder().decode(payload.slice(0, 36));
    const playerName = new TextDecoder().decode(payload.slice(36));

    console.log("Received join request from", playerName);

    // Add player to game match
    const gamePlayer = new GamePlayer(playerId, false, playerName);
    peer.setPlayer(gamePlayer);

    match?.addPlayer(gamePlayer);

    this.sendJoinResponse(peer, match);
  }

  public handleJoinResponse(
    peer: WebRTCPeer,
    payload: ArrayBuffer | null
  ): void {
    if (payload === null) {
      return console.warn("Received empty join response");
    }

    if (this.gameState.getMatch() !== null) {
      return this.handleAlreadyJoinedMatch(peer);
    }

    console.log("Received join response from", peer.getToken());

    // Data
    const dataView = new DataView(payload);
    const state = dataView.getUint8(0);
    const totalSlots = dataView.getUint8(1);

    // Create game match
    const match = new Match(false, state, totalSlots, MATCH_ATTRIBUTES);
    this.gameState.setMatch(match);

    // Add local player
    const localGamePlayer = this.gameState.getGamePlayer();
    localGamePlayer.reset();

    match.addPlayer(localGamePlayer);
  }

  public handlePlayerConnection(
    peer: WebRTCPeer,
    payload: ArrayBuffer | null
  ): void {
    if (payload === null || payload.byteLength < 39) {
      return console.warn("Invalid player connection state payload", payload);
    }

    const dataView = new DataView(payload);

    const state = dataView.getUint8(0);
    const id = new TextDecoder().decode(payload.slice(1, 37));
    const host = dataView.getUint8(37) === 1;
    const score = dataView.getUint8(38);
    const nameBytes = payload.slice(39);

    const name = new TextDecoder().decode(nameBytes);

    if (state === ConnectionStateType.Disconnected) {
      return this.handlePlayerDisconnectedById(id);
    }

    const gamePlayer = new GamePlayer(id, host, name, score);
    this.gameState.getMatch()?.addPlayer(gamePlayer);

    if (host) {
      peer.setPlayer(gamePlayer);
    }
  }

  public handleSnapshotEnd(peer: WebRTCPeer): void {
    console.log("Received snapshot from", peer.getName());

    this.findMatchesTimerService?.stop(false);
    peer.setJoined(true);

    const player = peer.getPlayer();

    if (player === null) {
      return console.warn("Player is null");
    }

    const localEvent = new LocalEvent<PlayerConnectedPayload>(
      EventType.PlayerConnected,
      { player, matchmaking: true }
    );

    this.gameController.getEventProcessorService().addLocalEvent(localEvent);

    this.sentSnapshotACK(peer);
  }

  public handleSnapshotACK(peer: WebRTCPeer): void {
    console.log("Received snapshot ACK from", peer.getName());

    peer.setJoined(true);

    const player = peer.getPlayer();

    if (player === null) {
      return console.warn("Player is null");
    }

    this.webrtcService
      .getPeers()
      .filter((matchPeer) => matchPeer !== peer)
      .forEach((peer) => {
        console.log("Sending player connection to", peer.getName());
        this.sendPlayerConnection(
          peer,
          player,
          ConnectionStateType.Connected,
          false
        );
      });

    const localEvent = new LocalEvent<PlayerConnectedPayload>(
      EventType.PlayerConnected,
      { player, matchmaking: false }
    );

    this.gameController.getEventProcessorService().addLocalEvent(localEvent);

    this.advertiseMatch();
  }

  public async savePlayerScore(): Promise<void> {
    const gamePlayer = this.gameState.getGamePlayer();
    const score = gamePlayer.getScore();

    const saveScoreRequest: SaveScoreRequest = { score };
    await this.apiService.saveScore(saveScoreRequest);
  }

  public async handleGameOver(): Promise<void> {
    if (this.gameState.getMatch()?.isHost()) {
      this.webrtcService
        .getPeers()
        .forEach((peer) => peer.disconnectGracefully());

      await this.apiService.removeMatch();
    }

    this.gameController.getGameState().setMatch(null);
  }

  private handleAlreadyJoinedMatch(peer: WebRTCPeer): void {
    console.warn(
      "Already joined a match, disconnecting peer...",
      peer.getToken()
    );

    peer.disconnect();
  }

  private handlePlayerDisconnection(peer: WebRTCPeer): void {
    const player = peer.getPlayer();

    if (player === null) {
      return console.warn("Player is null");
    }

    console.log(`Player ${player.getName()} disconnected`);
    this.gameState.getMatch()?.removePlayer(player);

    this.webrtcService
      .getPeers()
      .filter((matchPeer) => matchPeer !== peer)
      .forEach((peer) => {
        this.sendPlayerConnection(
          peer,
          player,
          ConnectionStateType.Disconnected,
          false
        );
      });

    const playerDisconnectedEvent = new LocalEvent<PlayerDisconnectedPayload>(
      EventType.PlayerDisconnected,
      { player }
    );

    this.gameController
      .getEventProcessorService()
      .addLocalEvent(playerDisconnectedEvent);

    this.advertiseMatch();
  }

  private handlePlayerDisconnectedById(playerId: string) {
    const match = this.gameState.getMatch();

    if (match === null) {
      return console.warn("Game match is null");
    }

    const player = match.getPlayer(playerId);

    if (player === null) {
      return console.warn("Player not found", playerId);
    }

    console.log(`Player ${player.getName()} disconnected`);
    match.removePlayer(player);

    const localEvent = new LocalEvent<PlayerDisconnectedPayload>(
      EventType.PlayerDisconnected,
      { player }
    );

    this.gameController.getEventProcessorService().addLocalEvent(localEvent);
  }

  private handleHostDisconnected(peer: WebRTCPeer): void {
    console.log(`Host ${peer.getName()} disconnected`);

    this.gameState.setMatch(null);

    const localEvent = new LocalEvent(EventType.HostDisconnected, null);
    this.gameController.getEventProcessorService().addLocalEvent(localEvent);
  }

  private async findMatches(): Promise<FindMatchesResponse[]> {
    console.log("Finding matches...");

    const body: FindMatchesRequest = {
      version: this.gameController.getVersion(),
      total_slots: 1,
      attributes: MATCH_ATTRIBUTES,
    };

    return this.apiService.findMatches(body);
  }

  private async createAndAdvertiseMatch(): Promise<void> {
    // Create game match
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

    // Update local player
    const localGamePlayer = this.gameState.getGamePlayer();
    localGamePlayer.reset();
    localGamePlayer.setHost(true);

    match.addPlayer(localGamePlayer);

    // Advertise match
    await this.advertiseMatch();
  }

  private async advertiseMatch(): Promise<void> {
    const match = this.gameState.getMatch();

    if (match === null) {
      return console.warn("Game match is null");
    }

    const body: AdvertiseMatchRequest = {
      version: this.gameController.getVersion(),
      total_slots: match.getTotalSlots(),
      available_slots: match.getAvailableSlots(),
      attributes: match.getAttributes(),
    };

    console.log("Advertising match...");

    await this.apiService.advertiseMatch(body);

    const localEvent = new LocalEvent(EventType.MatchAdvertised, null);
    this.gameController.getEventProcessorService().addLocalEvent(localEvent);
  }

  private async joinMatches(matches: FindMatchesResponse[]): Promise<void> {
    matches.forEach((match) => this.joinMatch(match));
  }

  private async joinMatch(match: FindMatchesResponse): Promise<void> {
    const { token } = match;
    this.webrtcService.sendOffer(token);
  }

  private sendJoinRequest(peer: WebRTCPeer): void {
    const playerId = this.gameState.getGamePlayer().getId();
    const playerName = this.gameState.getGamePlayer().getName();

    const playerIdBytes = new TextEncoder().encode(playerId);
    const playerNameBytes = new TextEncoder().encode(playerName);

    const payload = new Uint8Array([
      WebRTCType.JoinRequest,
      ...playerIdBytes,
      ...playerNameBytes,
    ]);

    peer.sendReliableOrderedMessage(payload, true);
  }

  private handleUnavailableSlots(peer: WebRTCPeer): void {
    console.log("Match is full, disconnecting peer...", peer.getToken());
    peer.disconnect();
  }

  private sendJoinResponse(peer: WebRTCPeer, match: Match): void {
    const state = match.getState();
    const totalSlots = match.getTotalSlots();
    const payload = new Uint8Array([
      WebRTCType.JoinResponse,
      state,
      totalSlots,
    ]);

    console.log("Sending join response to", peer.getName());
    peer.sendReliableOrderedMessage(payload, true);

    this.sendPlayerList(peer);
    this.sendSnapshotEnd(peer);
  }

  private sendPlayerList(peer: WebRTCPeer): void {
    const match = this.gameState.getMatch();

    if (match === null) {
      return console.warn("Game match is null");
    }

    console.log("Sending player list to", peer.getName());

    const players = match.getPlayers();

    players
      .filter((matchPlayer) => matchPlayer !== peer.getPlayer())
      .forEach((player) => {
        this.sendPlayerConnection(
          peer,
          player,
          ConnectionStateType.Connected,
          true
        );
      });
  }

  private sendPlayerConnection(
    peer: WebRTCPeer,
    player: GamePlayer,
    connectionState: ConnectionStateType,
    skipQueue: boolean
  ): void {
    const id = player.getId();
    const host = player.isHost() ? 1 : 0;
    const score = player.getScore();
    const name = player.getName();

    const idBytes = new TextEncoder().encode(id);
    const nameBytes = new TextEncoder().encode(name);

    const payload = new Uint8Array([
      WebRTCType.PlayerConnection,
      connectionState,
      ...idBytes,
      host,
      score,
      ...nameBytes,
    ]);

    peer.sendReliableOrderedMessage(payload, skipQueue);
  }

  private sendSnapshotEnd(peer: WebRTCPeer): void {
    console.log("Sending snapshot end to", peer.getName());

    const payload = new Uint8Array([WebRTCType.SnapshotEnd]);
    peer.sendReliableOrderedMessage(payload, true);
  }

  private sentSnapshotACK(peer: WebRTCPeer): void {
    console.log("Sending snapshot ACK to", peer.getName());
    const payload = new Uint8Array([WebRTCType.SnapshotACK]);
    peer.sendReliableOrderedMessage(payload, true);
  }
}
