import { TunnelType } from "../../enums/tunnel-type.js";
import type { WebRTCPeer } from "../../../engine/interfaces/network/webrtc-peer-interface.js";
import { WebRTCPeerService } from "./webrtc-peer-service.js";
import { DebugUtils } from "../../../engine/utils/debug-utils.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { BinaryWriter } from "../../../engine/utils/binary-writer-utils.js";
import type { BinaryReader } from "../../../engine/utils/binary-reader-utils.js";
import { WebRTCDispatcherService } from "./webrtc-dispatcher-service.js";
import { WebRTCType } from "../../../engine/enums/webrtc-type.js";
import { PeerCommandHandler } from "../../../engine/decorators/peer-command-handler-decorator.js";
import { ServerCommandHandler } from "../../decorators/server-command-handler.js";
import { WEB_SOCKET_SERVICE_TOKEN, type WebSocketServiceContract } from "../../interfaces/services/network/websocket-service-interface.js";
import { WebRTCPeerManagerService } from "./webrtc-peer-manager-service.js";
import { GameState } from "../../../engine/models/game-state.js";
import { GamePlayer } from "../../models/game-player.js";
import type { WebRTCServiceContract } from "../../../engine/interfaces/services/network/webrtc-service-contract.js";
import type { PeerConnectionListener } from "../../interfaces/peer-connection-listener-interface.js";
import { injectable, inject } from "@needle-di/core";
import { MatchSessionService } from "../session/match-session-service.js";
import { GameServer } from "../../models/game-server.js";
import { TimerManagerService } from "../../../engine/services/gameplay/timer-manager-service.js";
import { IntervalManagerService } from "../../../engine/services/gameplay/interval-manager-service.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";

@injectable()
export class WebRTCService implements WebRTCServiceContract {
  // Network stats
  private downloadKilobytesPerSecond: number = 0;
  private uploadKilobytesPerSecond: number = 0;

  private readonly dispatcherService: WebRTCDispatcherService;
  private connectionListener: PeerConnectionListener | null = null;

  constructor(
    private readonly gamePlayer: GamePlayer = inject(GamePlayer),
    private readonly matchSessionService: MatchSessionService = inject(
      MatchSessionService
    ),
    private readonly gameServer: GameServer = inject(GameServer),
    private readonly timerManagerService: TimerManagerService = inject(
      TimerManagerService
    ),
    private readonly gameState: GameState = inject(GameState),
    private readonly webSocketService: WebSocketServiceContract = inject(
      WEB_SOCKET_SERVICE_TOKEN
    ),
    private readonly intervalManagerService: IntervalManagerService = inject(
      IntervalManagerService
    ),
    private readonly peerManagerService: WebRTCPeerManagerService = inject(
      WebRTCPeerManagerService
    )
  ) {
    this.dispatcherService = new WebRTCDispatcherService();
    this.intervalManagerService.createInterval(
      1,
      this.resetNetworkStats.bind(this)
    );
    this.registerCommandHandlers(this);
  }

  public initialize(listener: PeerConnectionListener): void {
    this.webSocketService.registerCommandHandlers(this);
    this.connectionListener = listener;
    EngineLogger.info("WebrtcService", "WebRTC service initialized");
  }

  public registerCommandHandlers(instance: object): void {
    this.dispatcherService.registerCommandHandlers(instance);
  }

  public dispatchCommand(
    commandId: WebRTCType,
    peer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void {
    this.dispatcherService.dispatchCommand(commandId, peer, binaryReader);
  }

  public async sendOffer(token: string): Promise<void> {
    const peer = this.addPeer(token);
    const offer = await peer.createOffer();

    EngineLogger.info("WebrtcService", "Sending WebRTC offer...", token, offer);

    const tokenBytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
    const offerBytes = new TextEncoder().encode(JSON.stringify(offer));

    const webSocketPayload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.PlayerRelay)
      .bytes(tokenBytes, 32)
      .unsignedInt8(TunnelType.SessionDescription)
      .bytes(offerBytes)
      .toArrayBuffer();

    this.webSocketService.sendMessage(webSocketPayload);
  }

  public getPeers(): WebRTCPeer[] {
    return this.peerManagerService.getPeers();
  }

  public removePeer(token: string): void {
    this.peerManagerService.removePeer(token);
  }

  @ServerCommandHandler(WebSocketType.PlayerRelay)
  public handleTunnelWebRTCData(binaryReader: BinaryReader): void {
    const originTokenBytes = binaryReader.bytes(32);
    const tunnelTypeId = binaryReader.unsignedInt8();
    const tunnelData = binaryReader.bytesAsArrayBuffer();

    const originToken = btoa(String.fromCharCode(...originTokenBytes));

    switch (tunnelTypeId) {
      case TunnelType.IceCandidate:
        return this.handleNewIceCandidateMessage(originToken, tunnelData);

      case TunnelType.SessionDescription:
        return this.handleSessionDescriptionMessage(originToken, tunnelData);

      default:
        EngineLogger.warn("WebrtcService", "Unknown tunnel type id", tunnelTypeId);
    }
  }

  public handleSessionDescriptionEvent(
    originToken: string,
    rtcSessionDescription: RTCSessionDescriptionInit
  ): void {
    if (this.matchSessionService.getMatch()?.isHost()) {
      this.handlePeerOffer(originToken, rtcSessionDescription);
    } else {
      this.handlePeerAnswer(originToken, rtcSessionDescription);
    }
  }

  public sendIceCandidate(
    token: string,
    iceCandidate: RTCIceCandidateInit
  ): void {
    EngineLogger.info("WebrtcService", "Sending ICE candidate...", token, iceCandidate);

    const tokenBytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
    const iceCandidateBytes = new TextEncoder().encode(
      JSON.stringify(iceCandidate)
    );
    const webSocketPayload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.PlayerRelay)
      .bytes(tokenBytes, 32)
      .unsignedInt8(TunnelType.IceCandidate)
      .bytes(iceCandidateBytes)
      .toArrayBuffer();

    this.webSocketService.sendMessage(webSocketPayload);
  }

  public handleNewIceCandidate(
    originToken: string,
    iceCandidate: RTCIceCandidateInit
  ): void {
    const peer = this.getPeer(originToken);

    if (peer === null) {
      EngineLogger.warn("WebrtcService", "WebRTC peer with token not found", originToken);
      return;
    }

    peer.addRemoteIceCandidate(iceCandidate);
  }

  @PeerCommandHandler(WebRTCType.GracefulDisconnect)
  public handleGracefulDisconnect(peer: WebRTCPeer): void {
    EngineLogger.info("WebrtcService", "Received graceful disconnect message");
    peer.disconnect(true);
    this.connectionListener?.onPeerDisconnected(peer, true);
  }

  @PeerCommandHandler(WebRTCType.PingRequest)
  public handlePingRequest(peer: WebRTCPeer): void {
    const arrayBuffer = BinaryWriter.build()
      .unsignedInt8(WebRTCType.PingResponse)
      .toArrayBuffer();

    peer.sendUnreliableUnorderedMessage(arrayBuffer);
  }

  @PeerCommandHandler(WebRTCType.PingResponse)
  public handlePingResponse(peer: WebRTCPeer): void {
    const pingRequestTime = peer.getPingRequestTime();

    if (pingRequestTime === null) {
      return;
    }

    peer.setPingTime(performance.now() - pingRequestTime);
    this.updatePingMedianMilliseconds();
  }

  public resetNetworkStats(): void {
    this.downloadKilobytesPerSecond = this.getDownloadBytes() / 1024;
    this.uploadKilobytesPerSecond = this.getUploadBytes() / 1024;
    this.peerManagerService.resetPeerNetworkStats();
  }

  public renderDebugInformation(context: CanvasRenderingContext2D): void {
    const match = this.matchSessionService.getMatch();
    if (match === null) return;

    const player = this.gamePlayer;

    if (player.isHost()) {
      DebugUtils.renderText(context, 24, 48, "Host");
    } else {
      const pingTime = player.getPingTime();
      const displayPingTime = pingTime === null ? "--- ms" : `${pingTime} ms`;

      DebugUtils.renderText(context, 24, 48, `Ping: ${displayPingTime}`);
    }

    DebugUtils.renderText(
      context,
      24,
      72,
      `Download: ${this.downloadKilobytesPerSecond.toFixed(1)} KB/s`
    );

    DebugUtils.renderText(
      context,
      24,
      96,
      `Upload: ${this.uploadKilobytesPerSecond.toFixed(1)} KB/s`
    );
  }

  private addPeer(token: string): WebRTCPeer {
    if (this.connectionListener === null) {
      throw new Error("WebRTCService not initialized");
    }
    const peer = new WebRTCPeerService(
      token,
      this,
      this.connectionListener,
      this.matchSessionService,
      this.gameServer,
      this.timerManagerService,
      this.gameState
    );
    this.peerManagerService.registerPeer(token, peer);

    return peer;
  }

  private handleNewIceCandidateMessage(
    originToken: string,
    payload: ArrayBuffer
  ): void {
    let iceCandidateData;

    try {
      iceCandidateData = JSON.parse(new TextDecoder().decode(payload));
    } catch (error) {
      EngineLogger.error("WebrtcService", "Failed to parse ICE candidate data", error);
      return;
    }

    this.handleNewIceCandidate(originToken, iceCandidateData);
  }

  private handleSessionDescriptionMessage(
    originToken: string,
    payload: ArrayBuffer
  ): void {
    let sessionDescriptionData;

    try {
      sessionDescriptionData = JSON.parse(new TextDecoder().decode(payload));
    } catch (error) {
      EngineLogger.error("WebrtcService", "Failed to parse session description data", error);
      return;
    }

    this.handleSessionDescriptionEvent(originToken, sessionDescriptionData);
  }

  private async handlePeerOffer(
    token: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    EngineLogger.info("WebrtcService", "Received WebRTC offer", token, offer);

    const peer = this.addPeer(token);
    const answer = await peer.createAnswer(offer);

    EngineLogger.info("WebrtcService", "Sending WebRTC answer...", token, answer);

    const tokenBytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
    const answerBytes = new TextEncoder().encode(JSON.stringify(answer));
    const webSocketPayload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.PlayerRelay)
      .bytes(tokenBytes, 32)
      .unsignedInt8(TunnelType.SessionDescription)
      .bytes(answerBytes)
      .toArrayBuffer();

    this.webSocketService.sendMessage(webSocketPayload);
  }

  private async handlePeerAnswer(
    token: string,
    rtcSessionDescription: RTCSessionDescriptionInit
  ): Promise<void> {
    EngineLogger.info("WebrtcService", "Received WebRTC answer", token, rtcSessionDescription);

    const peer = this.getPeer(token);

    if (peer === null) {
      EngineLogger.warn("WebrtcService", "WebRTC peer with token not found", token);
      return;
    }

    await peer.connect(rtcSessionDescription);
  }

  private getPeer(token: string): WebRTCPeer | null {
    return this.peerManagerService.getPeer(token);
  }

  private getDownloadBytes(): number {
    return this.peerManagerService.getDownloadBytes();
  }

  private getUploadBytes(): number {
    return this.peerManagerService.getUploadBytes();
  }

  private updatePingMedianMilliseconds(): void {
    const match = this.matchSessionService.getMatch();

    if (match === null) {
      return;
    }

    const players = match.getPlayers();

    const nonHostPings = players
      .filter((p: GamePlayer) => !p.isHost())
      .map((player: GamePlayer) => player.getPingTime())
      .filter((ping: number | null): ping is number => ping !== null);

    const computeMedian = (values: number[]): number | null => {
      if (values.length === 0) {
        return null;
      }
      values.sort((a: number, b: number) => a - b);
      const middle = Math.floor(values.length / 2);
      return values.length % 2 === 0
        ? Math.round((values[middle - 1] + values[middle]) / 2)
        : Math.round(values[middle]);
    };

    match.setPingMedianMilliseconds(computeMedian(nonHostPings));
  }
}
