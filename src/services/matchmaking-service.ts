import { GameController } from "../models/game-controller.js";
import type { FindMatchesResponse } from "../interfaces/response/find-matches-response.js";
import { TimerService } from "./timer-service.js";
import { Match } from "../models/match.js";
import { MATCH_ATTRIBUTES } from "../constants/matchmaking-constants.js";
import { GamePlayer } from "../models/game-player.js";
import { GameState } from "../models/game-state.js";
import { ConnectionStateType } from "../enums/connection-state-type.js";
import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { MatchStateType } from "../enums/match-state-type.js";
import { EventType } from "../enums/event-type.js";
import { LocalEvent } from "../models/local-event.js";
import type { PlayerConnectedPayload } from "../interfaces/event/player-connected-payload.js";
import type { PlayerDisconnectedPayload } from "../interfaces/event/player-disconnected-payload.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import type { AdvertiseMatchRequest } from "../interfaces/request/advertise-match-request.js";
import type { FindMatchesRequest } from "../interfaces/request/find-matches-request.js";
import type { SaveScoreRequest } from "../interfaces/request/save-score-request.js";
import { MATCH_TOTAL_SLOTS } from "../constants/configuration-constants.js";
import { getConfigurationKey } from "../utils/configuration-utils.js";
import { IntervalService } from "./interval-service.js";
import { DebugUtils } from "../utils/debug-utils.js";
import { WebSocketType } from "../enums/websocket-type.js";

export class MatchmakingService {
  private gameState: GameState;

  private findMatchesTimerService: TimerService | null = null;
  private pingCheckInterval: IntervalService | null = null;

  private pendingIdentities: Map<string, boolean> = new Map();
  private receivedIdentities: Map<
    string,
    { playerId: string; playerName: string }
  >;

  constructor(private gameController: GameController) {
    this.gameState = gameController.getGameState();
    this.receivedIdentities = new Map();
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

  public handlePlayerIdentity(payload: ArrayBuffer | null): void {
    if (!payload || payload.byteLength < 64) {
      console.warn("Invalid player identity payload", payload);
      return;
    }

    const payloadBytes = new Uint8Array(payload);
    const tokenBytes = payloadBytes.slice(0, 32);
    const playerIdBytes = payloadBytes.slice(32, 64);
    const userNameBytes = payloadBytes.slice(64);

    const token = btoa(String.fromCharCode(...tokenBytes));
    const playerId = new TextDecoder().decode(playerIdBytes);
    const playerName = new TextDecoder().decode(userNameBytes);

    this.receivedIdentities.set(token, { playerId, playerName });

    if (this.gameState.getMatch()?.isHost()) {
      this.gameController
        .getWebSocketService()
        .sendMessage(WebSocketType.PlayerIdentity, tokenBytes);
    } else {
      if (this.pendingIdentities.has(token) === false) {
        console.log("Ignoring unsolicited identity for token", token);
        return;
      }

      this.pendingIdentities.delete(token);
      this.gameController.getWebRTCService().sendOffer(token);
    }
  }

  public onPeerConnected(peer: WebRTCPeer): void {
    if (this.gameState.getMatch()?.isHost()) {
      return console.log("Peer connected", peer);
    }

    console.log("Connected to host", peer);

    this.sendJoinRequest(peer);
  }

  public onPeerDisconnected(peer: WebRTCPeer): void {
    if (peer.hasJoined() === false) {
      return console.warn("Ignoring disconnection from non-joined peer", peer);
    }

    const playerId = peer.getPlayer()?.getId() ?? null;

    if (playerId === null) {
      return console.warn("Unknown peer disconnected", peer);
    }

    if (this.gameState.getMatch()?.isHost()) {
      this.handlePlayerDisconnection(peer);
    } else {
      this.handleHostDisconnected(peer);
    }
  }

  public handleJoinRequest(peer: WebRTCPeer): void {
    const match = this.gameState.getMatch();

    if (match === null) {
      return console.warn("Game match is null");
    }

    if (match.getAvailableSlots() === 0) {
      return this.handleUnavailableSlots(peer);
    }

    // Check if we have received the identity for this token
    const token = peer.getToken();
    const identity = this.receivedIdentities.get(token) ?? null;

    if (identity === null) {
      return this.handleUnknownIdentity(peer);
    }

    const { playerId, playerName } = identity;
    console.log("Received join request from", playerName);

    // Add player to game match
    const gamePlayer = new GamePlayer(playerId, playerName);
    peer.setPlayer(gamePlayer);

    match.addPlayer(gamePlayer);

    // Delete the identity from the map
    this.receivedIdentities.delete(token);

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
    match.addPlayer(localGamePlayer);
  }

  public handlePlayerConnection(
    peer: WebRTCPeer,
    payload: ArrayBuffer | null
  ): void {
    if (payload === null || payload.byteLength < 36) {
      return console.warn("Invalid player connection state payload", payload);
    }

    const dataView = new DataView(payload);

    const state = dataView.getUint8(0);
    const playerId = new TextDecoder().decode(payload.slice(1, 33));
    const host = dataView.getUint8(33) === 1;
    const score = dataView.getUint8(34);
    const userName = new TextDecoder().decode(payload.slice(35));

    if (state === ConnectionStateType.Disconnected) {
      return this.handlePlayerDisconnectedById(playerId);
    }

    const gamePlayer = new GamePlayer(playerId, userName, host, score);
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

    this.sendSnapshotACK(peer);
  }

  public handleSnapshotACK(peer: WebRTCPeer): void {
    console.log("Received snapshot ACK from", peer.getName());

    peer.setJoined(true);

    const player = peer.getPlayer();

    if (player === null) {
      return console.warn("Player is null");
    }

    this.gameController
      .getWebRTCService()
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

  public handlePlayerPing(hosting: boolean, payload: ArrayBuffer | null): void {
    if (hosting) {
      return console.warn("Unexpected player ping information from a player");
    }

    if (payload === null) {
      return console.warn("Invalid player ping payload", payload);
    }

    const playerIdBytes = payload.slice(0, 32);
    const playerId = new TextDecoder().decode(playerIdBytes);

    const dataView = new DataView(payload);
    const playerPingTime = dataView.getUint16(32);

    this.gameState.getMatch()?.getPlayer(playerId)?.setPingTime(playerPingTime);
  }

  public async savePlayerScore(): Promise<void> {
    const gamePlayer = this.gameState.getGamePlayer();
    const score = gamePlayer.getScore();
    const saveScoreRequest: SaveScoreRequest = { score };

    await this.gameController.getAPIService().saveScore(saveScoreRequest);
  }

  public async handleGameOver(): Promise<void> {
    if (this.gameState.getMatch()?.isHost()) {
      this.gameController
        .getWebRTCService()
        .getPeers()
        .forEach((peer) => peer.disconnectGracefully());

      this.removePingCheckInterval();

      await this.gameController
        .getAPIService()
        .removeMatch()
        .catch((error) => console.error(error));
    }

    this.gameController.getGameState().setMatch(null);
  }

  public renderDebugInformation(context: CanvasRenderingContext2D): void {
    const match = this.gameController.getGameState().getMatch();

    if (match === null) {
      return;
    }

    const state = match.getState();
    DebugUtils.renderText(context, 24, 24, `State: ${MatchStateType[state]}`);
  }

  private removePingCheckInterval(): void {
    if (this.pingCheckInterval !== null) {
      this.gameController.removeInterval(this.pingCheckInterval);
    }
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

    this.gameController
      .getWebRTCService()
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

    return this.gameController.getAPIService().findMatches(body);
  }

  private async createAndAdvertiseMatch(): Promise<void> {
    this.pendingIdentities.clear();

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
    localGamePlayer.setHost(true);

    match.addPlayer(localGamePlayer);

    // Advertise match
    await this.advertiseMatch();

    // Add ping check
    this.pingCheckInterval = this.gameController.addInterval(
      1,
      this.updateAndSendPingToPlayers.bind(this)
    );
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

    await this.gameController.getAPIService().advertiseMatch(body);

    const localEvent = new LocalEvent(EventType.MatchAdvertised, null);
    this.gameController.getEventProcessorService().addLocalEvent(localEvent);
  }

  private async joinMatches(matches: FindMatchesResponse[]): Promise<void> {
    await Promise.all(matches.map((match) => this.joinMatch(match)));
  }

  private async joinMatch(match: FindMatchesResponse): Promise<void> {
    const { token } = match;
    const tokenBytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));

    this.pendingIdentities.set(token, true);

    this.gameController
      .getWebSocketService()
      .sendMessage(WebSocketType.PlayerIdentity, tokenBytes);
  }

  private sendJoinRequest(peer: WebRTCPeer): void {
    const payload = new Uint8Array([WebRTCType.JoinRequest]);
    peer.sendReliableOrderedMessage(payload.buffer, true);
  }

  private handleUnavailableSlots(peer: WebRTCPeer): void {
    console.log(
      "Received join request but the match is full, disconnecting peer...",
      peer.getToken()
    );

    peer.disconnect();
  }

  private handleUnknownIdentity(peer: WebRTCPeer): void {
    console.warn(
      "Received join request but no identity was found, disconnecting peer...",
      peer.getToken()
    );

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
    peer.sendReliableOrderedMessage(payload.buffer, true);

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
    const playerId = player.getId();
    const isHost = player.isHost() ? 1 : 0;
    const playerScore = player.getScore();
    const playerName = player.getName();

    const playerIdBytes = new TextEncoder().encode(playerId);
    const planerNameBytes = new TextEncoder().encode(playerName);

    const payload = new Uint8Array([
      WebRTCType.PlayerConnection,
      connectionState,
      ...playerIdBytes,
      isHost,
      playerScore,
      ...planerNameBytes,
    ]);

    peer.sendReliableOrderedMessage(payload.buffer, skipQueue);
  }

  private sendSnapshotEnd(peer: WebRTCPeer): void {
    console.log("Sending snapshot end to", peer.getName());

    const payload = new Uint8Array([WebRTCType.SnapshotEnd]);
    peer.sendReliableOrderedMessage(payload.buffer, true);
  }

  private sendSnapshotACK(peer: WebRTCPeer): void {
    console.log("Sending snapshot ACK to", peer.getName());
    const payload = new Uint8Array([WebRTCType.SnapshotACK]);
    peer.sendReliableOrderedMessage(payload.buffer, true);
  }

  private updateAndSendPingToPlayers(): void {
    this.sendPlayerPingToPlayers();

    this.gameController
      .getWebRTCService()
      .getPeers()
      .filter((peer) => peer.hasJoined())
      .forEach((peer) => {
        peer.getPlayer()?.setPingTime(peer.getPingTime());

        if (peer.mustPing()) {
          peer.sendPingRequest();
        }
      });
  }

  private sendPlayerPingToPlayers(): void {
    const players = this.gameState.getMatch()?.getPlayers() || [];

    this.gameController
      .getWebRTCService()
      .getPeers()
      .filter((peer) => peer.hasJoined())
      .forEach((peer) => {
        if (peer.getPlayer() === null) {
          return console.warn("Peer has no player associated", peer);
        }

        players.forEach((player) => {
          if (player.isHost()) {
            return;
          }

          this.sendPlayerPingToPlayer(player, peer);
        });
      });
  }

  private sendPlayerPingToPlayer(player: GamePlayer, peer: WebRTCPeer): void {
    const playerId = player.getId();
    const playerPingTime = player.getPingTime();

    if (playerPingTime === null) {
      return;
    }

    const playerIdBytes = new TextEncoder().encode(playerId);
    const arrayBuffer = new ArrayBuffer(1 + playerIdBytes.length + 2);
    const dataView = new DataView(arrayBuffer);

    // Set the WebRTCType.PlayerPing value (assumed to be an integer)
    dataView.setUint8(0, WebRTCType.PlayerPing);

    // Write the player ID bytes into the buffer starting at byte 1
    for (let i = 0; i < playerIdBytes.length; i++) {
      dataView.setUint8(1 + i, playerIdBytes[i]);
    }

    // Write the ping time as Float32 at the end of the buffer
    dataView.setUint16(1 + playerIdBytes.length, playerPingTime);

    // Send the reliable ordered message
    peer.sendReliableOrderedMessage(arrayBuffer, true);
  }
}
