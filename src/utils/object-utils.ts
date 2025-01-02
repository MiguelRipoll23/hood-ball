import { WebRTCPeer } from "../interfaces/webrtc-peer.js";

export class ObjectUtils {
  public static hasInvalidOwner(
    webrtcPeer: WebRTCPeer,
    ownerId: string
  ): boolean {
    if (webrtcPeer.getPlayer()?.isHost()) {
      return false;
    }

    return webrtcPeer.getPlayer()?.getId() !== ownerId;
  }
}
