import { GameController } from "../models/game-controller.js";
import type { FindMatchesResponse } from "../interfaces/response/find-matches-response.js";
import { TimerService } from "./timer-service.js";
import { Match } from "../models/match.js";
import { MATCH_ATTRIBUTES } from "../constants/matchmaking-constants.js";
import { GamePlayer } from "../models/game-player.js";
import { GameState } from "../models/game-state.js";
import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { MatchStateType } from "../enums/match-state-type.js";
import { EventType } from "../enums/event-type.js";
import { LocalEvent } from "../models/local-event.js";
import type { PlayerConnectedPayload } from "../interfaces/events/player-connected-payload.js";
import type { PlayerDisconnectedPayload } from "../interfaces/events/player-disconnected-payload.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import type { AdvertiseMatchRequest } from "../interfaces/request/advertise-match-request.js";
import type { FindMatchesRequest } from "../interfaces/request/find-matches-request.js";
import type { SaveScoreRequest } from "../interfaces/request/save-score-request.js";
import { MATCH_TOTAL_SLOTS } from "../constants/configuration-constants.js";
import { getConfigurationKey } from "../utils/configuration-utils.js";
import { IntervalService } from "./interval-service.js";
import { DebugUtils } from "../utils/debug-utils.js";
import { WebSocketType } from "../enums/websocket-type.js";
import { BinaryWriter } from "../utils/binary-writer-utils.js";
import { BinaryReader } from "../utils/binary-reader-utils.js";

export class MatchmakingService {
  private gameState: GameState;

  private findMatchesTimerService: TimerService | null = null;
  private pingCheckInterval: IntervalService | null = null;

  private pendingIdentities: Map<string, boolean>;
  private receivedIdentities: Map<
    string,
    { playerId: string; playerName: string }
  >;

  constructor(private gameController: GameController) {
    this.gameState = gameController.getGameState();
    this.pendingIdentities = new Map();
    this.receivedIdentities = new Map();
  }

  public async findOrAdvertiseMatch(): Promise<void> {
    const matches = await this.findMatches();

    if (matches.length === 0) {
      console.log("No matches found");
      await this.createAndAdvertiseMatch();
      return;
    }

    await this.joinMatches(matches);

    await new Promise<void>((resolve) => {
      this.findMatchesTimerService = this.gameController.addTimer(10, () =>
        resolve()
      );
    });

    await this.createAndAdvertiseMatch();
  }

  public handlePlayerIdentity(binaryReader: BinaryReader): void {
    const tokenBytes = binaryReader.bytes(32);
    const playerId = binaryReader.fixedLengthString(32);
    const playerName = binaryReader.fixedLengthString(16);

    const token = btoa(String.fromCharCode(...tokenBytes));

    console.log(
      `Received player identity (token: ${token}, playerId: ${playerId}, playerName: ${playerName})`
    );

    this.receivedIdentities.set(token, { playerId, playerName });

    if (this.gameState.getMatch()?.isHost()) {
      this.handlePlayerIdentityAsHost(token, tokenBytes);
    } else {
      this.handlePlayerIdentityAsPlayer(token);
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
      this.handleGameMatchNull(peer);
      return;
    }

    if (match.getAvailableSlots() === 0) {
      this.handleUnavailableSlots(peer);
      return;
    }

    // Check if we have received the identity for this token
    const token = peer.getToken();
    const identity = this.receivedIdentities.get(token) ?? null;

    if (identity === null) {
      this.handleUnknownIdentity(peer);
      return;
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
    binaryReader: BinaryReader
  ): void {
    if (this.gameState.getMatch() !== null) {
      return this.handleAlreadyJoinedMatch(peer);
    }

    console.log("Received join response from", peer.getToken());

    const matchState = binaryReader.unsignedInt8();
    const matchTotalSlots = binaryReader.unsignedInt8();

    // Create game match
    const match = new Match(
      false,
      matchState,
      matchTotalSlots,
      MATCH_ATTRIBUTES
    );

    this.gameState.setMatch(match);

    // Add local player
    const localGamePlayer = this.gameState.getGamePlayer();
    match.addPlayer(localGamePlayer);
  }

  public handlePlayerConnection(
    peer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void {
    const isConnected = binaryReader.boolean();
    const isHost = binaryReader.boolean();
    const playerId = binaryReader.fixedLengthString(32);
    const playerName = binaryReader.fixedLengthString(16);
    const playerScore = binaryReader.unsignedInt8();

    if (isConnected === false) {
      return this.handlePlayerDisconnectedById(playerId);
    }

    const gamePlayer = new GamePlayer(
      playerId,
      playerName,
      isHost,
      playerScore
    );

    if (isHost) {
      if (this.isHostIdentityUnverified(peer, gamePlayer)) {
        peer.disconnect();
        return;
      }

      peer.setPlayer(gamePlayer);
      this.receivedIdentities.delete(peer.getToken());
    }

    this.gameState.getMatch()?.addPlayer(gamePlayer);
  }

  public handleSnapshotEnd(peer: WebRTCPeer): void {
    console.log("Received snapshot from", peer.getName());

    this.findMatchesTimerService?.stop(false);
    peer.setJoined(true);

    const player = peer.getPlayer();

    if (player === null) {
      this.handleRemotePlayerNull(peer);
      return;
    }

    const localEvent = new LocalEvent<PlayerConnectedPayload>(
      EventType.PlayerConnected
    );

    localEvent.setData({
      player,
      matchmaking: true,
    });

    this.gameController.getEventProcessorService().addLocalEvent(localEvent);

    this.sendSnapshotACK(peer);
  }

  public handleSnapshotACK(peer: WebRTCPeer): void {
    console.log("Received snapshot ACK from", peer.getName());

    peer.setJoined(true);

    const player = peer.getPlayer();

    if (player === null) {
      this.handleRemotePlayerNull(peer);
      return;
    }

    this.gameController
      .getWebRTCService()
      .getPeers()
      .filter((matchPeer) => matchPeer !== peer)
      .forEach((peer) => {
        console.log("Sending player connection to", peer.getName());
        this.sendPlayerConnection(peer, player, true, false);
      });

    const localEvent = new LocalEvent<PlayerConnectedPayload>(
      EventType.PlayerConnected
    );

    localEvent.setData({
      player,
      matchmaking: false,
    });

    this.gameController.getEventProcessorService().addLocalEvent(localEvent);

    this.advertiseMatch();
  }

  public handlePlayerPing(hosting: boolean, binaryReader: BinaryReader): void {
    console.log("Received player ping information");

    if (hosting) {
      return console.warn("Unexpected player ping information from a player");
    }

    const playerId = binaryReader.fixedLengthString(32);
    const playerPingTime = binaryReader.unsignedInt16();
    console.log(`Player ${playerId} ping time: ${playerPingTime}ms`);

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

  private handlePlayerIdentityAsHost(
    token: string,
    tokenBytes: Uint8Array
  ): void {
    console.log("Sending player identity to player", token);
    const webSocketPayload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.PlayerIdentity)
      .bytes(tokenBytes, 32)
      .toArrayBuffer();
    this.gameController.getWebSocketService().sendMessage(webSocketPayload);
  }

  private handlePlayerIdentityAsPlayer(token: string): void {
    console.log("Received player identity for token", token);
    this.pendingIdentities.set(token, true);

    // Send the offer to the host
    this.gameController.getWebRTCService().sendOffer(token);
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
      this.handleRemotePlayerNull(peer);
      return;
    }

    console.log(`Player ${player.getName()} disconnected`);
    this.gameState.getMatch()?.removePlayer(player);

    this.gameController
      .getWebRTCService()
      .getPeers()
      .filter((matchPeer) => matchPeer !== peer)
      .forEach((peer) => {
        this.sendPlayerConnection(peer, player, false, false);
      });

    const playerDisconnectedEvent = new LocalEvent<PlayerDisconnectedPayload>(
      EventType.PlayerDisconnected
    );

    playerDisconnectedEvent.setData({ player });

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
      EventType.PlayerDisconnected
    );

    localEvent.setData({ player });

    this.gameController.getEventProcessorService().addLocalEvent(localEvent);
  }

  private handleHostDisconnected(peer: WebRTCPeer): void {
    console.log(`Host ${peer.getName()} disconnected`);

    this.gameState.setMatch(null);

    const localEvent = new LocalEvent(EventType.HostDisconnected);
    this.gameController.getEventProcessorService().addLocalEvent(localEvent);
  }

  private async findMatches(): Promise<FindMatchesResponse[]> {
    console.log("Finding matches...");

    const body: FindMatchesRequest = {
      version: this.gameController.getVersion(),
      totalSlots: 1,
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
      this.sendPingToJoinedPlayers.bind(this)
    );
  }

  private async advertiseMatch(): Promise<void> {
    const match = this.gameState.getMatch();

    if (match === null) {
      return console.warn("Game match is null");
    }

    const body: AdvertiseMatchRequest = {
      version: this.gameController.getVersion(),
      totalSlots: match.getTotalSlots(),
      availableSlots: match.getAvailableSlots(),
      attributes: match.getAttributes(),
    };

    console.log("Advertising match...");

    await this.gameController.getAPIService().advertiseMatch(body);

    const localEvent = new LocalEvent(EventType.MatchAdvertised);
    this.gameController.getEventProcessorService().addLocalEvent(localEvent);
  }

  private async joinMatches(matches: FindMatchesResponse[]): Promise<void> {
    await Promise.all(matches.map((match) => this.joinMatch(match)));
  }

  private async joinMatch(match: FindMatchesResponse): Promise<void> {
    const { token } = match;
    const tokenBytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));

    this.pendingIdentities.set(token, true);

    console.log("Sending player identity to host", token);

    const webSocketPayload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.PlayerIdentity)
      .bytes(tokenBytes, 32)
      .toArrayBuffer();

    this.gameController.getWebSocketService().sendMessage(webSocketPayload);
  }

  private sendJoinRequest(peer: WebRTCPeer): void {
    const payload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.JoinRequest)
      .toArrayBuffer();

    peer.sendReliableOrderedMessage(payload, true);
  }

  private handleGameMatchNull(peer: WebRTCPeer): void {
    console.warn("Game match is null, disconnecting peer...", peer.getToken());
    peer.disconnect();
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

  private handleRemotePlayerNull(peer: WebRTCPeer): void {
    console.warn("Remote player is null for peer", peer.getToken());
    peer.disconnect();
  }

  private sendJoinResponse(peer: WebRTCPeer, match: Match): void {
    const state = match.getState();
    const totalSlots = match.getTotalSlots();

    const payload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.JoinResponse)
      .unsignedInt8(state)
      .unsignedInt8(totalSlots)
      .toArrayBuffer();

    console.log("Sending join response to", peer.getName());
    peer.sendReliableOrderedMessage(payload, true);

    this.sendPlayerList(peer);
    this.sendSnapshotEnd(peer);
  }

  private sendPlayerList(peer: WebRTCPeer): void {
    const match = this.gameState.getMatch();

    if (match === null) {
      this.handleGameMatchNull(peer);
      return;
    }

    console.log("Sending player list to", peer.getName());

    const players = match.getPlayers();

    players
      .filter((matchPlayer) => matchPlayer !== peer.getPlayer())
      .forEach((player) => {
        this.sendPlayerConnection(peer, player, true, true);
      });
  }

  private sendPlayerConnection(
    peer: WebRTCPeer,
    player: GamePlayer,
    isConnected: boolean,
    skipQueue: boolean
  ): void {
    const isHost = player.isHost();
    const playerId = player.getId();
    const playerScore = player.getScore();
    const playerName = player.getName();

    const payload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.PlayerConnection)
      .boolean(isConnected)
      .boolean(isHost)
      .fixedLengthString(playerId, 32)
      .fixedLengthString(playerName, 16)
      .unsignedInt8(playerScore)
      .toArrayBuffer();

    peer.sendReliableOrderedMessage(payload, skipQueue);
  }

  private isHostIdentityUnverified(
    peer: WebRTCPeer,
    gamePlayer: GamePlayer
  ): boolean {
    const identity = this.receivedIdentities.get(peer.getToken()) ?? null;

    if (identity === null) {
      console.warn("Host identity not found for token", peer.getToken());
      return true;
    }

    if (identity.playerId !== gamePlayer.getId()) {
      console.warn(
        `Host player ID mismatch: expected ${
          identity.playerId
        }, got ${gamePlayer.getId()} for ${peer.getName()}`
      );

      return true;
    }

    if (identity.playerName !== gamePlayer.getName()) {
      console.warn(
        `Host player name mismatch: expected ${
          identity.playerName
        }, got ${gamePlayer.getName()} for ${peer.getName()}`
      );

      return true;
    }

    return false;
  }

  private sendSnapshotEnd(peer: WebRTCPeer): void {
    console.log("Sending snapshot end to", peer.getName());

    const payload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.SnapshotEnd)
      .toArrayBuffer();

    peer.sendReliableOrderedMessage(payload, true);
  }

  private sendSnapshotACK(peer: WebRTCPeer): void {
    console.log("Sending snapshot ACK to", peer.getName());

    const payload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.SnapshotACK)
      .toArrayBuffer();

    peer.sendReliableOrderedMessage(payload, true);
  }

  private sendPingToJoinedPlayers(): void {
    this.sendPingInformationToJoinedPlayers();

    this.gameController
      .getWebRTCService()
      .getPeers()
      .filter((peer) => peer.hasJoined())
      .forEach((peer) => {
        peer.sendPingRequest();
      });
  }

  private sendPingInformationToJoinedPlayers(): void {
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
    const peerPingTime = peer.getPingTime();

    if (peerPingTime === null) {
      return;
    }

    const playerId = player.getId();

    const payload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.PlayerPing)
      .fixedLengthString(playerId, 32)
      .unsignedInt16(peerPingTime)
      .toArrayBuffer();

    peer.sendUnreliableUnorderedMessage(payload);
  }
}
