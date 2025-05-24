import { GameController } from "../models/game-controller.js";
import { TunnelType } from "../enums/tunnel-type.js";
import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { WebRTCPeerService } from "./webrtc-peer-service.js";
import { DebugUtils } from "../utils/debug-utils.js";
import { WebSocketType } from "../enums/websocket-type.js";

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

    const payload = new Uint8Array([
      ...tokenBytes,
      TunnelType.SessionDescription,
      ...offerBytes,
    ]);

    this.gameController
      .getWebSocketService()
      .sendMessage(WebSocketType.Tunnel, payload);
  }

  public getPeers(): WebRTCPeer[] {
    return Array.from(this.peers.values());
  }

  public removePeer(token: string): void {
    this.peers.delete(token);

    console.log("Removed WebRTC peer, updated peers count", this.peers.size);
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

    const candidateBytes = new TextEncoder().encode(
      JSON.stringify(iceCandidate)
    );

    const payload = new Uint8Array([
      ...Uint8Array.from(atob(token), (c) => c.charCodeAt(0)),
      TunnelType.IceCandidate,
      ...candidateBytes,
    ]);

    this.gameController
      .getWebSocketService()
      .sendMessage(WebSocketType.Tunnel, payload);
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

    const payload = new Uint8Array([
      ...tokenBytes,
      TunnelType.SessionDescription,
      ...answerBytes,
    ]);

    this.gameController
      .getWebSocketService()
      .sendMessage(WebSocketType.Tunnel, payload);
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
