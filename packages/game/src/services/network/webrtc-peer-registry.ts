import { injectable } from "@needle-di/core";
import type { WebRTCPeer } from "@game/interfaces/services/network/webrtc-peer.js";

@injectable()
export class WebRTCPeerRegistry {
  private readonly peers = new Map<string, WebRTCPeer>();

  public add(token: string, peer: WebRTCPeer): void {
    this.peers.set(token, peer);
  }

  public remove(token: string): void {
    this.peers.delete(token);
  }

  public get(token: string): WebRTCPeer | null {
    return this.peers.get(token) ?? null;
  }

  public list(): WebRTCPeer[] {
    return Array.from(this.peers.values());
  }

  public size(): number {
    return this.peers.size;
  }
}
