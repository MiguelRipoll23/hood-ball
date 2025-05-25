import { GameController } from "../models/game-controller.js";
import { TunnelType } from "../enums/tunnel-type.js";
import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { WebRTCPeerService } from "./webrtc-peer-service.js";
import { DebugUtils } from "../utils/debug-utils.js";
import { WebSocketType } from "../enums/websocket-type.js";
import { BinaryWriter } from "../utils/binary-writer-utils.js";
import type { BinaryReader } from "../utils/binary-reader-utils.js";

export class WebRTCService {
  private peers: Map<string, WebRTCPeer> = new Map();

  // Network stats
  private downloadKilobytesPerSecond: number = 0;
  private uploadKilobytesPerSecond: number = 0;

  constructor(private gameController: GameController) {}

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

    this.gameController.getWebSocketService().sendMessage(webSocketPayload);
  }

  public getPeers(): WebRTCPeer[] {
    return Array.from(this.peers.values());
  }

  public removePeer(token: string): void {
    this.peers.delete(token);

    console.log("Removed WebRTC peer, updated peers count", this.peers.size);
  }

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
    if (this.gameController.getGameState().getMatch()?.isHost()) {
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

    this.gameController.getWebSocketService().sendMessage(webSocketPayload);
  }

  public handleNewIceCandidate(
    originToken: string,
    iceCandidate: RTCIceCandidateInit
  ): void {
    const peer = this.getPeer(originToken);

    if (peer === null) {
      return console.warn("WebRTC peer with token not found", originToken);
    }

    peer.addRemoteIceCandidate(iceCandidate);
  }

  public resetNetworkStats(): void {
    this.downloadKilobytesPerSecond = this.getDownloadBytes() / 1024;
    this.uploadKilobytesPerSecond = this.getUploadBytes() / 1024;
    this.getPeers().forEach((peer) => peer.resetNetworkStats());
  }

  public renderDebugInformation(context: CanvasRenderingContext2D): void {
    const match = this.gameController.getGameState().getMatch();
    if (match === null) return;

    const player = this.gameController.getGameState().getGamePlayer();

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

  private addPeer(token: string): WebRTCPeer {
    const peer = new WebRTCPeerService(this.gameController, token);
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

    this.gameController.getWebSocketService().sendMessage(webSocketPayload);
  }

  private async handlePeerAnswer(
    token: string,
    rtcSessionDescription: RTCSessionDescriptionInit
  ): Promise<void> {
    console.log("Received WebRTC answer", token, rtcSessionDescription);

    const peer = this.getPeer(token);

    if (peer === null) {
      return console.warn("WebRTC peer with token not found", token);
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
}
