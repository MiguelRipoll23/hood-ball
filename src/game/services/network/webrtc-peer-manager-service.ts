import { injectable } from "@needle-di/core";
import type { WebRTCPeer } from "../../../engine/interfaces/network/webrtc-peer-interface.js";

@injectable()
export class WebRTCPeerManagerService {
  private readonly peers = new Map<string, WebRTCPeer>();

  public registerPeer(token: string, peer: WebRTCPeer): void {
    this.peers.set(token, peer);
    console.log("Added WebRTC peer, updated peers count", this.peers.size);
  }

  public getPeer(token: string): WebRTCPeer | null {
    return this.peers.get(token) ?? null;
  }

  public getPeers(): WebRTCPeer[] {
    return Array.from(this.peers.values());
  }

  public getPeerCount(): number {
    return this.peers.size;
  }

  public removePeer(token: string): void {
    this.peers.delete(token);
    console.log("Removed WebRTC peer, updated peers count", this.peers.size);
  }

  public getDownloadBytes(): number {
    return this.getPeers().reduce(
      (total, peer) => total + peer.getDownloadBytes(),
      0
    );
  }

  public getUploadBytes(): number {
    return this.getPeers().reduce(
      (total, peer) => total + peer.getUploadBytes(),
      0
    );
  }

  public resetPeerNetworkStats(): void {
    this.getPeers().forEach((peer) => peer.resetNetworkStats());
  }
}
