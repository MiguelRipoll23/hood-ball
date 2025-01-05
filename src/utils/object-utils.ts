import {
  CANVAS_EXTRA_MARGIN,
  CANVAS_MARGIN,
} from "../constants/canvas-constants.js";
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

    const objectLeft = objectX - objectWidth / 2;
    const objectRight = objectX + objectWidth / 2;
    const objectTop = objectY - objectHeight / 2;
    const objectBottom = objectY + objectHeight / 2;

    // Get the canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    if (objectLeft < CANVAS_MARGIN) {
      positionableObject.setX(objectX + CANVAS_EXTRA_MARGIN); // Prevent going out of the left boundary
      hasChanged = true;
    } else if (objectRight > canvasWidth - CANVAS_MARGIN) {
      positionableObject.setX(objectX - CANVAS_EXTRA_MARGIN); // Prevent going out of the right boundary
      hasChanged = true;
    }

    // Adjust Y position if out of bounds
    if (objectTop < CANVAS_MARGIN) {
      positionableObject.setY(objectY + CANVAS_EXTRA_MARGIN); // Prevent going out of the top boundary
      hasChanged = true;
    } else if (objectBottom > canvasHeight - CANVAS_MARGIN) {
      positionableObject.setY(objectY - CANVAS_EXTRA_MARGIN); // Prevent going out of the bottom boundary
      hasChanged = true;
    }

    if (hasChanged) {
      positionableObject.setSync(true);
    }
  }
}
