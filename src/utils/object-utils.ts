import { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { BasePositionableGameObject } from "../objects/base/base-positionable-game-object.js";

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

  public static fixObjectPositionIfOutOfBounds(
    positionableObject: BasePositionableGameObject,
    canvas: HTMLCanvasElement
  ) {
    let hasChanged = false;

    const objectX = positionableObject.getX();
    const objectY = positionableObject.getY();
    const objectWidth = positionableObject.getWidth();
    const objectHeight = positionableObject.getHeight();

    // Get the canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Adjust X position if out of bounds
    if (objectX < 0) {
      positionableObject.setX(0); // Prevent going out of the left boundary
      hasChanged = true;
    } else if (objectX + objectWidth > canvasWidth) {
      positionableObject.setX(canvasWidth - objectWidth); // Prevent going out of the right boundary
      hasChanged = true;
    }

    // Adjust Y position if out of bounds
    if (objectY < 0) {
      positionableObject.setY(0); // Prevent going out of the top boundary
      hasChanged = true;
    } else if (objectY + objectHeight > canvasHeight) {
      positionableObject.setY(canvasHeight - objectHeight); // Prevent going out of the bottom boundary
      hasChanged = true;
    }

    if (hasChanged) {
      positionableObject.setSync(true);
    }
  }
}
