import type { ITimerService } from "../../../core/interfaces/services/gameplay/timer-service-interface.js";
import { Match } from "../../models/match.js";
import { GamePlayer } from "../../models/game-player.js";
import { GameState } from "../../../core/models/game-state.js";
import { MATCH_ATTRIBUTES } from "../../constants/matchmaking-constants.js";
import type { WebRTCPeer } from "../../interfaces/services/network/webrtc-peer.js";
import { EventType } from "../../enums/event-type.js";
import { LocalEvent } from "../../../core/models/local-event.js";
import type { PlayerConnectedPayload } from "../../interfaces/events/player-connected-payload.js";
import type { PlayerDisconnectedPayload } from "../../interfaces/events/player-disconnected-payload.js";
import { WebRTCType } from "../../enums/webrtc-type.js";
import type { IIntervalService } from "../../../core/interfaces/services/gameplay/interval-service-interface.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { BinaryWriter } from "../../../core/utils/binary-writer-utils.js";
import { BinaryReader } from "../../../core/utils/binary-reader-utils.js";
import { PeerCommandHandler } from "../../decorators/peer-command-handler-decorator.js";
import { ServerCommandHandler } from "../../decorators/server-command-handler.js";
import { WebSocketService } from "./websocket-service.js";
import { WebRTCService } from "./webrtc-service.js";
import type { PeerConnectionListener } from "../../interfaces/services/network/peer-connection-listener.js";
import type { IMatchmakingNetworkService } from "../../interfaces/services/network/matchmaking-network-service-interface.js";
import { EventProcessorService } from "../../../core/services/gameplay/event-processor-service.js";
import { TimerManagerService } from "../../../core/services/gameplay/timer-manager-service.js";
import { IntervalManagerService } from "../../../core/services/gameplay/interval-manager-service.js";
import { MatchFinderService } from "../gameplay/match-finder-service.js";
import { injectable, inject } from "@needle-di/core";
import {
  PendingIdentitiesToken,
  ReceivedIdentitiesToken,
  PendingDisconnectionsToken,
} from "../gameplay/matchmaking-tokens.js";
import { container } from "../../../core/services/di-container.js";
import { MatchmakingService } from "../gameplay/matchmaking-service.js";
import { SpawnPointService } from "../gameplay/spawn-point-service.js";

@injectable()
export class MatchmakingNetworkService
  implements PeerConnectionListener, IMatchmakingNetworkService
{
  private findMatchesTimerService: ITimerService | null = null;
  private pingCheckInterval: IIntervalService | null = null;

  constructor(
    private readonly gameState: GameState = inject(GameState),
    private readonly timerManagerService: TimerManagerService = inject(
      TimerManagerService
    ),
    private readonly intervalManagerService: IntervalManagerService = inject(
      IntervalManagerService
    ),
    private readonly webSocketService: WebSocketService = inject(
      WebSocketService
    ),
    private readonly webrtcService: WebRTCService = inject(WebRTCService),
    private readonly eventProcessorService: EventProcessorService = inject(
      EventProcessorService
    ),
    private readonly matchFinderService: MatchFinderService = inject(
      MatchFinderService
    ),
    private readonly spawnPointService: SpawnPointService = inject(
      SpawnPointService
    ),
    private readonly pendingIdentities = inject(PendingIdentitiesToken),
    private readonly receivedIdentities = inject(ReceivedIdentitiesToken),
    private readonly pendingDisconnections = inject(PendingDisconnectionsToken)
  ) {
    this.webSocketService.registerCommandHandlers(this);
    this.webrtcService.registerCommandHandlers(this);
  }

  public startFindMatchesTimer(resolve: () => void): void {
    this.findMatchesTimerService = this.timerManagerService.createTimer(
      10,
      resolve
    );
  }

  public stopFindMatchesTimer(): void {
    this.findMatchesTimerService?.stop(false);
  }

  public startPingCheckInterval(): void {
    this.pingCheckInterval = this.intervalManagerService.createInterval(
      1,
      this.sendPingToJoinedPlayers.bind(this)
    );
  }

  public removePingCheckInterval(): void {
    if (this.pingCheckInterval !== null) {
      this.intervalManagerService.removeInterval(this.pingCheckInterval);
    }
  }

  @ServerCommandHandler(WebSocketType.PlayerIdentity)
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
      console.log("Peer connected", peer);
      return;
    }

    console.log("Connected to host", peer);

    this.sendJoinRequest(peer);
  }

  public onPeerDisconnected(peer: WebRTCPeer): void {
    if (peer.hasJoined() === false) {
      console.warn("Ignoring disconnection from non-joined peer", peer);
      return;
    }

    const playerId = peer.getPlayer()?.getId() ?? null;

    if (playerId === null) {
      console.warn("Unknown peer disconnected", peer);
      return;
    }

    if (this.gameState.getMatch()?.isHost()) {
      this.handlePlayerDisconnection(peer);
    } else {
      this.handleHostDisconnected(peer);
    }
  }

  @PeerCommandHandler(WebRTCType.JoinRequest)
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

    const token = peer.getToken();
    const identity = this.receivedIdentities.get(token) ?? null;

    if (identity === null) {
      this.handleUnknownIdentity(peer);
      return;
    }

    this.receivedIdentities.delete(token);

    const { playerId, playerName } = identity;
    console.log("Received join request from", playerName);

    const gamePlayer = new GamePlayer(playerId, playerName);
    peer.setPlayer(gamePlayer);

    const spawnPointIndex =
      this.spawnPointService.getAndConsumeSpawnPointIndex();
    if (spawnPointIndex === -1) {
      console.warn("No spawn points available for joining player");
    } else {
      gamePlayer.setSpawnPointIndex(spawnPointIndex);
    }

    match.addPlayer(gamePlayer);

    this.sendJoinResponse(peer, match);
  }

  @PeerCommandHandler(WebRTCType.JoinResponse)
  public handleJoinResponse(
    peer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void {
    if (this.gameState.getMatch() !== null) {
      this.handleAlreadyJoinedMatch(peer);
      return;
    }

    console.log("Received join response from", peer.getToken());

    const matchState = binaryReader.unsignedInt8();
    const matchTotalSlots = binaryReader.unsignedInt8();

    const match = new Match(
      false,
      matchState,
      matchTotalSlots,
      MATCH_ATTRIBUTES
    );

    this.gameState.setMatch(match);
  }

  @PeerCommandHandler(WebRTCType.PlayerConnection)
  public handlePlayerConnection(
    peer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void {
    const isConnected = binaryReader.boolean();
    const isHost = binaryReader.boolean();
    const playerId = binaryReader.fixedLengthString(32);
    const playerName = binaryReader.fixedLengthString(16);
    const playerSpawnIndex = binaryReader.unsignedInt8();
    const playerScore = binaryReader.unsignedInt8();

    if (isConnected === false) {
      this.handlePlayerDisconnectedById(playerId);
      return;
    }

    const isLocalPlayer = this.gameState.getGamePlayer().getId() === playerId;

    let gamePlayer: GamePlayer;

    if (isLocalPlayer) {
      gamePlayer = this.gameState.getGamePlayer();
      gamePlayer.setSpawnPointIndex(playerSpawnIndex);
    } else {
      gamePlayer = new GamePlayer(
        playerId,
        playerName,
        isHost,
        playerScore,
        playerSpawnIndex
      );
    }

    if (isHost) {
      if (this.isHostIdentityUnverified(peer, gamePlayer)) {
        peer.disconnect(true);
        return;
      }

      peer.setPlayer(gamePlayer);
      this.receivedIdentities.delete(peer.getToken());
    }

    this.gameState.getMatch()?.addPlayer(gamePlayer);
  }

  @PeerCommandHandler(WebRTCType.SnapshotEnd)
  public handleSnapshotEnd(peer: WebRTCPeer): void {
    console.log("Received snapshot from", peer.getName());

    this.stopFindMatchesTimer();
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

    this.eventProcessorService.addLocalEvent(localEvent);

    this.sendSnapshotACK(peer);
  }

  @PeerCommandHandler(WebRTCType.SnapshotACK)
  public handleSnapshotACK(peer: WebRTCPeer): void {
    console.log("Received snapshot ACK from", peer.getName());

    peer.setJoined(true);

    const player = peer.getPlayer();

    if (player === null) {
      this.handleRemotePlayerNull(peer);
      return;
    }

    this.webrtcService
      .getPeers()
      .filter((matchPeer: WebRTCPeer) => matchPeer !== peer)
      .forEach((p: WebRTCPeer) => {
        console.log("Sending player connection to", p.getName());
        this.sendPlayerConnection(p, player, true, false);
      });

    const localEvent = new LocalEvent<PlayerConnectedPayload>(
      EventType.PlayerConnected
    );

    localEvent.setData({
      player,
      matchmaking: false,
    });

    this.eventProcessorService.addLocalEvent(localEvent);

    if (this.gameState.getMatch()?.isHost()) {
      this.notifyMatchPlayerToServer(true, player.getId());
    }

    void this.matchFinderService.advertiseMatch();
  }

  @PeerCommandHandler(WebRTCType.PlayerPing)
  public handlePlayerPing(peer: WebRTCPeer, binaryReader: BinaryReader): void {
    if (this.gameState.getGamePlayer().isHost()) {
      console.warn(
        `Unexpected player ping information from player ${peer.getName()}`
      );
      return;
    }

    const playerId = binaryReader.fixedLengthString(32);
    const playerPingTime = binaryReader.unsignedInt16();

    this.gameState.getMatch()?.getPlayer(playerId)?.setPingTime(playerPingTime);
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

    this.webSocketService.sendMessage(webSocketPayload);
  }

  private handlePlayerIdentityAsPlayer(token: string): void {
    console.log("Received player identity for token", token);
    this.pendingIdentities.set(token, true);

    this.webrtcService.sendOffer(token);
  }

  private handleAlreadyJoinedMatch(peer: WebRTCPeer): void {
    console.warn(
      "Already joined a match, disconnecting peer...",
      peer.getToken()
    );

    peer.disconnect(true);
  }

  private handlePlayerDisconnection(peer: WebRTCPeer): void {
    const player = peer.getPlayer();

    if (player === null) {
      this.handleRemotePlayerNull(peer);
      return;
    }

    console.log(`Player ${player.getName()} disconnected`);
    this.gameState.getMatch()?.removePlayer(player);
    this.spawnPointService.releaseSpawnPointIndex(player.getSpawnPointIndex());

    this.webrtcService
      .getPeers()
      .filter((matchPeer: WebRTCPeer) => matchPeer !== peer)
      .forEach((matchPeer: WebRTCPeer) => {
        this.sendPlayerConnection(matchPeer, player, false, false);
      });

    const playerDisconnectedEvent = new LocalEvent<PlayerDisconnectedPayload>(
      EventType.PlayerDisconnected
    );

    playerDisconnectedEvent.setData({ player });

    this.eventProcessorService.addLocalEvent(playerDisconnectedEvent);

    if (this.gameState.getMatch()?.isHost()) {
      this.notifyMatchPlayerToServer(false, player.getId());
    }

    void this.matchFinderService.advertiseMatch();

    if (this.pendingDisconnections.delete(player.getId())) {
      container
        .get(MatchmakingService)
        .finalizeIfNoPendingDisconnections();
    }
  }

  private handlePlayerDisconnectedById(playerId: string) {
    const match = this.gameState.getMatch();

    if (match === null) {
      console.warn("Game match is null");
      return;
    }

    const player = match.getPlayer(playerId);

    if (player === null) {
      console.warn("Player not found", playerId);
      return;
    }

    console.log(`Player ${player.getName()} disconnected`);
    match.removePlayer(player);

    const localEvent = new LocalEvent<PlayerDisconnectedPayload>(
      EventType.PlayerDisconnected
    );

    localEvent.setData({ player });

    this.eventProcessorService.addLocalEvent(localEvent);
  }

  private handleHostDisconnected(peer: WebRTCPeer): void {
    console.log(`Host ${peer.getName()} disconnected`);
    this.gameState.setMatch(null);

    const localEvent = new LocalEvent(EventType.HostDisconnected);
    this.eventProcessorService.addLocalEvent(localEvent);
  }

  private sendJoinRequest(peer: WebRTCPeer): void {
    const payload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.JoinRequest)
      .toArrayBuffer();

    peer.sendReliableOrderedMessage(payload, true);
  }

  private handleGameMatchNull(peer: WebRTCPeer): void {
    console.warn("Game match is null, disconnecting peer...", peer.getToken());
    peer.disconnect(true);
  }

  private handleUnavailableSlots(peer: WebRTCPeer): void {
    console.log(
      "Received join request but the match is full, disconnecting peer...",
      peer.getToken()
    );

    peer.disconnect(true);
  }

  private handleUnknownIdentity(peer: WebRTCPeer): void {
    console.warn(
      "Received join request but no identity was found, disconnecting peer...",
      peer.getToken()
    );

    peer.disconnect(true);
  }

  private handleRemotePlayerNull(peer: WebRTCPeer): void {
    console.warn("Remote player is null for peer", peer.getToken());
    peer.disconnect(true);
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

    players.forEach((player: GamePlayer) => {
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
    const spawnIndex = player.getSpawnPointIndex();

    const payload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.PlayerConnection)
      .boolean(isConnected)
      .boolean(isHost)
      .fixedLengthString(playerId, 32)
      .fixedLengthString(playerName, 16)
      .unsignedInt8(spawnIndex)
      .unsignedInt8(playerScore)
      .toArrayBuffer();

    console.log(
      `Sending player connection for ${player.getName()} with index ${spawnIndex}`
    );
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

    this.webrtcService
      .getPeers()
      .filter((peer: WebRTCPeer) => peer.hasJoined())
      .forEach((p: WebRTCPeer) => {
        p.sendPingRequest();
      });
  }

  private sendPingInformationToJoinedPlayers(): void {
    const players = this.gameState.getMatch()?.getPlayers() || [];

    this.webrtcService
      .getPeers()
      .filter((peer: WebRTCPeer) => peer.hasJoined())
      .forEach((p: WebRTCPeer) => {
        if (p.getPlayer() === null) {
          console.warn("Peer has no player associated", p);
          return;
        }

        players.forEach((player: GamePlayer) => {
          if (player.isHost()) {
            return;
          }

          this.sendPlayerPingToPlayer(player, p);
        });
      });
  }

  private sendPlayerPingToPlayer(player: GamePlayer, peer: WebRTCPeer): void {
    const playerPing = player.getPingTime();

    if (playerPing === null) {
      return;
    }

    const playerId = player.getId();

    const payload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.PlayerPing)
      .fixedLengthString(playerId, 32)
      .unsignedInt16(playerPing)
      .toArrayBuffer();

    peer.sendUnreliableUnorderedMessage(payload);
  }

  private notifyMatchPlayerToServer(
    connected: boolean,
    playerId: string
  ): void {
    const payload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.MatchPlayer)
      .boolean(connected)
      .fixedLengthString(playerId, 32)
      .toArrayBuffer();

    this.webSocketService.sendMessage(payload);
  }
}
