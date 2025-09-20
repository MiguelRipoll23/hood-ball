import { TunnelType } from "../../enums/tunnel-type.js";
import type { WebRTCPeer } from "../../interfaces/services/network/webrtc-peer.js";
import { WebRTCPeerService } from "./webrtc-peer-service.js";
import { DebugUtils } from "../../../core/utils/debug-utils.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { BinaryWriter } from "../../../core/utils/binary-writer-utils.js";
import type { BinaryReader } from "../../../core/utils/binary-reader-utils.js";
import { WebRTCDispatcherService } from "./webrtc-dispatcher-service.js";
import { WebRTCType } from "../../enums/webrtc-type.js";
import { PeerCommandHandler } from "../../decorators/peer-command-handler-decorator.js";
import { ServerCommandHandler } from "../../decorators/server-command-handler.js";
import { WebSocketService } from "./websocket-service.js";
import { GameState } from "../../state/game-state.js";
import { TimerManagerService } from "../../../engine/services/time/timer-manager-service.js";
import type { GamePlayer } from "../../models/game-player.js";
import type { WebRTCServiceContract } from "../../interfaces/services/network/webrtc-service-interface.js";
import type { PeerConnectionListener } from "../../interfaces/services/network/peer-connection-listener.js";
import { inject, injectable } from "@needle-di/core";
@injectable()
export class WebRTCService implements WebRTCServiceContract {
  private peers: Map<string, WebRTCPeer> = new Map();

  // Network stats
  private downloadKilobytesPerSecond: number = 0;
  private uploadKilobytesPerSecond: number = 0;

  private readonly dispatcherService: WebRTCDispatcherService;
  private connectionListener: PeerConnectionListener | null = null;

  constructor(
    private readonly gameState: GameState = inject(GameState),
    private readonly webSocketService: WebSocketService = inject(WebSocketService),
    private readonly timerManagerService: TimerManagerService = inject(TimerManagerService)
  ) {
    this.dispatcherService = new WebRTCDispatcherService();
    this.registerCommandHandlers(this);
    this.webSocketService.registerCommandHandlers(this);
  }

  public setConnectionListener(listener: PeerConnectionListener): void {
    if (this.connectionListener !== null) {
      console.warn("WebRTC connection listener is being replaced");
    }

    this.connectionListener = listener;
  }

  public registerCommandHandlers(instance: object): void {
    this.dispatcherService.registerCommandHandlers(instance);
  }

  public bindCommandHandler(
    commandId: number,
    commandHandler: (peer: WebRTCPeer, binaryReader: BinaryReader) => void,
    label?: string
  ): void {
    this.dispatcherService.bindCommandHandler(commandId, commandHandler, label);
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

    console.log("Sending WebRTC offer...", token, offer);

    const tokenBytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
    const offerBytes = new TextEncoder().encode(JSON.stringify(offer));

    const webSocketPayload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.Tunnel)
      .bytes(tokenBytes, 32)
      .unsignedInt8(TunnelType.SessionDescription)
      .bytes(offerBytes)
      .toArrayBuffer();

    this.getWebSocketService().sendMessage(webSocketPayload);
  }

  public getPeers(): WebRTCPeer[] {
    return Array.from(this.peers.values());
  }

  public removePeer(token: string): void {
    this.peers.delete(token);

    console.log("Removed WebRTC peer, updated peers count", this.peers.size);
  }

  @ServerCommandHandler(WebSocketType.Tunnel)
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
        console.warn("Unknown tunnel type id", tunnelTypeId);
    }
  }

  public handleSessionDescriptionEvent(
    originToken: string,
    rtcSessionDescription: RTCSessionDescriptionInit
  ): void {
    if (this.gameState.getMatch()?.isHost()) {
      this.handlePeerOffer(originToken, rtcSessionDescription);
    } else {
      this.handlePeerAnswer(originToken, rtcSessionDescription);
    }
  }

  public sendIceCandidate(
    token: string,
    iceCandidate: RTCIceCandidateInit
  ): void {
    console.log("Sending ICE candidate...", token, iceCandidate);

    const tokenBytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
    const iceCandidateBytes = new TextEncoder().encode(
      JSON.stringify(iceCandidate)
    );
    const webSocketPayload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.Tunnel)
      .bytes(tokenBytes, 32)
      .unsignedInt8(TunnelType.IceCandidate)
      .bytes(iceCandidateBytes)
      .toArrayBuffer();

    this.getWebSocketService().sendMessage(webSocketPayload);
  }

  public handleNewIceCandidate(
    originToken: string,
    iceCandidate: RTCIceCandidateInit
  ): void {
    const peer = this.getPeer(originToken);

    if (peer === null) {
      console.warn("WebRTC peer with token not found", originToken);
      return;
    }

    peer.addRemoteIceCandidate(iceCandidate);
  }

  @PeerCommandHandler(WebRTCType.GracefulDisconnect)
  public handleGracefulDisconnect(peer: WebRTCPeer): void {
    console.log("Received graceful disconnect message");
    peer.disconnect(true);
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
    this.getPeers().forEach((peer) => peer.resetNetworkStats());
  }

  public renderDebugInformation(context: CanvasRenderingContext2D): void {
    const match = this.gameState.getMatch();
    if (match === null) return;

    const player = this.gameState.getGamePlayer();

    if (player === null) {
      DebugUtils.renderText(context, 24, 24, "No player found");
      return;
    }

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

  private getWebSocketService(): WebSocketService {
    if (this.webSocketService === null) {
      throw new Error("WebSocketService is not initialized");
    }

    return this.webSocketService;
  }

  private addPeer(token: string): WebRTCPeer {
    if (this.connectionListener === null) {
      throw new Error("WebRTCService not initialized");
    }
    const peer = new WebRTCPeerService(
      token,
      this,
      this.connectionListener,
      this.gameState,
      this.timerManagerService
    );
    this.peers.set(token, peer);

    console.log("Added WebRTC peer, updated peers count", this.peers.size);

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
      console.error("Failed to parse ICE candidate data", error);
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
      console.error("Failed to parse session description data", error);
      return;
    }

    this.handleSessionDescriptionEvent(originToken, sessionDescriptionData);
  }

  private async handlePeerOffer(
    token: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    console.log("Received WebRTC offer", token, offer);

    const peer = this.addPeer(token);
    const answer = await peer.createAnswer(offer);

    console.log("Sending WebRTC answer...", token, answer);

    const tokenBytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
    const answerBytes = new TextEncoder().encode(JSON.stringify(answer));
    const webSocketPayload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.Tunnel)
      .bytes(tokenBytes, 32)
      .unsignedInt8(TunnelType.SessionDescription)
      .bytes(answerBytes)
      .toArrayBuffer();

    this.getWebSocketService().sendMessage(webSocketPayload);
  }

  private async handlePeerAnswer(
    token: string,
    rtcSessionDescription: RTCSessionDescriptionInit
  ): Promise<void> {
    console.log("Received WebRTC answer", token, rtcSessionDescription);

    const peer = this.getPeer(token);

    if (peer === null) {
      console.warn("WebRTC peer with token not found", token);
      return;
    }

    await peer.connect(rtcSessionDescription);
  }

  private getPeer(token: string): WebRTCPeer | null {
    return this.peers.get(token) ?? null;
  }

  private getDownloadBytes(): number {
    return this.getPeers().reduce(
      (total, peer) => total + peer.getDownloadBytes(),
      0
    );
  }

  private getUploadBytes(): number {
    return this.getPeers().reduce(
      (total, peer) => total + peer.getUploadBytes(),
      0
    );
  }

  private updatePingMedianMilliseconds(): void {
    const match = this.gameState.getMatch();

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





